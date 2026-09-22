import os
import re
import json
import uuid
import asyncio
import bcrypt
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from typing import Optional, Dict, Any, List, Union
import structlog
import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, Query, HTTPException, Request
import database
from dependencies import get_tenant_id, get_caller_context, verify_super_admin, JWT_SECRET
from models import (
    TenantCreate,
    TenantUpdate,
    TenantSettingsUpdate,
    SyncGlobalRulesPayload,
    PartnerTemplatePayload,
    PasswordReset,
    PaymentReminderRequest,
    TenantBillingUpdate,
    AdminDueAlertRequest,
    PushSubscribePayload,
    PushUnsubscribePayload,
    PublicBookingRequest,
    StaffCreateRequest,
    StaffUpdateRequest,
)
import utils
from utils import safe_json_loads
import razorpay_client
from services.crm_service import create_google_calendar_event
from services.whatsapp_service import dispatch_whatsapp_message, dispatch_automated_status_whatsapp
from tasks_service import dispatch_push_notification, VAPID_PUBLIC_KEY
from routers.marketing import execute_meta_template_sync
from routers.settings import update_tenant_settings

router = APIRouter()
logger = structlog.get_logger('crm-api-auth')

GLOBAL_DEFAULT_STRICT_RULES = """1. CONSULTATIVE SALES CLOSER (NOT PASSIVE SUPPORT): Act like a proactive, high-converting WhatsApp sales closer, not a passive customer support desk. Follow the 3-Beat Sales Formula: (1) Answer the customer's query directly and anchor value or relief in sentence 1. (2) If their specific need or pain is unclear, ask 1 diagnostic qualification question. (3) When guiding to a booking, consult, or visit, always provide binary closing choices (e.g. 'morning or evening?', 'tomorrow 11:30 AM or 4:30 PM?') instead of passive 'do you want to book?'.
2. ACTIVE OBJECTION RE-FRAMING: When a customer expresses price resistance ('too expensive') or delay ('will check and let you know'), never accept a dead-end. Reframe the value in 1 sentence and offer a zero-friction micro-step (such as a 5-minute call with the coordinator or a tentative slot hold).
3. EASY INDIAN ENGLISH & NATURAL HUMAN TONE: Reply like an authentic, friendly real person texting on WhatsApp in India using easy Indian English. Avoid stiff corporate jargon, robotic filler ('Certainly!', 'I would be delighted to assist you', 'Please feel free to reach out'), and formal customer service essays.
4. TAMIL & LANGUAGE CONTINUITY: If the customer writes in Tamil (Tamil script or Tanglish), reply 100% in natural Tamil/Tanglish. If the customer communicates in another language (Hindi, Telugu, etc.), detect and save their language preference and consistently reply in that language for all future messages.
5. GOOGLE CALENDAR ACCURACY & REAL-TIME SLOTS: Check live availability from Google Calendar before confirming or proposing appointments. Never double-book or falsely claim days are fully booked when open slots exist.
6. FACTUAL PRICING & SERVICES: Only mention services and prices exactly as they appear in the business knowledge base. Never invent unlisted services or treatments.
7. CONVERSATIONAL WHATSAPP BREVITY (NO ESSAYS): Keep responses to 2 to 3 natural sentences (25 to 45 words max). Absolutely zero marketing essays, bullet points, hyphens, dashes, asterisks, or emojis.
8. CONTEXTUAL 2-HOUR & 20-HOUR RECOVERY FOLLOWUPS: Automated followups must read the previous conversation exchanges to understand what was actually being discussed and continue that specific topic instead of sending generic check-ins or forced canned slots."""

@router.get("/admin/global-rules")
async def get_admin_global_rules(admin_user: dict = Depends(verify_super_admin)):
    """Retrieve global platform strict rules, Google Calendar scheduling policy, and tenant adoption statistics."""
    async with database.db_pool.acquire() as conn:
        total_tenants = await conn.fetchval("SELECT count(*) FROM tenants") or 0
        tenants_with_rules = await conn.fetchval("SELECT count(*) FROM ai_config WHERE strict_rules IS NOT NULL AND length(strict_rules) > 10") or 0
        gcal_connected_count = await conn.fetchval("SELECT count(*) FROM tenant_credentials WHERE provider = 'google_calendar' AND is_active = true") or 0
        
        # Standard platform operating hours defaults
        default_open = "09:00"
        default_close = "20:00"

        return {
            "status": "active",
            "strict_rules": GLOBAL_DEFAULT_STRICT_RULES,
            "total_tenants": total_tenants,
            "tenants_with_rules": tenants_with_rules,
            "gcal_connected_tenants": gcal_connected_count,
            "opening_time": default_open,
            "closing_time": default_close,
            "rules_summary": [
                {
                    "title": "Human-Like Easy Indian English & Natural WhatsApp Chat",
                    "description": "Replies sound like a warm, helpful real human texting in easy Indian English. Eliminates generic corporate robotic tone and bot clichés.",
                    "status": "Enforced Globally"
                },
                {
                    "title": "Tamil & Multilingual Preference Memory",
                    "description": "Full Tamil (script and Tanglish) fluency. Customer language preference is automatically detected, saved in customer records, and consistently maintained across all interactions.",
                    "status": "Enforced Globally"
                },
                {
                    "title": "Real-Time Google Calendar Availability & Conflict Prevention",
                    "description": "Before proposing or confirming an appointment, the AI checks live Free/Busy availability from the organization's Google Calendar and CRM bookings. Proposes and books exclusively during open free hours (09:00 AM - 08:00 PM). Never invents, hallucinates, or quotes wrong/occupied slot data.",
                    "status": "Enforced Globally"
                },
                {
                    "title": "Context-Aware 2-Hour Recovery Follow-Up",
                    "description": "Followups read the previous 3-4 conversation exchanges to directly continue the specific discussion topic (symptoms, pricing, timings) with short, clear, non-pushy messages.",
                    "status": "Enforced Globally"
                },
                {
                    "title": "12-Hour Time Format Directive",
                    "description": "All dates and appointment times are quoted in 12-hour format with AM/PM (e.g. 10:00 AM, 06:30 PM). Military / 24-hour time is strictly forbidden.",
                    "status": "Enforced Globally"
                }
            ]
        }


@router.post("/admin/global-rules")
@router.post("/admin/sync-global-rules")
async def sync_admin_global_rules(
    payload: Optional[SyncGlobalRulesPayload] = None,
    admin_user: dict = Depends(verify_super_admin)
):
    """Each client organization independently and autonomously manages its own AI instructions, prompt, and strict rules."""
    return {
        "status": "success",
        "message": "Global AI rule override is disabled. Each tenant organization autonomously follows its own AI instructions.",
        "updated_count": 0
    }


@router.get("/admin/partner-templates")
@router.get("/api/v1/crm/admin/partner-templates")
async def list_partner_templates(admin_user: dict = Depends(verify_super_admin)):
    """Retrieve all configured partner agency white-label templates."""
    async with database.db_pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS partner_agency_templates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                partner_name TEXT NOT NULL UNIQUE,
                partner_share_pct NUMERIC DEFAULT 50,
                owner_share_pct NUMERIC DEFAULT 50,
                custom_domain TEXT,
                brand_name TEXT,
                brand_logo_url TEXT,
                brand_favicon_url TEXT,
                brand_primary_color TEXT DEFAULT '#7C3AED',
                brand_support_email TEXT,
                brand_support_phone TEXT,
                hide_platform_branding BOOLEAN DEFAULT true,
                is_default BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            )
        """)
        rows = await conn.fetch(
            "SELECT * FROM partner_agency_templates ORDER BY is_default DESC, updated_at DESC"
        )
    return [
        {
            "id": str(r["id"]),
            "partner_name": r["partner_name"],
            "partner_share_pct": float(r["partner_share_pct"] or 50.0),
            "owner_share_pct": float(r["owner_share_pct"] or 50.0),
            "custom_domain": r["custom_domain"] or "",
            "brand_name": r["brand_name"] or "",
            "brand_logo_url": r["brand_logo_url"] or "",
            "brand_favicon_url": r["brand_favicon_url"] or "",
            "brand_primary_color": r["brand_primary_color"] or "#7C3AED",
            "brand_support_email": r["brand_support_email"] or "",
            "brand_support_phone": r["brand_support_phone"] or "",
            "hide_platform_branding": bool(r["hide_platform_branding"]),
            "is_default": bool(r["is_default"]),
            "created_at": r["created_at"].isoformat() if r["created_at"] else "",
            "updated_at": r["updated_at"].isoformat() if r["updated_at"] else "",
        }
        for r in rows
    ]


@router.post("/admin/partner-templates")
@router.post("/api/v1/crm/admin/partner-templates")
async def save_partner_template(payload: PartnerTemplatePayload, admin_user: dict = Depends(verify_super_admin)):
    """Save or update a partner agency's reusable white-label preset."""
    p_name = payload.partner_name.strip()
    if not p_name:
        raise HTTPException(400, "Partner agency name is required")
        
    c_domain = (payload.custom_domain or "").strip().lower()
    b_name = (payload.brand_name or p_name).strip()
    
    async with database.db_pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS partner_agency_templates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                partner_name TEXT NOT NULL UNIQUE,
                partner_share_pct NUMERIC DEFAULT 50,
                owner_share_pct NUMERIC DEFAULT 50,
                custom_domain TEXT,
                brand_name TEXT,
                brand_logo_url TEXT,
                brand_favicon_url TEXT,
                brand_primary_color TEXT DEFAULT '#7C3AED',
                brand_support_email TEXT,
                brand_support_phone TEXT,
                hide_platform_branding BOOLEAN DEFAULT true,
                is_default BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            )
        """)
        
        # If is_default is true, unmark previous default
        if payload.is_default:
            await conn.execute("UPDATE partner_agency_templates SET is_default = false WHERE partner_name != $1", p_name)
            
        row = await conn.fetchrow(
            """
            INSERT INTO partner_agency_templates (
                partner_name, partner_share_pct, owner_share_pct, custom_domain, brand_name,
                brand_logo_url, brand_favicon_url, brand_primary_color, brand_support_email,
                brand_support_phone, hide_platform_branding, is_default, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
            ON CONFLICT (partner_name) DO UPDATE SET
                partner_share_pct = EXCLUDED.partner_share_pct,
                owner_share_pct = EXCLUDED.owner_share_pct,
                custom_domain = EXCLUDED.custom_domain,
                brand_name = EXCLUDED.brand_name,
                brand_logo_url = EXCLUDED.brand_logo_url,
                brand_favicon_url = EXCLUDED.brand_favicon_url,
                brand_primary_color = EXCLUDED.brand_primary_color,
                brand_support_email = EXCLUDED.brand_support_email,
                brand_support_phone = EXCLUDED.brand_support_phone,
                hide_platform_branding = EXCLUDED.hide_platform_branding,
                is_default = EXCLUDED.is_default,
                updated_at = now()
            RETURNING *
            """,
            p_name,
            float(payload.partner_share_pct or 50.0),
            float(payload.owner_share_pct or 50.0),
            c_domain,
            b_name,
            (payload.brand_logo_url or "").strip(),
            (payload.brand_favicon_url or "").strip(),
            (payload.brand_primary_color or "#7C3AED").strip(),
            (payload.brand_support_email or "").strip(),
            (payload.brand_support_phone or "").strip(),
            bool(payload.hide_platform_branding),
            bool(payload.is_default),
        )
        
    return {
        "status": "success",
        "message": f"Partner agency template '{p_name}' saved successfully",
        "template": {
            "id": str(row["id"]),
            "partner_name": row["partner_name"],
            "partner_share_pct": float(row["partner_share_pct"] or 50.0),
            "owner_share_pct": float(row["owner_share_pct"] or 50.0),
            "custom_domain": row["custom_domain"] or "",
            "brand_name": row["brand_name"] or "",
            "brand_logo_url": row["brand_logo_url"] or "",
            "brand_favicon_url": row["brand_favicon_url"] or "",
            "brand_primary_color": row["brand_primary_color"] or "#7C3AED",
            "brand_support_email": row["brand_support_email"] or "",
            "brand_support_phone": row["brand_support_phone"] or "",
            "hide_platform_branding": bool(row["hide_platform_branding"]),
            "is_default": bool(row["is_default"]),
        }
    }


@router.delete("/admin/partner-templates/{partner_name}")
@router.delete("/api/v1/crm/admin/partner-templates/{partner_name}")
async def delete_partner_template(partner_name: str, admin_user: dict = Depends(verify_super_admin)):
    """Delete a partner agency template."""
    async with database.db_pool.acquire() as conn:
        await conn.execute("DELETE FROM partner_agency_templates WHERE partner_name = $1", partner_name)
    return {"status": "success", "deleted_partner": partner_name}


@router.get("/admin/tenants")
@router.get("/api/v1/crm/admin/tenants")
async def list_admin_tenants(admin_user: dict = Depends(verify_super_admin)):
    """List all client tenants with metadata, stats, billing, and primary admin email."""
    async with database.db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT 
                t.id, t.name, t.slug, t.is_active, t.plan, t.settings, t.created_at,
                t.razorpay_customer_id, t.razorpay_subscription_id, t.razorpay_short_url,
                t.org_lifecycle_stage, t.subscription_status, t.next_charge_at,
                t.last_payment_status, t.last_charge_at,
                (SELECT email FROM users WHERE tenant_id = t.id ORDER BY (role = 'admin') DESC, (role = 'super_admin') DESC, created_at ASC LIMIT 1) as admin_email,
                (SELECT COUNT(*) FROM contacts WHERE tenant_id = t.id) as contact_count,
                (SELECT COUNT(*) FROM conversations WHERE tenant_id = t.id) as conversation_count,
                (SELECT COUNT(*) FROM messages WHERE tenant_id = t.id) as message_count,
                (SELECT is_active FROM tenant_credentials WHERE tenant_id = t.id AND provider = 'whatsapp' LIMIT 1) as whatsapp_configured,
                (SELECT is_active FROM tenant_credentials WHERE tenant_id = t.id AND provider = 'google_calendar' LIMIT 1) as google_calendar_configured,
                (SELECT COUNT(*) FROM customers WHERE tenant_id = t.id AND (call_status ILIKE '%missed%' OR id IN (SELECT customer_id FROM customer_notes WHERE note_text ILIKE '%missed%'))) as missed_call_count,
                (SELECT phone FROM customers WHERE tenant_id = t.id AND (call_status ILIKE '%missed%' OR id IN (SELECT customer_id FROM customer_notes WHERE note_text ILIKE '%missed%')) ORDER BY created_at DESC LIMIT 1) as last_missed_caller,
                (SELECT created_at FROM customers WHERE tenant_id = t.id AND (call_status ILIKE '%missed%' OR id IN (SELECT customer_id FROM customer_notes WHERE note_text ILIKE '%missed%')) ORDER BY created_at DESC LIMIT 1) as last_missed_at
            FROM tenants t
            ORDER BY t.created_at DESC
            """
        )
    result = []
    for r in rows:
        cfg = r["settings"] or {}
        if isinstance(cfg, str):
            try: cfg = json.loads(cfg)
            except: cfg = {}
        monthly_price = float(cfg.get("monthly_price", 999.0 if (r["plan"] or "").lower() == "starter" else (9999.0 if (r["plan"] or "").lower() == "enterprise" else 2630.0)))
        billing_day = int(cfg.get("billing_cycle_day", 1))
        razorpay_sub_id = r["razorpay_subscription_id"] or cfg.get("razorpay_subscription_id", "")
        next_renewal = r["next_charge_at"].strftime("%d %b %Y") if r["next_charge_at"] else cfg.get("next_renewal_date", f"Day {billing_day} of every month")
        admin_phone = cfg.get("admin_whatsapp_number", "")
        sha_token = hashlib.sha256(f"{str(r['id'])}:{JWT_SECRET}:missed-call".encode()).hexdigest()[:16]
        m_token = cfg.get("missed_call_token") or sha_token
        m_tpl = cfg.get("template_missed_call") or "missed_call_followup"
        result.append({
            "id": str(r["id"]),
            "name": r["name"],
            "slug": r["slug"],
            "status": "active" if r["is_active"] else "inactive",
            "plan": r["plan"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else "",
            "admin_email": r["admin_email"] or "",
            "admin_whatsapp_number": admin_phone,
            "contact_count": int(r["contact_count"] or 0),
            "conversation_count": int(r["conversation_count"] or 0),
            "message_count": int(r["message_count"] or 0),
            "whatsapp_configured": bool(r["whatsapp_configured"]),
            "google_calendar_configured": bool(r["google_calendar_configured"]),
            "monthly_price": monthly_price,
            "billing_cycle_day": billing_day,
            "razorpay_customer_id": r["razorpay_customer_id"] or "",
            "razorpay_subscription_id": razorpay_sub_id,
            "razorpay_short_url": r["razorpay_short_url"] or "",
            "org_lifecycle_stage": r["org_lifecycle_stage"] or "setup",
            "subscription_status": r["subscription_status"] or "not_started",
            "next_charge_at": r["next_charge_at"].isoformat() if r["next_charge_at"] else None,
            "last_payment_status": r["last_payment_status"] or "",
            "last_charge_at": r["last_charge_at"].isoformat() if r["last_charge_at"] else None,
            "next_renewal_date": next_renewal,
            "billing_method": "Razorpay Auto-Debit",
            "custom_domain": (cfg.get("custom_domain") or "").strip().lower(),
            "brand_name": (cfg.get("brand_name") or "").strip(),
            "partner_name": (cfg.get("partner_name") or "").strip(),
            "sales_channel": (cfg.get("sales_channel") or "direct").strip(),
            "partner_share_pct": float(cfg.get("partner_share_pct") or 0.0),
            "owner_share_pct": float(cfg.get("owner_share_pct") or 100.0),
            "missed_call_webhook_token": sha_token,
            "missed_call_token": m_token,
            "template_missed_call": m_tpl,
            "missed_call_count": int(r["missed_call_count"] or 0),
            "last_missed_caller": r["last_missed_caller"] or "",
            "last_missed_at": r["last_missed_at"].isoformat() if r["last_missed_at"] else None,
        })
    return result


@router.get("/admin/missed-calls")
@router.get("/api/v1/crm/admin/missed-calls")
async def list_admin_missed_calls(
    tenant_id: Optional[str] = Query(None),
    limit: int = Query(25),
    admin_user: dict = Depends(verify_super_admin)
):
    """List recently captured missed calls across all tenants (or filtered by tenant_id)."""
    async with database.db_pool.acquire() as conn:
        if tenant_id:
            rows = await conn.fetch(
                """
                SELECT c.id, c.tenant_id, t.name as tenant_name, t.slug as tenant_slug,
                       c.name, c.phone, c.status, c.call_status, c.created_at,
                       (SELECT body FROM messages m WHERE m.tenant_id = c.tenant_id AND m.direction = 'outbound' ORDER BY m.created_at DESC LIMIT 1) as last_outbound_msg
                FROM customers c
                JOIN tenants t ON t.id = c.tenant_id
                WHERE c.tenant_id = $1::uuid AND (c.call_status ILIKE '%missed%' OR c.id IN (SELECT customer_id FROM customer_notes WHERE note_text ILIKE '%missed%'))
                ORDER BY c.created_at DESC
                LIMIT $2
                """,
                tenant_id, limit
            )
        else:
            rows = await conn.fetch(
                """
                SELECT c.id, c.tenant_id, t.name as tenant_name, t.slug as tenant_slug,
                       c.name, c.phone, c.status, c.call_status, c.created_at,
                       (SELECT body FROM messages m WHERE m.tenant_id = c.tenant_id AND m.direction = 'outbound' ORDER BY m.created_at DESC LIMIT 1) as last_outbound_msg
                FROM customers c
                JOIN tenants t ON t.id = c.tenant_id
                WHERE c.call_status ILIKE '%missed%' OR c.id IN (SELECT customer_id FROM customer_notes WHERE note_text ILIKE '%missed%')
                ORDER BY c.created_at DESC
                LIMIT $1
                """,
                limit
            )
        return [
            {
                "id": str(r["id"]),
                "tenant_id": str(r["tenant_id"]),
                "tenant_name": r["tenant_name"],
                "tenant_slug": r["tenant_slug"],
                "caller_name": r["name"],
                "caller_phone": r["phone"],
                "call_status": r["call_status"] or "missed",
                "created_at": r["created_at"].isoformat() if r["created_at"] else "",
                "last_outbound_msg": r["last_outbound_msg"] or ""
            }
            for r in rows
        ]


@router.post("/admin/tenants")
async def create_admin_tenant(payload: TenantCreate, admin_user: dict = Depends(verify_super_admin)):
    """
    Onboard a brand new client:
    1. Create tenant record with billing settings
    2. Create tenant admin user with bcrypt password
    3. Save WhatsApp credentials, Meta templates & Location text
    4. Save modular AI system prompt (assistantName, botGoal, servicesText)
    5. Save Google Calendar & Email credentials (if provided)
    """
    slug = payload.slug.strip().lower().replace(" ", "-")
    async with database.db_pool.acquire() as conn:
        # Check slug collision
        existing = await conn.fetchval("SELECT id FROM tenants WHERE slug = $1", slug)
        if existing:
            raise HTTPException(400, f"Organization identifier (slug) '{slug}' is already in use")

        # Check email collision
        existing_email = await conn.fetchval("SELECT id FROM users WHERE email = $1", payload.admin_email.strip())
        if existing_email:
            raise HTTPException(400, f"Admin email '{payload.admin_email}' is already registered")

        tenant_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())

        password_hash = bcrypt.hashpw(payload.admin_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Compile AI System Prompt if modular fields provided
        assistant_name = payload.assistant_name.strip() if payload.assistant_name else "Assistant"
        bot_goal = payload.bot_goal.strip() if payload.bot_goal else ""
        services_text = payload.services_text.strip() if payload.services_text else ""
        full_location = payload.full_location_text.strip() if payload.full_location_text else ""

        if bot_goal or services_text or full_location:
            parts = [
                f"You are {assistant_name}, the official AI WhatsApp Assistant for {payload.name.strip()}.",
                f"Your primary goal is: {bot_goal}."
            ]
            if services_text:
                parts.append(f"### SERVICES, PRICING & BUSINESS INFORMATION\n{services_text}")
            if full_location:
                parts.append(f"### CLINIC / BUSINESS LOCATION\n{full_location}\n(When an appointment is confirmed, always share this exact location and directions warmly with the customer).")
            parts.append(
                "### CONVERSATION GUIDELINES & WHATSAPP RULES\n"
                "- Talk like a real person on WhatsApp: natural, flowing, empathetic, and concise.\n"
                "- Avoid robotic corporate scripts or overwhelming walls of text. Keep responses to 2-3 short conversational sentences.\n"
                "- React to what the user actually says in the moment rather than following a rigid fixed sequence.\n"
                "- Ask one clear question at a time to qualify their needs and guide them towards booking.\n"
                "- Reply in the same language the customer uses (English, Tamil, Hindi, etc.)."
            )

            # Industry-specific protocol and safety guardrails
            ind_choice = (payload.industry or "clinic").strip().lower()
            if ind_choice in ("clinic", "healthcare", "dental", "medical"):
                parts.append(
                    "### MEDICAL & CLINIC PROTOCOL\n"
                    "- Prioritize patient safety, comfort, and confidentiality.\n"
                    "- Never diagnose conditions or prescribe medications over chat.\n"
                    "- In case of severe emergency (chest pain, acute breathlessness, severe trauma), immediately advise the patient to call emergency services (108) or visit the nearest emergency room.\n"
                    "- Encourage booking an in-person consultation with the doctor for thorough diagnosis."
                )
            elif ind_choice in ("real_estate", "realestate"):
                parts.append(
                    "### REAL ESTATE CONSULTATION PROTOCOL\n"
                    "- Qualify buyer preferences (configuration, budget, preferred locality, investment vs self-use).\n"
                    "- Highlight verified property amenities, RERA approvals, and location advantages.\n"
                    "- Guide the client to schedule an exclusive on-site property tour with our relationship manager."
                )
            elif ind_choice in ("salon_spa", "salon", "spa"):
                parts.append(
                    "### SALON & WELLNESS PROTOCOL\n"
                    "- Recommend personalized grooming, hair, skin, and spa treatments tailored to client requirements.\n"
                    "- Inquire about stylist preference and communicate treatment duration clearly."
                )
            elif ind_choice in ("education", "coaching"):
                parts.append(
                    "### ACADEMIC & ADMISSIONS PROTOCOL\n"
                    "- Understand student academic goals, grade, and competitive exam targets.\n"
                    "- Highlight batch schedule options, faculty expertise, and free demo class bookings."
                )
            elif ind_choice in ("automobile", "automotive"):
                parts.append(
                    "### AUTOMOTIVE SERVICE PROTOCOL\n"
                    "- Identify vehicle make/model and determine if service is periodic maintenance, repair, or new test drive.\n"
                    "- Offer express service appointment booking with transparent estimate communication."
                )
            elif ind_choice in ("consulting", "legal"):
                parts.append(
                    "### PROFESSIONAL ADVISORY PROTOCOL\n"
                    "- Maintain absolute client confidentiality and professional clarity.\n"
                    "- Clarify advisory scope and guide client to schedule a strategic consultation session."
                )

            compiled_prompt = "\n\n".join(parts)
        else:
            compiled_prompt = payload.ai_prompt.strip() or f"You are {assistant_name}, the official WhatsApp assistant for {payload.name.strip()}. Assist customers politely and accurately."

        # Prepare Billing Settings
        m_price = payload.monthly_price if payload.monthly_price is not None else (999.0 if (payload.plan or "").lower() == "starter" else (9999.0 if (payload.plan or "").lower() == "enterprise" else 2630.0))
        b_day = payload.billing_cycle_day or 1
        ind = (payload.industry or "clinic").strip().lower()
        admin_display_name = (payload.admin_name or "").strip() or payload.name.strip()
        t_settings = {
            "admin_name": admin_display_name,
            "industry": ind,
            "monthly_price": float(m_price),
            "billing_cycle_day": int(b_day),
            "razorpay_subscription_id": (payload.razorpay_subscription_id or "").strip(),
            "next_renewal_date": f"Day {b_day} of every month",
            "country_code": "+91",
            "currency": "INR",
            "currency_symbol": "₹",
            "allow_text_fallback": False,
            "disable_template_text_fallback": True,
            "template_booking_confirmation": payload.template_booking_confirmation.strip() if payload.template_booking_confirmation else "booking_confirmationn",
            "template_booking_reschedule_confirmation": payload.template_reschedule_confirmation.strip() if payload.template_reschedule_confirmation else "booking_reschedule_confirmation",
            "template_cancellation_confirmation": payload.template_cancellation_confirmation.strip() if payload.template_cancellation_confirmation else "cancellation_confirmation",
            "template_appointment_reminder": "appointment_ramainder",
            "template_reschedule_nudge": "reschedule_nudge",
            "template_review_request": "review_request",
            "template_admin_notification": payload.template_admin_notification.strip() if payload.template_admin_notification else "admin_notification",
            "template_admin_reschedule_notice": payload.template_admin_reschedule_notice.strip() if payload.template_admin_reschedule_notice else "admin_reschedule_notice",
            "template_admin_cancellation_notice": payload.template_admin_cancellation_notice.strip() if payload.template_admin_cancellation_notice else "admin_cancellation_notice",
            "template_admin_human_request": payload.template_admin_human_request.strip() if payload.template_admin_human_request else "admin_human_request",
            "template_admin_daily_digest": "admin_daily_digest",
            "template_admin_appointment_reminder": "admin_appointment_reminder",
            "template_client_followup_checkin": "client_followup_checkin",
            "taxonomy": {
                "staff_label": "Doctor / Consultant" if ind == "clinic" else "Staff Member",
                "client_label": "Patient" if ind == "clinic" else "Customer",
                "client_plural": "Patients" if ind == "clinic" else "Customers",
                "requirement_label": "Health Concern" if ind == "clinic" else "Requirement",
                "event_label": "Appointment" if ind == "clinic" else "Meeting",
                "booking_cta": "+ Book Appointment",
                "doctor_presets": [],
                "staff_presets": [],
            },
        }

        # Transactional insert
        try:
            async with conn.transaction():
                # 1. Tenant
                await conn.execute(
                    "INSERT INTO tenants (id, name, slug, is_active, plan, settings) VALUES ($1::uuid, $2, $3, true, $4, $5::jsonb)",
                    tenant_id, payload.name.strip(), slug, payload.plan or "pro", json.dumps(t_settings)
                )

                # 2. Admin User
                await conn.execute(
                    "INSERT INTO users (id, tenant_id, email, password_hash, role, display_name) VALUES ($1::uuid, $2::uuid, $3, $4, 'admin', $5)",
                    user_id, tenant_id, payload.admin_email.strip(), password_hash, admin_display_name
                )

                # 3. WhatsApp Credentials & Meta Templates
                cred_dict = {
                    "phone_number_id": payload.meta_phone_id.strip() if payload.meta_phone_id else "",
                    "waba_id": payload.meta_waba_id.strip() if payload.meta_waba_id else "",
                    "access_token": payload.meta_access_token.strip() if payload.meta_access_token else "",
                    "app_secret": payload.meta_app_secret.strip() if payload.meta_app_secret else "",
                    "verify_token": payload.verify_token.strip() if payload.verify_token else (slug + "_verify_token"),
                    "full_location_text": full_location,
                    "admin_whatsapp_number": payload.admin_whatsapp_number.strip() if payload.admin_whatsapp_number else "",
                    "allow_text_fallback": False,
                    "disable_template_text_fallback": True,
                    "template_booking_confirmation": payload.template_booking_confirmation.strip() if payload.template_booking_confirmation else "booking_confirmationn",
                    "template_booking_reschedule_confirmation": payload.template_reschedule_confirmation.strip() if payload.template_reschedule_confirmation else "booking_reschedule_confirmation",
                    "template_cancellation_confirmation": payload.template_cancellation_confirmation.strip() if payload.template_cancellation_confirmation else "cancellation_confirmation",
                    "template_appointment_reminder": "appointment_ramainder",
                    "template_reschedule_nudge": "reschedule_nudge",
                    "template_review_request": "review_request",
                    "template_admin_notification": payload.template_admin_notification.strip() if payload.template_admin_notification else "admin_notification",
                    "template_admin_reschedule_notice": payload.template_admin_reschedule_notice.strip() if payload.template_admin_reschedule_notice else "admin_reschedule_notice",
                    "template_admin_cancellation_notice": payload.template_admin_cancellation_notice.strip() if payload.template_admin_cancellation_notice else "admin_cancellation_notice",
                    "template_admin_human_request": payload.template_admin_human_request.strip() if payload.template_admin_human_request else "admin_human_request",
                    "template_admin_daily_digest": "admin_daily_digest",
                    "template_client_followup_checkin": "client_followup_checkin",
                }
                await conn.execute(
                    "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'whatsapp', $3::jsonb, true)",
                    str(uuid.uuid4()), tenant_id, json.dumps(cred_dict)
                )

                # 4. AI Config (Modular + Compiled + Global Strict Rules)
                await conn.execute(
                    """INSERT INTO ai_config (tenant_id, model, system_prompt, assistant_name, bot_goal, services_text, strict_rules, response_style, methodology, temperature, max_tokens) 
                       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, 'short', 'dogfooding', 0.3, 500)""",
                    tenant_id, payload.ai_model or "gemini-1.5-flash", compiled_prompt, assistant_name, bot_goal, services_text, GLOBAL_DEFAULT_STRICT_RULES
                )

                # 5. Customer Model API Keys (Gemini, Groq, OpenCode)
                if payload.gemini_api_key and payload.gemini_api_key.strip():
                    gem_cred = {"api_key": payload.gemini_api_key.strip()}
                    await conn.execute(
                        "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'gemini', $3::jsonb, true)",
                        str(uuid.uuid4()), tenant_id, json.dumps(gem_cred)
                    )

                if payload.groq_api_key and payload.groq_api_key.strip():
                    groq_cred = {"api_key": payload.groq_api_key.strip()}
                    await conn.execute(
                        "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'groq', $3::jsonb, true)",
                        str(uuid.uuid4()), tenant_id, json.dumps(groq_cred)
                    )

                if payload.opencode_api_key and payload.opencode_api_key.strip():
                    opencode_cred = {
                        "api_key": payload.opencode_api_key.strip(),
                        "base_url": payload.opencode_base_url.strip() if payload.opencode_base_url else "https://api.openai.com/v1"
                    }
                    await conn.execute(
                        "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'opencode', $3::jsonb, true)",
                        str(uuid.uuid4()), tenant_id, json.dumps(opencode_cred)
                    )

                # 6. Google Calendar & Email Sync Credentials
                if payload.google_client_id or payload.google_refresh_token:
                    g_cred_dict = {
                        "client_id": payload.google_client_id.strip() if payload.google_client_id else "",
                        "client_secret": payload.google_client_secret.strip() if payload.google_client_secret else "",
                        "refresh_token": payload.google_refresh_token.strip() if payload.google_refresh_token else "",
                        "calendar_id": payload.google_calendar_id.strip() if payload.google_calendar_id else "primary",
                        "notification_email": payload.notification_email.strip() if payload.notification_email else payload.admin_email.strip(),
                    }
                    await conn.execute(
                        "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'google_calendar', $3::jsonb, true)",
                        str(uuid.uuid4()), tenant_id, json.dumps(g_cred_dict)
                    )
        except Exception as e:
            logger.error(f"Error provisioning client tenant: {e}")
            raise HTTPException(400, f"Failed to provision client organization: {str(e)}")

    # Auto-provision Meta templates for new tenant if WhatsApp credentials provided
    if payload.meta_waba_id and payload.meta_access_token:
        try:
            sync_res = await execute_meta_template_sync(tenant_id, database.db_pool)
            logger.info("tenant_onboarding_meta_templates_synced", tenant_id=tenant_id, total_required=sync_res.get("total_required"))
        except Exception as st_err:
            logger.warning("tenant_onboarding_meta_template_sync_warn", tenant_id=tenant_id, error=str(st_err))

    return {
        "id": tenant_id,
        "name": payload.name.strip(),
        "slug": slug,
        "admin_email": payload.admin_email.strip(),
        "webhook_url": f"{utils.APP_BASE_URL}/webhooks/whatsapp/{slug}",
        "verify_token": payload.verify_token.strip() or (slug + "_verify_token"),
        "login_url": f"{utils.APP_BASE_URL}/login",
        "status": "active"
    }


@router.get("/admin/tenants/{tenant_id}")
async def get_admin_tenant_details(tenant_id: str, admin_user: dict = Depends(verify_super_admin)):
    """Retrieve full details of a specific client including credentials and AI config."""
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT * FROM tenants WHERE id = $1::uuid", tenant_id)
        if not tenant:
            raise HTTPException(404, "Client not found")

        tenant_admin_user = await conn.fetchrow("SELECT email, role, display_name FROM users WHERE tenant_id = $1::uuid AND role = 'admin' LIMIT 1", tenant_id)
        creds = await conn.fetchrow("SELECT credential_data, is_active FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' LIMIT 1", tenant_id)
        gemini_creds = await conn.fetchrow("SELECT credential_data, is_active FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'gemini' LIMIT 1", tenant_id)
        groq_creds = await conn.fetchrow("SELECT credential_data, is_active FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'groq' LIMIT 1", tenant_id)
        opencode_creds = await conn.fetchrow("SELECT credential_data, is_active FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'opencode' LIMIT 1", tenant_id)
        ai_cfg = await conn.fetchrow("SELECT * FROM ai_config WHERE tenant_id = $1::uuid LIMIT 1", tenant_id)

        t_settings = tenant["settings"] if tenant and tenant["settings"] else {}
        if isinstance(t_settings, str):
            try: t_settings = json.loads(t_settings)
            except: t_settings = {}
        admin_display = tenant_admin_user["display_name"] if tenant_admin_user and tenant_admin_user["display_name"] else t_settings.get("admin_name", "")

        cred_data = {}
        if creds and creds["credential_data"]:
            cd = creds["credential_data"]
            if isinstance(cd, str):
                try: cd = json.loads(cd)
                except: cd = {}
            cred_data = dict(cd)

        has_gemini_key = bool(gemini_creds and gemini_creds["credential_data"])
        has_groq_key = bool(groq_creds and groq_creds["credential_data"])
        has_opencode_key = bool(opencode_creds and opencode_creds["credential_data"])

    return {
        "id": str(tenant["id"]),
        "name": tenant["name"],
        "slug": tenant["slug"],
        "status": "active" if tenant["is_active"] else "inactive",
        "plan": tenant["plan"],
        "created_at": tenant["created_at"].isoformat() if tenant["created_at"] else "",
        "admin_name": admin_display,
        "admin_email": tenant_admin_user["email"] if tenant_admin_user else "",
        "webhook_url": f"http://168.138.172.197/webhooks/whatsapp/{tenant['slug']}",
        "credentials": {
            "phone_number_id": cred_data.get("phone_number_id", ""),
            "verify_token": cred_data.get("verify_token", ""),
            "has_access_token": bool(cred_data.get("access_token")),
            "has_app_secret": bool(cred_data.get("app_secret")),
            "has_gemini_key": has_gemini_key,
            "has_groq_key": has_groq_key,
            "has_opencode_key": has_opencode_key,
            "full_location_text": cred_data.get("full_location_text", ""),
            "admin_whatsapp_number": cred_data.get("admin_whatsapp_number", ""),
            "template_booking_confirmation": cred_data.get("template_booking_confirmation", "booking_confirmationn"),
            "template_admin_notification": cred_data.get("template_admin_notification", "admin_notification"),
            "template_admin_human_request": cred_data.get("template_admin_human_request", "admin_human_request"),
            "template_cancellation_confirmation": cred_data.get("template_cancellation_confirmation", "cancellation_confirmation"),
            "template_admin_cancellation_notice": cred_data.get("template_admin_cancellation_notice", "admin_cancellation_notice"),
            "template_reschedule_confirmation": cred_data.get("template_reschedule_confirmation", "booking_reschedule_confirmation"),
            "template_admin_reschedule_notice": cred_data.get("template_admin_reschedule_notice", "admin_reschedule_notice"),
        },
        "ai_config": {
            "model": ai_cfg["model"] if ai_cfg else "gemini-1.5-flash",
            "assistant_name": ai_cfg.get("assistant_name", "") if (ai_cfg and "assistant_name" in ai_cfg) else "Assistant",
            "bot_goal": ai_cfg.get("bot_goal", "") if (ai_cfg and "bot_goal" in ai_cfg) else "",
            "services_text": ai_cfg.get("services_text", "") if (ai_cfg and "services_text" in ai_cfg) else "",
            "system_prompt": ai_cfg["system_prompt"] if ai_cfg else "",
            "temperature": float(ai_cfg["temperature"]) if ai_cfg else 0.3,
            "max_tokens": int(ai_cfg["max_tokens"]) if ai_cfg else 500,
        },
        "whitelabel": {
            "custom_domain": t_settings.get("custom_domain", ""),
            "brand_name": t_settings.get("brand_name", "") or tenant["name"],
            "brand_logo_url": t_settings.get("brand_logo_url", ""),
            "brand_favicon_url": t_settings.get("brand_favicon_url", ""),
            "brand_primary_color": t_settings.get("brand_primary_color", "#059669"),
            "brand_support_email": t_settings.get("brand_support_email", ""),
            "brand_support_phone": t_settings.get("brand_support_phone", ""),
            "hide_platform_branding": t_settings.get("hide_platform_branding", False),
            "sales_channel": t_settings.get("sales_channel", "direct"),
            "partner_name": t_settings.get("partner_name", ""),
            "partner_share_pct": float(t_settings.get("partner_share_pct") or 0.0),
            "owner_share_pct": float(t_settings.get("owner_share_pct") or 100.0),
        }
    }


@router.post("/admin/tenants/{tenant_id}/reset-password")
async def reset_admin_tenant_password(tenant_id: str, payload: PasswordReset, admin_user: dict = Depends(verify_super_admin)):
    """Reset the admin password for a client organization."""
    if not payload.new_password or len(payload.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    # Direct bcrypt hash to match auth-service format and avoid passlib wrap bug
    password_hash = bcrypt.hashpw(payload.new_password.encode("utf-8")[:72], bcrypt.gensalt(12)).decode("utf-8")

    async with database.db_pool.acquire() as conn:
        tenant_row = await conn.fetchrow(
            """SELECT t.id, t.name, t.slug,
                      (SELECT email FROM users WHERE tenant_id = t.id ORDER BY (role = 'admin') DESC, (role = 'super_admin') DESC, created_at ASC LIMIT 1) as admin_email
               FROM tenants t WHERE t.id = $1::uuid""",
            tenant_id
        )
        if not tenant_row:
            raise HTTPException(404, "Client organization not found")

        # 1. Update only the primary admin user for this tenant
        target_email = tenant_row["admin_email"]
        if target_email:
            result = await conn.execute(
                "UPDATE users SET password_hash = $1 WHERE tenant_id = $2::uuid AND email = $3",
                password_hash, tenant_id, target_email
            )
        else:
            result = await conn.execute(
                "UPDATE users SET password_hash = $1 WHERE tenant_id = $2::uuid AND (role = 'admin' OR role = 'super_admin')",
                password_hash, tenant_id
            )
        if result == "UPDATE 0":
            # 2. If no user linked yet, create admin user for this tenant
            admin_email = (tenant_row["admin_email"] or f"admin@{tenant_row['slug']}.com").lower().strip()
            await conn.execute(
                """INSERT INTO users (id, tenant_id, email, password_hash, role, created_at)
                   VALUES (gen_random_uuid(), $1::uuid, $2, $3, 'admin', now())
                   ON CONFLICT (email) DO UPDATE SET
                    password_hash = EXCLUDED.password_hash,
                    tenant_id = EXCLUDED.tenant_id""",
                tenant_id, admin_email, password_hash
            )

    return {"status": "ok", "message": "Password reset successfully"}


@router.get("/admin/tenants/{tenant_id}/settings")
async def get_admin_tenant_settings(tenant_id: str, admin_user: dict = Depends(verify_super_admin)):
    """Retrieve full settings for a specific client organization as Super Admin."""
    from routers.settings import get_tenant_settings
    return await get_tenant_settings(tenant_id=tenant_id, target_tenant_id=tenant_id, caller={"role": "super_admin"})


@router.put("/admin/tenants/{tenant_id}/settings")
@router.patch("/admin/tenants/{tenant_id}/settings")
async def update_admin_tenant_settings(tenant_id: str, payload: TenantSettingsUpdate, admin_user: dict = Depends(verify_super_admin)):
    """Update all settings & credentials for a specific client organization directly from Super Admin."""
    from routers.settings import update_tenant_settings
    return await update_tenant_settings(payload=payload, tenant_id=tenant_id, target_tenant_id=tenant_id, caller={"role": "super_admin"})





@router.patch("/admin/tenants/{tenant_id}/toggle-status")
async def toggle_admin_tenant_status(tenant_id: str, admin_user: dict = Depends(verify_super_admin)):
    """Toggle tenant active / paused status (e.g. for non-payment or maintenance)."""
    async with database.db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """UPDATE tenants 
               SET is_active = NOT is_active, updated_at = now() 
               WHERE id = $1::uuid 
               RETURNING id, name, is_active""",
            tenant_id
        )
        if not row:
            raise HTTPException(404, "Client not found")

    return {
        "id": str(row["id"]),
        "name": row["name"],
        "is_active": row["is_active"],
        "status": "active" if row["is_active"] else "paused"
    }


@router.delete("/admin/tenants/{tenant_id}")
async def delete_admin_tenant(tenant_id: str, admin_user: dict = Depends(verify_super_admin)):
    """Permanently delete a client organization and all its data."""
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT id, name FROM tenants WHERE id = $1::uuid", tenant_id)
        if not tenant:
            raise HTTPException(404, "Client organization not found")
            
        async with conn.transaction():
            await conn.execute("DELETE FROM scheduled_jobs WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM bookings WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM messages WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM conversations WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM customer_notes WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM tasks WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM customers WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM customer_reviews WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM contacts WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM push_subscriptions WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM notifications WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM marketing_campaigns WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM marketing_triggers WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM reply_rules WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM tenant_credentials WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM ai_config WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM audit_logs WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM users WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM tenants WHERE id = $1::uuid", tenant_id)
            
    return {"status": "deleted", "tenant_id": tenant_id, "name": tenant["name"]}


@router.get("/admin/stats")
async def get_platform_admin_stats(admin_user: dict = Depends(verify_super_admin)):
    """Retrieve global multi-tenant platform metrics, MRR and health status."""
    async with database.db_pool.acquire() as conn:
        tenants = await conn.fetch("SELECT id, name, plan, is_active, settings, created_at FROM tenants")
        total_msgs = await conn.fetchval("SELECT COUNT(*) FROM messages") or 0
        total_convs = await conn.fetchval("SELECT COUNT(*) FROM conversations") or 0
        total_bookings = await conn.fetchval("SELECT COUNT(*) FROM bookings") or 0
        
        # Calculate MRR using per-tenant monthly_price from settings, falling back to plan defaults
        plan_defaults = {
            "starter": 999.0,
            "pro": 2630.0,
            "enterprise": 9999.0
        }
        total_mrr = 0.0
        for t in tenants:
            if not t["is_active"]:
                continue
            t_cfg = t["settings"] or {}
            if isinstance(t_cfg, str):
                try: t_cfg = json.loads(t_cfg)
                except: t_cfg = {}
            price = float(t_cfg.get("monthly_price", 0)) if isinstance(t_cfg, dict) and t_cfg.get("monthly_price") else plan_defaults.get((t["plan"] or "pro").lower(), 2630.0)
            total_mrr += price
        
    return {
        "total_tenants": len(tenants),
        "active_tenants": sum(1 for t in tenants if t["is_active"]),
        "paused_tenants": sum(1 for t in tenants if not t["is_active"]),
        "total_messages": int(total_msgs),
        "total_conversations": int(total_convs),
        "total_bookings": int(total_bookings),
        "estimated_mrr": total_mrr,
        "mrr_currency": "INR",
        "mrr_symbol": "₹",
        "system_status": "operational",
        "uptime": "99.98%"
    }


@router.post("/admin/tenants/{tenant_id}/payment-reminder")
async def send_tenant_payment_reminder(
    tenant_id: str,
    payload: PaymentReminderRequest,
    background_tasks: BackgroundTasks,
    admin_user: dict = Depends(verify_super_admin)
):
    """Send an automated WhatsApp payment reminder to client organization admin."""
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT id, name, slug FROM tenants WHERE id = $1::uuid", tenant_id)
        if not tenant:
            raise HTTPException(404, "Client tenant not found")
            
        wa_row = await conn.fetchrow("SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp'", tenant_id)
        admin_user = await conn.fetchrow("SELECT email FROM users WHERE tenant_id = $1::uuid AND role = 'admin' LIMIT 1", tenant_id)
        
        wa_data = {}
        if wa_row and wa_row["credential_data"]:
            d = wa_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            wa_data = dict(d)
            
        target_phone = payload.custom_phone or wa_data.get("admin_whatsapp_number", "")
        clean_phone = re.sub(r'[^0-9]', '', target_phone)
        
        curr_sym = "₹" if payload.currency == "INR" else ("$" if payload.currency == "USD" else (payload.currency + " "))
        pay_url = payload.payment_link or f"https://boldlabs.ai/pay/{tenant['slug']}"
        
        if payload.custom_message and payload.custom_message.strip():
            msg_text = payload.custom_message.strip()
        else:
            msg_text = (
                f"🔔 *Boldlabs CRM — Subscription Renewal Notice*\n\n"
                f"Dear *{tenant['name']}* Team,\n\n"
                f"This is a friendly reminder that your monthly platform subscription ({curr_sym}{payload.amount:,.2f}) is scheduled for renewal *{payload.due_date}*.\n\n"
                f"💳 *Quick Payment Link:* {pay_url}\n\n"
                f"Your WhatsApp AI Automation and CRM access remain fully active. If you've already completed this payment, please disregard this note.\n\n"
                f"— Boldlabs Billing Support"
            )
            
        # Dispatch in background task if phone is available
        if clean_phone and len(clean_phone) >= 10:
            background_tasks.add_task(
                dispatch_automated_status_whatsapp,
                tenant_id,
                None,
                clean_phone,
                msg_text,
                0
            )
            
    return {
        "status": "sent",
        "tenant_id": tenant_id,
        "tenant_name": tenant["name"],
        "recipient_phone": clean_phone or "Recorded to Dashboard Log",
        "amount": payload.amount,
        "due_date": payload.due_date,
        "message_preview": msg_text
    }


@router.put("/admin/tenants/{tenant_id}/billing")
async def update_tenant_billing_config(tenant_id: str, payload: TenantBillingUpdate, admin_user: dict = Depends(verify_super_admin)):
    """Update a client organization's plan, pricing, and Razorpay subscription details."""
    async with database.db_pool.acquire() as conn:
        t_row = await conn.fetchrow("SELECT plan, settings FROM tenants WHERE id = $1::uuid", tenant_id)
        if not t_row:
            raise HTTPException(404, "Client tenant not found")
            
        cur_settings = t_row["settings"] or {}
        if isinstance(cur_settings, str):
            try: cur_settings = json.loads(cur_settings)
            except: cur_settings = {}
            
        if payload.monthly_price is not None:
            cur_settings["monthly_price"] = float(payload.monthly_price)
        if payload.billing_cycle_day is not None:
            cur_settings["billing_cycle_day"] = int(payload.billing_cycle_day)
        if payload.razorpay_subscription_id is not None:
            cur_settings["razorpay_subscription_id"] = payload.razorpay_subscription_id.strip()
        if payload.next_renewal_date is not None:
            cur_settings["next_renewal_date"] = payload.next_renewal_date.strip()
        if payload.sales_channel is not None:
            cur_settings["sales_channel"] = payload.sales_channel.strip()
        if payload.partner_name is not None:
            cur_settings["partner_name"] = payload.partner_name.strip()
        if payload.partner_share_pct is not None:
            cur_settings["partner_share_pct"] = float(payload.partner_share_pct)
        if payload.owner_share_pct is not None:
            cur_settings["owner_share_pct"] = float(payload.owner_share_pct)
        if payload.plan is not None:
            cur_settings["plan"] = payload.plan.strip()
            
        new_plan = payload.plan or t_row["plan"]
        await conn.execute(
            "UPDATE tenants SET plan = $1, settings = $2::jsonb, updated_at = now() WHERE id = $3::uuid",
            new_plan, json.dumps(cur_settings), tenant_id
        )
        
    return {
        "status": "updated",
        "tenant_id": tenant_id,
        "plan": new_plan,
        "settings": cur_settings
    }


# ── Razorpay Automated Billing & Webhooks ─────────────────────────────────────

async def dispatch_subscription_reminder(tenant_id: str, reminder_stage: int, payment_link: str = ""):
    """
    Dispatches the 4 friendly WhatsApp payment reminder templates from the platform
    to the organization's admin WhatsApp contact.
    """
    try:
        async with database.db_pool.acquire() as conn:
            tenant = await conn.fetchrow(
                "SELECT id, name, slug, razorpay_short_url FROM tenants WHERE id = $1::uuid",
                tenant_id
            )
            if not tenant:
                return
            
            wa_cred = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
                tenant_id
            )
            admin_phone = ""
            if wa_cred and wa_cred["credential_data"]:
                cd = wa_cred["credential_data"]
                if isinstance(cd, str):
                    try: cd = json.loads(cd)
                    except: cd = {}
                admin_phone = cd.get("admin_whatsapp_number", "")

            clean_phone = re.sub(r'[^0-9]', '', admin_phone)
            if not clean_phone or len(clean_phone) < 10:
                logger.info("reminder_skipped_no_admin_phone", tenant_id=tenant_id)
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
            elif reminder_stage == 2:
                msg_text = (
                    f"Hi {org_name} team,\n\n"
                    f"We tried to renew your WhatsApp automation subscription (₹3,499), but the payment couldn't go through. "
                    f"Razorpay will automatically retry in a few days.\n\n"
                    f"To keep your WhatsApp bot running without interruption, you can complete the payment directly here: {pay_url}\n\n"
                    f"— Boldlabs Team"
                )
            elif reminder_stage == 3:
                msg_text = (
                    f"Hi {org_name} team,\n\n"
                    f"Your WhatsApp automation system has been paused because we were unable to process your subscription renewal after multiple attempts. "
                    f"Don't worry — all your customer contacts, conversation histories, and settings are completely safe.\n\n"
                    f"To reactivate your automation and dashboard access right away, please complete payment here: {pay_url}\n\n"
                    f"We'll turn everything back on instantly!\n\n"
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

            await conn.execute(
                "UPDATE tenants SET last_reminder_sent_at = now(), reminder_stage = $1 WHERE id = $2::uuid",
                reminder_stage, tenant_id
            )

            await dispatch_automated_status_whatsapp(
                tenant_id,
                None,
                clean_phone,
                msg_text,
                0
            )
            logger.info("subscription_reminder_dispatched", tenant_id=tenant_id, stage=reminder_stage, phone=clean_phone)
    except Exception as e:
        logger.error("dispatch_sub_reminder_error", tenant_id=tenant_id, stage=reminder_stage, error=str(e))


@router.post("/admin/tenants/{tenant_id}/activate-billing")
async def activate_tenant_billing(
    tenant_id: str,
    force_new: bool = False,
    custom_phone: Optional[str] = Query(None),
    admin_user: dict = Depends(verify_super_admin)
):
    """
    Stage B: Activate & Start Billing.
    Generates a live Razorpay Payment Link for the tenant's monthly subscription,
    records razorpay_customer_id, razorpay_subscription_id (payment link ID), razorpay_short_url,
    and sets org_lifecycle_stage = 'ready_to_activate'.
    Note: Automation STILL runs freely in this stage until the customer completes the first payment.
    """
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow(
            "SELECT id, name, slug, settings, org_lifecycle_stage, subscription_status, razorpay_subscription_id, razorpay_short_url FROM tenants WHERE id = $1::uuid",
            tenant_id
        )
        if not tenant:
            raise HTTPException(404, "Client tenant not found")
        
        existing_sub_id = tenant.get("razorpay_subscription_id") or ""
        existing_short_url = tenant.get("razorpay_short_url") or ""
        
        # If already has a valid working payment link (plink_...) and short_url, and not forced, return it
        if not force_new and existing_sub_id.startswith("plink_") and existing_short_url:
            return {
                "status": "ready_to_activate",
                "tenant_id": tenant_id,
                "subscription_id": existing_sub_id,
                "short_url": existing_short_url,
                "org_lifecycle_stage": tenant.get("org_lifecycle_stage") or "ready_to_activate",
                "subscription_status": tenant.get("subscription_status") or "not_started",
                "message": "Payment link already active"
            }

        admin_contact = await conn.fetchrow(
            "SELECT email FROM users WHERE tenant_id = $1::uuid AND is_active = true ORDER BY (role = 'admin') DESC, created_at ASC LIMIT 1",
            tenant_id
        )
        wa_cred = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
            tenant_id
        )
        admin_phone = ""
        if custom_phone and custom_phone.strip():
            admin_phone = custom_phone.strip()
        elif wa_cred and wa_cred["credential_data"]:
            cd = wa_cred["credential_data"]
            if isinstance(cd, str):
                try: cd = json.loads(cd)
                except: cd = {}
            admin_phone = cd.get("admin_whatsapp_number", "")
        
        cfg = tenant.get("settings") or {}
        if isinstance(cfg, str):
            try: cfg = json.loads(cfg)
            except: cfg = {}
        if not admin_phone:
            admin_phone = cfg.get("admin_whatsapp_number", "")

        customer_name = tenant["name"]
        customer_email = admin_contact["email"] if admin_contact else f"{tenant['slug']}@boldlabs.ai"
        monthly_price = float(cfg.get("monthly_price", 2630.0))
        amount_paisa = int(monthly_price * 100)
        
        cust_id = None
        try:
            cust_res = await razorpay_client.create_customer(customer_name, customer_email, admin_phone)
            cust_id = cust_res.get("id")
        except Exception as ce:
            logger.warning("razorpay_cust_create_warning", error=str(ce))
            
        plink_res = await razorpay_client.create_payment_link(
            amount=amount_paisa,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_contact=admin_phone,
            description=f"{customer_name} - Platform Subscription (₹{int(monthly_price):,}/mo)",
            org_slug=tenant["slug"],
            tenant_id=tenant_id
        )
        sub_id = plink_res.get("id")
        short_url = plink_res.get("short_url")

        await conn.execute(
            """
            UPDATE tenants 
            SET razorpay_customer_id = COALESCE($1, razorpay_customer_id),
                razorpay_subscription_id = $2,
                razorpay_short_url = $3,
                org_lifecycle_stage = 'ready_to_activate',
                subscription_status = 'not_started',
                updated_at = now()
            WHERE id = $4::uuid
            """,
            cust_id, sub_id, short_url, tenant_id
        )

        if custom_phone and custom_phone.strip():
            await conn.execute(
                """
                UPDATE tenants
                SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{admin_whatsapp_number}', to_jsonb($1::text), true)
                WHERE id = $2::uuid
                """,
                custom_phone.strip(), tenant_id
            )

        logger.info("tenant_billing_activated", tenant_id=tenant_id, sub_id=sub_id, short_url=short_url)
        return {
            "status": "ready_to_activate",
            "tenant_id": tenant_id,
            "subscription_id": sub_id,
            "short_url": short_url,
            "org_lifecycle_stage": "ready_to_activate",
            "subscription_status": "not_started"
        }


@router.post("/admin/tenants/{tenant_id}/sync-billing")
async def sync_tenant_billing(tenant_id: str, admin_user: dict = Depends(verify_super_admin)):
    """
    On-demand reconciliation with Razorpay API.
    Fetches latest payment link / subscription state and invoices, updating local records.
    """
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow(
            "SELECT id, razorpay_subscription_id, org_lifecycle_stage, subscription_status FROM tenants WHERE id = $1::uuid",
            tenant_id
        )
        if not tenant:
            raise HTTPException(404, "Client tenant not found")
        sub_id = tenant.get("razorpay_subscription_id")
        if not sub_id:
            raise HTTPException(400, "Organization has no Razorpay payment link or subscription attached")

        if sub_id.startswith("plink_"):
            plink_data = await razorpay_client.fetch_payment_link(sub_id)
            plink_status = plink_data.get("status", "")
            if plink_status == "paid":
                new_sub_status = "active"
                new_stage = "billing_active"
            elif plink_status in ("cancelled", "expired"):
                new_sub_status = "cancelled"
                new_stage = tenant.get("org_lifecycle_stage")
            else:
                new_sub_status = "not_started"
                new_stage = tenant.get("org_lifecycle_stage") or "ready_to_activate"

            await conn.execute(
                """
                UPDATE tenants
                SET subscription_status = $1,
                    org_lifecycle_stage = COALESCE($2, org_lifecycle_stage),
                    last_payment_status = $3,
                    updated_at = now()
                WHERE id = $4::uuid
                """,
                new_sub_status, new_stage, plink_status, tenant_id
            )

            synced_invoices_count = 0
            payments = plink_data.get("payments", [])
            for pay in payments:
                pay_id = pay.get("payment_id") or pay.get("id")
                pay_amount = float(pay.get("amount", 263000)) / 100.0
                pay_status = pay.get("status", "captured")
                if pay_id and pay_status in ("captured", "paid"):
                    await conn.execute(
                        """
                        INSERT INTO invoices (id, tenant_id, razorpay_invoice_id, razorpay_payment_id, razorpay_subscription_id, amount, currency, status, paid_at, created_at)
                        VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, 'INR', 'paid', now(), now())
                        ON CONFLICT (razorpay_invoice_id) DO UPDATE
                        SET status = 'paid',
                            razorpay_payment_id = EXCLUDED.razorpay_payment_id,
                            paid_at = now()
                        """,
                        tenant_id, f"inv_{sub_id}_{pay_id}", pay_id, sub_id, pay_amount
                    )
                    synced_invoices_count += 1

            return {
                "status": "synced",
                "tenant_id": tenant_id,
                "razorpay_status": plink_status,
                "subscription_status": new_sub_status,
                "org_lifecycle_stage": new_stage,
                "next_charge_at": None,
                "invoices_synced": synced_invoices_count
            }
        else:
            sub_data = await razorpay_client.fetch_subscription(sub_id)
            rzp_status = sub_data.get("status", "")
            status_map = {
                "created": "not_started",
                "authenticated": "active",
                "active": "active",
                "pending": "payment_failed",
                "halted": "paused",
                "cancelled": "cancelled",
                "completed": "active",
                "expired": "paused"
            }
            new_sub_status = status_map.get(rzp_status, "active" if rzp_status == "active" else tenant.get("subscription_status") or "not_started")
            
            current_end = sub_data.get("current_end")
            next_charge = datetime.fromtimestamp(current_end, tz=timezone.utc) if current_end else None
            
            new_stage = tenant.get("org_lifecycle_stage")
            if new_sub_status == "active":
                new_stage = "billing_active"

            await conn.execute(
                """
                UPDATE tenants
                SET subscription_status = $1,
                    org_lifecycle_stage = COALESCE($2, org_lifecycle_stage),
                    next_charge_at = COALESCE($3, next_charge_at),
                    last_payment_status = $4,
                    updated_at = now()
                WHERE id = $5::uuid
                """,
                new_sub_status, new_stage, next_charge, rzp_status, tenant_id
            )

            invoices = await razorpay_client.fetch_invoices_for_subscription(sub_id)
            synced_invoices_count = 0
            for inv in invoices:
                inv_id = inv.get("id")
                amount = float(inv.get("amount", 0)) / 100.0
                currency = inv.get("currency", "INR")
                inv_status = inv.get("status", "pending")
                paid_at = datetime.fromtimestamp(inv.get("paid_at"), tz=timezone.utc) if inv.get("paid_at") else None
                pdf_url = inv.get("short_url") or inv.get("invoice_pdf")
                payment_id = inv.get("payment_id")

                await conn.execute(
                    """
                    INSERT INTO invoices (id, tenant_id, razorpay_invoice_id, razorpay_payment_id, razorpay_subscription_id, amount, currency, status, invoice_pdf_url, paid_at, created_at)
                    VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, now())
                    ON CONFLICT (razorpay_invoice_id) DO UPDATE
                    SET status = EXCLUDED.status,
                        razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, invoices.razorpay_payment_id),
                        invoice_pdf_url = COALESCE(EXCLUDED.invoice_pdf_url, invoices.invoice_pdf_url),
                        paid_at = COALESCE(EXCLUDED.paid_at, invoices.paid_at)
                    """,
                    tenant_id, inv_id, payment_id, sub_id, amount, currency, inv_status, pdf_url, paid_at
                )
                synced_invoices_count += 1

            return {
                "status": "synced",
                "tenant_id": tenant_id,
                "razorpay_status": rzp_status,
                "subscription_status": new_sub_status,
                "org_lifecycle_stage": new_stage,
                "next_charge_at": next_charge.isoformat() if next_charge else None,
                "invoices_synced": synced_invoices_count
            }


@router.get("/admin/tenants/{tenant_id}/invoices")
async def get_tenant_invoices(tenant_id: str, admin_user: dict = Depends(verify_super_admin)):
    """Retrieve billing invoice history for an organization."""
    async with database.db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, razorpay_invoice_id, razorpay_payment_id, razorpay_subscription_id,
                   amount, currency, status, invoice_pdf_url, created_at, paid_at
            FROM invoices
            WHERE tenant_id = $1::uuid
            ORDER BY created_at DESC
            """,
            tenant_id
        )
        return [
            {
                "id": str(r["id"]),
                "razorpay_invoice_id": r["razorpay_invoice_id"],
                "razorpay_payment_id": r["razorpay_payment_id"],
                "razorpay_subscription_id": r["razorpay_subscription_id"],
                "amount": float(r["amount"]),
                "currency": r["currency"],
                "status": r["status"],
                "invoice_pdf_url": r["invoice_pdf_url"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "paid_at": r["paid_at"].isoformat() if r["paid_at"] else None,
            }
            for r in rows
        ]


@router.post("/admin/purge-test-data")
async def purge_test_data(tenant_id: Optional[str] = None, admin_user: dict = Depends(verify_super_admin)):
    """
    Purge test records (bookings, customers, contacts, test messages) across all or specific tenants.
    Ensures zero dummy or test data remains in the database.
    """
    async with database.db_pool.acquire() as conn:
        t_filter = "AND tenant_id = $1::uuid" if tenant_id else ""
        params = [tenant_id] if tenant_id else []

        # 1. Purge test bookings
        b_res = await conn.execute(
            f"DELETE FROM bookings WHERE (notes ILIKE '%test%' OR service ILIKE '%test%') {t_filter}",
            *params
        )
        b_count = int(b_res.split()[-1]) if b_res else 0

        # 2. Purge test customers
        c_res = await conn.execute(
            f"DELETE FROM customers WHERE (name ILIKE '%test%' OR health_concern ILIKE '%test%') {t_filter}",
            *params
        )
        c_count = int(c_res.split()[-1]) if c_res else 0

        # 3. Purge test contacts
        ct_res = await conn.execute(
            f"DELETE FROM contacts WHERE (name ILIKE '%test%' OR notes ILIKE '%test%') {t_filter}",
            *params
        )
        ct_count = int(ct_res.split()[-1]) if ct_res else 0

        # 4. Purge test messages
        m_res = await conn.execute(
            f"DELETE FROM messages WHERE (body ILIKE '%[TEST]%' OR body ILIKE '%test_message%' OR body ILIKE 'Test message from%' OR body ILIKE '%automated test%') {t_filter}",
            *params
        )
        m_count = int(m_res.split()[-1]) if m_res else 0

        logger.info("admin_purged_test_data", bookings=b_count, customers=c_count, contacts=ct_count, messages=m_count, tenant_id=tenant_id)
        return {
            "success": True,
            "purged": {
                "bookings": b_count,
                "customers": c_count,
                "contacts": ct_count,
                "messages": m_count
            }
        }


@router.post("/admin/alerts/send-due-alert")
async def send_admin_due_date_alert(payload: AdminDueAlertRequest, background_tasks: BackgroundTasks, admin_user: dict = Depends(verify_super_admin)):
    """
    Send an automated Razorpay subscription renewal due date alert to the SUPER ADMIN's WhatsApp.
    Helps the admin track which clients' auto-debit renewals are scheduled without messaging clients.
    """
    clean_phone = re.sub(r'[^0-9]', '', payload.super_admin_phone)
    if not clean_phone or len(clean_phone) < 10:
        raise HTTPException(400, "Valid 10+ digit super admin WhatsApp number required")

    async with database.db_pool.acquire() as conn:
        # Find any active tenant with Meta WhatsApp credentials to dispatch the message
        sender_cred = await conn.fetchrow(
            "SELECT tenant_id, credential_data FROM tenant_credentials WHERE provider = 'whatsapp' AND is_active = true LIMIT 1"
        )
        sender_tenant_id = str(sender_cred["tenant_id"]) if sender_cred else str(uuid.uuid4())

        if payload.tenant_id:
            # Single tenant alert
            tenant = await conn.fetchrow("SELECT id, name, slug, plan, settings FROM tenants WHERE id = $1::uuid", payload.tenant_id)
            if not tenant:
                raise HTTPException(404, "Tenant not found")
                
            cfg = tenant["settings"] or {}
            if isinstance(cfg, str):
                try: cfg = json.loads(cfg)
                except: cfg = {}
                
            plan_str = (tenant["plan"] or "pro").upper()
            fee = float(cfg.get("monthly_price", 999.0 if plan_str == "STARTER" else (9999.0 if plan_str == "ENTERPRISE" else 2999.0)))
            day = cfg.get("billing_cycle_day", 1)
            next_date = cfg.get("next_renewal_date", f"Day {day} of this month")
            sub_id = cfg.get("razorpay_subscription_id", "Direct Auto-Debit")
            
            msg_text = (
                f"🔔 *Boldlabs Super Admin — Razorpay Client Renewal Alert*\n\n"
                f"🏢 *Client Organization:* {tenant['name']}\n"
                f"📦 *Subscription Tier:* {plan_str} (₹{fee:,.2f}/mo)\n"
                f"💳 *Payment Gateway:* Razorpay Auto-Debit\n"
                f"📅 *Scheduled Renewal:* {next_date} (Cycle Day {day})\n"
                f"🆔 *Razorpay Sub ID:* {sub_id}\n\n"
                f"💡 *Action:* Razorpay will automatically attempt debit. Please verify settlement status in your Razorpay Dashboard."
            )
        else:
            # Consolidated digest of all active client renewals
            tenants = await conn.fetch("SELECT id, name, plan, settings FROM tenants WHERE is_active = true ORDER BY name")
            summary_lines = []
            total_mrr = 0.0
            
            for t in tenants:
                cfg = t["settings"] or {}
                if isinstance(cfg, str):
                    try: cfg = json.loads(cfg)
                    except: cfg = {}
                plan_str = (t["plan"] or "pro").upper()
                fee = float(cfg.get("monthly_price", 999.0 if plan_str == "STARTER" else (9999.0 if plan_str == "ENTERPRISE" else 2999.0)))
                total_mrr += fee
                day = cfg.get("billing_cycle_day", 1)
                next_date = cfg.get("next_renewal_date", f"Day {day}")
                sub_id = cfg.get("razorpay_subscription_id", "Auto-Debit")
                summary_lines.append(f"• *{t['name']}* ({plan_str}): ₹{fee:,.0f} | Due: {next_date} | Sub ID: {sub_id}")
                
            summary_block = "\n".join(summary_lines) if summary_lines else "No active clients."
            
            msg_text = (
                f"📊 *Boldlabs Super Admin — Client Subscription Renewal Digest*\n\n"
                f"💰 *Total Platform MRR:* ₹{total_mrr:,.2f}/mo\n"
                f"🏢 *Active Client Workspaces:* {len(tenants)}\n\n"
                f"*Upcoming Razorpay Auto-Debit Schedule:*\n"
                f"{summary_block}\n\n"
                f"⚡ *Billing Gateway:* Razorpay Subscriptions (Automatic)\n"
                f"— Boldlabs Automation Monitoring"
            )
            
        # Dispatch approved Meta Template admin_notification (bypasses Meta 24-hour window)
        try:
            s_data = sender_cred["credential_data"] if sender_cred and sender_cred["credential_data"] else {}
            if isinstance(s_data, str):
                try: s_data = json.loads(s_data)
                except: s_data = {}
            p_id = s_data.get("phone_number_id")
            a_token = s_data.get("access_token")
            if p_id and a_token and not str(a_token).startswith("EAAB_test"):
                if payload.tenant_id:
                    t_p1 = "Boldlabs Admin"
                    t_p2 = f"Renewal: {tenant['name']}"
                    t_p3 = f"₹{fee:,.0f}/mo"
                    t_p4 = str(next_date)
                    t_p5 = "Razorpay Auto-Debit"
                else:
                    t_p1 = "Boldlabs Admin"
                    t_p2 = "Client Renewal Digest"
                    t_p3 = f"₹{total_mrr:,.0f} Total MRR"
                    t_p4 = "Day 1 of month"
                    t_p5 = f"{len(tenants)} Active Clients"
                
                tpl_body = {
                    "messaging_product": "whatsapp",
                    "to": clean_phone,
                    "type": "template",
                    "template": {
                        "name": "admin_notification",
                        "language": {"code": "en"},
                        "components": [
                            {
                                "type": "body",
                                "parameters": [
                                    {"type": "text", "text": t_p1},
                                    {"type": "text", "text": t_p2},
                                    {"type": "text", "text": t_p3},
                                    {"type": "text", "text": t_p4},
                                    {"type": "text", "text": t_p5}
                                ]
                            }
                        ]
                    }
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp_tpl = await client.post(
                        f"https://graph.facebook.com/v19.0/{p_id}/messages",
                        headers={"Authorization": f"Bearer {a_token}", "Content-Type": "application/json"},
                        json=tpl_body
                    )
                    logger.info("admin_alert_template_dispatched", status=resp_tpl.status_code, body=resp_tpl.text)
        except Exception as e_tpl:
            logger.warning("admin_alert_template_dispatch_warn", error=str(e_tpl))

        background_tasks.add_task(
            dispatch_automated_status_whatsapp,
            sender_tenant_id,
            None,
            clean_phone,
            msg_text,
            0
        )

    return {
        "status": "alert_dispatched",
        "recipient_phone": clean_phone,
        "message_preview": msg_text
    }





@router.get("/notifications/vapid-public-key")
@router.get("/api/v1/crm/notifications/vapid-public-key")
async def get_vapid_public_key():
    """Returns VAPID public key for frontend Service Worker Web Push registration."""
    return {"vapid_public_key": VAPID_PUBLIC_KEY}


@router.post("/notifications/subscribe")
@router.post("/api/v1/crm/notifications/subscribe")
async def subscribe_push(
    payload: PushSubscribePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Registers or updates a client browser Web Push subscription."""
    if not payload.endpoint or not payload.keys.p256dh or not payload.keys.auth:
        raise HTTPException(400, "Invalid push subscription object")

    async with database.db_pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO push_subscriptions (id, tenant_id, endpoint, p256dh, auth, user_agent, created_at, updated_at)
               VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, now(), now())
               ON CONFLICT (endpoint) DO UPDATE SET
                tenant_id = EXCLUDED.tenant_id,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                user_agent = EXCLUDED.user_agent,
                updated_at = now()""",
            tenant_id, payload.endpoint, payload.keys.p256dh, payload.keys.auth, payload.user_agent
        )
    return {"status": "ok", "subscribed": True}


@router.post("/notifications/unsubscribe")
@router.post("/api/v1/crm/notifications/unsubscribe")
async def unsubscribe_push(
    payload: PushUnsubscribePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Unregisters a client browser Web Push subscription."""
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM push_subscriptions WHERE endpoint = $1 AND tenant_id = $2::uuid",
            payload.endpoint, tenant_id
        )
    return {"status": "ok", "unsubscribed": True}


@router.get("/notifications")
@router.get("/api/v1/crm/notifications")
async def list_notifications(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(50, le=100)
):
    """Lists recent notifications with unread count for the top header bell popover."""
    async with database.db_pool.acquire() as conn:
        unread_count = await conn.fetchval(
            "SELECT COUNT(*) FROM notifications WHERE tenant_id = $1::uuid AND is_read = false",
            tenant_id
        )
        sub_count = await conn.fetchval(
            "SELECT COUNT(*) FROM push_subscriptions WHERE tenant_id = $1::uuid",
            tenant_id
        )
        rows = await conn.fetch(
            """SELECT id, title, body, type, data, is_read, created_at
               FROM notifications
               WHERE tenant_id = $1::uuid
               ORDER BY created_at DESC
               LIMIT $2""",
            tenant_id, limit
        )

    return {
        "unread_count": unread_count or 0,
        "subscription_count": sub_count or 0,
        "notifications": [
            {
                "id": str(r["id"]),
                "title": r["title"],
                "body": r["body"],
                "type": r["type"],
                "data": json.loads(r["data"]) if isinstance(r["data"], str) else (r["data"] or {}),
                "is_read": bool(r["is_read"]),
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ]
    }


@router.patch("/notifications/{notification_id}/read")
@router.patch("/api/v1/crm/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Marks a single notification as read."""
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE notifications SET is_read = true WHERE id = $1::uuid AND tenant_id = $2::uuid",
            notification_id, tenant_id
        )
    return {"status": "ok", "id": notification_id}


@router.post("/notifications/mark-all-read")
@router.post("/api/v1/crm/notifications/mark-all-read")
async def mark_all_notifications_read(
    tenant_id: str = Depends(get_tenant_id)
):
    """Marks all notifications for this tenant as read."""
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE notifications SET is_read = true WHERE tenant_id = $1::uuid AND is_read = false",
            tenant_id
        )
    return {"status": "ok"}


@router.post("/notifications/test")
@router.post("/api/v1/crm/notifications/test")
async def send_test_push_notification(
    tenant_id: str = Depends(get_tenant_id)
):
    """Dispatches a real test push notification to verify background notification delivery."""
    res = await dispatch_push_notification(
        pool=database.db_pool,
        tenant_id=tenant_id,
        title="Boldlabs CRM Notification Active",
        body="Real background notifications are working! You will receive instant alerts even with the browser closed.",
        notif_type="system",
        url="/boldlabs#inbox"
    )
    return res


@router.delete("/notifications/{notification_id}")
@router.delete("/api/v1/crm/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Deletes a single notification for this tenant."""
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM notifications WHERE id = $1::uuid AND tenant_id = $2::uuid",
            notification_id, tenant_id
        )
    return {"status": "ok", "id": notification_id}


@router.delete("/notifications")
@router.delete("/api/v1/crm/notifications")
@router.post("/notifications/clear-all")
@router.post("/api/v1/crm/notifications/clear-all")
async def clear_all_notifications(
    tenant_id: str = Depends(get_tenant_id)
):
    """Clears and deletes all notifications for this tenant."""
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM notifications WHERE tenant_id = $1::uuid",
            tenant_id
        )
    return {"status": "ok"}


@router.get("/tenants/resolve/{slug}")
async def resolve_tenant_by_slug(slug: str):
    """
    Resolve a tenant workspace slug to its tenant ID and basic metadata.
    Used by frontend routing to establish strict tenant context.
    """
    clean_slug = slug.strip().lower()
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow(
            "SELECT id, name, slug, plan, is_active FROM tenants WHERE LOWER(slug) = $1",
            clean_slug
        )
        if not tenant:
            raise HTTPException(404, detail="Tenant organization not found")
        return {
            "id": str(tenant["id"]),
            "name": tenant["name"],
            "slug": tenant["slug"],
            "plan": tenant["plan"],
            "is_active": tenant["is_active"]
        }


# ═══════════════════════════════════════════════════════════════════════════════
# 🌟 PUBLIC WEB BOOKING ENGINE (/{slug}/book)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/public/{slug}/booking-info")
async def get_public_booking_info(slug: str):
    """
    Public endpoint for /{slug}/book page.
    Returns tenant business profile, doctors list, and health concerns / services.
    Uses ONLY the doctors and health concerns configured in the system.
    """
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow(
            """SELECT id, name, slug, plan, is_active, settings
               FROM tenants WHERE slug = $1""",
            slug.strip().lower()
        )
        if not tenant:
            raise HTTPException(404, "Organization not found")

        cfg = tenant["settings"] or {}
        if isinstance(cfg, str):
            try: cfg = json.loads(cfg)
            except: cfg = {}

        tax = cfg.get("taxonomy") or {}
        if isinstance(tax, str):
            try: tax = json.loads(tax)
            except: tax = {}

        industry = cfg.get("industry") or "clinic"

        # System configured doctors
        doctor_list = tax.get("doctor_presets") or tax.get("staff_presets") or []
        if not doctor_list:
            if industry == "clinic":
                doctor_list = [
                    "Dr. Sarah Mitchell (Chief Physician)",
                    "Dr. Arjun Mehta (Dental Specialist)",
                    "Dr. Priya Nair (Dermatologist)"
                ]
            else:
                doctor_list = ["Staff Specialist / Consultant"]

        # System configured health concerns / services
        default_concerns = {
            "clinic": ["General Consultation", "Dental Checkup & Cleaning", "Skin Health & Dermatology", "Back Pain & Physio", "Diabetes & Wellness"],
            "education": ["Class 10 Board Exam", "Class 12 IIT-JEE (Physics/Math)", "NEET Medical Entrance", "Spoken English & Fluency"],
            "real_estate": ["2 BHK Apartment (Mid-Budget)", "3 BHK Luxury Villa", "Commercial Office Space", "Residential Plot / Land"],
            "salon_spa": ["Haircut & Styling", "Keratin / Hair Spa", "Facial & Skin Rejuvenation", "Bridal Makeup Package"],
            "automobile": ["Periodic General Service", "Brake & Suspension Check", "Engine Diagnostics & Oil Change"],
        }.get(industry, ["General Consultation", "Follow-up Visit", "Specialist Consultation"])

        concerns_list = tax.get("requirement_presets") or default_concerns

        # Bot phone
        cred_row = await conn.fetchrow(
            """SELECT credential_data FROM tenant_credentials 
               WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true""",
            tenant["id"]
        )
        bot_phone = ""
        if cred_row and cred_row["credential_data"]:
            cd = cred_row["credential_data"]
            if isinstance(cd, str):
                try: cd = json.loads(cd)
                except: cd = {}
            bot_phone = cd.get("phone_number") or cd.get("admin_whatsapp_number") or ""
        if not bot_phone:
            bot_phone = cfg.get("admin_whatsapp_number", "")

        open_time = cfg.get("opening_time") or cfg.get("working_hours_start", "09:00")
        close_time = cfg.get("closing_time") or cfg.get("working_hours_end", "20:00")
        try:
            ot_parts = str(open_time).split(":")
            ct_parts = str(close_time).split(":")
            ot_fmt = datetime(2000, 1, 1, int(ot_parts[0]), int(ot_parts[1]) if len(ot_parts) > 1 else 0).strftime("%I:%M %p")
            ct_fmt = datetime(2000, 1, 1, int(ct_parts[0]), int(ct_parts[1]) if len(ct_parts) > 1 else 0).strftime("%I:%M %p")
            op_hours_formatted = f"{ot_fmt} – {ct_fmt}"
        except Exception:
            op_hours_formatted = "09:00 AM – 08:00 PM"

        return {
            "name": tenant["name"],
            "slug": tenant["slug"],
            "plan": tenant["plan"],
            "industry": industry,
            "currency": cfg.get("currency", "INR"),
            "currency_symbol": cfg.get("currency_symbol", "₹"),
            "logo_url": cfg.get("logo_url", ""),
            "full_location_text": cfg.get("full_location_text", ""),
            "doctor_label": tax.get("staff_label") or ("Doctor / Specialist" if industry == "clinic" else "Assigned Staff"),
            "concern_label": tax.get("requirement_label") or ("Health Concern / Service" if industry == "clinic" else "Requirement / Service"),
            "doctors": doctor_list,
            "health_concerns": concerns_list,
            "operating_hours": op_hours_formatted,
            "opening_time": open_time,
            "closing_time": close_time,
            "business_hours": {
                "open": open_time,
                "close": close_time,
                "slot_duration_minutes": 30
            },
            "bot_phone": bot_phone
        }


@router.post("/public/{slug}/book")
async def create_public_web_booking(slug: str, payload: PublicBookingRequest):
    """
    Public web booking handler from /{slug}/book page.
    Creates booking, customer, contact, syncs GCal, and sends WhatsApp confirmation.
    """
    if not payload.patient_name or not payload.patient_name.strip():
        raise HTTPException(400, "Patient name is required")
    if not payload.patient_phone or not payload.patient_phone.strip():
        raise HTTPException(400, "WhatsApp phone number is required")

    clean_name = payload.patient_name.strip()
    raw_phone = payload.patient_phone.strip()
    digits = "".join(filter(str.isdigit, raw_phone))
    clean_phone = f"+{digits}" if not raw_phone.startswith("+") else f"+{digits}"
    if len(digits) == 10:
        clean_phone = f"+91{digits}"

    # Normalize health concern(s) into clean string
    if isinstance(payload.health_concern, list):
        concerns = [str(c).strip() for c in payload.health_concern if str(c).strip()]
        health_concern_str = ", ".join(concerns) if concerns else "General Consultation"
    else:
        health_concern_str = str(payload.health_concern or "").strip() or "General Consultation"

    doc = (payload.doctor_name or payload.staff_member or "").strip() or None
    service_name = f"{health_concern_str} ({doc})" if doc else health_concern_str

    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT id, name, slug, settings FROM tenants WHERE slug = $1", slug.strip().lower())
        if not tenant:
            raise HTTPException(404, "Organization not found")
        tenant_id = str(tenant["id"])

        # Fetch tenant configured timezone from tenants.settings
        tenant_settings = {}
        if tenant.get("settings"):
            try:
                tenant_settings = json.loads(tenant["settings"]) if isinstance(tenant["settings"], str) else dict(tenant["settings"])
            except Exception:
                tenant_settings = {}
        tz_name = tenant_settings.get("timezone", "Asia/Kolkata").strip() if tenant_settings.get("timezone") else "Asia/Kolkata"
        try:
            tenant_tz = ZoneInfo(tz_name)
        except Exception:
            tenant_tz = ZoneInfo("Asia/Kolkata")

        # Parse datetime and attach tenant timezone to prevent UTC offset loss
        dt_str = f"{payload.booking_date} {payload.booking_time}"
        st_dt = None
        for fmt in ["%Y-%m-%d %H:%M", "%Y-%m-%d %I:%M %p", "%Y-%m-%d %I:%M%p"]:
            try:
                st_dt = datetime.strptime(dt_str.strip(), fmt)
                break
            except Exception:
                pass
        if not st_dt:
            st_dt = datetime.now(tenant_tz) + timedelta(days=1)
            st_dt = st_dt.replace(hour=10, minute=0, second=0, microsecond=0)
        elif st_dt.tzinfo is None:
            st_dt = st_dt.replace(tzinfo=tenant_tz)
        et_dt = st_dt + timedelta(minutes=30)

        booking_source = getattr(payload, "source", None) or "website_form"

        # 1. Upsert contact using normalized phone matching
        contact = await conn.fetchrow(
            """SELECT id FROM contacts 
               WHERE tenant_id = $1::uuid 
                 AND (
                   phone = $2
                   OR phone = ('+' || $2)
                   OR replace(phone, '+', '') = replace($2, '+', '')
                   OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($2, '[^0-9]', '', 'g'), 10)
                 )
               ORDER BY created_at ASC LIMIT 1""",
            tenant_id, clean_phone
        )
        if not contact:
            contact_id = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO contacts (id, tenant_id, name, phone, metadata, created_at, updated_at)
                   VALUES ($1::uuid, $2::uuid, $3, $4, $5::jsonb, now(), now())""",
                contact_id, tenant_id, clean_name, clean_phone,
                json.dumps({"preferred_doctor": doc, "health_concern": health_concern_str, "email": payload.patient_email or "", "source": booking_source})
            )
        else:
            contact_id = str(contact["id"])
            await conn.execute(
                """UPDATE contacts SET name = $1, metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('source', $2::text), updated_at = now() WHERE id = $3::uuid AND tenant_id = $4::uuid""",
                clean_name, booking_source, contact_id, tenant_id
            )

        # 2. Get or create conversation
        conv = await conn.fetchrow(
            "SELECT id FROM conversations WHERE tenant_id = $1::uuid AND contact_id = $2::uuid LIMIT 1",
            tenant_id, contact_id
        )
        if not conv:
            conv_id = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO conversations (id, tenant_id, contact_id, status, created_at, updated_at)
                   VALUES ($1::uuid, $2::uuid, $3::uuid, 'bot', now(), now())""",
                conv_id, tenant_id, contact_id
            )
        else:
            conv_id = str(conv["id"])

        # 3. Double Booking Conflict Check & Insert within an atomic transaction
        booking_id = str(uuid.uuid4())
        staff = doc
        source_label = "Website Form" if booking_source == "website_form" else booking_source
        if staff:
            combined_notes = f"Booked online via {source_label}.\nPractitioner: {staff}\nConcern: {health_concern_str}"
        else:
            combined_notes = f"Booked online via {source_label}.\nConcern: {health_concern_str}"
        if payload.notes:
            combined_notes += f"\nPatient Note: {payload.notes.strip()}"

        slot_booking_mode = tenant_settings.get("slot_booking_mode", "single") if isinstance(tenant_settings, dict) else "single"
        max_concurrent = int(tenant_settings.get("max_concurrent_bookings", 1)) if isinstance(tenant_settings, dict) else 1

        async with conn.transaction():
            if slot_booking_mode != "multiple":
                if staff:
                    conflict = await conn.fetchrow(
                        """SELECT id, service, start_time, end_time FROM bookings
                           WHERE tenant_id = $1::uuid AND status = 'confirmed'
                             AND (staff_member IS NULL OR staff_member = $4)
                             AND start_time < $3 AND end_time > $2
                           FOR UPDATE""",
                        tenant_id, st_dt, et_dt, staff
                    )
                else:
                    conflict = await conn.fetchrow(
                        """SELECT id, service, start_time, end_time FROM bookings
                           WHERE tenant_id = $1::uuid AND status = 'confirmed'
                             AND start_time < $3 AND end_time > $2
                           FOR UPDATE""",
                        tenant_id, st_dt, et_dt
                    )
                if conflict:
                    c_start = conflict["start_time"]
                    if hasattr(c_start, "astimezone"):
                        c_start = c_start.astimezone(tenant_tz)
                    c_time = c_start.strftime("%I:%M %p")
                    raise HTTPException(409, f"Timeslot conflict: An appointment for '{conflict['service']}' is already scheduled at {c_time}.")
            elif max_concurrent > 1:
                if staff:
                    existing_count = await conn.fetchval(
                        """SELECT COUNT(*) FROM bookings
                           WHERE tenant_id = $1::uuid AND status = 'confirmed'
                             AND (staff_member IS NULL OR staff_member = $4)
                             AND start_time < $3 AND end_time > $2""",
                        tenant_id, st_dt, et_dt, staff
                    ) or 0
                else:
                    existing_count = await conn.fetchval(
                        """SELECT COUNT(*) FROM bookings
                           WHERE tenant_id = $1::uuid AND status = 'confirmed'
                             AND start_time < $3 AND end_time > $2""",
                        tenant_id, st_dt, et_dt
                    ) or 0
                if existing_count >= max_concurrent:
                    raise HTTPException(409, f"Timeslot capacity reached: This slot has reached the maximum of {max_concurrent} concurrent bookings.")

            await conn.execute(
                """INSERT INTO bookings (id, tenant_id, contact_id, conversation_id, service, start_time, end_time, status, notes, price, currency, staff_member, source, metadata)
                   VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, 'confirmed', $8, 0, 'INR', $9, $10, $11::jsonb)""",
                booking_id, tenant_id, contact_id, conv_id, service_name, st_dt, et_dt, combined_notes, staff, booking_source, json.dumps({"source": booking_source, "channel": "website_form"})
            )

        # 3b. Queue automated 24h & 2h reminders and post-session review request in scheduled_jobs
        try:
            now_dt = datetime.now(st_dt.tzinfo) if st_dt.tzinfo else datetime.now()
            remind_24h = st_dt - timedelta(hours=24)
            if remind_24h > now_dt:
                await conn.execute(
                    """INSERT INTO scheduled_jobs (id, tenant_id, job_type, booking_id, scheduled_at, status, created_at)
                       VALUES (gen_random_uuid(), $1::uuid, 'reminder', $2::uuid, $3, 'pending', now())""",
                    tenant_id, booking_id, remind_24h
                )
            remind_2h = st_dt - timedelta(hours=2)
            if remind_2h > now_dt:
                await conn.execute(
                    """INSERT INTO scheduled_jobs (id, tenant_id, job_type, booking_id, scheduled_at, status, created_at)
                       VALUES (gen_random_uuid(), $1::uuid, 'reminder', $2::uuid, $3, 'pending', now())""",
                    tenant_id, booking_id, remind_2h
                )
            remind_admin_30m = st_dt - timedelta(minutes=30)
            if remind_admin_30m > now_dt:
                await conn.execute(
                    """INSERT INTO scheduled_jobs (id, tenant_id, job_type, booking_id, scheduled_at, status, created_at)
                       VALUES (gen_random_uuid(), $1::uuid, 'admin_reminder', $2::uuid, $3, 'pending', now())""",
                    tenant_id, booking_id, remind_admin_30m
                )
            pass
        except Exception as e_job:
            logger.warning("public_booking_scheduled_jobs_failed", error=str(e_job))

        # 4. Upsert customer directory
        try:
            cust = await conn.fetchrow("SELECT id FROM customers WHERE tenant_id = $1::uuid AND phone = $2", tenant_id, clean_phone)
            if not cust:
                cust_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO customers (id, tenant_id, phone, name, status, lead_probability, converted, health_concern, preferred_doctor, source, metadata, created_at, updated_at)
                       VALUES ($1::uuid, $2::uuid, $3, $4, 'converted', 'hot', true, $5, $6, $7, $8::jsonb, now(), now())
                       ON CONFLICT (tenant_id, phone) DO UPDATE SET status = 'converted', converted = true, lead_probability = 'hot', health_concern = EXCLUDED.health_concern, preferred_doctor = COALESCE(EXCLUDED.preferred_doctor, customers.preferred_doctor), source = COALESCE(customers.source, EXCLUDED.source), metadata = COALESCE(customers.metadata, '{}'::jsonb) || EXCLUDED.metadata, updated_at = now()""",
                    cust_id, tenant_id, clean_phone, clean_name, health_concern_str, staff, booking_source, json.dumps({"source": booking_source, "booked_via": "website_form"})
                )
            else:
                cust_id = str(cust["id"])
                await conn.execute(
                    """UPDATE customers 
                       SET name = COALESCE(NULLIF(name, ''), $1), 
                           status = 'converted', 
                           converted = true, 
                           lead_probability = 'hot', 
                           health_concern = $2, 
                           preferred_doctor = COALESCE($3, preferred_doctor),
                           source = COALESCE(customers.source, $4),
                           metadata = COALESCE(customers.metadata, '{}'::jsonb) || jsonb_build_object('last_booking_source', $4::text),
                           updated_at = now() 
                       WHERE id = $5::uuid AND tenant_id = $6::uuid""",
                    clean_name, health_concern_str, staff, booking_source, cust_id, tenant_id
                )

            # Record customer timeline activity note
            try:
                date_str_short = st_dt.strftime("%d %b %Y at %I:%M %p")
                await conn.execute(
                    """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color, created_at)
                       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'Website Form', $3, 'emerald', now())""",
                    tenant_id, cust_id, f"📅 Booked appointment via Website Form for '{health_concern_str}' on {date_str_short}."
                )
            except Exception as e_note:
                logger.warning("public_booking_customer_note_failed", error=str(e_note))
        except Exception as e_c:
            logger.warning("customer_directory_upsert_failed", error=str(e_c))

        # 5. WhatsApp booking confirmation dispatch (Approved Meta Template first)
        try:
            date_str = st_dt.strftime("%d %b %Y")
            time_str = st_dt.strftime("%I:%M %p")

            t_settings = {}
            if tenant and tenant.get("settings"):
                try:
                    t_settings = json.loads(tenant["settings"]) if isinstance(tenant["settings"], str) else dict(tenant["settings"])
                except Exception:
                    t_settings = {}

            wa_cred_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
                tenant_id
            )
            wa_creds = {}
            if wa_cred_row and wa_cred_row["credential_data"]:
                try:
                    wa_creds = json.loads(wa_cred_row["credential_data"]) if isinstance(wa_cred_row["credential_data"], str) else dict(wa_cred_row["credential_data"])
                except Exception:
                    wa_creds = {}

            customer_tpl = (
                t_settings.get("template_booking_confirmation") or
                wa_creds.get("template_booking_confirmation") or
                "booking_confirmationn"
            )
            is_mbr = (
                str(tenant_id) == "b97ca3e5-7d43-44cf-8021-6e3659def878"
                or ((tenant.get("slug") or "").lower() in ("mindbodyrecovery", "mind-body-recovery"))
                or ("mind body recovery" in (tenant.get("name") or "").lower())
            )
            if is_mbr:
                if customer_tpl in ("mbr_appointment_confirmed", "appointment_confirmation_simple"):
                    customer_params = [clean_name or "Valued Customer", date_str, time_str]
                else:
                    customer_params = [clean_name or "Valued Customer", "Appointment", date_str, time_str]
                wa_text = f"Appointment Confirmed! Hello {clean_name}, your appointment has been confirmed for {date_str} at {time_str}. Location: {tenant['name']}."
            else:
                customer_params = [clean_name, service_name, date_str, time_str]
                wa_text = f"Appointment Confirmed! Hello {clean_name}, your appointment for {service_name} is confirmed for {date_str} at {time_str}. Location: {tenant['name']}."

            tpl_resp = await dispatch_whatsapp_message(
                tenant_id,
                clean_phone,
                template_name=customer_tpl,
                template_params=customer_params
            )
            # Text fallback is strictly suppressed for message templates
            if not tpl_resp:
                logger.info("public_booking_wa_text_fallback_suppressed", template=customer_tpl, phone=clean_phone)

            # Record message in conversation history if template was sent
            if tpl_resp:
                try:
                    tpl_wamid = tpl_resp.get("messages", [{}])[0].get("id") if isinstance(tpl_resp, dict) else None
                    msg_body_record = wa_text
                    await conn.execute(
                        """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, template_name, template_params, status, ai_used_fallback)
                           VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, 'outbound', 'template', $4, $5, $6::jsonb, 'sent', false)""",
                        conv_id, tenant_id, tpl_wamid, msg_body_record, customer_tpl, json.dumps(customer_params or [])
                    )
                    await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", conv_id, tenant_id)
                except Exception as db_msg_err:
                    logger.warning("public_booking_msg_record_failed", error=str(db_msg_err))

            # 5b. Send location details if configured
            full_location = (wa_creds.get("full_location_text") or t_settings.get("full_location_text") or "").strip()
            if full_location:
                loc_msg = f"*Location & Directions:*\n{full_location}"
                loc_resp = await dispatch_whatsapp_message(tenant_id, clean_phone, text=loc_msg)
                if loc_resp:
                    try:
                        loc_wamid = loc_resp.get("messages", [{}])[0].get("id") if isinstance(loc_resp, dict) else None
                        await conn.execute(
                            """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, status, ai_used_fallback)
                               VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, 'outbound', 'text', $4, 'sent', false)""",
                            conv_id, tenant_id, loc_wamid, loc_msg
                        )
                    except Exception as db_loc_err:
                        logger.warning("public_booking_loc_msg_record_failed", error=str(db_loc_err))

            # 5c. Push Admin WhatsApp Alert via Meta admin_notification template
            admin_phone = (wa_creds.get("admin_whatsapp_number") or t_settings.get("admin_whatsapp_number") or "").strip()
            if admin_phone:
                admin_tpl = (
                    t_settings.get("template_admin_notification") or
                    wa_creds.get("template_admin_notification") or
                    "admin_notification"
                )
                clean_admin_phone = re.sub(r'[^0-9]', '', admin_phone)
                if len(clean_admin_phone) == 10:
                    clean_admin_phone = f"91{clean_admin_phone}"
                admin_params = [clean_name, clean_phone.replace("+", ""), service_name, date_str, time_str]
                await dispatch_whatsapp_message(tenant_id, clean_admin_phone, template_name=admin_tpl, template_params=admin_params)

        except Exception as e_wa:
            logger.warning("public_booking_wa_dispatch_failed", error=str(e_wa))

        # 6. Admin notification push
        try:
            await dispatch_push_notification(
                pool=database.db_pool,
                tenant_id=tenant_id,
                title="New Online Booking",
                body=f"{clean_name} booked {service_name} on {st_dt.strftime('%d %b at %I:%M %p')}",
                notif_type="booking",
                url=f"/{slug}#bookings"
            )
        except Exception:
            pass

        # 7. Trigger Google Calendar Sync (if configured)
        full_location = (wa_creds.get("full_location_text") if isinstance(wa_creds, dict) else None) or (tenant_settings.get("full_location_text") if isinstance(tenant_settings, dict) else "") or ""
        try:
            await create_google_calendar_event(
                conn=conn,
                tenant_id=tenant_id,
                booking_id=booking_id,
                service_name=service_name,
                clean_name=clean_name,
                clean_phone=clean_phone,
                notes=combined_notes,
                st_dt=st_dt,
                et_dt=et_dt,
                customer_email=payload.patient_email.strip() if payload.patient_email else None,
                source="Public Web Booking",
                date_str=st_dt.strftime("%d %b %Y"),
                clock_str=st_dt.strftime("%I:%M %p"),
                full_location=full_location
            )
        except Exception as e_gcal:
            logger.warning("public_booking_gcal_sync_failed", error=str(e_gcal))

        return {
            "status": "confirmed",
            "booking_id": booking_id,
            "doctor_name": staff or "",
            "health_concern": health_concern_str,
            "appointment_date": st_dt.strftime("%d %b %Y"),
            "appointment_time": st_dt.strftime("%I:%M %p"),
            "patient_name": clean_name,
            "patient_phone": clean_phone,
            "message": "Your appointment has been successfully booked! A confirmation message was sent to your WhatsApp."
        }


# ═══════════════════════════════════════════════════════════════════════════════
# 👥 SUPER-ADMIN STAFF ROLES & PERMISSIONS MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/tenants/{tenant_id}/staff")
async def list_tenant_staff(tenant_id: str, admin_user: dict = Depends(verify_super_admin)):
    """Lists all staff accounts for a tenant with roles and permissions."""
    async with database.db_pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, tenant_id, email, display_name, role, permissions, is_active, last_login_at, created_at
               FROM users WHERE tenant_id = $1::uuid
               ORDER BY (role = 'admin' OR role = 'super_admin') DESC, created_at ASC""",
            tenant_id
        )
        return [
            {
                "id": str(r["id"]),
                "tenant_id": str(r["tenant_id"]),
                "email": r["email"],
                "display_name": r["display_name"] or "",
                "role": r["role"],
                "permissions": safe_json_loads(r["permissions"], {}),
                "is_active": r["is_active"] if r["is_active"] is not None else True,
                "last_login_at": r["last_login_at"].isoformat() if r["last_login_at"] else None,
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ]

@router.post("/admin/tenants/{tenant_id}/staff")
async def create_tenant_staff(tenant_id: str, payload: StaffCreateRequest, admin_user: dict = Depends(verify_super_admin)):
    """Super Admin creates a new staff credential with role and permissions."""
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(400, "Valid email address is required")
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    async with database.db_pool.acquire() as conn:
        # Check tenant exists
        t = await conn.fetchrow("SELECT id FROM tenants WHERE id = $1::uuid", tenant_id)
        if not t:
            raise HTTPException(404, "Tenant not found")

        # Check existing user
        exists = await conn.fetchrow("SELECT id FROM users WHERE tenant_id = $1::uuid AND LOWER(email) = $2", tenant_id, clean_email)
        if exists:
            raise HTTPException(400, "A staff member with this email already exists in this organization")

        # Hash password
        pw_hash = bcrypt.hashpw(payload.password.encode("utf-8")[:72], bcrypt.gensalt(12)).decode("utf-8")
        perms = payload.permissions or {}
        user_id = str(uuid.uuid4())

        await conn.execute(
            """INSERT INTO users (id, tenant_id, email, password_hash, display_name, role, permissions, is_active, created_at, updated_at)
               VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::jsonb, true, now(), now())""",
            user_id, tenant_id, clean_email, pw_hash, payload.display_name.strip(), payload.role, json.dumps(perms)
        )

        return {
            "status": "created",
            "id": user_id,
            "email": clean_email,
            "display_name": payload.display_name.strip(),
            "role": payload.role,
            "permissions": perms
        }

@router.put("/admin/tenants/{tenant_id}/staff/{user_id}")
async def update_tenant_staff(tenant_id: str, user_id: str, payload: StaffUpdateRequest, admin_user: dict = Depends(verify_super_admin)):
    """Super Admin edits staff credentials, role, permissions, or resets password."""
    async with database.db_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id, email, role, permissions, is_active FROM users WHERE id = $1::uuid AND tenant_id = $2::uuid", user_id, tenant_id)
        if not user:
            raise HTTPException(404, "Staff member not found")

        updates = []
        vals = [user_id, tenant_id]

        if payload.display_name is not None:
            vals.append(payload.display_name.strip())
            updates.append(f"display_name = ${len(vals)}")

        if payload.role is not None:
            vals.append(payload.role.strip())
            updates.append(f"role = ${len(vals)}")

        if payload.permissions is not None:
            vals.append(json.dumps(payload.permissions))
            updates.append(f"permissions = ${len(vals)}::jsonb")

        if payload.is_active is not None:
            vals.append(payload.is_active)
            updates.append(f"is_active = ${len(vals)}")

        if payload.password and payload.password.strip():
            if len(payload.password.strip()) < 6:
                raise HTTPException(400, "Password must be at least 6 characters")
            pw_hash = bcrypt.hashpw(payload.password.strip().encode("utf-8")[:72], bcrypt.gensalt(12)).decode("utf-8")
            vals.append(pw_hash)
            updates.append(f"password_hash = ${len(vals)}")

        if updates:
            updates.append("updated_at = now()")
            sql = f"UPDATE users SET {', '.join(updates)} WHERE id = $1::uuid AND tenant_id = $2::uuid"
            await conn.execute(sql, *vals)

        return {"status": "updated", "id": user_id}

@router.delete("/admin/tenants/{tenant_id}/staff/{user_id}")
async def delete_tenant_staff(tenant_id: str, user_id: str, admin_user: dict = Depends(verify_super_admin)):
    """Super Admin removes a staff member from a tenant."""
    async with database.db_pool.acquire() as conn:
        # Protect super_admin account from deletion
        user = await conn.fetchrow("SELECT role, email FROM users WHERE id = $1::uuid AND tenant_id = $2::uuid", user_id, tenant_id)
        if not user:
            raise HTTPException(404, "Staff member not found")
        if user["role"] == "super_admin":
            raise HTTPException(400, "Cannot delete the super admin account")

        await conn.execute("DELETE FROM users WHERE id = $1::uuid AND tenant_id = $2::uuid", user_id, tenant_id)
        return {"status": "deleted", "id": user_id}

# ── Tenant Client Staff & Roles Endpoints ─────────────────────────────────────
@router.get("/staff")
@router.get("/api/v1/crm/staff")
async def client_list_staff(tenant_id: str = Depends(get_tenant_id)):
    """Tenant/Client lists all staff members in their organization."""
    async with database.db_pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, tenant_id, email, display_name, role, permissions, is_active, last_login_at, created_at
               FROM users WHERE tenant_id = $1::uuid
               ORDER BY (role IN ('super_admin', 'admin', 'owner')) DESC, created_at ASC""",
            tenant_id
        )
        return [
            {
                "id": str(r["id"]),
                "tenant_id": str(r["tenant_id"]),
                "email": r["email"],
                "display_name": r["display_name"] or "",
                "role": r["role"],
                "permissions": safe_json_loads(r["permissions"], {}),
                "is_active": r["is_active"] if r["is_active"] is not None else True,
                "last_login_at": r["last_login_at"].isoformat() if r["last_login_at"] else None,
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ]

@router.post("/staff")
@router.post("/api/v1/crm/staff")
async def client_create_staff(
    payload: StaffCreateRequest,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Tenant/Client creates a new team member (Sales, Doctor, Receptionist, Support)."""
    if caller.get("role") not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to manage staff.")
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(400, "Valid email address is required")
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    clean_role = (payload.role or "agent").strip().lower()
    ALLOWED_CLIENT_STAFF_ROLES = {"admin", "sales", "doctor", "receptionist", "marketing", "agent", "viewer"}
    if clean_role not in ALLOWED_CLIENT_STAFF_ROLES or clean_role == "super_admin":
        raise HTTPException(400, f"Invalid role. Permitted roles: {', '.join(sorted(ALLOWED_CLIENT_STAFF_ROLES))}")

    async with database.db_pool.acquire() as conn:
        exists = await conn.fetchrow("SELECT id FROM users WHERE tenant_id = $1::uuid AND LOWER(email) = $2", tenant_id, clean_email)
        if exists:
            raise HTTPException(400, "A staff member with this email already exists in your organization")

        pw_hash = bcrypt.hashpw(payload.password.encode("utf-8")[:72], bcrypt.gensalt(12)).decode("utf-8")
        perms = payload.permissions or {}
        user_id = str(uuid.uuid4())

        await conn.execute(
            """INSERT INTO users (id, tenant_id, email, password_hash, display_name, role, permissions, is_active, created_at, updated_at)
               VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::jsonb, true, now(), now())""",
            user_id, tenant_id, clean_email, pw_hash, payload.display_name.strip(), clean_role, json.dumps(perms)
        )

        return {
            "status": "created",
            "id": user_id,
            "email": clean_email,
            "display_name": payload.display_name.strip(),
            "role": clean_role,
            "permissions": perms
        }

@router.put("/staff/{user_id}")
@router.put("/api/v1/crm/staff/{user_id}")
async def client_update_staff(
    user_id: str,
    payload: StaffUpdateRequest,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Tenant/Client updates team member role, permissions, or password."""
    if caller.get("role") not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to manage staff.")
    ALLOWED_CLIENT_STAFF_ROLES = {"admin", "sales", "doctor", "receptionist", "marketing", "agent", "viewer"}
    async with database.db_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id, email, role, permissions, is_active FROM users WHERE id = $1::uuid AND tenant_id = $2::uuid", user_id, tenant_id)
        if not user:
            raise HTTPException(404, "Staff member not found")

        updates = []
        vals = [user_id, tenant_id]

        if payload.display_name is not None:
            vals.append(payload.display_name.strip())
            updates.append(f"display_name = ${len(vals)}")

        if payload.role is not None:
            clean_role = payload.role.strip().lower()
            if clean_role not in ALLOWED_CLIENT_STAFF_ROLES or clean_role == "super_admin":
                raise HTTPException(400, f"Invalid role. Permitted roles: {', '.join(sorted(ALLOWED_CLIENT_STAFF_ROLES))}")
            vals.append(clean_role)
            updates.append(f"role = ${len(vals)}")

        if payload.permissions is not None:
            vals.append(json.dumps(payload.permissions))
            updates.append(f"permissions = ${len(vals)}::jsonb")

        if payload.is_active is not None:
            vals.append(payload.is_active)
            updates.append(f"is_active = ${len(vals)}")

        if payload.password and payload.password.strip():
            if len(payload.password.strip()) < 6:
                raise HTTPException(400, "Password must be at least 6 characters")
            pw_hash = bcrypt.hashpw(payload.password.strip().encode("utf-8")[:72], bcrypt.gensalt(12)).decode("utf-8")
            vals.append(pw_hash)
            updates.append(f"password_hash = ${len(vals)}")

        if updates:
            updates.append("updated_at = now()")
            sql = f"UPDATE users SET {', '.join(updates)} WHERE id = $1::uuid AND tenant_id = $2::uuid"
            await conn.execute(sql, *vals)

        return {"status": "updated", "id": user_id}

@router.delete("/staff/{user_id}")
@router.delete("/api/v1/crm/staff/{user_id}")
async def client_delete_staff(
    user_id: str,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Tenant/Client deletes a team member."""
    if caller.get("role") not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to manage staff.")
    async with database.db_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT role, email FROM users WHERE id = $1::uuid AND tenant_id = $2::uuid", user_id, tenant_id)
        if not user:
            raise HTTPException(404, "Staff member not found")
        if user["role"] == "super_admin":
            raise HTTPException(400, "Cannot delete the super admin account")

        await conn.execute("DELETE FROM users WHERE id = $1::uuid AND tenant_id = $2::uuid", user_id, tenant_id)
        return {"status": "deleted", "id": user_id}
