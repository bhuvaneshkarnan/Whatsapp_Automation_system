"""
Core Worker — main entry point.
Reads messages from Redis Streams, processes them:
  1. Upsert contact & conversation in PostgreSQL
  2. Check if conversation is in human-agent mode (skip AI if so)
  3. Call Gemini (client's own API key) → fallback to rule engine
  4. Send WhatsApp reply via client's own phone number
  5. Persist all messages to DB
  6. Expose /health endpoint + Prometheus metrics
"""
import asyncio
import json
import os
import time
import uuid
import datetime
from datetime import timezone
from typing import Optional

import asyncpg
import redis.asyncio as aioredis
import structlog
from fastapi import FastAPI
from fastapi.responses import JSONResponse, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import uvicorn

import re
try:
    from providers.gemini import call_gemini, GeminiError
    from providers.llm_router import call_llm_cascade, call_groq, call_opencode, LLMError, clean_llm_response, strip_repetitive_greetings
    from providers.transcription import transcribe_voice_message, TranscriptionError
    from providers.rule_engine import apply_rule_engine, db_row_to_rule
    from providers.whatsapp_sender import send_text, send_template, mark_as_read, WhatsAppSendError
except (ImportError, ModuleNotFoundError):
    from core_worker.providers.gemini import call_gemini, GeminiError
    from core_worker.providers.llm_router import call_llm_cascade, call_groq, call_opencode, LLMError, clean_llm_response, strip_repetitive_greetings
    from core_worker.providers.transcription import transcribe_voice_message, TranscriptionError
    from core_worker.providers.rule_engine import apply_rule_engine, db_row_to_rule
    from core_worker.providers.whatsapp_sender import send_text, send_template, mark_as_read, WhatsAppSendError

# ── Logging ───────────────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger(service="core-worker")

# ── Metrics ───────────────────────────────────────────────────────────────────
messages_processed = Counter("core_messages_processed_total", "Messages processed", ["tenant", "status"])
ai_requests        = Counter("core_ai_requests_total", "AI requests", ["tenant", "provider"])
processing_time    = Histogram("core_processing_seconds", "End-to-end processing time", ["tenant"],
                               buckets=[0.5, 1, 2, 3, 5, 8, 10, 15, 30])
wa_sends           = Counter("core_wa_sends_total", "WhatsApp messages sent", ["tenant", "status"])

# ── Gmail Direct Dispatch & Email Builders ─────────────────────────────────────
def send_gmail_direct_notification(g_creds, to_email: str, subject: str, html_body: str):
    """Dispatches direct HTML email using authorized Google OAuth token via Gmail API."""
    if not to_email or "@" not in to_email:
        return None
    try:
        import base64
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from googleapiclient.discovery import build

        gmail_service = build("gmail", "v1", credentials=g_creds)
        msg = MIMEMultipart("alternative")
        msg["to"] = to_email.strip()
        msg["subject"] = subject
        msg.attach(MIMEText(html_body, "html"))
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
        res = gmail_service.users().messages().send(userId="me", body={"raw": raw}).execute()
        logger.info("gmail_email_notification_sent", to=to_email, msg_id=res.get("id"))
        return res
    except Exception as e:
        logger.warning("gmail_email_notification_failed", to=to_email, error=str(e))
        return None


def sanitize_and_fix_email(email: Optional[str]) -> Optional[str]:
    """Sanitizes email and automatically corrects common mobile-keyboard domain typos."""
    if not email or not isinstance(email, str):
        return None
    e = email.strip().lower()
    if "@" not in e:
        return None
    
    # Common domain typos made on mobile keyboards
    typo_map = {
        "@gmai.com": "@gmail.com",
        "@gamil.com": "@gmail.com",
        "@gmial.com": "@gmail.com",
        "@gmaill.com": "@gmail.com",
        "@gmaik.com": "@gmail.com",
        "@gmal.com": "@gmail.com",
        "@gmai.co": "@gmail.com",
        "@gmail.co": "@gmail.com",
        "@yaho.com": "@yahoo.com",
        "@yahooo.com": "@yahoo.com",
        "@hotmial.com": "@hotmail.com",
        "@hotmai.com": "@hotmail.com",
        "@outlok.com": "@outlook.com",
        "@outloo.com": "@outlook.com",
        "@iclud.com": "@icloud.com",
    }
    for typo, fixed in typo_map.items():
        if e.endswith(typo):
            e = e[:-len(typo)] + fixed
            break
    
    if re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', e):
        return e
    return None


def parse_flexible_datetime(date_str: str, time_str: str, tz) -> datetime.datetime:
    """Parses date and time supporting both 12-hour (10:00 AM, 7:30 PM, 08:00PM) and 24-hour (19:30, 09:00)."""
    clean_d = (date_str or "").strip()
    clean_t = (time_str or "").strip()
    
    formats = [
        "%Y-%m-%d %I:%M %p",
        "%Y-%m-%d %I:%M%p",
        "%Y-%m-%d %I %p",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%d-%m-%Y %I:%M %p",
        "%d-%m-%Y %I:%M%p",
        "%d-%m-%Y %H:%M",
        "%d/%m/%Y %I:%M %p",
        "%d/%m/%Y %H:%M",
    ]
    for fmt in formats:
        try:
            dt = datetime.datetime.strptime(f"{clean_d} {clean_t}", fmt)
            return dt.replace(tzinfo=tz)
        except ValueError:
            continue
    return datetime.datetime.now(tz) + datetime.timedelta(hours=2)


GLOBAL_DEFAULT_STRICT_RULES = (
    "- CONTINUOUS CONVERSATION & ZERO RE-GREETING: Never say 'Hi again', 'Hello again', or re-greet in an ongoing chat. Greet only on the very first message; thereafter reply directly to what the customer said.\n"
    "- GOOGLE CALENDAR AVAILABILITY & FREE-TIME BOOKING: Check live availability from Google Calendar. Propose and book only during verified open free time. Never invent, hallucinate, or state incorrect, wrong, or occupied timeslots.\n"
    "- NEVER use em dashes or hyphens connecting clauses. Use a comma or short period instead.\n"
    "- Sound 100% human and conversational, like texting a real person on WhatsApp, NOT an AI bot.\n"
    "- Keep replies concise (1 to 2 short lines). Connect thoughts smoothly into a single natural sentence or paragraph without awkward line gaps.\n"
    "- CUT ALL AI CLICHES: Never say delve into, furthermore, moreover, in conclusion, it is important to note, I understand your concern, thank you for reaching out.\n"
    "- Ask only ONE thing at a time. Never stack multiple questions in a single reply.\n"
    "- Never use markdown bullet lists or bold numbered headers unless the customer explicitly asked for a list.\n"
    "- Use natural contractions (I'll, we'll, you'll, that's) and active voice."
)

def build_booking_admin_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, contact_phone: str, customer_email: str, notes: str, full_location: str) -> str:
    loc_html = f"""<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Location</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{full_location}</td></tr>""" if full_location else ""
    notes_html = f"""<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Notes</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{notes}</td></tr>""" if notes and notes != "None" else ""
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; background-color: #f1f5f9; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Admin Notice</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">New Booking Received</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">Scheduled via WhatsApp Assistant</p>
  </div>
  
  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 0; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 35%;">Client Name</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Phone</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{contact_phone}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Email</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{customer_email or 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Service</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{service_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Date and Time</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{formatted_date} at {formatted_time}</td></tr>
      {loc_html}
      {notes_html}
    </table>
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    This appointment has been synced to Google Calendar and recorded in your CRM dashboard.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Boldlabs CRM
  </div>
</div>
"""


def build_booking_customer_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, contact_phone: str, full_location: str) -> str:
    loc_html = f"""<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Location</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{full_location}</td></tr>""" if full_location else ""
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; background-color: #ecfdf5; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Confirmed</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">Appointment Confirmed</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">Hello {name}, your appointment has been scheduled.</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 0; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 35%;">Service</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{service_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Date and Time</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{formatted_date} at {formatted_time}</td></tr>
      {loc_html}
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Phone on File</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{contact_phone}</td></tr>
    </table>
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    Need to reschedule or make adjustments? Reply directly to our WhatsApp chat anytime.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Thank you for choosing our business.
  </div>
</div>
"""


def build_cancellation_admin_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, contact_phone: str, customer_email: str) -> str:
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #b91c1c; background-color: #fef2f2; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Cancelled</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">Appointment Cancelled</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">The client cancelled this appointment. The slot has been released.</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 0; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 35%;">Client Name</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Phone</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{contact_phone}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Email</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{customer_email or 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Service</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{service_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Cancelled Slot</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{formatted_date} at {formatted_time}</td></tr>
    </table>
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    The calendar event has been removed and the CRM booking is marked cancelled.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Boldlabs CRM
  </div>
</div>
"""


def build_cancellation_customer_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str) -> str:
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; background-color: #f1f5f9; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Cancelled</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">Appointment Cancellation</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">Hello {name}, your appointment has been cancelled as requested.</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 0; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 35%;">Service</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{service_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Cancelled Slot</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{formatted_date} at {formatted_time}</td></tr>
    </table>
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    Whenever you would like to book a new appointment, simply message us on WhatsApp anytime.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Thank you.
  </div>
</div>
"""


def build_reschedule_admin_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, contact_phone: str, customer_email: str) -> str:
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #1d4ed8; background-color: #eff6ff; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Rescheduled</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">Appointment Rescheduled</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">The client has rescheduled to a new date and time.</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 0; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 35%;">Client Name</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Phone</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{contact_phone}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Email</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{customer_email or 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Service</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{service_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">New Date and Time</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{formatted_date} at {formatted_time}</td></tr>
    </table>
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    Google Calendar and CRM have been updated with the new slot.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Boldlabs CRM
  </div>
</div>
"""


def build_reschedule_customer_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, full_location: str) -> str:
    loc_html = f"""<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Location</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{full_location}</td></tr>""" if full_location else ""
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #1d4ed8; background-color: #eff6ff; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Rescheduled</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">Appointment Rescheduled</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">Hello {name}, your appointment has been updated to the new time slot.</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 0; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 35%;">Service</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{service_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">New Date and Time</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{formatted_date} at {formatted_time}</td></tr>
      {loc_html}
    </table>
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    Your calendar invite has been updated. Reply to our WhatsApp chat if you need further changes.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Thank you.
  </div>
</div>
"""


def build_reminder_customer_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, contact_phone: str, full_location: str) -> str:
    loc_html = f"""<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Location</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{full_location}</td></tr>""" if full_location else ""
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #0369a1; background-color: #f0f9ff; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Reminder</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">Upcoming Appointment Reminder</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">Hello {name}, this is a reminder for your upcoming session.</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 0; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 35%;">Service</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{service_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Date and Time</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{formatted_date} at {formatted_time}</td></tr>
      {loc_html}
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Phone on File</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{contact_phone}</td></tr>
    </table>
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    Please arrive a few minutes early. If you need to reschedule, reply directly to our WhatsApp chat.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Thank you for choosing our business.
  </div>
</div>
"""


def build_review_customer_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, full_location: str) -> str:
    loc_html = f"""<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Location</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{full_location}</td></tr>""" if full_location else ""
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; background-color: #ecfdf5; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Completed</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">Thank You for Your Visit</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">Hello {name}, thank you for attending your appointment.</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 0; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 35%;">Completed Service</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{service_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Date and Time</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{formatted_date} at {formatted_time}</td></tr>
      {loc_html}
    </table>
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    How was your experience? We would love to hear your feedback—reply directly to our WhatsApp chat anytime.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Thank you for trusting us with your service.
  </div>
</div>
"""


def build_takeover_admin_email_html(customer_name: str, contact_phone: str, customer_email: str, reason: str = "Client requested to speak with a staff member") -> str:
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #b45309; background-color: #fffbeb; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Action Required</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">Staff Takeover Requested</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">A customer in WhatsApp chat has requested human assistance.</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 0; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 35%;">Customer</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{customer_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Phone</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{contact_phone}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Email</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{customer_email or 'Not on file'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">Reason</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{reason}</td></tr>
    </table>
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    AI automation is paused for this chat. Please open your CRM dashboard inbox to take over and reply.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Boldlabs CRM Alerts
  </div>
</div>
"""


def build_daily_digest_admin_email_html(date_str: str, today_bookings_count: int, upcoming_summary: str = "") -> str:
    upcoming_html = f"""<div style="margin-top: 16px; font-size: 13px; color: #334155;"><strong>Schedule overview:</strong><br>{upcoming_summary}</div>""" if upcoming_summary else ""
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="margin-bottom: 20px;">
    <div style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #4338ca; background-color: #eef2ff; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">Daily Digest</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">Daily Business Digest</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">Performance & appointment summary for {date_str}</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 16px 0; margin: 20px 0;">
    <div style="display: flex; gap: 12px;">
      <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px;">
        <div style="font-size: 12px; color: #64748b; font-weight: 500;">Today's Appointments</div>
        <div style="font-size: 22px; color: #0f172a; font-weight: 700; margin-top: 4px;">{today_bookings_count}</div>
      </div>
    </div>
    {upcoming_html}
  </div>

  <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5;">
    Open your CRM dashboard to manage today's calendar and follow-ups.
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
    Boldlabs CRM Daily Digest
  </div>
</div>
"""


# ── Web Push Notifications ─────────────────────────────────────────────────────
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "BMpihU9a8uXtZIkGtKTSKVJTLzTHzQf8Vz_WolZCxkgTb39GJ_0RajTa6-nI6gCBS7_p7Qk7bPHOKSi-6BwpoZU")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "7VmcO0Iktk1j2BIrJrzH4lsCg-n3h0AX-P3WwYqHV_0")
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL", "mailto:admin@goboldlabs.com")


async def dispatch_push_notification(
    pool: Optional[asyncpg.Pool],
    tenant_id: str,
    title: str,
    body: str,
    notif_type: str = "message",
    url: Optional[str] = None,
    data: Optional[dict] = None
) -> dict:
    """
    Persists notification in database and dispatches real background Web Push
    to all registered devices for this tenant.
    """
    if not pool or not tenant_id:
        return {"status": "error", "message": "Missing pool or tenant_id"}

    notification_id = str(uuid.uuid4())
    merged_data = {"url": url or "/boldlabs#inbox", "type": notif_type, **(data or {})}

    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO notifications (id, tenant_id, title, body, type, data, is_read, created_at)
                   VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, false, now())""",
                notification_id, tenant_id, title, body, notif_type, json.dumps(merged_data)
            )

            subs = await conn.fetch(
                "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE tenant_id = $1::uuid",
                tenant_id
            )
    except Exception as dbe:
        logger.error("push_db_persist_failed", error=str(dbe))
        subs = []

    if not subs:
        return {"status": "ok", "notification_id": notification_id, "sent_count": 0}

    payload_json = json.dumps({
        "title": title,
        "body": body,
        "icon": "/favicon.ico",
        "badge": "/favicon.ico",
        "tag": f"{notif_type}-{int(time.time())}",
        "data": merged_data
    })

    sent_count = 0
    expired_ids = []

    try:
        from pywebpush import webpush, WebPushException
        vapid_claims = {"sub": VAPID_CLAIM_EMAIL}

        for sub in subs:
            sub_info = {
                "endpoint": sub["endpoint"],
                "keys": {
                    "p256dh": sub["p256dh"],
                    "auth": sub["auth"]
                }
            }
            try:
                webpush(
                    subscription_info=sub_info,
                    data=payload_json,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=vapid_claims,
                    ttl=86400
                )
                sent_count += 1
            except WebPushException as ex:
                logger.warning("webpush_send_failed", endpoint=sub["endpoint"][:30], error=str(ex))
                if ex.response is not None and ex.response.status_code in [404, 410]:
                    expired_ids.append(sub["id"])
            except Exception as e:
                logger.warning("webpush_generic_error", error=str(e))

        if expired_ids:
            try:
                async with pool.acquire() as conn:
                    await conn.execute(
                        "DELETE FROM push_subscriptions WHERE id = ANY($1::uuid[])",
                        expired_ids
                    )
            except Exception:
                pass
    except Exception as e:
        logger.error("dispatch_push_notification_failed", error=str(e))

    return {"status": "ok", "notification_id": notification_id, "sent_count": sent_count}


# ── FastAPI app (for /health only — worker runs in background) ─────────────────
app = FastAPI(title="Core Worker", version="1.0.0")

REDIS_URL    = os.getenv("REDIS_URL", "redis://localhost:6379")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform")
STREAM_KEY   = "stream:message.inbound"
CONSUMER_GROUP = "core-workers"
STATUS_STREAM_KEY = "stream:message.status"
STATUS_CONSUMER_GROUP = "status-workers"
CONSUMER_NAME  = f"worker-{os.getenv('HOSTNAME', 'local')}"


class CoreWorker:
    def __init__(self):
        self.db_pool: Optional[asyncpg.Pool] = None
        self.redis: Optional[aioredis.Redis] = None

    async def start(self):
        # Connect DB and Redis
        self.db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=8)
        self.redis = aioredis.from_url(REDIS_URL, decode_responses=True)

        # Create consumer groups (idempotent)
        try:
            await self.redis.xgroup_create(STREAM_KEY, CONSUMER_GROUP, id="$", mkstream=True)
        except Exception:
            pass  # Group already exists

        try:
            await self.redis.xgroup_create(STATUS_STREAM_KEY, STATUS_CONSUMER_GROUP, id="$", mkstream=True)
        except Exception:
            pass

        logger.info("core_worker_started", stream=STREAM_KEY, group=CONSUMER_GROUP)

        # Start the stream consumer loop
        asyncio.create_task(self._consume_loop())

        # Start the status updates consumer loop (delivery & read receipts)
        asyncio.create_task(self._status_consume_loop())

        # Start the scheduled job checker (reminders, review requests)
        asyncio.create_task(self._scheduled_job_loop())

    async def _status_consume_loop(self):
        """
        Consume delivery & read receipts from Meta WhatsApp Cloud API.
        Updates messages.status -> 'sent' -> 'delivered' (grey 2 ticks) -> 'read' (blue 2 ticks).
        """
        while True:
            try:
                results = await self.redis.xreadgroup(
                    STATUS_CONSUMER_GROUP, f"{CONSUMER_NAME}-status",
                    {STATUS_STREAM_KEY: ">"},
                    count=10,
                    block=2000,
                )

                for _stream, messages in (results or []):
                    for msg_id, fields in messages:
                        wa_message_id = fields.get("waMessageId", "")
                        status = fields.get("status", "")  # 'sent', 'delivered', 'read', 'failed'
                        if wa_message_id and status:
                            await self.db_pool.execute(
                                """UPDATE messages 
                                   SET status = $1, updated_at = now() 
                                   WHERE wa_message_id = $2""",
                                status, wa_message_id
                            )
                            logger.info("status_updated", wa_message_id=wa_message_id, status=status)
                        await self.redis.xack(STATUS_STREAM_KEY, STATUS_CONSUMER_GROUP, msg_id)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("status_consume_loop_error", error=str(e))
                await asyncio.sleep(2)

    async def _consume_loop(self):
        """
        Consume messages from Redis Stream using consumer group.
        Redis Streams provide at-least-once delivery with ACK.
        """
        while True:
            try:
                # 1. First drain/recover any pending unacknowledged messages (e.g. from restarts)
                try:
                    pending = await self.redis.xreadgroup(
                        CONSUMER_GROUP, CONSUMER_NAME,
                        {STREAM_KEY: "0"},
                        count=10,
                    )
                    if pending:
                        for _stream, p_messages in pending:
                            for msg_id, fields in p_messages:
                                asyncio.create_task(self._handle_message(msg_id, fields))
                except Exception as p_err:
                    logger.debug("pending_stream_check_skip", error=str(p_err))

                # 2. Read new messages from stream, block for 2s if empty
                results = await self.redis.xreadgroup(
                    CONSUMER_GROUP, CONSUMER_NAME,
                    {STREAM_KEY: ">"},
                    count=20,
                    block=2000,
                )

                tasks = []
                for _stream, messages in (results or []):
                    for msg_id, fields in messages:
                        tasks.append(asyncio.create_task(self._handle_message(msg_id, fields)))
                
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("consume_loop_error", error=str(e))
                await asyncio.sleep(2)

    async def _handle_message(self, stream_msg_id: str, fields: dict):
        tenant_id = fields.get("tenantId", "")
        wa_message_id = fields.get("waMessageId", "")
        start = time.monotonic()

        try:
            # ── 1. Upsert contact ─────────────────────────────────────────────
            contact_id = await self._upsert_contact(
                tenant_id=tenant_id,
                phone=fields["from"],
                name=fields.get("contactName") or None,
            )

            # ── 1b. Automatically ensure customer record exists in Customers tab ──
            clean_from = re.sub(r'\D', '', str(fields.get("from", "")))
            try:
                await self.db_pool.execute(
                    """
                    INSERT INTO customers (tenant_id, phone, name, status, lead_probability, followup_date, followup_time, health_concern, preferred_doctor, last_messaged_at, created_at, updated_at)
                    VALUES ($1::uuid, $2, $3, 'new', 'warm', NULL, NULL, NULL, NULL, NOW(), NOW(), NOW())
                    ON CONFLICT (tenant_id, phone) DO UPDATE
                    SET updated_at = NOW(),
                        last_messaged_at = NOW(),
                        name = CASE 
                            WHEN customers.name IS NULL OR customers.name = '' OR customers.name = 'Customer'
                            THEN COALESCE(EXCLUDED.name, customers.name)
                            ELSE customers.name 
                        END
                    """,
                    tenant_id,
                    clean_from or fields["from"],
                    fields.get("contactName") or "Customer",
                )
            except Exception as cust_err:
                logger.warning("auto_upsert_customer_failed", phone=fields.get("from"), error=str(cust_err))

            # ── 2. Get or create conversation ─────────────────────────────────
            conv_id, conv_status = await self._get_or_create_conversation(tenant_id, contact_id)

            # ── 3. WhatsApp Read Receipts (2 Blue Ticks) ──────────────────────
            creds = await self._get_tenant_whatsapp_creds(tenant_id)
            tenant_info = await self.db_pool.fetchrow(
                "SELECT is_active, org_lifecycle_stage, subscription_status FROM tenants WHERE id = $1::uuid", tenant_id
            )
            is_active = tenant_info["is_active"] if tenant_info else True
            stage = (tenant_info.get("org_lifecycle_stage") or "setup") if tenant_info else "setup"
            sub_status = (tenant_info.get("subscription_status") or "active") if tenant_info else "active"
            sub_delinquent = (
                (stage in ("ready_to_activate", "billing_active") and sub_status != "active")
                or (sub_status in ("payment_failed", "paused", "cancelled"))
            )

            # Only auto-mark as read (blue ticks) if AI is enabled and handling this chat.
            # If in Human Mode or delinquent/paused, keep as delivered (2 grey ticks) until staff opens chat in CRM.
            if not sub_delinquent and is_active is not False and conv_status != "human" and creds and creds.get("phone_number_id") and creds.get("access_token"):
                asyncio.create_task(
                    mark_as_read(creds["phone_number_id"], creds["access_token"], wa_message_id)
                )

            # ── 4. Process Voice Notes / Audio Messages ───────────────────────
            msg_type = fields.get("type", "text")
            body_text = fields.get("body", "")

            if msg_type in ["audio", "voice"] or (not body_text and fields.get("rawJson")):
                raw_data = {}
                try:
                    raw_data = json.loads(fields.get("rawJson", "{}"))
                except Exception:
                    pass

                # Extract button / quick reply clicks
                if msg_type == "button" or "button" in raw_data:
                    btn_obj = raw_data.get("button", {})
                    body_text = btn_obj.get("text") or btn_obj.get("payload") or body_text
                    logger.info("button_reply_received", conv_id=conv_id, button_text=body_text)
                elif msg_type == "interactive" or "interactive" in raw_data:
                    inter_obj = raw_data.get("interactive", {})
                    if inter_obj.get("type") == "button_reply":
                        body_text = inter_obj.get("button_reply", {}).get("title") or inter_obj.get("button_reply", {}).get("id") or body_text
                    elif inter_obj.get("type") == "list_reply":
                        body_text = inter_obj.get("list_reply", {}).get("title") or inter_obj.get("list_reply", {}).get("id") or body_text
                    logger.info("interactive_reply_received", conv_id=conv_id, title=body_text)

                media_id = raw_data.get("audio", {}).get("id") or raw_data.get("voice", {}).get("id")
                if media_id and creds and creds.get("access_token"):
                    try:
                        groq_key = await self._get_groq_key(tenant_id)
                        gemini_key = await self._get_gemini_key(tenant_id)
                        transcription = await transcribe_voice_message(
                            media_id=media_id,
                            wa_access_token=creds["access_token"],
                            groq_api_key=groq_key,
                            gemini_api_key=gemini_key,
                        )
                        if transcription:
                            body_text = f"🎤 [Voice Note]: {transcription}"
                            logger.info("voice_note_transcribed", conv_id=conv_id, text=body_text[:60])
                    except Exception as e:
                        logger.error("voice_note_transcription_failed", media_id=media_id, error=str(e))
                        body_text = "🎤 [Voice Note received]"

            # ── 5. Persist inbound message ────────────────────────────────────
            safe_content_type = "interactive" if msg_type in ["button", "interactive"] else (msg_type if msg_type in ['text', 'image', 'audio', 'video', 'document', 'template', 'interactive', 'sticker', 'location', 'button'] else 'text')
            await self._persist_message(
                tenant_id=tenant_id,
                conversation_id=conv_id,
                wa_message_id=wa_message_id,
                direction="inbound",
                body=body_text,
                content_type=safe_content_type,
            )

            # ── 5b. Auto-detect & persist customer email if mentioned in message ───
            if body_text and "@" in body_text:
                found_emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', body_text)
                for cand in found_emails:
                    clean_em = sanitize_and_fix_email(cand)
                    if clean_em:
                        try:
                            await self.db_pool.execute(
                                "UPDATE contacts SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{email}', to_jsonb($1::text)) WHERE id = $2::uuid",
                                clean_em, contact_id
                            )
                            logger.info("customer_email_auto_extracted", email=clean_em, contact_id=contact_id)
                            break
                        except Exception as em_err:
                            logger.warning("persist_extracted_email_failed", error=str(em_err))

            # ── 6. Route to AI or skip (human mode, paused automation, or subscription delinquent) ─────
            # Strict Gating: If unpaid/delinquent, AI auto-replies are held until payment is completed!
            if sub_delinquent:
                logger.warn("skipping_ai_subscription_not_active", conv_id=conv_id, tenant_id=tenant_id, stage=stage, sub_status=sub_status)
            elif is_active is False:
                logger.warn("skipping_ai_tenant_paused", conv_id=conv_id, tenant_id=tenant_id)
            elif conv_status == "human":
                logger.info("skipping_ai_human_mode", conv_id=conv_id, tenant_id=tenant_id)
            elif body_text:
                await self._generate_and_send_reply(
                    tenant_id=tenant_id,
                    conv_id=conv_id,
                    contact_phone=fields["from"],
                    message_text=body_text,
                    creds=creds,
                )

            # ── 7. Update conversation timestamp ──────────────────────────────
            await self.db_pool.execute(
                "UPDATE conversations SET last_message_at = now(), unread_count = unread_count + 1 WHERE id = $1",
                conv_id,
            )

            messages_processed.labels(tenant=tenant_id, status="success").inc()
            await self.redis.xack(STREAM_KEY, CONSUMER_GROUP, stream_msg_id)

        except Exception as e:
            logger.error("message_handling_failed", tenant_id=tenant_id, wa_id=wa_message_id, error=str(e))
            messages_processed.labels(tenant=tenant_id, status="error").inc()
            # ACK anyway to prevent poison-pill loop; dead letter handled by ops
            await self.redis.xack(STREAM_KEY, CONSUMER_GROUP, stream_msg_id)
        finally:
            elapsed = time.monotonic() - start
            processing_time.labels(tenant=tenant_id).observe(elapsed)

    async def _get_live_occupied_slots(self, tenant_id: str, tenant_tz) -> tuple[list[dict], bool]:
        """
        Retrieves occupied/busy time slots from both local PostgreSQL bookings table
        AND live Google Calendar (via FreeBusy API) for the next 7 days.
        Returns (merged_busy_slots, is_gcal_connected).
        """
        now_dt = datetime.datetime.now(tenant_tz)
        min_dt = now_dt - datetime.timedelta(hours=2)
        max_dt = now_dt + datetime.timedelta(days=7)

        # 1. Query CRM bookings
        busy_slots = []
        try:
            db_rows = await self.db_pool.fetch(
                """SELECT service, start_time, end_time
                   FROM bookings
                   WHERE tenant_id = $1::uuid
                     AND status = 'confirmed'
                     AND start_time >= $2
                     AND start_time <= $3
                   ORDER BY start_time ASC LIMIT 50""",
                tenant_id, min_dt, max_dt
            )
            for r in db_rows:
                st = r['start_time'].astimezone(tenant_tz) if hasattr(r['start_time'], 'astimezone') else r['start_time']
                et = r['end_time'].astimezone(tenant_tz) if hasattr(r['end_time'], 'astimezone') else r['end_time']
                busy_slots.append({
                    "start": st,
                    "end": et,
                    "source": "CRM Booking",
                    "desc": r.get('service', 'Booked Appointment')
                })
        except Exception as e:
            logger.warning("db_busy_slots_query_error", error=str(e), tenant_id=tenant_id)

        # 2. Query Google Calendar Free/Busy in real time (non-blocking with strict timeout)
        gcal_connected = False
        try:
            gcal_row = await self.db_pool.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                tenant_id
            )
            if gcal_row and gcal_row["credential_data"]:
                g_data = gcal_row["credential_data"]
                if isinstance(g_data, str):
                    try: g_data = json.loads(g_data)
                    except: g_data = {}

                if g_data.get("client_id") and g_data.get("refresh_token"):
                    def fetch_gcal_freebusy():
                        from google.oauth2.credentials import Credentials
                        from googleapiclient.discovery import build
                        g_creds = Credentials(
                            token=g_data.get("access_token"),
                            refresh_token=g_data.get("refresh_token"),
                            token_uri="https://oauth2.googleapis.com/token",
                            client_id=g_data.get("client_id"),
                            client_secret=g_data.get("client_secret"),
                        )
                        service = build("calendar", "v3", credentials=g_creds, cache_discovery=False)
                        cal_id = g_data.get("calendar_id") or "primary"
                        fb_res = service.freebusy().query(body={
                            "timeMin": now_dt.isoformat(),
                            "timeMax": max_dt.isoformat(),
                            "timeZone": str(tenant_tz),
                            "items": [{"id": cal_id}]
                        }).execute()
                        return fb_res.get("calendars", {}).get(cal_id, {}).get("busy", [])

                    gcal_busy = await asyncio.wait_for(asyncio.to_thread(fetch_gcal_freebusy), timeout=2.5)
                    gcal_connected = True
                    for b in gcal_busy:
                        try:
                            st = datetime.datetime.fromisoformat(b['start'].replace('Z', '+00:00')).astimezone(tenant_tz)
                            et = datetime.datetime.fromisoformat(b['end'].replace('Z', '+00:00')).astimezone(tenant_tz)
                            # Deduplicate with existing slots within 60s
                            if not any(abs((x["start"] - st).total_seconds()) < 60 and abs((x["end"] - et).total_seconds()) < 60 for x in busy_slots):
                                busy_slots.append({
                                    "start": st,
                                    "end": et,
                                    "source": "Google Calendar",
                                    "desc": "Busy Event on Google Calendar"
                                })
                        except Exception as parse_err:
                            logger.warning("gcal_slot_parse_error", error=str(parse_err))
        except Exception as ex:
            logger.warning("gcal_availability_fetch_warning", error=str(ex), tenant_id=tenant_id)

        busy_slots.sort(key=lambda x: x["start"])
        return busy_slots, gcal_connected

    async def _generate_and_send_reply(
        self,
        tenant_id: str,
        conv_id: str,
        contact_phone: str,
        message_text: str,
        creds: Optional[dict],
    ):
        """Call Gemini / Groq / OpenCode Cascade → fallback to rule engine → send via WhatsApp."""

        # Get AI config and all tenant keys
        ai_cfg = await self._get_ai_config(tenant_id)
        gemini_key = await self._get_gemini_key(tenant_id)
        groq_key = await self._get_groq_key(tenant_id)
        opencode_key, opencode_base = await self._get_opencode_creds(tenant_id)
        primary_provider = (creds.get("primary_model_provider") if creds else None) or ai_cfg.get("model_provider") or ("groq" if groq_key else "gemini")

        # 1. Retrieve full conversation history (up to last 30 messages for deep context)
        rows = await self.db_pool.fetch(
            """SELECT direction, body FROM messages
               WHERE conversation_id = $1 AND body IS NOT NULL
               ORDER BY created_at DESC LIMIT 30""",
            conv_id,
        )
        history = [
            {"role": "user" if r["direction"] == "inbound" else "assistant", "content": r["body"]}
            for r in reversed(rows)
        ]
        if not history or history[-1]["content"] != message_text:
            history.append({"role": "user", "content": message_text})

        # Determine conversation turn depth & ongoing state
        is_ongoing_conversation = len(history) > 1
        if is_ongoing_conversation:
            conversation_state_block = (
                f"### CONVERSATION STATE: CONTINUOUS ONGOING CONVERSATION (Turn #{len(history)}):\n"
                "- STRICT PROHIBITION: ABSOLUTELY DO NOT SAY 'Hi', 'Hello', 'Hey', 'Hi again', 'Hello again', OR RE-INTRODUCE YOURSELF.\n"
                "- The greeting phase is ALREADY FINISHED. You and the customer already greeted each other earlier in this chat.\n"
                "- A real human texting on WhatsApp NEVER repeatedly greets with 'Hi again!' on every single message. It sounds robotic, unnatural, and irritating.\n"
                "- Respond DIRECTLY, naturally, and warmly to what the customer just said without any greetings."
            )
        else:
            conversation_state_block = (
                "### CONVERSATION STATE: FIRST INCOMING MESSAGE:\n"
                "- This is the first greeting or message from this customer. Greet them warmly, state your name/role naturally, and ask how you can help."
            )

        # 2. Retrieve customer profile & bookings memory
        contact_row = await self.db_pool.fetchrow(
            """SELECT c.name, c.wa_profile_name, c.phone, c.tags, c.notes, c.metadata
               FROM conversations conv
               JOIN contacts c ON c.id = conv.contact_id
               WHERE conv.id = $1""",
            conv_id,
        )
        booking_rows = await self.db_pool.fetch(
            """SELECT service, start_time, status
               FROM bookings
               WHERE contact_id = (SELECT contact_id FROM conversations WHERE id = $1)
               ORDER BY start_time DESC LIMIT 3""",
            conv_id,
        )

        # Check if we have a verified customer full name (not default placeholder)
        db_name = (contact_row["name"] or "").strip() if contact_row else ""
        wa_name = (contact_row["wa_profile_name"] or "").strip() if contact_row else ""
        has_real_name = bool(db_name and db_name not in ["Valued Customer", "Client", "Customer"])
        customer_name_display = db_name if has_real_name else (f"Not confirmed yet (WhatsApp handle: {wa_name})" if wa_name else "Unknown")
        customer_name = db_name or wa_name or "Valued Customer"

        tags = (", ".join(contact_row["tags"])) if contact_row and contact_row.get("tags") else "None"
        notes = contact_row["notes"] if contact_row and contact_row.get("notes") else ""

        # Extract email from contact metadata if available
        meta_dict = contact_row.get("metadata") if contact_row else {}
        if isinstance(meta_dict, str):
            try: meta_dict = json.loads(meta_dict)
            except: meta_dict = {}
        customer_email = meta_dict.get("email") if isinstance(meta_dict, dict) else None

        tenant_timezone_str = "Asia/Kolkata"
        tenant_currency_str = "INR"
        tenant_currency_sym = "₹"
        tenant_country_code = "+91"
        tenant_st_row = await self.db_pool.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
        if tenant_st_row:
            if isinstance(tenant_st_row, str):
                try: tenant_st_row = json.loads(tenant_st_row)
                except: tenant_st_row = {}
            if tenant_st_row.get("timezone"):
                tenant_timezone_str = tenant_st_row.get("timezone").strip()
            if tenant_st_row.get("currency"):
                tenant_currency_str = tenant_st_row.get("currency").strip()
            if tenant_st_row.get("currency_symbol"):
                tenant_currency_sym = tenant_st_row.get("currency_symbol").strip()
            if tenant_st_row.get("country_code"):
                tenant_country_code = tenant_st_row.get("country_code").strip()

        import datetime
        try:
            import zoneinfo
            tenant_tz = zoneinfo.ZoneInfo(tenant_timezone_str)
        except Exception:
            tenant_tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

        booking_info = "No previous appointments."
        if booking_rows:
            b_list = []
            for b in booking_rows:
                st = b['start_time']
                if hasattr(st, 'astimezone'):
                    st_local = st.astimezone(tenant_tz)
                else:
                    st_local = st
                b_list.append(f"{b.get('service', 'Appointment')} on {st_local.strftime('%A, %d %b %Y at %I:%M %p')} (Status: {b.get('status', 'confirmed')})")
            booking_info = "; ".join(b_list)

        now = datetime.datetime.now(tenant_tz)
        time_context = (
            f"Today is {now.strftime('%A, %d %B %Y')} and current time is {now.strftime('%I:%M %p')} ({tenant_timezone_str} time).\n"
            f"Customer WhatsApp number: {contact_phone}\n"
            f"Business Currency: {tenant_currency_str} ({tenant_currency_sym})\n"
            "Use this live timestamp to resolve relative dates (today, tomorrow, next Monday) and know if a time has already passed.\n\n"
        )

        # Retrieve all currently booked/occupied slots for this business (next 7 days) from Google Calendar and CRM
        busy_slots, gcal_connected = await self._get_live_occupied_slots(tenant_id, tenant_tz)
        if busy_slots:
            busy_lines = [
                f"- {s['start'].strftime('%A, %d %b %Y: %I:%M %p')} to {s['end'].strftime('%I:%M %p')} ({s['source']})"
                for s in busy_slots
            ]
            busy_slots_block = (
                f"### LIVE CALENDAR AVAILABILITY & OCCUPIED TIMESLOTS ({'GOOGLE CALENDAR LIVE SYNC ACTIVE' if gcal_connected else 'CRM LOCAL SCHEDULE'}):\n"
                f"- Live Integration Status: {'Google Calendar Connected & Verified (Ground Truth)' if gcal_connected else 'CRM Internal Schedule Active'}\n"
                "The following time slots are ALREADY OCCUPIED and BUSY on the calendar over the next 7 days. NO ONE CAN BOOK THESE TIMES:\n"
                + "\n".join(busy_lines)
                + "\n\n### STRICT AVAILABILITY & FREE-TIME BOOKING DIRECTIVES (ZERO WRONG DATA):\n"
                "- LIVE CALENDAR GROUND TRUTH: The occupied slots above are the definitive ground truth from Google Calendar and the CRM.\n"
                "- FREE TIME ONLY: You must STRICTLY and EXCLUSIVELY propose or confirm appointments during open, unoccupied time slots.\n"
                "- ZERO WRONG OR INCORRECT DATA: NEVER guess, invent, or state inaccurate slot availability. If a customer requests any occupied time slot above, you MUST politely inform them that this slot is already booked on the calendar, and propose the closest open free time instead.\n"
                "- BUSINESS OPERATING HOURS: Standard business operating hours are strictly 09:00 AM to 08:00 PM. Never propose times outside operating hours or overlapping with occupied slots.\n"
                "- NO TIME ASSUMPTION: If the customer asks for an appointment without giving a specific time, ask what day and time works best for them. Never assume today at 3pm or create a booking without their explicit confirmation."
            )
        else:
            busy_slots_block = (
                f"### LIVE CALENDAR AVAILABILITY ({'GOOGLE CALENDAR LIVE SYNC ACTIVE' if gcal_connected else 'CRM LOCAL SCHEDULE'}):\n"
                f"- Live Integration Status: {'Google Calendar Connected & Verified (Ground Truth)' if gcal_connected else 'CRM Internal Schedule Active'}\n"
                "All standard business hours (09:00 AM to 08:00 PM) over the next 7 days are currently open and available for booking.\n"
                "- Propose and book only during standard business hours upon customer confirmation. Never invent or assume times."
            )

        memory_block = (
            "### CUSTOMER PROFILE & CONVERSATION MEMORY:\n"
            f"- Customer Name: {customer_name_display}\n"
            f"- Customer WhatsApp Phone: {contact_phone}\n"
            f"- Customer Email on File: {customer_email if customer_email else 'Not provided yet (Ask for email)'}\n"
            f"- Known Bookings for THIS Customer: {booking_info}\n"
            f"- CRM Tags: {tags}\n"
            f"- Profile Notes: {notes if notes else 'None'}\n"
            "- PERSISTENT MEMORY DIRECTIVE: You have persistent memory across this entire conversation history. "
            "Remember everything the customer has mentioned (clinic details, enquiry handling, setup, questions, preferences). "
            "NEVER re-ask questions they already answered in the history below. Continue the conversation fluidly using all prior context."
        )

        assistant_name = ai_cfg.get("assistant_name") or "Assistant"
        custom_instructions = ai_cfg.get("system_prompt") or ""
        bot_goal = ai_cfg.get("bot_goal") or ""
        services_text = ai_cfg.get("services_text") or ""
        response_style = ai_cfg.get("response_style") or "short"
        methodology = ai_cfg.get("methodology") or "dogfooding"
        strict_rules = (ai_cfg.get("strict_rules") or "").strip() or GLOBAL_DEFAULT_STRICT_RULES
        if "CONTINUOUS CONVERSATION" not in strict_rules:
            strict_rules = "- CONTINUOUS CONVERSATION & ZERO RE-GREETING: Never say 'Hi again', 'Hello again', or re-greet in an ongoing chat. Greet only on the very first message; thereafter reply directly to what the customer said.\n" + strict_rules
        if "GOOGLE CALENDAR AVAILABILITY" not in strict_rules:
            strict_rules = "- GOOGLE CALENDAR AVAILABILITY & FREE-TIME BOOKING: Check live availability from Google Calendar. Propose and book only during verified open free time. Never invent, hallucinate, or state incorrect, wrong, or occupied timeslots.\n" + strict_rules
        objection_handling = ai_cfg.get("objection_handling") or ""

        # Master Global Human Persona & Conversational Intelligence Engine
        master_human_directives = (
            "### MASTER HUMAN CONVERSATION & TEXTING RULES (MANDATORY FOR EVERY REPLY):\n"
            "You are replying as a REAL PERSON representing the business on WhatsApp, NOT as an AI bot.\n"
            "Always use the business name, tone, services, and verified details given to you in context. Never invent or assume business details on your own.\n\n"
            "1. Continuous Conversation & Zero Re-Greeting Rule (ABSOLUTE MANDATORY):\n"
            "- NEVER say 'Hi', 'Hello', 'Hey', 'Hi again', 'Hello again', or repeatedly greet the customer in an ongoing chat!\n"
            "- You only introduce yourself or greet ONCE at the very first message of a brand new conversation.\n"
            "- Once the customer has replied or the conversation is in progress (from message 2 onwards), DIVE DIRECTLY into the answer or question with empathy.\n"
            "- Never say 'Hi again! Thanks for sharing...' or 'Hello again!'. Jump straight to: 'Thanks for sharing...' or 'Got it...'.\n\n"
            "2. Sound Like a Real Person, Not a Script:\n"
            "- Acknowledge what the person just said before moving on to your point, the way someone naturally reacts, rather than jumping straight into an answer.\n"
            "- Small natural reactions are fine here and there (e.g., 'Oh got it', 'Makes total sense', 'Sure thing'), but keep them genuine.\n"
            "- Match their energy and formality: casual gets casual back, while a worried or frustrated message gets genuine warmth and reassurance before a solution.\n"
            "- Mirror the language and tone they wrote in (English, Hinglish, casual phrases, etc.).\n"
            "- Ask ONE thing at a time. NEVER stack two or three questions into one message.\n"
            "- Show real interest with a genuine follow-up instead of rushing them to the next step.\n\n"
            "3. Natural WhatsApp Texting Style:\n"
            "- Write like you're texting on your phone, not filing a corporate report.\n"
            "- Keep replies concise and punchy (1 to 2 short sentences). Make every word count.\n"
            "- DO NOT insert blank line gaps between short 1-2 sentence replies. Connect them smoothly into a single natural sentence or paragraph (e.g. 'Awesome, I have got that booked for you for today at 07:00 PM.' or 'Thanks for sharing that! Just to quickly check...'). Use a line gap ONLY when providing a list or separating distinct topics.\n"
            "- NEVER use em dashes (—) or hyphens connecting clauses. Use a comma or short period instead.\n"
            "- CUT ALL AI CLICHÉS and canned customer service lines: 'in conclusion', 'delve into', 'furthermore', 'moreover', 'it's important to note', 'game-changer', 'not just X, but Y', 'I understand your concern', 'thank you for reaching out'.\n"
            "- Mix short and medium sentences. Skip bullet points and headers unless the user explicitly requested a list.\n"
            "- Use natural contractions (I'll, we'll, you'll, that's). Prefer active voice. Be specific, not vague."
        )

        appointment_intelligence = (
            "### APPOINTMENT INTELLIGENCE & CONFLICT PREVENTION (MANDATORY):\n\n"
            "1. CUSTOMER ALREADY HAS AN UPCOMING BOOKING:\n"
            "- If the customer already has an upcoming booking listed under 'Known Bookings for THIS Customer' and asks to book an appointment (e.g. 'Want to book appointment', 'I want an appointment', 'Can I book a call?'):\n"
            "  * Remind them of their currently scheduled booking first, and ask if they want to reschedule that one or book an additional appointment!\n"
            "  * Example: 'You already have an appointment scheduled for [Date & Time]! Did you want to reschedule that one, or book an additional slot?'\n"
            "  * DO NOT create a new booking unless they confirm they want another additional booking or reschedule.\n\n"
            "2. STRICT BOOKING GUARDRAIL — NEVER ASSUME OR INVENT DATE / TIME:\n"
            "- If the customer does not have an upcoming booking and says 'Want to book appointment', 'I want an appointment', 'Can I book a slot?', or general booking intent:\n"
            "  * DO NOT BOOK AN APPOINTMENT IMMEDIATELY.\n"
            "  * DO NOT INVENT OR ASSUME A TIME OR DATE ON YOUR OWN (never assume today at 15:00, etc.).\n"
            "  * NEVER output [ACTION:CREATE_BOOKING: ...] on a general request.\n"
            "  * Instead, ask what day and time they prefer (and ask for their name/email if not on file), e.g.:\n"
            "    'Sure thing! What day and time works best for you?'\n"
            "    (or 'Sure! What day and time works best for you? Also please share your full name and email for the calendar invite.').\n\n"
            "3. CONFLICT PREVENTION & LIVE CALENDAR FREE-TIME BOOKING (ZERO WRONG DATA):\n"
            "- Only ONE appointment can be booked in any given time slot.\n"
            "- Check the 'LIVE CALENDAR AVAILABILITY & OCCUPIED TIMESLOTS' list above before proposing or agreeing to any time.\n"
            "- If a customer asks for a slot that is already occupied or busy on Google Calendar (or CRM), NEVER agree to that time.\n"
            "- NEVER say incorrect, hallucinated, or wrong schedule data. Politely inform them:\n"
            "  'That slot is already booked on our calendar. Would [suggest an available free time from open hours] work for you instead?'\n"
            "- Operating hours: strictly within business hours (09:00 AM to 08:00 PM).\n\n"
            "4. INQUIRY ABOUT EXISTING APPOINTMENT ('When is my appointment?', 'What time is my call?', 'Do I have a booking?', 'Check my appointment', 'My appointment status'):\n"
            "- CRITICAL GLOBAL DIRECTIVE: THIS IS AN INFORMATIONAL STATUS INQUIRY ONLY.\n"
            "- The customer is ONLY asking what time or date their existing appointment is. THEY ARE NOT ASKING TO BOOK OR RESCHEDULE!\n"
            "- STRICT PROHIBITIONS:\n"
            "  * NEVER create a new booking on an inquiry.\n"
            "  * NEVER reschedule, alter, or move their existing booking.\n"
            "  * NEVER output [ACTION:CREATE_BOOKING: ...] or [ACTION:RESCHEDULE_BOOKING: ...] under ANY circumstances.\n"
            "  * NEVER say 'Your demo is now set for...', 'has been rescheduled to...', or 'is booked for...' as if you just executed an action.\n"
            "- EXACT REQUIRED BEHAVIOR:\n"
            "  * Look directly at 'Known Bookings for THIS Customer' in the CUSTOMER PROFILE above.\n"
            "  * If they have an existing confirmed/upcoming booking:\n"
            "    State clearly in 1 friendly, natural sentence when their appointment is already scheduled:\n"
            "    Example: 'Your Free Discovery Demo is scheduled for today, 05 Sep 2026 at 08:00 AM! Let me know if you need to make any changes or have any questions.'\n"
            "  * If they have NO active bookings listed:\n"
            "    State clearly in 1 short sentence: 'You don't have an active appointment scheduled right now. Would you like to book one?'\n\n"
            "5. MANDATORY ACTION TAG ON BOOKING CONFIRMATION:\n"
            "- Once the customer has provided or confirmed their Date, Time, Name, and Email (e.g. user says 'Yes', 'Confirm', 'Today 7pm', etc.):\n"
            "  You MUST append the booking action tag on a new line at the very end of your reply:\n"
            "  [ACTION:CREATE_BOOKING: {\"service\": \"<Service Name>\", \"date\": \"YYYY-MM-DD\", \"time\": \"HH:MM\", \"name\": \"<Customer Name>\", \"email\": \"<Customer Email>\", \"notes\": \"<Notes>\"}]\n"
            "- CRITICAL: If you tell the customer their appointment is booked or confirmed without this exact tag, the calendar invite CANNOT be generated!\n\n"
            "6. CANCELLATION ACTIONS (MANDATORY):\n"
            "- When a customer explicitly asks to cancel their booking (e.g. 'cancel my appointment', 'cancel it', 'want to cancell it', 'yes cancel'):\n"
            "  * If they have an existing booking listed above: Confirm the cancellation politely in 1 short line, and MUST append on a new line:\n"
            "    [ACTION:CANCEL_BOOKING]\n"
            "- If they do not have an active booking: Let them know they don't have an active booking to cancel.\n\n"
            "7. RESCHEDULE ACTIONS (MANDATORY):\n"
            "- When a customer asks to change or reschedule their booking to a new Date & Time:\n"
            "  * Check that the new slot is not occupied.\n"
            "  * Confirm the new Date & Time politely in 1 short line, and MUST append on a new line:\n"
            "    [ACTION:RESCHEDULE_BOOKING: {\"service\": \"<Service Name>\", \"date\": \"YYYY-MM-DD\", \"time\": \"HH:MM\", \"name\": \"<Customer Name>\", \"email\": \"<Customer Email>\", \"notes\": \"Rescheduled\"}]\n\n"
            "8. 12-HOUR TIME FORMAT DIRECTIVE (ABSOLUTE MANDATORY RULE):\n"
            "- The entire business operates strictly in 12-HOUR TIME FORMAT.\n"
            "- ALWAYS speak, quote, propose, and confirm appointments exclusively in 12-HOUR FORMAT WITH AM/PM (e.g., '10:00 AM', '02:30 PM', '07:00 PM').\n"
            "- NEVER use military or 24-hour time (like 20:30, 19:00, or 14:00) when replying to customers.\n"
            "- In the JSON action tag [ACTION:CREATE_BOOKING: ...] or [ACTION:RESCHEDULE_BOOKING: ...], pass time in either 12-hour format ('07:00 PM') or HH:MM ('19:00').\n\n"
            "9. AUTOMATIC CUSTOMER DETAIL EXTRACTION (AGE & LOCATION):\n"
            "- If the customer mentions their age (e.g. 'I am 26', 'age 32', '24 yrs old') or their location/city/area (e.g. 'from Anna Nagar, Chennai', 'living in Bangalore', 'from Delhi'):\n"
            "  Append this action tag on a new line at the very end of your reply:\n"
            "  [ACTION:CUSTOMER_INFO: {\"age\": <age as integer or null>, \"location\": \"<City or location>\"}]"
        )

        full_location = (creds.get("full_location_text") or "").strip() if creds else ""
        if not full_location:
            tenant_st = await self.db_pool.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
            if tenant_st:
                if isinstance(tenant_st, str):
                    try: tenant_st = json.loads(tenant_st)
                    except: tenant_st = {}
                full_location = (tenant_st.get("full_location_text") or "").strip()

        prompt_blocks = [
            time_context,
            f"You are {assistant_name or 'the assistant'}, representing this business directly on WhatsApp chat.",
            conversation_state_block,
            memory_block,
            busy_slots_block,
        ]

        if custom_instructions.strip():
            prompt_blocks.append(f"### BUSINESS KNOWLEDGE BASE & INSTRUCTIONS:\n{custom_instructions.strip()}")

        if services_text.strip():
            prompt_blocks.append(f"### SERVICES & PRICING:\n{services_text.strip()}")

        if bot_goal.strip():
            prompt_blocks.append(f"### GOALS & OBJECTIVES:\n{bot_goal.strip()}")

        if objection_handling.strip():
            prompt_blocks.append(f"### OBJECTION HANDLING STRATEGY:\n{objection_handling.strip()}")

        if strict_rules.strip():
            prompt_blocks.append(f"### GLOBAL BOT STRICT RULES & NEGATIVE CONSTRAINTS:\n{strict_rules.strip()}")

        if response_style.strip():
            prompt_blocks.append(f"### CONVERSATION STYLE & TONE:\n{response_style.strip()}")

        if methodology.strip():
            prompt_blocks.append(f"### CONVERSATION METHODOLOGY:\n{methodology.strip()}")

        if full_location:
            prompt_blocks.append(f"### BUSINESS ADDRESS & LOCATION:\n{full_location}\n- Provide this exact address and directions whenever the customer asks where the business or clinic is located.")

        # Supreme Authority Directives at the very bottom
        prompt_blocks.append(master_human_directives)
        prompt_blocks.append(appointment_intelligence)

        prompt_blocks.append(
            "### STRICT DOMAIN COMPLIANCE PROTOCOL (ABSOLUTE RULE):\n"
            "1. You must STRICTLY and EXCLUSIVELY answer using ONLY the facts, instructions, services, and pricing provided in the knowledge base above.\n"
            "2. If a customer asks a question outside what is provided in this prompt, politely state that our team can explain those details on a quick call, or answer that we do not offer that service. Never guess or provide out-of-the-box unlisted info.\n"
            "3. NEVER invent, assume, or quote unlisted prices, discounts, or policies under any circumstance.\n"
            "4. Reply ONLY as a real person in natural, concise WhatsApp texting style (1-2 short lines)."
        )

        active_system_prompt = "\n\n".join(prompt_blocks)

        response_text, provider_used = await call_llm_cascade(
            messages=history,
            system_prompt=active_system_prompt,
            gemini_key=gemini_key,
            groq_key=groq_key,
            opencode_key=opencode_key,
            opencode_base_url=opencode_base,
            primary_provider=primary_provider,
            gemini_model=ai_cfg.get("model") or "gemini-3.1-flash-lite",
            max_tokens=350,
            temperature=0.3,
            timeout_seconds=3.5,
            tenant_id=tenant_id,
        )

        booking_action = None
        cancel_action = False
        reschedule_action = None
        ai_used_fallback = (provider_used != primary_provider and provider_used != "gemini")

        # Inbound Customer Cancellation Intent Safety Net
        inbound_lower = (message_text or "").lower().strip()
        inbound_cancel_intent = any(w in inbound_lower for w in ["cancell it", "cancel it", "yes cancel", "yes cancell", "cancel booking", "cancell booking", "cancel appointment", "cancell appointment", "cancel my", "cancell my"]) or (inbound_lower in ["cancel", "cancell", "yes cancel", "yes cancell", "cancell it", "cancel it"])
        if inbound_cancel_intent:
            cancel_action = True
            logger.info("inbound_cancellation_intent_detected", customer_msg=message_text)

        # Inbound Appointment Inquiry Detection (Lookup Only - NEVER rebook or reschedule)
        inbound_appointment_inquiry = any(p in inbound_lower for p in [
            "when is my appointment", "when is my booking", "what time is my appointment",
            "what time is my booking", "what time is my call", "what time is my demo",
            "do i have an appointment", "do i have a booking", "check my appointment",
            "check my booking", "my appointment time", "my appointment date",
            "when is my demo", "appointment status", "booking status", "when is my meeting",
            "when is appointment", "what time is appointment"
        ])

        # Inbound Human Takeover Request Intent
        human_request_intent = any(w in inbound_lower for w in ["human agent", "talk to human", "speak to human", "talk to agent", "talk to staff", "speak to real person", "real person", "customer care executive", "connect to agent", "human support", "speak with someone"])
        if human_request_intent:
            await self.db_pool.execute("UPDATE conversations SET status = 'human', updated_at = now() WHERE id = $1::uuid", conv_id)
            response_text = "I have notified our team. A staff member will take over this conversation shortly!"
            asyncio.create_task(
                self._execute_admin_human_alert(
                    tenant_id=tenant_id,
                    conv_id=conv_id,
                    contact_phone=contact_phone,
                    customer_name=customer_name,
                    creds=creds,
                )
            )

        if response_text:
            response_text = clean_llm_response(response_text)
            if is_ongoing_conversation:
                response_text = strip_repetitive_greetings(response_text)
            
            # 1. Intercept [ACTION:CANCEL_BOOKING] or AI confirmation phrases
            if "[ACTION:CANCEL_BOOKING]" in response_text or any(phrase in response_text.lower() for phrase in ["cancelled your booking", "have cancelled your", "booking has been cancelled", "appointment is cancelled", "appointment has been cancelled", "cancelled your appointment"]):
                cancel_action = True
                response_text = response_text.replace("[ACTION:CANCEL_BOOKING]", "").strip()

            # 2. Intercept [ACTION:RESCHEDULE_BOOKING: ...]
            m_resched = re.search(r'\[ACTION:RESCHEDULE_BOOKING:\s*(\{.*?\})\]', response_text, re.DOTALL)
            if m_resched:
                try:
                    reschedule_action = json.loads(m_resched.group(1))
                except Exception as e:
                    logger.warning("reschedule_action_json_parse_failed", error=str(e))
                response_text = re.sub(r'\[ACTION:RESCHEDULE_BOOKING:\s*\{.*?\}\]', '', response_text, flags=re.DOTALL).strip()

            # Intercept [ACTION:CUSTOMER_INFO: ...] tag
            m_cust = re.search(r'\[ACTION:CUSTOMER_INFO:\s*(\{.*?\})\]', response_text, re.DOTALL)
            if m_cust:
                try:
                    c_info = json.loads(m_cust.group(1))
                    c_age = c_info.get("age")
                    c_loc = c_info.get("location")
                    if c_age or c_loc:
                        asyncio.create_task(
                            self._update_customer_extracted_info(tenant_id, contact_phone, c_age, c_loc)
                        )
                except Exception as ex:
                    logger.warning("customer_info_parse_failed", error=str(ex))
                response_text = re.sub(r'\[ACTION:CUSTOMER_INFO:\s*\{.*?\}\]', '', response_text, flags=re.DOTALL).strip()

            # 3. Intercept [ACTION:CREATE_BOOKING: ...] tag
            m = re.search(r'\[ACTION:CREATE_BOOKING:\s*(\{.*?\})\]', response_text, re.DOTALL)
            if m:
                try:
                    booking_action = json.loads(m.group(1))
                except Exception as e:
                    logger.warning("booking_action_json_parse_failed", error=str(e))
                # Strip action tag from message sent to WhatsApp customer
                response_text = re.sub(r'\[ACTION:CREATE_BOOKING:\s*\{.*?\}\]', '', response_text, flags=re.DOTALL).strip()

            # 4. Inbound Appointment Inquiry Protection
            if inbound_appointment_inquiry:
                if booking_action or reschedule_action:
                    logger.info("suppressed_accidental_action_on_inquiry",
                                had_booking=bool(booking_action),
                                had_reschedule=bool(reschedule_action),
                                customer_msg=message_text)
                    booking_action = None
                    reschedule_action = None
                    cancel_action = False

                # Sanitize response if LLM hallucinated rebooking confirmation phrasing
                accident_phrases = ["is now set for", "has been rescheduled to", "is rescheduled to", "have rescheduled", "is now booked for"]
                if any(ph in (response_text or "").lower() for ph in accident_phrases):
                    try:
                        active_b = await self.db_pool.fetchrow(
                            """SELECT service_name, booking_date, booking_time FROM bookings
                               WHERE tenant_id = $1::uuid AND (customer_phone = $2 OR RIGHT(REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($2, '[^0-9]', '', 'g'), 10))
                               AND status IN ('confirmed', 'pending') ORDER BY booking_date DESC, booking_time DESC LIMIT 1""",
                            tenant_id, contact_phone
                        )
                        if active_b:
                            svc = active_b["service_name"] or "Consultation"
                            b_dt = active_b["booking_date"].strftime("%d %b %Y") if hasattr(active_b["booking_date"], "strftime") else str(active_b["booking_date"])
                            b_tm = str(active_b["booking_time"] or "")
                            try:
                                t_parts = b_tm.split(":")
                                hour = int(t_parts[0])
                                minute = t_parts[1][:2]
                                am_pm = "AM" if hour < 12 else "PM"
                                display_hour = 12 if hour in (0, 12) else hour % 12
                                b_tm = f"{display_hour:02d}:{minute} {am_pm}"
                            except Exception:
                                pass
                            response_text = f"Your {svc} appointment is scheduled for {b_dt} at {b_tm}! Let me know if you need to reschedule or have any questions."
                        else:
                            response_text = "You don't have an active appointment scheduled right now. Would you like to book one?"
                    except Exception as ex:
                        logger.warning("failed_to_lookup_booking_for_sanitization", error=str(ex))

            if not response_text:
                if booking_action:
                    svc = booking_action.get('service') or 'Consultation'
                    dt = booking_action.get('date') or 'the scheduled date'
                    tm = booking_action.get('time') or ''
                    response_text = f"Your appointment for {svc} on {dt} at {tm} has been confirmed! Looking forward to it."
                elif cancel_action:
                    response_text = "Your appointment has been cancelled. Please reach out anytime if you would like to reschedule."
                elif reschedule_action:
                    dt = reschedule_action.get('date') or 'the new date'
                    tm = reschedule_action.get('time') or ''
                    response_text = f"Your appointment has been rescheduled to {dt} at {tm}."

            ai_requests.labels(tenant=tenant_id, provider=provider_used).inc()
        
        if not response_text:
            # Load tenant rules from DB only if completely empty and no booking action
            rule_rows = await self.db_pool.fetch(
                "SELECT name, priority, trigger_type, trigger_value, response_text FROM reply_rules "
                "WHERE tenant_id = $1 AND is_active = true ORDER BY priority DESC",
                tenant_id,
            )
            tenant_rules = [db_row_to_rule(dict(r)) for r in rule_rows]
            response_text = apply_rule_engine(message_text, tenant_id, tenant_rules)
            provider_used = "rule_engine"
            ai_used_fallback = True
            ai_requests.labels(tenant=tenant_id, provider="rule_engine").inc()

        if response_text:
            def _repl_12hr(m):
                hh = int(m.group(1))
                mm = m.group(2)
                if hh >= 12:
                    return f"{hh if hh == 12 else hh - 12:02d}:{mm} PM"
                else:
                    return f"{12 if hh == 0 else hh:02d}:{mm} AM"
            response_text = re.sub(r'\b([01]?\d|2[0-3]):([0-5]\d)(?!\s*(?:am|pm|AM|PM))\b', _repl_12hr, response_text)

        # Persist outbound message
        out_msg_id = await self.db_pool.fetchval(
            """INSERT INTO messages
               (id, conversation_id, tenant_id, direction, content_type, body, status, ai_model_used, ai_used_fallback)
               VALUES ($1::uuid, $2::uuid, $3::uuid, 'outbound', 'text', $4, 'pending', $5, $6)
               RETURNING id""",
            str(uuid.uuid4()), conv_id, tenant_id, response_text, provider_used, ai_used_fallback,
        )
        try:
            await self.db_pool.execute(
                "UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1::uuid",
                conv_id
            )
            clean_cp = re.sub(r'\D', '', str(contact_phone))
            await self.db_pool.execute(
                """UPDATE customers SET last_messaged_at = NOW(), updated_at = NOW()
                   WHERE tenant_id = $1::uuid AND (phone = $2 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = RIGHT($2, 10))""",
                tenant_id, clean_cp or contact_phone
            )
        except Exception as e:
            logger.warning("outbound_conversation_update_failed", error=str(e))

        # Send via WhatsApp using client's own phone number
        if creds and creds.get("phone_number_id") and creds.get("access_token"):
            try:
                wa_id = await send_text(
                    phone_number_id=creds["phone_number_id"],
                    access_token=creds["access_token"],
                    to=contact_phone,
                    body=response_text,
                )
                # Update message with wa_message_id and sent status
                await self.db_pool.execute(
                    "UPDATE messages SET wa_message_id = $1, status = 'sent' WHERE id = $2::uuid",
                    wa_id, str(out_msg_id),
                )
                wa_sends.labels(tenant=tenant_id, status="success").inc()
            except WhatsAppSendError as e:
                await self.db_pool.execute(
                    "UPDATE messages SET status = 'failed', error_message = $1 WHERE id = $2::uuid",
                    str(e), str(out_msg_id),
                )
                wa_sends.labels(tenant=tenant_id, status="failed").inc()
                logger.error("wa_send_failed", error=str(e), tenant_id=tenant_id)
        else:
            logger.warning("no_whatsapp_creds_cannot_send", tenant_id=tenant_id)

        # Execute Actions: Cancellation, Reschedule, or New Booking
        if cancel_action:
            asyncio.create_task(
                self._execute_ai_cancellation(
                    tenant_id=tenant_id,
                    conv_id=conv_id,
                    contact_phone=contact_phone,
                    customer_name=customer_name,
                    creds=creds,
                )
            )
        elif reschedule_action:
            asyncio.create_task(
                self._execute_ai_reschedule(
                    tenant_id=tenant_id,
                    conv_id=conv_id,
                    contact_phone=contact_phone,
                    customer_name=customer_name,
                    booking_data=reschedule_action,
                    creds=creds,
                )
            )
        elif booking_action:
            asyncio.create_task(
                self._execute_ai_booking(
                    tenant_id=tenant_id,
                    conv_id=conv_id,
                    contact_phone=contact_phone,
                    customer_name=customer_name,
                    booking_data=booking_action,
                    creds=creds,
                )
            )


    async def _update_customer_extracted_info(self, tenant_id: str, phone: str, age=None, location=None):
        """Auto-update customer age/location extracted from WhatsApp message by AI."""
        try:
            pool = self.db_pool
            row = await pool.fetchrow(
                """SELECT id FROM customers 
                   WHERE tenant_id = $1::uuid 
                     AND (phone = $2 OR phone = replace($2, '+', '') OR ('+' || phone) = $2)
                   LIMIT 1""",
                tenant_id, phone
            )
            if not row:
                logger.info("customer_info_extract_no_customer", phone=phone)
                return
            cust_id = row["id"]
            if age is not None:
                await pool.execute(
                    "UPDATE customers SET age = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
                    int(age), cust_id, tenant_id
                )
            if location:
                await pool.execute(
                    "UPDATE customers SET location = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
                    str(location), cust_id, tenant_id
                )
            logger.info("customer_info_auto_updated", phone=phone, age=age, location=location)
        except Exception as ex:
            logger.warning("customer_info_update_failed", error=str(ex))

    async def _execute_ai_booking(
        self,
        tenant_id: str,
        conv_id: str,
        contact_phone: str,
        customer_name: str,
        booking_data: dict,
        creds: Optional[dict],
    ):
        """Creates booking in DB, dispatches Meta WhatsApp Templates, and syncs with Google Calendar."""
        try:
            import datetime
            import zoneinfo

            tenant_timezone_str = "Asia/Kolkata"
            tenant_currency_str = "INR"
            tenant_currency_sym = "₹"
            tenant_st_row = await self.db_pool.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
            if tenant_st_row:
                if isinstance(tenant_st_row, str):
                    try: tenant_st_row = json.loads(tenant_st_row)
                    except: tenant_st_row = {}
                if tenant_st_row.get("timezone"):
                    tenant_timezone_str = tenant_st_row.get("timezone").strip()
                if tenant_st_row.get("currency"):
                    tenant_currency_str = tenant_st_row.get("currency").strip()
                if tenant_st_row.get("currency_symbol"):
                    tenant_currency_sym = tenant_st_row.get("currency_symbol").strip()

            try:
                tz = zoneinfo.ZoneInfo(tenant_timezone_str)
            except Exception:
                tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

            service_name = booking_data.get("service") or "Consultation / Demo"
            date_str = booking_data.get("date") or datetime.date.today().strftime("%Y-%m-%d")
            time_str = booking_data.get("time") or "10:00"
            notes = booking_data.get("notes") or "Booked via WhatsApp AI Assistant"
            name = booking_data.get("name") or customer_name or "Valued Customer"
            customer_email = sanitize_and_fix_email(booking_data.get("email"))

            # Parse start and end time using flexible 12-hr / 24-hr parser
            st_dt = parse_flexible_datetime(date_str, time_str, tz)

            et_dt = st_dt + datetime.timedelta(minutes=30)

            # Get contact_id
            contact_id = await self.db_pool.fetchval(
                "SELECT contact_id FROM conversations WHERE id = $1::uuid", conv_id
            )

            # If email not in booking action, check contact metadata
            if not customer_email and contact_id:
                c_meta = await self.db_pool.fetchval("SELECT metadata FROM contacts WHERE id = $1::uuid", contact_id)
                if c_meta:
                    if isinstance(c_meta, str):
                        try: c_meta = json.loads(c_meta)
                        except: c_meta = {}
                    customer_email = sanitize_and_fix_email(c_meta.get("email"))
            if not customer_email:
                c_em = await self.db_pool.fetchval(
                    "SELECT metadata->>'email' FROM contacts WHERE tenant_id = $1::uuid AND (phone = $2 OR phone LIKE $3) LIMIT 1",
                    tenant_id, contact_phone, f"%{contact_phone[-10:]}%"
                )
                customer_email = sanitize_and_fix_email(c_em)

            # Save customer email and name if provided
            if contact_id:
                if customer_email:
                    try:
                        await self.db_pool.execute(
                            "UPDATE contacts SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{email}', to_jsonb($1::text)) WHERE id = $2::uuid",
                            customer_email, contact_id
                        )
                    except Exception as e:
                        logger.warning("save_contact_email_failed", error=str(e))
                if name and name not in ["Valued Customer", "Client", "Customer"]:
                    try:
                        await self.db_pool.execute(
                            "UPDATE contacts SET name = $1 WHERE id = $2::uuid AND (name IS NULL OR name = '' OR name = 'Valued Customer' OR name = 'Client')",
                            name, contact_id
                        )
                    except Exception as e:
                        logger.warning("save_contact_name_failed", error=str(e))

            # 1. Check if THIS contact already has an active booking at this time
            if contact_id:
                existing_for_contact = await self.db_pool.fetchrow(
                    """SELECT id FROM bookings
                       WHERE tenant_id = $1::uuid
                         AND contact_id = $2::uuid
                         AND status = 'confirmed'
                         AND start_time < $4 AND end_time > $3""",
                    tenant_id, contact_id, st_dt, et_dt
                )
                if existing_for_contact:
                    logger.info("ai_booking_already_exists_for_contact", booking_id=str(existing_for_contact["id"]))
                    return

            # 2. Check if another client has an active booking at this time
            conflict_row = await self.db_pool.fetchrow(
                """SELECT id, service, start_time, end_time
                   FROM bookings
                   WHERE tenant_id = $1::uuid
                     AND status = 'confirmed'
                     AND (contact_id IS NULL OR contact_id != $4::uuid)
                     AND start_time < $3 AND end_time > $2""",
                tenant_id, st_dt, et_dt, contact_id
            )
            if conflict_row:
                logger.warning("ai_booking_conflict_with_another_client", tenant_id=tenant_id, requested_start=str(st_dt), conflict_id=str(conflict_row["id"]))
                # Do NOT send an out-of-band conflicting message to WhatsApp to prevent confusing double-replies
                return

            # Insert booking record in DB
            booking_id = str(uuid.uuid4())
            await self.db_pool.execute(
                """INSERT INTO bookings (id, tenant_id, contact_id, conversation_id, service, start_time, end_time, status, notes, price, currency)
                   VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, 'confirmed', $8, 0, 'INR')""",
                booking_id, tenant_id, contact_id, conv_id, service_name, st_dt, et_dt, notes
            )
            logger.info("ai_booking_created", booking_id=booking_id, service=service_name, start_time=str(st_dt))

            # Dispatch Real Web Push Notification for New Booking
            try:
                formatted_d = st_dt.strftime("%d %b")
                formatted_t = st_dt.strftime("%I:%M %p")
                asyncio.create_task(
                    dispatch_push_notification(
                        pool=self.db_pool,
                        tenant_id=tenant_id,
                        title=f"📅 New Booking: {name}",
                        body=f"{service_name} on {formatted_d} at {formatted_t}",
                        notif_type="booking",
                        url="/boldlabs#bookings",
                        data={"contact_phone": contact_phone, "booking_id": booking_id}
                    )
                )
            except Exception as b_err:
                logger.warning("booking_push_failed", error=str(b_err))

            # 1. Send Meta WhatsApp Template (booking_confirmationn)
            if creds and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                template_name = (
                    creds.get("template_booking_confirmation") or
                    (tenant_st_row.get("template_booking_confirmation") if tenant_st_row else None) or
                    "booking_confirmationn"
                )
                formatted_date = st_dt.strftime("%d-%m-%Y")
                formatted_time = st_dt.strftime("%I:%M %p")

                components = [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": name},
                            {"type": "text", "text": service_name},
                            {"type": "text", "text": formatted_date},
                            {"type": "text", "text": formatted_time},
                        ]
                    }
                ]
                try:
                    await send_template(
                        phone_number_id=creds["phone_number_id"],
                        access_token=creds["access_token"],
                        to=contact_phone,
                        template_name=template_name,
                        language_code="en",
                        components=components,
                    )
                    logger.info("meta_booking_template_sent", template=template_name, to=contact_phone)
                except Exception as e:
                    logger.warning("meta_template_send_failed", error=str(e), template=template_name)

                # 1b. Automatically send Business Address & Live Location if configured
                full_location = (creds.get("full_location_text") or "").strip()
                if not full_location:
                    tenant_st = await self.db_pool.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
                    if tenant_st:
                        if isinstance(tenant_st, str):
                            try: tenant_st = json.loads(tenant_st)
                            except: tenant_st = {}
                        full_location = (tenant_st.get("full_location_text") or "").strip()

                if full_location:
                    loc_msg = f"📍 *Location & Directions:*\n{full_location}"
                    await asyncio.sleep(1.0)  # Brief pause so confirmation arrives first
                    try:
                        loc_wa_id = await send_text(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=contact_phone,
                            body=loc_msg,
                        )
                        # Record in messages table
                        loc_msg_id = str(uuid.uuid4())
                        await self.db_pool.execute(
                            """INSERT INTO messages (id, conversation_id, tenant_id, direction, content_type, body, status, wa_message_id, ai_used_fallback)
                               VALUES ($1::uuid, $2::uuid, $3::uuid, 'outbound', 'text', $4, 'sent', $5, false)""",
                            loc_msg_id, conv_id, tenant_id, loc_msg, loc_wa_id
                        )
                        await self.db_pool.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid", conv_id)
                        logger.info("location_directions_sent_to_customer", to=contact_phone)
                    except Exception as e:
                        logger.warning("location_directions_send_failed", error=str(e))

                # 2. Send Admin Notification WhatsApp Alert to Admin Number
                admin_phone = (creds.get("admin_whatsapp_number") or "").strip()
                if not admin_phone:
                    tenant_st_data = await self.db_pool.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
                    if tenant_st_data:
                        if isinstance(tenant_st_data, str):
                            try: tenant_st_data = json.loads(tenant_st_data)
                            except: tenant_st_data = {}
                        admin_phone = (tenant_st_data.get("admin_whatsapp_number") or "").strip()

                if admin_phone:
                    clean_admin_phone = re.sub(r'[^0-9+]', '', admin_phone)
                    if not clean_admin_phone.startswith("+"):
                        clean_admin_phone = f"+91{clean_admin_phone}" if len(clean_admin_phone) == 10 else f"+{clean_admin_phone}"

                    admin_alert_text = (
                        f"🔔 *New Booking Confirmed!* 📅\n\n"
                        f"• *Customer:* {name}\n"
                        f"• *Phone:* {contact_phone}\n"
                        f"• *Service:* {service_name}\n"
                        f"• *Date & Time:* {formatted_date} at {formatted_time}\n"
                        f"• *Email:* {customer_email or 'Not provided'}\n\n"
                        f"✅ Confirmed by WhatsApp AI Assistant & synced to Google Calendar."
                    )
                    admin_template = (
                        creds.get("template_admin_notification") or
                        (tenant_st_row.get("template_admin_notification") if tenant_st_row else None) or
                        "admin_notification"
                    )
                    admin_components = [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": name},
                                {"type": "text", "text": contact_phone},
                                {"type": "text", "text": service_name},
                                {"type": "text", "text": formatted_date},
                                {"type": "text", "text": formatted_time},
                            ]
                        }
                    ]
                    try:
                        await send_template(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=clean_admin_phone,
                            template_name=admin_template,
                            language_code="en",
                            components=admin_components,
                        )
                        logger.info("admin_notification_template_sent", template=admin_template, to=clean_admin_phone)
                    except Exception as e:
                        logger.warning("admin_notification_template_failed_trying_text", error=str(e))
                        try:
                            await send_text(
                                phone_number_id=creds["phone_number_id"],
                                access_token=creds["access_token"],
                                to=clean_admin_phone,
                                body=admin_alert_text,
                            )
                            logger.info("admin_whatsapp_alert_text_sent", to=clean_admin_phone)
                        except Exception as e2:
                            logger.error("admin_whatsapp_alert_failed", error=str(e2))

            # 3. Google Calendar Event Creation & Email Invite to Both Customer & Admin
            gcal_row = await self.db_pool.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                tenant_id
            )
            if gcal_row and gcal_row["credential_data"]:
                g_data = gcal_row["credential_data"]
                if isinstance(g_data, str):
                    try: g_data = json.loads(g_data)
                    except: g_data = {}
                
                if g_data.get("refresh_token") and g_data.get("client_id"):
                    try:
                        from google.oauth2.credentials import Credentials
                        from googleapiclient.discovery import build
                        
                        g_creds = Credentials(
                            token=g_data.get("access_token"),
                            refresh_token=g_data.get("refresh_token"),
                            token_uri="https://oauth2.googleapis.com/token",
                            client_id=g_data.get("client_id"),
                            client_secret=g_data.get("client_secret"),
                        )
                        g_service = build("calendar", "v3", credentials=g_creds)
                        cal_id = g_data.get("calendar_id") or "primary"
                        
                        event_body = {
                            "summary": f"{service_name} - {name} ({contact_phone})",
                            "description": (
                                f"WhatsApp Booking Automated By AI\n\n"
                                f"• Client Name: {name}\n"
                                f"• Client Phone: {contact_phone}\n"
                                f"• Client Email: {customer_email or 'N/A'}\n"
                                f"• Service: {service_name}\n"
                                f"• Scheduled Time: {st_dt.strftime('%d %B %Y at %I:%M %p')}\n"
                                f"• Notes: {notes}"
                            ),
                            "start": {"dateTime": st_dt.isoformat()},
                            "end": {"dateTime": et_dt.isoformat()},
                        }
                        
                        # Add attendees: admin email + customer email
                        attendees = []
                        admin_notif_email = g_data.get("notification_email")
                        if not admin_notif_email:
                            tenant_settings_row = await self.db_pool.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
                            if tenant_settings_row:
                                if isinstance(tenant_settings_row, str):
                                    try: tenant_settings_row = json.loads(tenant_settings_row)
                                    except: tenant_settings_row = {}
                                admin_notif_email = tenant_settings_row.get("notification_email")

                        if admin_notif_email and "@" in admin_notif_email:
                            attendees.append({"email": admin_notif_email.strip()})
                        if customer_email and "@" in customer_email:
                            attendees.append({"email": customer_email.strip()})
                        
                        if attendees:
                            event_body["attendees"] = attendees
                        
                        event = g_service.events().insert(calendarId=cal_id, body=event_body, sendUpdates="all").execute()
                        if event and event.get("id"):
                            await self.db_pool.execute(
                                "UPDATE bookings SET google_event_id = $1 WHERE id = $2::uuid",
                                event["id"], booking_id
                            )
                            logger.info("google_calendar_event_created", event_id=event["id"], booking_id=booking_id)

                        # 4. Direct Gmail API Confirmation Email to Admin & Customer
                        # Send tailored copy to Admin
                        if admin_notif_email and "@" in admin_notif_email:
                            admin_email_html = build_booking_admin_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                                contact_phone=contact_phone,
                                customer_email=customer_email,
                                notes=notes,
                                full_location=full_location,
                            )
                            admin_subject = f"[Admin Alert] New Booking: {service_name} - {name} ({formatted_date} at {formatted_time})"
                            send_gmail_direct_notification(g_creds, admin_notif_email, admin_subject, admin_email_html)
                        
                        # Send tailored copy to Customer
                        if customer_email and "@" in customer_email:
                            customer_email_html = build_booking_customer_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                                contact_phone=contact_phone,
                                full_location=full_location,
                            )
                            customer_subject = f"Booking Confirmed: Your {service_name} Appointment on {formatted_date} at {formatted_time}"
                            send_gmail_direct_notification(g_creds, customer_email, customer_subject, customer_email_html)
                            logger.info("booking_confirmation_email_sent_to_customer", to=customer_email, booking_id=booking_id)

                    except Exception as e:
                        logger.error("google_calendar_sync_error", error=str(e), booking_id=booking_id)

            # 4. Queue automatic 24h & 2h reminders and post-session review request in scheduled_jobs
            try:
                remind_24h = st_dt - datetime.timedelta(hours=24)
                if remind_24h > datetime.datetime.now(tz):
                    await self.db_pool.execute(
                        """INSERT INTO scheduled_jobs (id, tenant_id, job_type, booking_id, scheduled_at, status, created_at)
                           VALUES (gen_random_uuid(), $1::uuid, 'reminder', $2::uuid, $3, 'pending', now())""",
                        tenant_id, booking_id, remind_24h
                    )
                remind_2h = st_dt - datetime.timedelta(hours=2)
                if remind_2h > datetime.datetime.now(tz):
                    await self.db_pool.execute(
                        """INSERT INTO scheduled_jobs (id, tenant_id, job_type, booking_id, scheduled_at, status, created_at)
                           VALUES (gen_random_uuid(), $1::uuid, 'reminder', $2::uuid, $3, 'pending', now())""",
                        tenant_id, booking_id, remind_2h
                    )
                review_at = et_dt + datetime.timedelta(hours=1)
                await self.db_pool.execute(
                    """INSERT INTO scheduled_jobs (id, tenant_id, job_type, booking_id, scheduled_at, status, created_at)
                       VALUES (gen_random_uuid(), $1::uuid, 'review_request', $2::uuid, $3, 'pending', now())""",
                    tenant_id, booking_id, review_at
                )
                logger.info("ai_booking_scheduled_jobs_queued", booking_id=booking_id)
            except Exception as e_job:
                logger.warning("ai_booking_scheduled_jobs_failed", error=str(e_job))

        except Exception as e:
            logger.error("execute_ai_booking_failed", error=str(e), tenant_id=tenant_id)


    async def _analyze_and_update_lead(
        self,
        tenant_id: str,
        phone: str,
        conv_id: str,
        message_text: str,
        history: list,
        booking_action: Optional[dict] = None,
    ):
        """Intelligently classify customer lead grade (hot/warm/cold), extract requirement/concern, and handle follow-up dates based on real conversation analysis."""
        try:
            full_text = " ".join([m.get("content", "") for m in history[-8:]] + [message_text]).lower()

            # 1. Lead Probability & Status Classification
            lead_prob = "warm"
            status = "contacted"

            # Hot indicators: ready to book, pricing query, urgent, slots requested, or booking made
            hot_keywords = [
                "book", "appointment", "schedule", "cost", "price", "fee", "rate", "timing", "available", 
                "slot", "today", "tomorrow", "urgent", "emergency", "consult", "doctor", "fees", "how much",
                "want to visit", "want to come", "reserve", "confirm", "when can i", "open now", "admission",
                "enroll", "register", "buy", "purchase", "interested in booking", "can i get an appointment"
            ]
            # Cold indicators: stop, unsubscribe, wrong number, not interested, spam
            cold_keywords = [
                "stop", "unsubscribe", "wrong number", "not interested", "dont message", "don't message", 
                "remove me", "spam", "cancel my number", "no thanks", "do not call", "not required"
            ]

            if booking_action or any(kw in full_text for kw in ["booked for you", "appointment is booked", "appointment is confirmed", "confirmed"]):
                lead_prob = "hot"
                status = "converted"
            elif any(kw in full_text for kw in cold_keywords):
                lead_prob = "cold"
                status = "lost"
            elif any(kw in full_text for kw in hot_keywords):
                lead_prob = "hot"
                status = "in-progress"
            else:
                lead_prob = "warm"
                status = "contacted"

            # 2. Extract Requirement / Health Concern / Inquiry
            extracted_concern = None
            concern_patterns = [
                r"(?:have|having|suffering from|got|dealing with)\s+([a-zA-Z\s]{3,35})",
                r"(?:interested in|looking for|inquiry about|need|want|regarding)\s+([a-zA-Z\s]{3,35})",
                r"(?:treatment for|consultation for|problem with|course for|property in)\s+([a-zA-Z\s]{3,35})",
            ]
            for pat in concern_patterns:
                m = re.search(pat, message_text, re.IGNORECASE)
                if m:
                    candidate = m.group(1).strip().title()
                    # Filter out noise / common generic words
                    if len(candidate.split()) <= 5 and not any(sw in candidate.lower() for sw in ["you", "your", "the", "this", "help", "please", "some", "more", "info", "details"]):
                        extracted_concern = candidate
                        break

            # 3. Follow-up Date (ONLY if customer explicitly asked for future follow-up)
            followup_date = None
            import datetime
            if "next week" in full_text:
                followup_date = datetime.date.today() + datetime.timedelta(days=7)
            elif "after 2 days" in full_text or "in 2 days" in full_text:
                followup_date = datetime.date.today() + datetime.timedelta(days=2)
            elif "after 3 days" in full_text or "in 3 days" in full_text:
                followup_date = datetime.date.today() + datetime.timedelta(days=3)
            elif "next month" in full_text:
                followup_date = datetime.date.today() + datetime.timedelta(days=30)

            # 4. Update customer record in database
            updates = ["lead_probability = $1", "updated_at = NOW()", "last_messaged_at = NOW()"]
            params = [lead_prob, tenant_id, phone]
            idx = 4

            if status:
                updates.append(f"status = CASE WHEN customers.status = 'converted' THEN 'converted' ELSE ${idx} END")
                params.insert(len(params) - 2, status)
                idx += 1

            if status == "converted":
                updates.append("converted = true")

            if extracted_concern:
                updates.append(f"health_concern = CASE WHEN customers.health_concern IS NULL OR customers.health_concern = 'General Consultation' THEN ${idx} ELSE customers.health_concern END")
                params.insert(len(params) - 2, extracted_concern)
                idx += 1

            if followup_date:
                updates.append(f"followup_date = COALESCE(customers.followup_date, ${idx}::date)")
                params.insert(len(params) - 2, followup_date.isoformat())
                idx += 1

            query = f"""
                UPDATE customers
                SET {', '.join(updates)}
                WHERE tenant_id = $2::uuid AND phone = $3
            """
            await self.db_pool.execute(query, *params)
            logger.info("lead_analyzed_and_updated", phone=phone, lead_prob=lead_prob, status=status, concern=extracted_concern)
        except Exception as e:
            logger.warning("lead_analysis_failed", error=str(e), phone=phone)

    async def _execute_ai_cancellation(
        self,
        tenant_id: str,
        conv_id: str,
        contact_phone: str,
        customer_name: str,
        creds: Optional[dict],
    ):
        """Cancels booking in DB, removes from Google Calendar, and dispatches Meta cancellation templates to Customer and Admin."""
        try:
            import datetime
            import zoneinfo

            tenant_timezone_str = "Asia/Kolkata"
            tenant_st_row = await self.db_pool.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
            if tenant_st_row:
                if isinstance(tenant_st_row, str):
                    try: tenant_st_row = json.loads(tenant_st_row)
                    except: tenant_st_row = {}
                if tenant_st_row.get("timezone"):
                    tenant_timezone_str = tenant_st_row.get("timezone").strip()

            try:
                tz = zoneinfo.ZoneInfo(tenant_timezone_str)
            except Exception:
                tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

            contact_id = await self.db_pool.fetchval(
                "SELECT contact_id FROM conversations WHERE id = $1::uuid", conv_id
            )
            if not contact_id:
                return

            # Find active booking
            booking = await self.db_pool.fetchrow(
                """SELECT b.id, b.service, b.start_time, b.google_event_id
                   FROM bookings b
                   LEFT JOIN contacts c ON c.id = b.contact_id
                   WHERE b.tenant_id = $1::uuid 
                     AND (b.contact_id = $2::uuid OR b.conversation_id = $3::uuid OR c.phone = $4 OR RIGHT(REGEXP_REPLACE(COALESCE(c.phone, ''), '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($4, '[^0-9]', '', 'g'), 10))
                     AND b.status = 'confirmed'
                   ORDER BY b.start_time DESC LIMIT 1""",
                tenant_id, contact_id, conv_id, contact_phone
            )
            if not booking:
                logger.info("no_active_booking_to_cancel", contact_id=contact_id)
                return

            booking_id = str(booking["id"])
            service_name = booking.get("service") or "Consultation / Demo"
            st_dt = booking["start_time"].astimezone(tz)
            formatted_date = st_dt.strftime("%d-%m-%Y")
            formatted_time = st_dt.strftime("%I:%M %p")
            name = customer_name or "Valued Customer"

            # 1. Update status in DB
            await self.db_pool.execute(
                "UPDATE bookings SET status = 'cancelled', updated_at = now() WHERE id = $1::uuid",
                booking_id
            )
            logger.info("ai_booking_cancelled", booking_id=booking_id)

            # Dispatch Web Push Notification for Cancellation
            try:
                asyncio.create_task(
                    dispatch_push_notification(
                        pool=self.db_pool,
                        tenant_id=tenant_id,
                        title=f"❌ Booking Cancelled: {name}",
                        body=f"{service_name} on {formatted_date} at {formatted_time} was cancelled.",
                        notif_type="booking_cancelled",
                        url="/boldlabs#bookings",
                        data={"contact_phone": contact_phone, "booking_id": booking_id}
                    )
                )
            except Exception as pe:
                logger.warning("cancellation_push_failed", error=str(pe))

            # 2. Cancel from Google Calendar
            if booking.get("google_event_id"):
                gcal_row = await self.db_pool.fetchrow(
                    "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                    tenant_id
                )
                if gcal_row and gcal_row["credential_data"]:
                    g_data = gcal_row["credential_data"]
                    if isinstance(g_data, str):
                        try: g_data = json.loads(g_data)
                        except: g_data = {}
                    if g_data.get("refresh_token") and g_data.get("client_id"):
                        try:
                            from google.oauth2.credentials import Credentials
                            from googleapiclient.discovery import build
                            g_creds = Credentials(
                                token=g_data.get("access_token"),
                                refresh_token=g_data.get("refresh_token"),
                                token_uri="https://oauth2.googleapis.com/token",
                                client_id=g_data.get("client_id"),
                                client_secret=g_data.get("client_secret"),
                            )
                            g_service = build("calendar", "v3", credentials=g_creds)
                            cal_id = g_data.get("calendar_id") or "primary"
                            g_service.events().delete(calendarId=cal_id, eventId=booking["google_event_id"], sendUpdates="all").execute()
                            logger.info("google_calendar_event_deleted", event_id=booking["google_event_id"])
                        except Exception as e:
                            logger.warning("gcal_delete_event_failed", error=str(e))

            # 3. Send Customer Cancellation Meta Template
            if creds and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                template_name = (
                    creds.get("template_cancellation_confirmation") or
                    (tenant_st_row.get("template_cancellation_confirmation") if tenant_st_row else None) or
                    "cancellation_confirmation"
                )
                components = [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": name},
                            {"type": "text", "text": service_name},
                            {"type": "text", "text": formatted_date},
                            {"type": "text", "text": formatted_time},
                        ]
                    }
                ]
                try:
                    await send_template(
                        phone_number_id=creds["phone_number_id"],
                        access_token=creds["access_token"],
                        to=contact_phone,
                        template_name=template_name,
                        language_code="en",
                        components=components,
                    )
                    logger.info("cancellation_template_sent_to_customer", template=template_name, to=contact_phone)
                except Exception as e:
                    logger.warning("cancellation_template_send_failed", error=str(e))

                # 4. Send Admin Cancellation Alert to Admin WhatsApp Number
                admin_phone = (creds.get("admin_whatsapp_number") or "").strip()
                if not admin_phone and tenant_st_row:
                    admin_phone = (tenant_st_row.get("admin_whatsapp_number") or "").strip()

                if admin_phone:
                    clean_admin_phone = re.sub(r'[^0-9+]', '', admin_phone)
                    if not clean_admin_phone.startswith("+"):
                        clean_admin_phone = f"+91{clean_admin_phone}" if len(clean_admin_phone) == 10 else f"+{clean_admin_phone}"

                    admin_cancel_text = (
                        f"⚠️ *Booking Cancelled Notice!* 📅\n\n"
                        f"• *Customer:* {name}\n"
                        f"• *Phone:* {contact_phone}\n"
                        f"• *Service:* {service_name}\n"
                        f"• *Original Date & Time:* {formatted_date} at {formatted_time}\n\n"
                        f"❌ The booking has been marked cancelled in CRM and removed from Google Calendar."
                    )
                    # Send Meta Template FIRST (immune to 24h customer window)
                    admin_cancel_template = (
                        creds.get("template_admin_cancellation_notice") or
                        (tenant_st_row.get("template_admin_cancellation_notice") if tenant_st_row else None) or
                        "admin_cancellation_notice"
                    )
                    admin_cancel_components = [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": name},
                                {"type": "text", "text": contact_phone},
                                {"type": "text", "text": service_name},
                                {"type": "text", "text": formatted_date},
                                {"type": "text", "text": formatted_time},
                            ]
                        }
                    ]
                    try:
                        await send_template(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=clean_admin_phone,
                            template_name=admin_cancel_template,
                            language_code="en",
                            components=admin_cancel_components,
                        )
                        logger.info("admin_cancellation_template_sent", template=admin_cancel_template, to=clean_admin_phone)
                    except Exception as e:
                        logger.warning("admin_cancellation_template_failed_trying_text", error=str(e))
                        try:
                            await send_text(
                                phone_number_id=creds["phone_number_id"],
                                access_token=creds["access_token"],
                                to=clean_admin_phone,
                                body=admin_cancel_text,
                            )
                            logger.info("admin_cancellation_alert_text_sent", to=clean_admin_phone)
                        except Exception as e2:
                            logger.error("admin_cancellation_alert_failed", error=str(e2))

            # 5. Direct Gmail API Cancellation Email to Admin & Customer
            gcal_row = await self.db_pool.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                tenant_id
            )
            if gcal_row and gcal_row["credential_data"]:
                try:
                    g_data = gcal_row["credential_data"]
                    if isinstance(g_data, str):
                        try: g_data = json.loads(g_data)
                        except: g_data = {}
                    if g_data.get("refresh_token") and g_data.get("client_id"):
                        from google.oauth2.credentials import Credentials
                        g_creds = Credentials(
                            token=g_data.get("access_token"),
                            refresh_token=g_data.get("refresh_token"),
                            token_uri="https://oauth2.googleapis.com/token",
                            client_id=g_data.get("client_id"),
                            client_secret=g_data.get("client_secret"),
                        )
                        # Fetch customer email
                        customer_email = ""
                        c_meta = await self.db_pool.fetchval("SELECT metadata FROM contacts WHERE id = $1::uuid", contact_id)
                        if c_meta:
                            if isinstance(c_meta, str):
                                try: c_meta = json.loads(c_meta)
                                except: c_meta = {}
                            customer_email = c_meta.get("email") or ""

                        admin_notif_email = g_data.get("notification_email")
                        if not admin_notif_email and tenant_st_row:
                            admin_notif_email = tenant_st_row.get("notification_email")

                        # Send tailored copy to Admin
                        if admin_notif_email and "@" in admin_notif_email:
                            admin_email_html = build_cancellation_admin_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                                contact_phone=contact_phone,
                                customer_email=customer_email,
                            )
                            admin_subject = f"[Admin Notice] Booking Cancelled: {service_name} - {name} ({formatted_date} at {formatted_time})"
                            send_gmail_direct_notification(g_creds, admin_notif_email, admin_subject, admin_email_html)

                        customer_email = sanitize_and_fix_email(customer_email)

                        # Send tailored copy to Customer
                        if customer_email and "@" in customer_email:
                            customer_email_html = build_cancellation_customer_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                            )
                            customer_subject = f"Appointment Cancelled: {service_name} on {formatted_date}"
                            send_gmail_direct_notification(g_creds, customer_email, customer_subject, customer_email_html)
                            logger.info("cancellation_email_sent_to_customer", to=customer_email)
                except Exception as ge:
                    logger.warning("gmail_cancellation_dispatch_failed", error=str(ge))

        except Exception as e:
            logger.error("execute_ai_cancellation_failed", error=str(e), tenant_id=tenant_id)

    async def _execute_admin_human_alert(
        self,
        tenant_id: str,
        conv_id: str,
        contact_phone: str,
        customer_name: str,
        creds: Optional[dict],
    ):
        """Sends instant WhatsApp alert and Meta template to Admin when human takeover is requested."""
        try:
            name = customer_name or "A customer"

            # Dispatch Web Push Notification for Human Takeover Request
            try:
                asyncio.create_task(
                    dispatch_push_notification(
                        pool=self.db_pool,
                        tenant_id=tenant_id,
                        title=f"🚨 Staff Takeover Requested: {name}",
                        body=f"{contact_phone} requested to speak with a human team member.",
                        notif_type="human_request",
                        url="/boldlabs#inbox",
                        data={"contact_phone": contact_phone, "conversation_id": conv_id}
                    )
                )
            except Exception as pe:
                logger.warning("human_alert_push_failed", error=str(pe))

            admin_phone = (creds.get("admin_whatsapp_number") or "").strip() if creds else ""
            if not admin_phone:
                tenant_st_row = await self.db_pool.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
                if tenant_st_row:
                    if isinstance(tenant_st_row, str):
                        try: tenant_st_row = json.loads(tenant_st_row)
                        except: tenant_st_row = {}
                    admin_phone = (tenant_st_row.get("admin_whatsapp_number") or "").strip()

            if admin_phone and creds and creds.get("phone_number_id") and creds.get("access_token"):
                clean_admin = re.sub(r'[^0-9+]', '', admin_phone)
                if not clean_admin.startswith("+"):
                    clean_admin = f"+91{clean_admin}" if len(clean_admin) == 10 else f"+{clean_admin}"

                alert_text = (
                    f"🚨 *Staff Takeover Requested!* 👤\n\n"
                    f"• *Customer:* {name}\n"
                    f"• *Phone:* {contact_phone}\n\n"
                    f"💬 The customer requested to speak with a human team member. AI automation has been paused for this chat. Please open your CRM dashboard to reply."
                )
                admin_template = (
                    creds.get("template_admin_human_request") or
                    (tenant_st_row.get("template_admin_human_request") if tenant_st_row else None) or
                    "admin_human_request"
                )
                components = [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": name},
                            {"type": "text", "text": contact_phone},
                            {"type": "text", "text": "Customer requested human support"},
                        ]
                    }
                ]
                try:
                    await send_template(
                        phone_number_id=creds["phone_number_id"],
                        access_token=creds["access_token"],
                        to=clean_admin,
                        template_name=admin_template,
                        language_code="en",
                        components=components,
                    )
                    logger.info("admin_human_alert_template_sent", template=admin_template, to=clean_admin)
                except Exception as e:
                    logger.warning("admin_human_alert_template_failed_trying_text", error=str(e))
                    try:
                        await send_text(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=clean_admin,
                            body=alert_text,
                        )
                        logger.info("admin_human_alert_text_sent", to=clean_admin)
                    except Exception as e2:
                        logger.error("admin_human_alert_failed", error=str(e2))
        except Exception as e:
            logger.error("execute_admin_human_alert_failed", error=str(e))

    async def _execute_ai_reschedule(
        self,
        tenant_id: str,
        conv_id: str,
        contact_phone: str,
        customer_name: str,
        booking_data: dict,
        creds: Optional[dict],
    ):
        """Reschedules existing booking in DB, updates Google Calendar, and dispatches Meta reschedule templates."""
        try:
            import datetime
            import zoneinfo

            tenant_timezone_str = "Asia/Kolkata"
            tenant_st_row = await self.db_pool.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
            if tenant_st_row:
                if isinstance(tenant_st_row, str):
                    try: tenant_st_row = json.loads(tenant_st_row)
                    except: tenant_st_row = {}
                if tenant_st_row.get("timezone"):
                    tenant_timezone_str = tenant_st_row.get("timezone").strip()

            try:
                tz = zoneinfo.ZoneInfo(tenant_timezone_str)
            except Exception:
                tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

            contact_id = await self.db_pool.fetchval(
                "SELECT contact_id FROM conversations WHERE id = $1::uuid", conv_id
            )
            if not contact_id:
                return

            # Find existing confirmed booking
            old_booking = await self.db_pool.fetchrow(
                """SELECT b.id, b.service, b.google_event_id
                   FROM bookings b
                   LEFT JOIN contacts c ON c.id = b.contact_id
                   WHERE b.tenant_id = $1::uuid
                     AND (b.contact_id = $2::uuid OR b.conversation_id = $3::uuid OR c.phone = $4 OR RIGHT(REGEXP_REPLACE(COALESCE(c.phone, ''), '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($4, '[^0-9]', '', 'g'), 10))
                     AND b.status = 'confirmed'
                   ORDER BY b.start_time DESC LIMIT 1""",
                tenant_id, contact_id, conv_id, contact_phone
            )

            service_name = booking_data.get("service") or (old_booking["service"] if old_booking else "Consultation / Demo")
            date_str = booking_data.get("date") or datetime.date.today().strftime("%Y-%m-%d")
            time_str = booking_data.get("time") or "10:00"
            notes = booking_data.get("notes") or "Rescheduled via WhatsApp AI Assistant"
            name = booking_data.get("name") or customer_name or "Valued Customer"

            # Parse start and end time using flexible 12-hr / 24-hr parser
            st_dt = parse_flexible_datetime(date_str, time_str, tz)

            et_dt = st_dt + datetime.timedelta(minutes=30)
            formatted_date = st_dt.strftime("%d-%m-%Y")
            formatted_time = st_dt.strftime("%I:%M %p")

            if old_booking:
                booking_id = str(old_booking["id"])
                await self.db_pool.execute(
                    """UPDATE bookings
                       SET start_time = $1, end_time = $2, service = $3, notes = $4, status = 'confirmed', updated_at = now()
                       WHERE id = $5::uuid""",
                    st_dt, et_dt, service_name, notes, booking_id
                )
                logger.info("ai_booking_rescheduled", booking_id=booking_id, new_start=str(st_dt))
            else:
                booking_id = str(uuid.uuid4())
                await self.db_pool.execute(
                    """INSERT INTO bookings (id, tenant_id, contact_id, conversation_id, service, start_time, end_time, status, notes, price, currency)
                       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, 'confirmed', $8, 0, 'INR')""",
                    booking_id, tenant_id, contact_id, conv_id, service_name, st_dt, et_dt, notes
                )
                logger.info("ai_booking_rescheduled_new_row", booking_id=booking_id, start_time=str(st_dt))

            # Dispatch Web Push Notification for Reschedule
            try:
                asyncio.create_task(
                    dispatch_push_notification(
                        pool=self.db_pool,
                        tenant_id=tenant_id,
                        title=f"🔄 Booking Rescheduled: {name}",
                        body=f"{service_name} moved to {formatted_date} at {formatted_time}.",
                        notif_type="booking_rescheduled",
                        url="/boldlabs#bookings",
                        data={"contact_phone": contact_phone, "booking_id": booking_id}
                    )
                )
            except Exception as pe:
                logger.warning("reschedule_push_failed", error=str(pe))

            # Update in Google Calendar
            gcal_row = await self.db_pool.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                tenant_id
            )
            if gcal_row and gcal_row["credential_data"]:
                g_data = gcal_row["credential_data"]
                if isinstance(g_data, str):
                    try: g_data = json.loads(g_data)
                    except: g_data = {}
                if g_data.get("refresh_token") and g_data.get("client_id"):
                    try:
                        from google.oauth2.credentials import Credentials
                        from googleapiclient.discovery import build
                        g_creds = Credentials(
                            token=g_data.get("access_token"),
                            refresh_token=g_data.get("refresh_token"),
                            token_uri="https://oauth2.googleapis.com/token",
                            client_id=g_data.get("client_id"),
                            client_secret=g_data.get("client_secret"),
                        )
                        g_service = build("calendar", "v3", credentials=g_creds)
                        cal_id = g_data.get("calendar_id") or "primary"
                        event_body = {
                            "summary": f"{service_name} - {name} ({contact_phone})",
                            "description": (
                                f"WhatsApp Booking (Rescheduled)\n\n"
                                f"• Client Name: {name}\n"
                                f"• Client Phone: {contact_phone}\n"
                                f"• Service: {service_name}\n"
                                f"• Scheduled Time: {st_dt.strftime('%d %B %Y at %I:%M %p')}\n"
                                f"• Notes: {notes}"
                            ),
                            "start": {"dateTime": st_dt.isoformat()},
                            "end": {"dateTime": et_dt.isoformat()},
                        }
                        if old_booking and old_booking.get("google_event_id"):
                            g_service.events().patch(calendarId=cal_id, eventId=old_booking["google_event_id"], body=event_body, sendUpdates="all").execute()
                            logger.info("google_calendar_rescheduled_patched", event_id=old_booking["google_event_id"])
                        else:
                            event = g_service.events().insert(calendarId=cal_id, body=event_body, sendUpdates="all").execute()
                            if event and event.get("id"):
                                await self.db_pool.execute("UPDATE bookings SET google_event_id = $1 WHERE id = $2::uuid", event["id"], booking_id)

                        # 4. Direct Gmail API Reschedule Email to Admin & Customer
                        full_location = (creds.get("full_location_text") or "").strip() if creds else ""
                        if not full_location and tenant_st_row:
                            full_location = (tenant_st_row.get("full_location_text") or tenant_st_row.get("location") or "").strip()

                        # Fetch customer email
                        customer_email = (booking_data.get("email") or "").strip()
                        if not customer_email:
                            c_meta = await self.db_pool.fetchval("SELECT metadata FROM contacts WHERE id = $1::uuid", contact_id)
                            if c_meta:
                                if isinstance(c_meta, str):
                                    try: c_meta = json.loads(c_meta)
                                    except: c_meta = {}
                                customer_email = c_meta.get("email") or ""
                        if not customer_email:
                            customer_email = await self.db_pool.fetchval(
                                "SELECT metadata->>'email' FROM contacts WHERE tenant_id = $1::uuid AND (phone = $2 OR phone = replace($2, '+', '')) LIMIT 1",
                                tenant_id, contact_phone
                            ) or ""

                        admin_notif_email = g_data.get("notification_email")
                        if not admin_notif_email and tenant_st_row:
                            admin_notif_email = tenant_st_row.get("notification_email")

                        # Send tailored copy to Admin
                        if admin_notif_email and "@" in admin_notif_email:
                            admin_email_html = build_reschedule_admin_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                                contact_phone=contact_phone,
                                customer_email=customer_email,
                            )
                            admin_subject = f"[Admin Notice] Booking Rescheduled: {service_name} - {name} to {formatted_date} at {formatted_time}"
                            send_gmail_direct_notification(g_creds, admin_notif_email, admin_subject, admin_email_html)
                            logger.info("reschedule_email_sent_to_admin", to=admin_notif_email)

                        customer_email = sanitize_and_fix_email(customer_email)

                        # Send tailored copy to Customer
                        if customer_email and "@" in customer_email:
                            customer_email_html = build_reschedule_customer_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                                full_location=full_location,
                            )
                            customer_subject = f"Reschedule Confirmed: Your {service_name} is now on {formatted_date} at {formatted_time}"
                            send_gmail_direct_notification(g_creds, customer_email, customer_subject, customer_email_html)
                            logger.info("reschedule_email_sent_to_customer", to=customer_email)

                    except Exception as e:
                        logger.warning("gcal_reschedule_sync_failed", error=str(e))

            # Update pending scheduled reminders to 2 hours before the new start time
            try:
                reminder_time = st_dt - datetime.timedelta(hours=2)
                if reminder_time > datetime.datetime.now(tz):
                    await self.db_pool.execute(
                        """UPDATE scheduled_jobs
                           SET scheduled_at = $1, status = 'pending'
                           WHERE booking_id = $2::uuid AND job_type = 'reminder'""",
                        reminder_time, booking_id
                    )
            except Exception as e_rem:
                logger.warning("reminder_job_reschedule_failed", error=str(e_rem))

            # Send Customer Reschedule Meta Template
            if creds and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                template_name = (
                    creds.get("template_reschedule_confirmation") or
                    (tenant_st_row.get("template_reschedule_confirmation") if tenant_st_row else None) or
                    "booking_reschedule_confirmation"
                )
                components = [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": name},
                            {"type": "text", "text": service_name},
                            {"type": "text", "text": formatted_date},
                            {"type": "text", "text": formatted_time},
                        ]
                    }
                ]
                try:
                    await send_template(
                        phone_number_id=creds["phone_number_id"],
                        access_token=creds["access_token"],
                        to=contact_phone,
                        template_name=template_name,
                        language_code="en",
                        components=components,
                    )
                    logger.info("reschedule_template_sent_to_customer", template=template_name, to=contact_phone)
                except Exception as e:
                    logger.warning("reschedule_template_send_failed", error=str(e), template=template_name)
                    try:
                        customer_fallback_text = (
                            f"Hello {name}, your {service_name} appointment has been rescheduled to {formatted_date} at {formatted_time}. "
                            f"If you need to make any changes, just reply to this chat. We look forward to seeing you."
                        )
                        await send_text(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=contact_phone,
                            body=customer_fallback_text,
                        )
                        logger.info("reschedule_fallback_text_sent_to_customer", to=contact_phone)
                    except Exception as e2:
                        logger.error("reschedule_fallback_text_failed", error=str(e2))

                # Send Admin Reschedule Alert
                admin_phone = (creds.get("admin_whatsapp_number") or "").strip()
                if not admin_phone and tenant_st_row:
                    admin_phone = (tenant_st_row.get("admin_whatsapp_number") or "").strip()

                if admin_phone:
                    clean_admin_phone = re.sub(r'[^0-9+]', '', admin_phone)
                    if not clean_admin_phone.startswith("+"):
                        clean_admin_phone = f"+91{clean_admin_phone}" if len(clean_admin_phone) == 10 else f"+{clean_admin_phone}"

                    admin_resched_text = (
                        f"🔄 *Booking Rescheduled Notice!* 📅\n\n"
                        f"• *Customer:* {name}\n"
                        f"• *Phone:* {contact_phone}\n"
                        f"• *Service:* {service_name}\n"
                        f"• *New Date & Time:* {formatted_date} at {formatted_time}\n\n"
                        f"✅ Google Calendar and CRM have been updated with the new slot."
                    )
                    # Send Meta Template FIRST (immune to 24h customer window)
                    admin_template = (
                        creds.get("template_admin_reschedule_notice") or
                        (tenant_st_row.get("template_admin_reschedule_notice") if tenant_st_row else None) or
                        "admin_reschedule_notice"
                    )
                    admin_components = [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": name},
                                {"type": "text", "text": contact_phone},
                                {"type": "text", "text": service_name},
                                {"type": "text", "text": formatted_date},
                                {"type": "text", "text": formatted_time},
                            ]
                        }
                    ]
                    try:
                        await send_template(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=clean_admin_phone,
                            template_name=admin_template,
                            language_code="en",
                            components=admin_components,
                        )
                        logger.info("admin_reschedule_template_sent", template=admin_template, to=clean_admin_phone)
                    except Exception as e:
                        logger.warning("admin_reschedule_template_failed_trying_fallback", error=str(e), template=admin_template)
                        # Fallback to approved admin_notification template if specific reschedule template is pending in Meta
                        fallback_template = creds.get("template_admin_notification") or "admin_notification"
                        try:
                            await send_template(
                                phone_number_id=creds["phone_number_id"],
                                access_token=creds["access_token"],
                                to=clean_admin_phone,
                                template_name=fallback_template,
                                language_code="en",
                                components=admin_components,
                            )
                            logger.info("admin_reschedule_fallback_template_sent", template=fallback_template, to=clean_admin_phone)
                        except Exception as e_fb:
                            logger.warning("admin_reschedule_fallback_template_failed_trying_text", error=str(e_fb))
                            try:
                                await send_text(
                                    phone_number_id=creds["phone_number_id"],
                                    access_token=creds["access_token"],
                                    to=clean_admin_phone,
                                    body=admin_resched_text,
                                )
                                logger.info("admin_reschedule_alert_text_sent", to=clean_admin_phone)
                            except Exception as e2:
                                logger.error("admin_reschedule_alert_failed", error=str(e2))
        except Exception as e:
            logger.error("execute_ai_reschedule_failed", error=str(e), tenant_id=tenant_id)

    # ── DB helpers ─────────────────────────────────────────────────────────────

    async def _upsert_contact(self, tenant_id: str, phone: str, name: Optional[str]) -> str:
        row = await self.db_pool.fetchrow(
            """INSERT INTO contacts (id, tenant_id, phone, name, wa_profile_name)
               VALUES ($1::uuid, $2::uuid, $3, $4, $4)
               ON CONFLICT (tenant_id, phone)
               DO UPDATE SET
                 wa_profile_name = COALESCE(EXCLUDED.wa_profile_name, contacts.wa_profile_name),
                 updated_at = now()
               RETURNING id""",
            str(uuid.uuid4()), tenant_id, phone, name,
        )
        contact_id = str(row["id"])

        # Real-time customer sync: Ensure customer record exists in customers table for CRM Customers tab
        try:
            clean_digits = re.sub(r"[^0-9]", "", phone)
            await self.db_pool.execute(
                """INSERT INTO customers (id, tenant_id, phone, name, status, lead_probability, last_messaged_at, created_at, updated_at)
                   VALUES (gen_random_uuid(), $1::uuid, $2, COALESCE($3, 'Customer'), 'new', 'warm', now(), now(), now())
                   ON CONFLICT (tenant_id, phone)
                   DO UPDATE SET
                     name = CASE WHEN customers.name IS NULL OR customers.name = 'Customer' THEN COALESCE(EXCLUDED.name, customers.name) ELSE customers.name END,
                     last_messaged_at = now(),
                     updated_at = now()""",
                tenant_id, clean_digits, name
            )
        except Exception as e:
            logger.warning("customer_upsert_from_contact_failed", error=str(e), phone=phone)

        return contact_id

    async def _get_or_create_conversation(self, tenant_id: str, contact_id: str) -> tuple[str, str]:
        row = await self.db_pool.fetchrow(
            """SELECT id, status FROM conversations
               WHERE tenant_id = $1::uuid AND contact_id = $2::uuid
               ORDER BY created_at DESC LIMIT 1""",
            tenant_id, contact_id,
        )
        if row:
            return str(row["id"]), row["status"]

        new_id = str(uuid.uuid4())
        await self.db_pool.execute(
            "INSERT INTO conversations (id, tenant_id, contact_id, status) VALUES ($1::uuid, $2::uuid, $3::uuid, 'bot')",
            new_id, tenant_id, contact_id,
        )
        return new_id, "bot"

    async def _persist_message(self, tenant_id: str, conversation_id: str,
                                wa_message_id: str, direction: str, body: str, content_type: str):
        await self.db_pool.execute(
            """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, status)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, 'delivered')
               ON CONFLICT (wa_message_id) DO NOTHING""",
            str(uuid.uuid4()), conversation_id, tenant_id, wa_message_id,
            direction, content_type, body,
        )
        try:
            if direction == "inbound":
                await self.db_pool.execute(
                    """UPDATE conversations 
                       SET last_message_at = NOW(), unread_count = COALESCE(unread_count, 0) + 1, updated_at = NOW() 
                       WHERE id = $1::uuid""",
                    conversation_id
                )
            else:
                await self.db_pool.execute(
                    """UPDATE conversations 
                       SET last_message_at = NOW(), updated_at = NOW() 
                       WHERE id = $1::uuid""",
                    conversation_id
                )

            # Keep customer record in customers table synced with latest WhatsApp chat timestamp
            await self.db_pool.execute(
                """UPDATE customers c
                   SET last_messaged_at = NOW(), updated_at = NOW()
                   FROM contacts ct
                   JOIN conversations cv ON cv.contact_id = ct.id
                   WHERE cv.id = $1::uuid
                     AND (c.phone = ct.phone OR RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10))
                     AND c.tenant_id = cv.tenant_id""",
                conversation_id
            )
        except Exception as e:
            logger.warning("update_conversation_timestamp_failed", conv_id=conversation_id, error=str(e))

    async def _get_tenant_whatsapp_creds(self, tenant_id: str) -> Optional[dict]:
        row = await self.db_pool.fetchrow(
            """SELECT credential_data FROM tenant_credentials
               WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true""",
            tenant_id,
        )
        if not row or not row["credential_data"]:
            return None
        data = row["credential_data"]
        if isinstance(data, str):
            try:
                return json.loads(data)
            except Exception:
                return {}
        return dict(data)

    async def _get_gemini_key(self, tenant_id: str) -> Optional[str]:
        row = await self.db_pool.fetchrow(
            """SELECT credential_data FROM tenant_credentials
               WHERE tenant_id = $1::uuid AND provider = 'gemini' AND is_active = true""",
            tenant_id,
        )
        if row and row["credential_data"]:
            data = row["credential_data"]
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except Exception:
                    data = {}
            k = data.get("api_key")
            if k and str(k).strip() and not str(k).endswith("_CHANGE_ME") and not str(k).startswith("AIzaSy_DRAINED") and len(str(k)) > 15:
                return str(k).strip()
        env_k = os.getenv("GEMINI_API_KEY")
        if env_k and str(env_k).strip() and not str(env_k).endswith("_CHANGE_ME") and len(str(env_k)) > 15:
            return str(env_k).strip()
        return None

    async def _get_groq_key(self, tenant_id: str) -> Optional[str]:
        row = await self.db_pool.fetchrow(
            """SELECT credential_data FROM tenant_credentials
               WHERE tenant_id = $1::uuid AND provider = 'groq' AND is_active = true""",
            tenant_id,
        )
        if row and row["credential_data"]:
            data = row["credential_data"]
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except Exception:
                    data = {}
            return data.get("api_key")
        return os.getenv("GROQ_API_KEY") or None

    async def _get_opencode_creds(self, tenant_id: str) -> tuple[Optional[str], str]:
        row = await self.db_pool.fetchrow(
            """SELECT credential_data FROM tenant_credentials
               WHERE tenant_id = $1::uuid AND provider = 'opencode' AND is_active = true""",
            tenant_id,
        )
        if row and row["credential_data"]:
            data = row["credential_data"]
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except Exception:
                    data = {}
            api_key = data.get("api_key")
            base_url = data.get("base_url") or "https://opencode.ai/zen/v1"
            return api_key, base_url
        return os.getenv("OPENCODE_API_KEY") or None, "https://opencode.ai/zen/v1"

    async def _get_ai_config(self, tenant_id: str) -> dict:
        row = await self.db_pool.fetchrow(
            "SELECT model, temperature, max_tokens, timeout_ms, system_prompt, assistant_name, bot_goal, services_text, response_style, methodology, strict_rules, objection_handling FROM ai_config WHERE tenant_id = $1::uuid",
            tenant_id,
        )
        if row:
            return dict(row)
        return {"model": "gemini-3.1-flash-lite", "temperature": 0.3, "max_tokens": 500, "timeout_ms": 8000, "response_style": "short", "methodology": "dogfooding"}

    async def _scheduled_job_loop(self):
        """
        Poll every 60 seconds for:
        1. 2-Hour Appointment Reminders for confirmed bookings (only once per booking).
        2. Scheduled background jobs.
        """
        while True:
            try:
                await asyncio.sleep(60)
                await self._process_appointment_reminders()
                await self._process_daily_digest()
                await self._process_scheduled_jobs()
                await self._process_subscription_reminders()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("scheduled_job_error", error=str(e))

    async def _process_subscription_reminders(self):
        """
        Polls for:
        1. Upcoming subscription renewals (2 days before next_charge_at).
        2. Gentle follow-up for orgs paused for 3+ days.
        """
        try:
            now = datetime.datetime.now(timezone.utc)
            two_days_later = now + datetime.timedelta(days=2)

            # 1. Upcoming renewal in 2 days (Stage 1)
            rows_renewal = await self.db_pool.fetch(
                """
                SELECT id, name, slug, razorpay_short_url, next_charge_at
                FROM tenants
                WHERE org_lifecycle_stage = 'billing_active'
                  AND subscription_status = 'active'
                  AND next_charge_at IS NOT NULL
                  AND next_charge_at <= $1
                  AND next_charge_at > $2
                  AND (reminder_stage IS NULL OR reminder_stage = 0)
                """,
                two_days_later, now
            )
            for r in rows_renewal:
                await self._dispatch_platform_subscription_reminder(str(r["id"]), 1, r.get("razorpay_short_url") or "")

            # 2. Gentle follow-up for paused orgs (Stage 4)
            three_days_ago = now - datetime.timedelta(days=3)
            rows_paused = await self.db_pool.fetch(
                """
                SELECT id, name, slug, razorpay_short_url
                FROM tenants
                WHERE org_lifecycle_stage = 'billing_active'
                  AND subscription_status = 'paused'
                  AND (last_reminder_sent_at IS NULL OR last_reminder_sent_at <= $1)
                  AND (reminder_stage IS NULL OR reminder_stage < 4)
                """,
                three_days_ago
            )
            for r in rows_paused:
                await self._dispatch_platform_subscription_reminder(str(r["id"]), 4, r.get("razorpay_short_url") or "")
        except Exception as e:
            logger.error("subscription_reminders_check_error", error=str(e))

    async def _dispatch_platform_subscription_reminder(self, tenant_id: str, reminder_stage: int, payment_link: str = ""):
        """Dispatches WhatsApp reminder from platform to tenant admin."""
        try:
            tenant = await self.db_pool.fetchrow(
                "SELECT id, name, slug, razorpay_short_url FROM tenants WHERE id = $1::uuid",
                tenant_id
            )
            if not tenant:
                return

            creds = await self._get_tenant_whatsapp_creds(tenant_id)
            admin_phone = creds.get("admin_whatsapp_number", "") if creds else ""
            clean_phone = re.sub(r'[^0-9]', '', admin_phone)
            if not clean_phone or len(clean_phone) < 10:
                return

            pay_url = payment_link or tenant.get("razorpay_short_url") or f"https://boldlabs.ai/pay/{tenant['slug']}"
            org_name = tenant["name"]

            if reminder_stage == 1:
                msg_text = (
                    f"Hi {org_name} team,\n\n"
                    f"Quick heads up from Boldlabs — your monthly subscription for your WhatsApp automation (₹3,499) "
                    f"will renew in 2 days. No action needed if your card on file is active!\n\n"
                    f"Link to view or update payment: {pay_url}\n\n"
                    f"— Boldlabs Team"
                )
            elif reminder_stage == 4:
                msg_text = (
                    f"Hi {org_name} team,\n\n"
                    f"Just checking in — your WhatsApp automation is still paused. We'd love to help get your AI assistant back up and handling inquiries for {org_name}.\n\n"
                    f"If you need help with payment or have questions, reply to this message or update your payment here: {pay_url}\n\n"
                    f"— Boldlabs Team"
                )
            else:
                return

            await self.db_pool.execute(
                "UPDATE tenants SET last_reminder_sent_at = now(), reminder_stage = $1 WHERE id = $2::uuid",
                reminder_stage, tenant_id
            )

            if creds and creds.get("phone_number_id") and creds.get("access_token"):
                await send_text(
                    phone_number_id=creds["phone_number_id"],
                    access_token=creds["access_token"],
                    to=clean_phone,
                    body=msg_text
                )
                logger.info("sub_reminder_dispatched_via_worker", tenant_id=tenant_id, stage=reminder_stage, phone=clean_phone)
        except Exception as e:
            logger.error("dispatch_platform_sub_reminder_failed", tenant_id=tenant_id, stage=reminder_stage, error=str(e))

    async def _process_daily_digest(self):
        """
        Runs once daily at ~08:00 AM in tenant's local timezone.
        Queries today's confirmed bookings count and dispatches template_admin_daily_digest to admin.
        """
        try:
            tenants = await self.db_pool.fetch("SELECT id, settings FROM tenants WHERE is_active = true")
            for t in tenants:
                tenant_id = str(t["id"])
                settings = t["settings"] or {}
                if isinstance(settings, str):
                    try: settings = json.loads(settings)
                    except: settings = {}

                tz_str = settings.get("timezone", "Asia/Kolkata")
                import zoneinfo
                try: tz = zoneinfo.ZoneInfo(tz_str)
                except Exception: tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

                now_local = datetime.datetime.now(tz)
                # Check if current time is around 08:00 AM (08:00 - 08:05)
                if now_local.hour == 8 and now_local.minute < 5:
                    today_str = now_local.strftime("%Y-%m-%d")
                    digest_key = f"digest_sent:{tenant_id}:{today_str}"
                    already_sent = await self.redis.get(digest_key)
                    if not already_sent:
                        start_of_day = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
                        end_of_day = now_local.replace(hour=23, minute=59, second=59, microsecond=999999)
                        
                        count = await self.db_pool.fetchval(
                            """SELECT count(*) FROM bookings
                               WHERE tenant_id = $1::uuid AND status = 'confirmed'
                                 AND start_time >= $2 AND start_time <= $3""",
                            tenant_id, start_of_day, end_of_day
                        )
                        
                        wa_row = await self.db_pool.fetchrow(
                            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
                            tenant_id
                        )
                        if wa_row and wa_row["credential_data"]:
                            wdata = wa_row["credential_data"]
                            if isinstance(wdata, str):
                                try: wdata = json.loads(wdata)
                                except: wdata = {}
                            
                            admin_phone = (wdata.get("admin_whatsapp_number") or settings.get("admin_whatsapp_number") or "").strip()
                            if admin_phone and wdata.get("phone_number_id") and wdata.get("access_token"):
                                clean_admin = re.sub(r'[^0-9+]', '', admin_phone)
                                if not clean_admin.startswith("+"):
                                    clean_admin = f"+91{clean_admin}" if len(clean_admin) == 10 else f"+{clean_admin}"
                                
                                digest_template = (
                                    wdata.get("template_admin_daily_digest") or
                                    (settings.get("template_admin_daily_digest") if settings else None) or
                                    "admin_daily_digest"
                                )
                                formatted_today = now_local.strftime("%A, %d %B %Y")
                                components = [
                                    {
                                        "type": "body",
                                        "parameters": [
                                            {"type": "text", "text": str(count or 0)},
                                            {"type": "text", "text": formatted_today},
                                        ]
                                    }
                                ]
                                try:
                                    await send_template(
                                        phone_number_id=wdata["phone_number_id"],
                                        access_token=wdata["access_token"],
                                        to=clean_admin,
                                        template_name=digest_template,
                                        language_code="en",
                                        components=components,
                                    )
                                    logger.info("admin_daily_digest_sent", tenant_id=tenant_id, count=count, to=clean_admin)
                                    await self.redis.setex(digest_key, 86400, "1")
                                except Exception as de:
                                    logger.warning("admin_daily_digest_failed", error=str(de))
        except Exception as e:
            logger.error("process_daily_digest_error", error=str(e))

    async def _process_appointment_reminders(self):
        """Find confirmed bookings happening in 2 hours that have not yet received a reminder."""
        try:
            due_reminders = await self.db_pool.fetch(
                """SELECT b.id, b.tenant_id, b.service, b.start_time, b.conversation_id,
                          c.phone, c.name as contact_name,
                          tc.credential_data as wa_creds,
                          t.settings as tenant_settings
                   FROM bookings b
                   JOIN contacts c ON c.id = b.contact_id
                   JOIN tenants t ON t.id = b.tenant_id
                   JOIN tenant_credentials tc ON tc.tenant_id = b.tenant_id AND tc.provider = 'whatsapp'
                   WHERE b.status = 'confirmed'
                     AND b.reminder_sent_at IS NULL
                     AND b.start_time <= (now() + interval '2 hours 5 minutes')
                     AND b.start_time >= now()
                   LIMIT 25"""
            )

            for row in due_reminders:
                booking_id = str(row["id"])
                tenant_id = str(row["tenant_id"])
                contact_phone = row["phone"]
                name = row["contact_name"] or "there"
                service_name = row["service"] or "Appointment"
                conv_id = str(row["conversation_id"]) if row.get("conversation_id") else None

                # Extract timezone
                tenant_timezone_str = "Asia/Kolkata"
                t_st = row["tenant_settings"] if row.get("tenant_settings") else {}
                if isinstance(t_st, str):
                    try: t_st = json.loads(t_st)
                    except: t_st = {}
                if t_st.get("timezone"):
                    tenant_timezone_str = t_st.get("timezone").strip()

                import zoneinfo
                try: tz = zoneinfo.ZoneInfo(tenant_timezone_str)
                except: tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

                st_dt = row["start_time"].astimezone(tz)
                formatted_date = st_dt.strftime("%d-%m-%Y")
                formatted_time = st_dt.strftime("%I:%M %p")

                creds = row["wa_creds"] if row.get("wa_creds") else {}
                if isinstance(creds, str):
                    try: creds = json.loads(creds)
                    except: creds = {}

                # 1. Mark as sent immediately to avoid duplicate dispatch
                await self.db_pool.execute(
                    "UPDATE bookings SET reminder_sent_at = now() WHERE id = $1::uuid",
                    booking_id
                )

                # 2. Dispatch Meta Template or Text
                if creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                    template_name = (
                        creds.get("template_appointment_reminder") or
                        (t_st.get("template_appointment_reminder") if t_st else None) or
                        "appointment_ramainder"
                    )
                    components = [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": name},
                                {"type": "text", "text": service_name},
                                {"type": "text", "text": f"{formatted_time} on {formatted_date}"},
                            ]
                        }
                    ]
                    try:
                        await send_template(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=contact_phone,
                            template_name=template_name,
                            language_code="en",
                            components=components,
                        )
                        logger.info("2hr_appointment_reminder_template_sent", booking_id=booking_id, to=contact_phone)
                    except Exception as e:
                        logger.warning("reminder_template_send_failed_fallback_to_text", error=str(e), template=template_name)
                        reminder_text = (
                            f"Hi {name}! ⏰ This is a friendly reminder that your *{service_name}* appointment "
                            f"is in 2 hours today at *{formatted_time}*. We look forward to seeing you!"
                        )
                        try:
                            await send_text(
                                phone_number_id=creds["phone_number_id"],
                                access_token=creds["access_token"],
                                to=contact_phone,
                                body=reminder_text,
                            )
                            if conv_id:
                                await self.db_pool.execute(
                                    """INSERT INTO messages (id, conversation_id, tenant_id, direction, content_type, body, status, ai_used_fallback)
                                       VALUES ($1::uuid, $2::uuid, $3::uuid, 'outbound', 'text', $4, 'sent', false)""",
                                    str(uuid.uuid4()), conv_id, tenant_id, reminder_text
                                )
                            logger.info("2hr_appointment_reminder_text_sent", booking_id=booking_id, to=contact_phone)
                        except Exception as e2:
                            logger.error("reminder_text_send_failed", error=str(e2))
        except Exception as e:
            logger.error("process_appointment_reminders_failed", error=str(e))

    async def _process_scheduled_jobs(self):
        """Find due scheduled jobs and send WhatsApp messages using approved Meta utility templates."""
        due_jobs = await self.db_pool.fetch(
            """SELECT sj.id, sj.tenant_id, sj.job_type, sj.booking_id,
                      b.contact_id, b.service, b.start_time, b.end_time, b.notes,
                      c.phone, c.name as contact_name,
                      tc.credential_data as wa_creds,
                      t.settings as tenant_settings
               FROM scheduled_jobs sj
               JOIN bookings b ON b.id = sj.booking_id
               JOIN contacts c ON c.id = b.contact_id
               JOIN tenants t ON t.id = sj.tenant_id
               JOIN tenant_credentials tc ON tc.tenant_id = sj.tenant_id AND tc.provider = 'whatsapp'
               WHERE sj.status = 'pending'
                 AND sj.scheduled_at <= now()
               LIMIT 20""",
        )

        for job in due_jobs:
            try:
                creds = dict(job["wa_creds"]) if isinstance(job["wa_creds"], dict) else json.loads(job["wa_creds"])
                t_st = job["tenant_settings"] if job.get("tenant_settings") else {}
                if isinstance(t_st, str):
                    try: t_st = json.loads(t_st)
                    except: t_st = {}

                name = job.get("contact_name") or "there"
                service = job["service"] or "Appointment"
                start = job["start_time"]

                tz_str = t_st.get("timezone", "Asia/Kolkata")
                try:
                    import zoneinfo
                    tz = zoneinfo.ZoneInfo(tz_str)
                except Exception:
                    tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

                if isinstance(start, datetime.datetime):
                    st_tz = start.astimezone(tz)
                    date_str = st_tz.strftime("%d-%m-%Y")
                    time_str = st_tz.strftime("%I:%M %p")
                    full_time_str = f"{time_str} on {date_str}"
                else:
                    full_time_str = str(start)

                sent_via_template = False
                job_type = job["job_type"]

                # 1. Reminder job: Send approved appointment_ramainder template
                if job_type == "reminder" and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                    template_name = (
                        creds.get("template_appointment_reminder") or
                        t_st.get("template_appointment_reminder") or
                        "appointment_ramainder"
                    )
                    components = [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": name},
                                {"type": "text", "text": service},
                                {"type": "text", "text": full_time_str},
                            ]
                        }
                    ]
                    try:
                        await send_template(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=job["phone"],
                            template_name=template_name,
                            language_code="en",
                            components=components,
                        )
                        sent_via_template = True
                        logger.info("scheduled_reminder_template_sent", template=template_name, to=job["phone"])
                    except Exception as te:
                        logger.warning("scheduled_reminder_template_failed_fallback_text", error=str(te))

                # 2. Review Request job: Send approved review_request template
                elif job_type == "review_request" and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                    review_link = (t_st.get("google_review_link") or creds.get("google_review_link") or "").strip() or "https://g.page"
                    template_name = (
                        creds.get("template_review_request") or
                        t_st.get("template_review_request") or
                        "review_request"
                    )
                    components = [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": name},
                                {"type": "text", "text": service},
                                {"type": "text", "text": review_link},
                            ]
                        }
                    ]
                    try:
                        await send_template(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=job["phone"],
                            template_name=template_name,
                            language_code="en",
                            components=components,
                        )
                        sent_via_template = True
                        logger.info("scheduled_review_template_sent", template=template_name, to=job["phone"])
                    except Exception as te:
                        logger.warning("scheduled_review_template_failed_fallback_text", error=str(te))

                # 3. Fallback to freeform text if template wasn't sent
                if not sent_via_template:
                    message = self._build_scheduled_message(dict(job))
                    await send_text(
                        phone_number_id=creds["phone_number_id"],
                        access_token=creds["access_token"],
                        to=job["phone"],
                        body=message,
                    )

                await self.db_pool.execute(
                    "UPDATE scheduled_jobs SET status = 'sent', sent_at = now() WHERE id = $1",
                    job["id"],
                )

                if job.get("contact_id") and job.get("tenant_id"):
                    conv_row = await self.db_pool.fetchrow(
                        "SELECT id FROM conversations WHERE contact_id = $1 AND tenant_id = $2 LIMIT 1",
                        job["contact_id"], job["tenant_id"]
                    )
                    if conv_row:
                        logged_body = f"Template: {job_type}" if sent_via_template else message
                        await self.db_pool.execute(
                            """INSERT INTO messages (id, conversation_id, tenant_id, direction, content_type, body, status, ai_used_fallback)
                               VALUES ($1::uuid, $2::uuid, $3::uuid, 'outbound', 'text', $4, 'sent', false)""",
                            str(uuid.uuid4()), conv_row["id"], job["tenant_id"], logged_body
                        )

                logger.info("scheduled_job_sent", job_id=str(job["id"]), job_type=job["job_type"])
            except Exception as e:
                logger.error("scheduled_job_failed", job_id=str(job["id"]), error=str(e))
                await self.db_pool.execute(
                    "UPDATE scheduled_jobs SET status = 'failed' WHERE id = $1",
                    job["id"],
                )

    def _build_scheduled_message(self, job: dict) -> str:
        name = job.get("contact_name") or "there"
        service = job["service"]
        start = job["start_time"]
        if isinstance(start, datetime.datetime):
            start_str = start.strftime("%A, %d %B at %I:%M %p")
        else:
            start_str = str(start)

        if job["job_type"] == "reminder":
            return (
                f"Hi {name}! This is a friendly reminder that you have a *{service}* appointment "
                f"scheduled for *{start_str}*. We look forward to seeing you!"
            )
        elif job["job_type"] == "review_request":
            return (
                f"Hi {name}! We hope your *{service}* went well! "
                f"We'd love to hear your feedback. Please take a moment to share your experience with us. "
                f"Your feedback helps us serve you better!"
            )
        return f"Hi {name}, this is a message from us regarding your {service} booking."


# ── Shared worker instance ────────────────────────────────────────────────────
worker = CoreWorker()


@app.on_event("startup")
async def startup():
    await worker.start()


@app.get("/health")
def health():
    return {"status": "ok", "service": "core-worker"}


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3002)),
        loop="asyncio",
        log_config=None,  # Use structlog instead
    )
