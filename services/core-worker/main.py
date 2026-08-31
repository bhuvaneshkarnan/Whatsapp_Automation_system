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
from datetime import datetime, timezone
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
    from providers.llm_router import call_llm_cascade, call_groq, call_opencode, LLMError, clean_llm_response
    from providers.transcription import transcribe_voice_message, TranscriptionError
    from providers.rule_engine import apply_rule_engine, db_row_to_rule
    from providers.whatsapp_sender import send_text, send_template, mark_as_read, WhatsAppSendError
except (ImportError, ModuleNotFoundError):
    from core_worker.providers.gemini import call_gemini, GeminiError
    from core_worker.providers.llm_router import call_llm_cascade, call_groq, call_opencode, LLMError, clean_llm_response
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


def build_booking_admin_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, contact_phone: str, customer_email: str, notes: str, full_location: str) -> str:
    loc_html = f"""<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: bold;">📍 Location:</td><td style="padding: 10px 0; color: #0f172a;">{full_location}</td></tr>""" if full_location else ""
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
  <div style="background-color: #0f172a; background: linear-gradient(135deg, #0f172a, #1e293b); padding: 24px 20px; border-radius: 8px; text-align: center;">
    <span style="display: inline-block; background: rgba(255,255,255,0.15); color: #ffffff !important; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Admin Notification</span>
    <h2 style="margin: 10px 0 4px 0; font-size: 22px; font-weight: bold; color: #ffffff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">🚨 New Booking Received</h2>
    <p style="margin: 0; font-size: 13px; color: #cbd5e1 !important;">Scheduled via WhatsApp AI Assistant</p>
  </div>
  <div style="padding: 24px 0;">
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">Hello <strong>Admin & Team</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #475569;">A new appointment has been scheduled by a client. Here are the client and booking details:</p>
    
    <div style="margin: 18px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h4 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">👤 Client Information</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 35%;">Client Name:</td><td style="padding: 8px 0; color: #0f172a; font-weight: bold;">{name}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b; font-weight: 600;">WhatsApp Phone:</td><td style="padding: 8px 0; color: #0f172a;">{contact_phone}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Client Email:</td><td style="padding: 8px 0; color: #0f172a;">{customer_email or 'Not provided'}</td></tr>
      </table>
    </div>

    <div style="margin: 18px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h4 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">📅 Appointment Schedule</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 35%;">Service:</td><td style="padding: 8px 0; color: #0f172a; font-weight: bold;">{service_name}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Date & Time:</td><td style="padding: 8px 0; color: #0f172a; font-weight: bold;">{formatted_date} at {formatted_time}</td></tr>
        {loc_html}
        <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Notes:</td><td style="padding: 8px 0; color: #0f172a;">{notes}</td></tr>
      </table>
    </div>
    
    <div style="margin-top: 20px; padding: 12px 16px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px; font-size: 13px; color: #065f46;">
      ✅ <strong>Calendar Synced:</strong> This event has been added to your Google Calendar. You can manage or contact the client directly from your CRM dashboard.
    </div>
  </div>
  <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
    Boldlabs AI WhatsApp CRM Platform • Admin Alert Dispatch
  </div>
</div>
"""


def build_booking_customer_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, contact_phone: str, full_location: str) -> str:
    loc_html = f"""<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: bold;">📍 Location:</td><td style="padding: 10px 0; color: #0f172a;">{full_location}</td></tr>""" if full_location else ""
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
  <div style="background-color: #059669; background: linear-gradient(135deg, #10b981, #059669); padding: 24px 20px; border-radius: 8px; text-align: center;">
    <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: #ffffff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">✅ Your Booking is Confirmed!</h2>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #ecfdf5 !important;">We look forward to seeing you</p>
  </div>
  <div style="padding: 24px 0;">
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">Hi <strong>{name}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #475569;">Thank you for booking with us! Your appointment has been confirmed. Below are your scheduled details:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 12px 16px; color: #64748b; font-weight: 600; width: 35%;">Service:</td><td style="padding: 12px 16px; color: #0f172a; font-weight: bold;">{service_name}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 12px 16px; color: #64748b; font-weight: 600;">Date & Time:</td><td style="padding: 12px 16px; color: #0f172a; font-weight: bold;">📅 {formatted_date} at ⏰ {formatted_time}</td></tr>
      {loc_html}
      <tr><td style="padding: 12px 16px; color: #64748b; font-weight: 600;">Phone on File:</td><td style="padding: 12px 16px; color: #0f172a;">{contact_phone}</td></tr>
    </table>

    <div style="margin-top: 20px; padding: 14px 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; font-size: 13px; color: #1e40af;">
      💬 <strong>Need to reschedule or cancel?</strong><br>Simply reply to our WhatsApp chat or send us a message anytime. We are happy to help!
    </div>
  </div>
  <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
    Thank you for choosing our business!
  </div>
</div>
"""


def build_cancellation_admin_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, contact_phone: str, customer_email: str) -> str:
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
  <div style="background-color: #dc2626; background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 24px 20px; border-radius: 8px; text-align: center;">
    <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff !important; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Admin Notification</span>
    <h2 style="margin: 10px 0 4px 0; font-size: 22px; font-weight: bold; color: #ffffff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">❌ Client Cancelled Appointment</h2>
    <p style="margin: 0; font-size: 13px; color: #fee2e2 !important;">Booking removed from schedule</p>
  </div>
  <div style="padding: 24px 0;">
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">Hello <strong>Admin & Team</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #475569;">A client has cancelled their appointment. The slot has been released:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; color: #64748b; font-weight: 600; width: 35%;">Client Name:</td><td style="padding: 10px 16px; color: #0f172a; font-weight: bold;">{name}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Client Phone:</td><td style="padding: 10px 16px; color: #0f172a;">{contact_phone}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Client Email:</td><td style="padding: 10px 16px; color: #0f172a;">{customer_email or 'Not provided'}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Service:</td><td style="padding: 10px 16px; color: #0f172a;">{service_name}</td></tr>
      <tr><td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Cancelled Slot:</td><td style="padding: 10px 16px; color: #ef4444; font-weight: bold;">{formatted_date} at {formatted_time}</td></tr>
    </table>

    <div style="margin-top: 16px; padding: 12px 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; font-size: 13px; color: #991b1b;">
      🗑️ <strong>Calendar Updated:</strong> The Google Calendar event has been automatically deleted and the CRM booking is marked 'cancelled'.
    </div>
  </div>
  <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
    Boldlabs AI WhatsApp CRM Platform • Admin Alert Dispatch
  </div>
</div>
"""


def build_cancellation_customer_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str) -> str:
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
  <div style="background-color: #475569; background: linear-gradient(135deg, #64748b, #475569); padding: 24px 20px; border-radius: 8px; text-align: center;">
    <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: #ffffff !important;">❌ Appointment Cancelled</h2>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #f1f5f9 !important;">Confirmation of your cancellation</p>
  </div>
  <div style="padding: 24px 0;">
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">Hi <strong>{name}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #475569;">As requested, your scheduled appointment has been cancelled:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 12px 16px; color: #64748b; font-weight: 600; width: 35%;">Service:</td><td style="padding: 12px 16px; color: #0f172a;">{service_name}</td></tr>
      <tr><td style="padding: 12px 16px; color: #64748b; font-weight: 600;">Cancelled Slot:</td><td style="padding: 12px 16px; color: #64748b;">{formatted_date} at {formatted_time}</td></tr>
    </table>

    <p style="font-size: 14px; color: #475569; line-height: 1.5;">If you would like to pick a new date or time in the future, simply message us back on WhatsApp anytime. We are always here to help!</p>
  </div>
  <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
    Thank you!
  </div>
</div>
"""


def build_reschedule_admin_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, contact_phone: str, customer_email: str) -> str:
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
  <div style="background-color: #1d4ed8; background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px 20px; border-radius: 8px; text-align: center;">
    <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff !important; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Admin Notification</span>
    <h2 style="margin: 10px 0 4px 0; font-size: 22px; font-weight: bold; color: #ffffff !important;">🔄 Booking Rescheduled by Client</h2>
    <p style="margin: 0; font-size: 13px; color: #dbeafe !important;">Updated appointment schedule</p>
  </div>
  <div style="padding: 24px 0;">
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">Hello <strong>Admin & Team</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #475569;">The client has rescheduled their appointment to a new date and time:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; color: #64748b; font-weight: 600; width: 35%;">Client Name:</td><td style="padding: 10px 16px; color: #0f172a; font-weight: bold;">{name}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Client Phone:</td><td style="padding: 10px 16px; color: #0f172a;">{contact_phone}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Client Email:</td><td style="padding: 10px 16px; color: #0f172a;">{customer_email or 'Not provided'}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Service:</td><td style="padding: 10px 16px; color: #0f172a;">{service_name}</td></tr>
      <tr><td style="padding: 10px 16px; color: #64748b; font-weight: 600;">New Date & Time:</td><td style="padding: 10px 16px; color: #2563eb; font-weight: bold;">📅 {formatted_date} at ⏰ {formatted_time}</td></tr>
    </table>

    <div style="margin-top: 16px; padding: 12px 16px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px; font-size: 13px; color: #1e40af;">
      🔄 <strong>Calendar Updated:</strong> The Google Calendar event has been moved to the new time slot automatically.
    </div>
  </div>
  <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
    Boldlabs AI WhatsApp CRM Platform • Admin Alert Dispatch
  </div>
</div>
"""


def build_reschedule_customer_email_html(service_name: str, formatted_date: str, formatted_time: str, name: str, full_location: str) -> str:
    loc_html = f"""<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: bold;">📍 Location:</td><td style="padding: 10px 0; color: #0f172a;">{full_location}</td></tr>""" if full_location else ""
    return f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
  <div style="background-color: #4f46e5; background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 24px 20px; border-radius: 8px; text-align: center;">
    <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: #ffffff !important;">🔄 Your Appointment is Rescheduled</h2>
    <p style="margin: 6px 0 0 0; font-size: 14px; color: #e0e7ff !important;">Updated appointment schedule</p>
  </div>
  <div style="padding: 24px 0;">
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">Hi <strong>{name}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #475569;">Your appointment has been successfully rescheduled to your new requested time:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 12px 16px; color: #64748b; font-weight: 600; width: 35%;">Service:</td><td style="padding: 12px 16px; color: #0f172a; font-weight: bold;">{service_name}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 12px 16px; color: #64748b; font-weight: 600;">New Date & Time:</td><td style="padding: 12px 16px; color: #4f46e5; font-weight: bold;">📅 {formatted_date} at ⏰ {formatted_time}</td></tr>
      {loc_html}
    </table>

    <p style="font-size: 14px; color: #475569; line-height: 1.5;">Your calendar invite has been updated. Reply directly to our WhatsApp chat anytime if you need any further assistance!</p>
  </div>
  <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
    Thank you!
  </div>
</div>
"""

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
                # Read up to 20 messages, block for 2s if stream is empty
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

            # ── 2. Get or create conversation ─────────────────────────────────
            conv_id, conv_status = await self._get_or_create_conversation(tenant_id, contact_id)

            # ── 3. WhatsApp Read Receipts (2 Blue Ticks) ──────────────────────
            creds = await self._get_tenant_whatsapp_creds(tenant_id)
            is_active = await self.db_pool.fetchval(
                "SELECT is_active FROM tenants WHERE id = $1::uuid", tenant_id
            )
            # Only auto-mark as read (blue ticks) if AI is enabled and handling this chat.
            # If in Human Mode or paused, keep as delivered (2 grey ticks) until staff opens chat in CRM.
            if is_active is not False and conv_status != "human" and creds and creds.get("phone_number_id") and creds.get("access_token"):
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
            await self._persist_message(
                tenant_id=tenant_id,
                conversation_id=conv_id,
                wa_message_id=wa_message_id,
                direction="inbound",
                body=body_text,
                content_type=msg_type,
            )

            # ── 6. Route to AI or skip (human mode or paused automation) ─────
            is_active = await self.db_pool.fetchval(
                "SELECT is_active FROM tenants WHERE id = $1::uuid", tenant_id
            )
            if is_active is False:
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
        primary_provider = ai_cfg.get("model_provider") or "gemini"

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

        # Retrieve all currently booked/occupied slots for this business (next 7 days) to prevent double bookings
        tenant_busy_rows = await self.db_pool.fetch(
            """SELECT service, start_time, end_time
               FROM bookings
               WHERE tenant_id = $1::uuid
                 AND status = 'confirmed'
                 AND start_time >= now() - INTERVAL '2 hours'
                 AND start_time <= now() + INTERVAL '7 days'
               ORDER BY start_time ASC LIMIT 40""",
            tenant_id,
        )
        if tenant_busy_rows:
            busy_lines = [
                f"- {r['start_time'].astimezone(tenant_tz).strftime('%A, %d %b %Y: %I:%M %p')} to {r['end_time'].astimezone(tenant_tz).strftime('%I:%M %p')} ({r.get('service', 'Booked')})"
                for r in tenant_busy_rows
            ]
            busy_slots_block = (
                "### ALREADY BOOKED & OCCUPIED TIMESLOTS (STRICT CONFLICT PREVENTION):\n"
                "The following time slots are ALREADY TAKEN by other clients. NO ONE ELSE CAN BOOK THESE TIMES:\n"
                + "\n".join(busy_lines)
                + "\n- If the customer requests any slot listed above, you MUST politely inform them that this time is already taken, and propose the closest available time slot instead."
            )
        else:
            busy_slots_block = (
                "### ALREADY BOOKED & OCCUPIED TIMESLOTS:\n"
                "All standard business hours are currently open and available for booking."
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
        strict_rules = ai_cfg.get("strict_rules") or ""
        objection_handling = ai_cfg.get("objection_handling") or ""

        # Master Global Human Persona & Conversational Intelligence Engine
        master_human_directives = (
            "### MASTER HUMAN CONVERSATION & TEXTING RULES (MANDATORY FOR EVERY REPLY):\n"
            "You are replying as a REAL PERSON representing the business on WhatsApp, NOT as an AI bot.\n"
            "Always use the business name, tone, services, and verified details given to you in context. Never invent or assume business details on your own.\n\n"
            "1. Sound Like a Real Person, Not a Script:\n"
            "- Acknowledge what the person just said before moving on to your point, the way someone naturally reacts, rather than jumping straight into an answer.\n"
            "- Small natural reactions are fine here and there (e.g., 'Oh got it', 'Makes total sense', 'Sure thing'), but keep them genuine.\n"
            "- Match their energy and formality: casual gets casual back, while a worried or frustrated message gets genuine warmth and reassurance before a solution.\n"
            "- Mirror the language and tone they wrote in (English, Hinglish, casual phrases, etc.).\n"
            "- Ask ONE thing at a time. NEVER stack two or three questions into one message.\n"
            "- Show real interest with a genuine follow-up instead of rushing them to the next step.\n\n"
            "2. Natural WhatsApp Texting Style:\n"
            "- Write like you're texting on your phone, not filing a corporate report.\n"
            "- Keep replies concise and punchy (1 to 2 short sentences). Make every word count.\n"
            "- DO NOT insert blank line gaps between short 1-2 sentence replies. Connect them smoothly into a single natural sentence or paragraph (e.g. 'Awesome, I have got that booked for you for today at 19:00.' or 'Thanks for sharing that! Just to quickly check...'). Use a line gap ONLY when providing a list or separating distinct topics.\n"
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
            "3. CONFLICT PREVENTION / ONLY ONE BOOKING AT A TIME:\n"
            "- Only ONE appointment can be booked in any given time slot.\n"
            "- Check the 'ALREADY BOOKED & OCCUPIED TIMESLOTS' list above before agreeing to any time.\n"
            "- If a customer asks for a slot that is already booked (e.g. 1:00 AM, 9:00 AM, etc.), NEVER agree to that time. Politely let them know:\n"
            "  'That slot is already booked. Would [suggest alternate time or day] work for you instead?'\n\n"
            "4. INQUIRY ABOUT EXISTING APPOINTMENT ('When is my appointment?', 'Do I have a booking?', 'What time is my call?'):\n"
            "- Check 'Known Bookings for THIS Customer' in the CUSTOMER PROFILE above.\n"
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
            "8. 12-HOUR TIME FORMAT DIRECTIVE (ABSOLUTE RULE):\n"
            "- ALWAYS speak and quote time in 12-HOUR FORMAT with AM/PM (e.g. '08:30 PM', '10:00 AM', '07:00 PM') in all messages to customers.\n"
            "- NEVER use military or 24-hour time (like 20:30, 19:00, or 14:00) when replying to customers.\n"
            "- In the JSON action tag [ACTION:CREATE_BOOKING: ...], pass time as 24-hour HH:MM (e.g. '20:30')."
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
            memory_block,
            busy_slots_block,
        ]

        if custom_instructions.strip():
            prompt_blocks.append(f"### BUSINESS KNOWLEDGE BASE & INSTRUCTIONS:\n{custom_instructions.strip()}")

        if services_text.strip():
            prompt_blocks.append(f"### SERVICES & PRICING:\n{services_text.strip()}")

        if bot_goal.strip():
            prompt_blocks.append(f"### GOALS & OBJECTIVES:\n{bot_goal.strip()}")

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
            primary_provider=primary_provider or "gemini",
            gemini_model="gemini-3.5-flash-lite",
            max_tokens=2048,
            temperature=0.3,
            timeout_seconds=12.0,
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

            # 3. Intercept [ACTION:CREATE_BOOKING: ...] tag
            m = re.search(r'\[ACTION:CREATE_BOOKING:\s*(\{.*?\})\]', response_text, re.DOTALL)
            if m:
                try:
                    booking_action = json.loads(m.group(1))
                except Exception as e:
                    logger.warning("booking_action_json_parse_failed", error=str(e))
                # Strip action tag from message sent to WhatsApp customer
                response_text = re.sub(r'\[ACTION:CREATE_BOOKING:\s*\{.*?\}\]', '', response_text, flags=re.DOTALL).strip()
            elif not cancel_action and not reschedule_action and any(phrase in response_text.lower() for phrase in [
                "booked for you", "have got that booked", "got that booked", "appointment is booked", 
                "appointment is confirmed", "scheduled for you", "has been scheduled", "all set for", 
                "you are all set", "you're all set", "all set", "booked for today", "booked for tomorrow", 
                "confirmed for", "see you at", "looking forward to seeing you at", "reserved for you",
                "got it, you are all set", "you're booked"
            ]):
                # Intelligent Fallback extractor: LLM confirmed the booking in text but forgot the JSON tag!
                extracted_email = ""
                extracted_name = customer_name or ""
                for h in reversed(history):
                    content = h.get("content", "")
                    email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', content)
                    if email_match and not extracted_email:
                        extracted_email = email_match.group(0)
                        lines = [l.strip() for l in content.split('\n') if l.strip()]
                        for l in lines:
                            if '@' not in l and len(l.split()) <= 4 and not re.search(r'\d', l):
                                extracted_name = l
                                break

                # Extract time from message_text, response_text, or recent history
                combined_texts = f"{message_text} {response_text}"
                for h in reversed(history[-6:]):
                    combined_texts += f" {h.get('content', '')}"

                pm_match = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(pm|am)', combined_texts, re.IGNORECASE)
                time_str = "10:00"
                if pm_match:
                    h = int(pm_match.group(1))
                    m = int(pm_match.group(2) or 0)
                    is_pm = 'pm' in pm_match.group(3).lower()
                    if is_pm and h < 12:
                        h += 12
                    elif not is_pm and h == 12:
                        h = 0
                    time_str = f"{h:02d}:{m:02d}"
                else:
                    time_match = re.search(r'\b([01]?\d|2[0-3]):([0-5]\d)\b', combined_texts)
                    if time_match:
                        time_str = f"{int(time_match.group(1)):02d}:{time_match.group(2)}"

                today_iso = now.strftime("%Y-%m-%d")
                date_str = today_iso
                if "tomorrow" in combined_texts.lower():
                    date_str = (now + datetime.timedelta(days=1)).strftime("%Y-%m-%d")

                booking_action = {
                    "service": "Consultation / Appointment",
                    "date": date_str,
                    "time": time_str,
                    "name": extracted_name or "Valued Customer",
                    "email": extracted_email,
                    "notes": "Auto-extracted from WhatsApp conversation"
                }
                logger.info("fallback_booking_action_extracted", booking_action=booking_action)

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
            customer_email = (booking_data.get("email") or "").strip()

            # Parse start and end time
            try:
                dt_naive = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                st_dt = dt_naive.replace(tzinfo=tz)
            except Exception:
                st_dt = datetime.datetime.now(tz) + datetime.timedelta(hours=2)

            et_dt = st_dt + datetime.timedelta(minutes=30)

            # Get contact_id
            contact_id = await self.db_pool.fetchval(
                "SELECT contact_id FROM conversations WHERE id = $1::uuid", conv_id
            )

            # Save customer email and name if provided (with strict validation)
            if contact_id:
                if customer_email and re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', customer_email):
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

            # Double Booking Conflict Check:
            conflict_row = await self.db_pool.fetchrow(
                """SELECT id, service, start_time, end_time
                   FROM bookings
                   WHERE tenant_id = $1::uuid
                     AND status = 'confirmed'
                     AND start_time < $3 AND end_time > $2""",
                tenant_id, st_dt, et_dt
            )
            if conflict_row:
                logger.warning("ai_booking_conflict_detected", tenant_id=tenant_id, requested_start=str(st_dt), conflict_id=str(conflict_row["id"]))
                conflict_msg = f"That slot on {st_dt.strftime('%d %b at %I:%M %p')} is already booked by another client. Could you please let me know another time or day that works for you?"
                if creds and creds.get("phone_number_id") and creds.get("access_token"):
                    try:
                        await send_text(
                            phone_number_id=creds["phone_number_id"],
                            access_token=creds["access_token"],
                            to=contact_phone,
                            body=conflict_msg,
                        )
                        conf_msg_id = str(uuid.uuid4())
                        await self.db_pool.execute(
                            """INSERT INTO messages (id, conversation_id, tenant_id, direction, content_type, body, status, ai_used_fallback)
                               VALUES ($1::uuid, $2::uuid, $3::uuid, 'outbound', 'text', $4, 'sent', false)""",
                            conf_msg_id, conv_id, tenant_id, conflict_msg
                        )
                        await self.db_pool.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid", conv_id)
                    except Exception:
                        pass
                return

            # Insert booking record in DB
            booking_id = str(uuid.uuid4())
            await self.db_pool.execute(
                """INSERT INTO bookings (id, tenant_id, contact_id, conversation_id, service, start_time, end_time, status, notes, price, currency)
                   VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, 'confirmed', $8, 0, 'INR')""",
                booking_id, tenant_id, contact_id, conv_id, service_name, st_dt, et_dt, notes
            )
            logger.info("ai_booking_created", booking_id=booking_id, service=service_name, start_time=str(st_dt))

            # 1. Send Meta WhatsApp Template (booking_confirmationn)
            if creds and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                template_name = creds.get("template_booking_confirmation") or "booking_confirmationn"
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
                    # Send Meta Template FIRST (immune to 24h customer window)
                    admin_template = creds.get("template_admin_notification") or "admin_notification"
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
                        if customer_email and re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', customer_email) and customer_email.strip() != (admin_notif_email or "").strip():
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
                            admin_subject = f"🚨 [Admin Alert] New Booking: {service_name} - {name} ({formatted_date} at {formatted_time})"
                            send_gmail_direct_notification(g_creds, admin_notif_email, admin_subject, admin_email_html)
                        
                        # Send tailored copy to Customer
                        if customer_email and "@" in customer_email and customer_email != (admin_notif_email or "").strip():
                            customer_email_html = build_booking_customer_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                                contact_phone=contact_phone,
                                full_location=full_location,
                            )
                            customer_subject = f"✅ Booking Confirmed: Your {service_name} Appointment on {formatted_date} at {formatted_time}"
                            send_gmail_direct_notification(g_creds, customer_email, customer_subject, customer_email_html)

                    except Exception as e:
                        logger.error("google_calendar_sync_error", error=str(e), booking_id=booking_id)

        except Exception as e:
            logger.error("execute_ai_booking_failed", error=str(e), tenant_id=tenant_id)

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
                """SELECT id, service, start_time, google_event_id
                   FROM bookings
                   WHERE tenant_id = $1::uuid AND contact_id = $2::uuid AND status = 'confirmed'
                   ORDER BY start_time DESC LIMIT 1""",
                tenant_id, contact_id
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
                template_name = creds.get("template_cancellation_confirmation") or "cancellation_confirmation"
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
                    admin_cancel_template = creds.get("template_admin_cancellation_notice") or "admin_cancellation_notice"
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
                            admin_subject = f"❌ [Admin Notice] Booking Cancelled: {service_name} - {name} ({formatted_date} at {formatted_time})"
                            send_gmail_direct_notification(g_creds, admin_notif_email, admin_subject, admin_email_html)

                        # Send tailored copy to Customer
                        if customer_email and "@" in customer_email and customer_email != (admin_notif_email or "").strip():
                            customer_email_html = build_cancellation_customer_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                            )
                            customer_subject = f"❌ Appointment Cancelled: {service_name} on {formatted_date}"
                            send_gmail_direct_notification(g_creds, customer_email, customer_subject, customer_email_html)
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
                # Send Meta Template FIRST (immune to 24h customer window)
                admin_template = creds.get("template_admin_human_request") or "admin_human_request"
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
                """SELECT id, service, google_event_id
                   FROM bookings
                   WHERE tenant_id = $1::uuid AND contact_id = $2::uuid AND status = 'confirmed'
                   ORDER BY start_time DESC LIMIT 1""",
                tenant_id, contact_id
            )

            service_name = booking_data.get("service") or (old_booking["service"] if old_booking else "Consultation / Demo")
            date_str = booking_data.get("date") or datetime.date.today().strftime("%Y-%m-%d")
            time_str = booking_data.get("time") or "10:00"
            notes = booking_data.get("notes") or "Rescheduled via WhatsApp AI Assistant"
            name = booking_data.get("name") or customer_name or "Valued Customer"

            try:
                dt_naive = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                st_dt = dt_naive.replace(tzinfo=tz)
            except Exception:
                st_dt = datetime.datetime.now(tz) + datetime.timedelta(hours=2)

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
                            admin_email_html = build_reschedule_admin_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                                contact_phone=contact_phone,
                                customer_email=customer_email,
                            )
                            admin_subject = f"🔄 [Admin Notice] Booking Rescheduled: {service_name} - {name} to {formatted_date} at {formatted_time}"
                            send_gmail_direct_notification(g_creds, admin_notif_email, admin_subject, admin_email_html)

                        # Send tailored copy to Customer
                        if customer_email and "@" in customer_email and customer_email != (admin_notif_email or "").strip():
                            customer_email_html = build_reschedule_customer_email_html(
                                service_name=service_name,
                                formatted_date=formatted_date,
                                formatted_time=formatted_time,
                                name=name,
                                full_location=full_location,
                            )
                            customer_subject = f"🔄 Reschedule Confirmed: Your {service_name} is now on {formatted_date} at {formatted_time}"
                            send_gmail_direct_notification(g_creds, customer_email, customer_subject, customer_email_html)

                    except Exception as e:
                        logger.warning("gcal_reschedule_sync_failed", error=str(e))

            # Send Customer Reschedule Meta Template
            if creds and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                template_name = creds.get("template_reschedule_confirmation") or "booking_confirmationn"
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
                    logger.warning("reschedule_template_send_failed", error=str(e))

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
                    admin_template = creds.get("template_admin_notification") or "admin_notification"
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
                        logger.warning("admin_reschedule_template_failed_trying_text", error=str(e))
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
        return str(row["id"])

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
            return data.get("api_key"), data.get("base_url", "https://api.openai.com/v1")
        return os.getenv("OPENCODE_API_KEY") or None, "https://api.openai.com/v1"

    async def _get_ai_config(self, tenant_id: str) -> dict:
        row = await self.db_pool.fetchrow(
            "SELECT model, temperature, max_tokens, timeout_ms, system_prompt, assistant_name, bot_goal, services_text, response_style, methodology, strict_rules, objection_handling FROM ai_config WHERE tenant_id = $1::uuid",
            tenant_id,
        )
        if row:
            return dict(row)
        return {"model": "gemini-1.5-flash", "temperature": 0.3, "max_tokens": 500, "timeout_ms": 8000, "response_style": "short", "methodology": "dogfooding"}

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
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("scheduled_job_error", error=str(e))

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
                                
                                digest_template = wdata.get("template_admin_daily_digest") or "admin_daily_digest"
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
                    template_name = creds.get("template_appointment_reminder") or "appointment_ramainder"
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
        """Find due scheduled jobs and send WhatsApp messages."""
        due_jobs = await self.db_pool.fetch(
            """SELECT sj.id, sj.tenant_id, sj.job_type, sj.booking_id,
                      b.service, b.start_time, b.end_time, b.notes,
                      c.phone, c.name as contact_name,
                      tc.credential_data as wa_creds
               FROM scheduled_jobs sj
               JOIN bookings b ON b.id = sj.booking_id
               JOIN contacts c ON c.id = b.contact_id
               JOIN tenant_credentials tc ON tc.tenant_id = sj.tenant_id AND tc.provider = 'whatsapp'
               WHERE sj.status = 'pending'
                 AND sj.scheduled_at <= now()
               LIMIT 20""",
        )

        for job in due_jobs:
            try:
                creds = dict(job["wa_creds"])
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
        if isinstance(start, datetime):
            start_str = start.strftime("%A, %d %B at %I:%M %p")
        else:
            start_str = str(start)

        if job["job_type"] == "reminder":
            return (
                f"Hi {name}! ⏰ This is a friendly reminder that you have a *{service}* appointment "
                f"scheduled for *{start_str}*. We look forward to seeing you!"
            )
        elif job["job_type"] == "review_request":
            return (
                f"Hi {name}! We hope your *{service}* went well! 😊 "
                f"We'd love to hear your feedback. Please take a moment to share your experience with us. "
                f"Your feedback helps us serve you better! 🌟"
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
