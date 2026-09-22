import os
import re
import json
import uuid
import asyncio
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Union
import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import database
from models import TenantSettingsUpdate
from dependencies import get_tenant_id, get_caller_context
from utils import APP_BASE_URL
from routers.marketing import execute_meta_template_sync

router = APIRouter()
logger = structlog.get_logger('settings')

@router.get("/settings")
async def get_tenant_settings(
    tenant_id: str = Depends(get_tenant_id),
    target_tenant_id: Optional[str] = Query(None),
    caller: dict = Depends(get_caller_context)
):
    """Retrieve full settings for the currently logged-in tenant / client."""
    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    if isinstance(target_tenant_id, str) and target_tenant_id.strip() and caller_role == "super_admin":
        tenant_id = target_tenant_id.strip()
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow(
            """
            SELECT id, name, slug, plan, is_active, settings,
                   subscription_status, org_lifecycle_stage,
                   razorpay_customer_id, razorpay_subscription_id, razorpay_short_url,
                   next_charge_at, last_payment_status, last_charge_at, created_at
            FROM tenants WHERE id = $1::uuid
            """,
            tenant_id
        )
        if not tenant:
            raise HTTPException(404, "Tenant not found")

        tenant_settings = tenant["settings"] if tenant and tenant["settings"] else {}
        if isinstance(tenant_settings, str):
            try: tenant_settings = json.loads(tenant_settings)
            except: tenant_settings = {}
        logo_url = tenant_settings.get("logo_url", "")

        wa_cred_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
            tenant_id
        )
        wa_data = {}
        if wa_cred_row and wa_cred_row["credential_data"]:
            d = wa_cred_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            wa_data = dict(d)

        gemini_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'gemini' AND is_active = true",
            tenant_id
        )
        gem_key = ""
        if gemini_row and gemini_row["credential_data"]:
            d = gemini_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            gem_key = d.get("api_key", "")

        groq_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'groq' AND is_active = true",
            tenant_id
        )
        groq_key = ""
        if groq_row and groq_row["credential_data"]:
            d = groq_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            groq_key = d.get("api_key", "")

        opencode_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'opencode' AND is_active = true",
            tenant_id
        )
        opencode_key = ""
        opencode_base = "https://opencode.ai/zen/v1"
        if opencode_row and opencode_row["credential_data"]:
            d = opencode_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            opencode_key = d.get("api_key", "")
            opencode_base = d.get("base_url") or "https://opencode.ai/zen/v1"

        gcal_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
            tenant_id
        )
        gcal_data = {}
        if gcal_row and gcal_row["credential_data"]:
            d = gcal_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            gcal_data = dict(d)

        ai_cfg_row = await conn.fetchrow("SELECT * FROM ai_config WHERE tenant_id = $1::uuid", tenant_id)
        ai_cfg = dict(ai_cfg_row) if ai_cfg_row else {}

        admin_user_row = await conn.fetchrow(
            "SELECT email, display_name FROM users WHERE tenant_id = $1::uuid AND role IN ('admin', 'super_admin') ORDER BY (role = 'admin') DESC, created_at ASC LIMIT 1",
            tenant_id
        )

    def mask_secret(val: Optional[str]) -> str:
        if not val:
            return ""
        s = str(val).strip()
        if not s:
            return ""
        if len(s) <= 4:
            return "••••"
        return "••••••••" + s[-4:]

    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    is_privileged = caller_role in ("admin", "owner", "super_admin")

    res_meta_access_token = wa_data.get("access_token", "") if is_privileged else mask_secret(wa_data.get("access_token", ""))
    res_meta_app_secret = wa_data.get("app_secret", "") if is_privileged else mask_secret(wa_data.get("app_secret", ""))
    res_gemini_key = gem_key if is_privileged else mask_secret(gem_key)
    res_groq_key = groq_key if is_privileged else mask_secret(groq_key)
    res_opencode_key = opencode_key if is_privileged else mask_secret(opencode_key)
    res_google_client_secret = gcal_data.get("client_secret", "") if is_privileged else mask_secret(gcal_data.get("client_secret", ""))
    res_google_refresh_token = gcal_data.get("refresh_token", "") if is_privileged else mask_secret(gcal_data.get("refresh_token", ""))

    return {
        "tenant_id": str(tenant["id"]),
        "name": tenant["name"],
        "slug": tenant["slug"],
        "logo_url": logo_url,
        "webhook_url": f"{APP_BASE_URL}/webhooks/whatsapp/{tenant['slug']}",
        
        # Meta WhatsApp
        "meta_phone_id": wa_data.get("phone_number_id", ""),
        "meta_waba_id": wa_data.get("waba_id", ""),
        "meta_access_token": res_meta_access_token,
        "meta_app_secret": res_meta_app_secret,
        "verify_token": wa_data.get("verify_token", "") if is_privileged else mask_secret(wa_data.get("verify_token", "")),
        "has_access_token": bool(wa_data.get("access_token")),
        "has_app_secret": bool(wa_data.get("app_secret")),
        
        # AI Config & BYOK
        "primary_model_provider": wa_data.get("primary_model_provider", "groq" if groq_key else "gemini"),
        "ai_model": ai_cfg.get("model", "gemini-3.1-flash-lite"),
        "gemini_api_key": res_gemini_key,
        "groq_api_key": res_groq_key,
        "opencode_api_key": res_opencode_key,
        "opencode_base_url": opencode_base,
        "has_gemini_key": bool(gem_key),
        "has_groq_key": bool(groq_key),
        "has_opencode_key": bool(opencode_key),
        "assistant_name": ai_cfg.get("assistant_name", "Assistant"),
        "bot_goal": ai_cfg.get("bot_goal", ""),
        "services_text": ai_cfg.get("services_text", ""),
        "ai_prompt": ai_cfg.get("system_prompt", ""),
        "response_style": ai_cfg.get("response_style", "short"),
        "methodology": ai_cfg.get("methodology", "dogfooding"),
        "strict_rules": ai_cfg.get("strict_rules", ""),
        "objection_handling": ai_cfg.get("objection_handling", ""),
        
        # Location, Region & Templates
        "full_location_text": wa_data.get("full_location_text") or tenant_settings.get("full_location_text", ""),
        "timezone": tenant_settings.get("timezone", "Asia/Kolkata"),
        "country_code": tenant_settings.get("country_code", "+91"),
        "currency": tenant_settings.get("currency", "INR"),
        "currency_symbol": tenant_settings.get("currency_symbol", "₹"),
        "admin_name": tenant_settings.get("admin_name", "") or (admin_user_row["display_name"] if admin_user_row else ""),
        "admin_email": admin_user_row["email"] if admin_user_row else "",
        "admin_whatsapp_number": wa_data.get("admin_whatsapp_number") or tenant_settings.get("admin_whatsapp_number", ""),
        "template_booking_confirmation": wa_data.get("template_booking_confirmation") or tenant_settings.get("template_booking_confirmation", "booking_confirmationn"),
        "template_admin_notification": wa_data.get("template_admin_notification") or tenant_settings.get("template_admin_notification", "admin_notification"),
        "template_admin_human_request": wa_data.get("template_admin_human_request") or tenant_settings.get("template_admin_human_request", "admin_human_request"),
        "template_cancellation_confirmation": wa_data.get("template_cancellation_confirmation") or tenant_settings.get("template_cancellation_confirmation", "cancellation_confirmation"),
        "template_admin_cancellation_notice": wa_data.get("template_admin_cancellation_notice") or tenant_settings.get("template_admin_cancellation_notice", "admin_cancellation_notice"),
        "template_reschedule_confirmation": wa_data.get("template_reschedule_confirmation") or tenant_settings.get("template_reschedule_confirmation", "booking_reschedule_confirmation"),
        "template_admin_reschedule_notice": wa_data.get("template_admin_reschedule_notice") or tenant_settings.get("template_admin_reschedule_notice", "admin_reschedule_notice"),
        "template_post_service_review": wa_data.get("template_post_service_review") if wa_data.get("template_post_service_review") is not None else tenant_settings.get("template_post_service_review", ""),
        "template_appointment_reminder": wa_data.get("template_appointment_reminder") or tenant_settings.get("template_appointment_reminder", "appointment_ramainder"),
        "template_reschedule_nudge": wa_data.get("template_reschedule_nudge") or tenant_settings.get("template_reschedule_nudge", "reschedule_nudge"),
        "template_review_request": wa_data.get("template_review_request") if wa_data.get("template_review_request") is not None else tenant_settings.get("template_review_request", ""),
        "template_admin_daily_digest": wa_data.get("template_admin_daily_digest") or tenant_settings.get("template_admin_daily_digest", "admin_daily_digest"),
        "template_admin_appointment_reminder": wa_data.get("template_admin_appointment_reminder") or tenant_settings.get("template_admin_appointment_reminder", "admin_appointment_reminder"),
        "template_client_followup": wa_data.get("template_client_followup") or tenant_settings.get("template_client_followup", "client_followup_checkin"),
        "google_review_link": (tenant_settings.get("gmb_review_url") or tenant_settings.get("google_review_link") or wa_data.get("google_review_link") or wa_data.get("gmb_review_url") or "").strip(),
        "enable_auto_review": tenant_settings.get("enable_auto_review", True) if tenant_settings.get("enable_auto_review") is not None else True,
        "allow_text_fallback": tenant_settings.get("allow_text_fallback", False) if tenant_settings.get("allow_text_fallback") is not None else False,
        "disable_template_text_fallback": tenant_settings.get("disable_template_text_fallback", True) if tenant_settings.get("disable_template_text_fallback") is not None else True,
        
        # Google Calendar
        "google_client_id": gcal_data.get("client_id", ""),
        "google_client_secret": res_google_client_secret,
        "google_refresh_token": res_google_refresh_token,
        "google_calendar_id": gcal_data.get("calendar_id", "primary"),
        "notification_email": gcal_data.get("notification_email") or tenant_settings.get("notification_email", ""),
        "google_calendar_configured": bool(gcal_data.get("client_id") and gcal_data.get("refresh_token")),
        
        # Industry & Taxonomy
        "industry": tenant_settings.get("industry", "clinic"),
        "taxonomy": tenant_settings.get("taxonomy", {
            "staff_label": "Preferred Doctor / Staff",
            "client_label": "Patient / Customer",
            "requirement_label": "Health Concern / Treatment",
            "event_label": "Appointment",
            "booking_cta": "Schedule Appointment",
        }),
        "opening_time": tenant_settings.get("opening_time", "09:00"),
        "closing_time": tenant_settings.get("closing_time", "20:00"),
        "review_experience_tags": tenant_settings.get("review_experience_tags") or [
            'Friendly & Caring Staff',
            'Clean & Hygienic Space',
            'Quick & Prompt Service',
            'Detailed Explanation',
            'Great Results & Treatment',
            'Value for Money',
            'Comfortable & Relaxing',
            'Easy Booking & Response'
        ],
        "requirement_presets": (
            (tenant_settings.get("taxonomy") or {}).get("requirement_presets")
            if isinstance(tenant_settings.get("taxonomy"), dict)
            else tenant_settings.get("requirement_presets")
        ) or [],
        "gmb_review_url": (tenant_settings.get("gmb_review_url") or tenant_settings.get("google_review_link") or wa_data.get("google_review_link") or wa_data.get("gmb_review_url") or "").strip(),
        "slot_booking_mode": tenant_settings.get("slot_booking_mode", "single"),
        "max_concurrent_bookings": tenant_settings.get("max_concurrent_bookings", 1),

        # Razorpay Subscription & Organization Lifecycle
        "plan": tenant.get("plan") or "pro",
        "monthly_price": float(tenant_settings.get("monthly_price") or (999.0 if (tenant.get("plan") or "").lower() == "starter" else (9999.0 if (tenant.get("plan") or "").lower() == "enterprise" else 2630.0))),
        "currency": tenant_settings.get("currency", "INR"),
        "currency_symbol": tenant_settings.get("currency_symbol") or "₹",
        "org_lifecycle_stage": tenant.get("org_lifecycle_stage") or "setup",
        "subscription_status": tenant.get("subscription_status") or "active",
        "razorpay_customer_id": tenant.get("razorpay_customer_id") or "",
        "razorpay_subscription_id": tenant.get("razorpay_subscription_id") or (f"sub_{tenant.get('slug')}" if tenant.get("slug") else ""),
        "razorpay_short_url": (
            "" if "boldlabs-crm" in (tenant.get("razorpay_short_url") or tenant_settings.get("razorpay_short_url") or tenant_settings.get("payment_link") or "")
            else (tenant.get("razorpay_short_url") or tenant_settings.get("razorpay_short_url") or tenant_settings.get("payment_link") or "")
        ),
        "next_charge_at": (
            tenant["next_charge_at"].isoformat()
            if tenant.get("next_charge_at")
            else (
                # Dynamically calculate next monthly renewal anniversary
                (lambda: (
                    (lambda now, b_day: (
                        (datetime(now.year, now.month, min(b_day, 28), tzinfo=timezone.utc)
                         if datetime(now.year, now.month, min(b_day, 28), tzinfo=timezone.utc) > now
                         else (datetime(now.year + 1, 1, min(b_day, 28), tzinfo=timezone.utc)
                               if now.month == 12
                               else datetime(now.year, now.month + 1, min(b_day, 28), tzinfo=timezone.utc)))
                    ).isoformat())
                    (datetime.now(timezone.utc), int(tenant_settings.get("billing_cycle_day") or (tenant["created_at"].day if tenant.get("created_at") else 30) or 30))
                ))()
            )
        ),
        "last_payment_status": tenant.get("last_payment_status") or "paid",
        "last_charge_at": tenant["last_charge_at"].isoformat() if tenant.get("last_charge_at") else (tenant["created_at"].isoformat() if tenant.get("created_at") else None),

        # White-Label & Partner Settings
        "custom_domain": tenant_settings.get("custom_domain") or "",
        "brand_name": tenant_settings.get("brand_name") or tenant["name"],
        "brand_logo_url": tenant_settings.get("brand_logo_url") or logo_url or "",
        "brand_favicon_url": tenant_settings.get("brand_favicon_url") or "",
        "brand_primary_color": tenant_settings.get("brand_primary_color") or "#059669",
        "brand_support_email": tenant_settings.get("brand_support_email") or "",
        "brand_support_phone": tenant_settings.get("brand_support_phone") or "",
        "hide_platform_branding": tenant_settings.get("hide_platform_branding", False),
        "sales_channel": tenant_settings.get("sales_channel", "direct"),
        "partner_name": tenant_settings.get("partner_name", ""),
        "partner_share_pct": float(tenant_settings.get("partner_share_pct") or 0.0),
        "owner_share_pct": float(tenant_settings.get("owner_share_pct") or 100.0),

        # Missed Call → WhatsApp Auto-Reply
        "missed_call_webhook_token": (
            tenant_settings.get("missed_call_token")
            or hashlib.sha256(f"{tenant_id}:{os.environ.get('JWT_SECRET', '')}:missed-call".encode()).hexdigest()[:16]
        ),
        "template_missed_call": tenant_settings.get("template_missed_call", "missed_call_followup"),
    }




@router.get("/settings/ai-usage")
async def get_ai_usage_stats(
    tenant_id: str = Depends(get_tenant_id),
    target_tenant_id: Optional[str] = Query(None),
    caller: dict = Depends(get_caller_context)
):
    """Retrieve 30-day AI message usage stats (without exposing model names)."""
    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    if isinstance(target_tenant_id, str) and target_tenant_id.strip() and caller_role == "super_admin":
        tenant_id = target_tenant_id.strip()
        
    async with database.db_pool.acquire() as conn:
        totals_row = await conn.fetchrow("""
            SELECT 
                COUNT(*) as total_replies,
                AVG(processing_ms) as avg_speed_ms
            FROM messages 
            WHERE tenant_id = $1::uuid 
              AND direction = 'outbound' 
              AND ai_model_used IS NOT NULL
              AND created_at >= NOW() - INTERVAL '30 days'
        """, tenant_id)

        daily_rows = await conn.fetch("""
            SELECT 
                DATE(timezone('Asia/Kolkata', created_at)) as date,
                COUNT(*) as count
            FROM messages
            WHERE tenant_id = $1::uuid 
              AND direction = 'outbound' 
              AND ai_model_used IS NOT NULL
              AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(timezone('Asia/Kolkata', created_at))
            ORDER BY date ASC
        """, tenant_id)
        
        daily_stats = []
        for r in daily_rows:
            daily_stats.append({
                "date": r["date"].isoformat() if r["date"] else "",
                "count": r["count"]
            })

    total_replies = totals_row["total_replies"] if totals_row and totals_row["total_replies"] else 0
    avg_speed_ms = totals_row["avg_speed_ms"] if totals_row and totals_row["avg_speed_ms"] else 0

    return {
        "total_replies_30d": total_replies,
        "avg_speed_ms": float(avg_speed_ms) if avg_speed_ms else 0.0,
        "daily_stats": daily_stats
    }

@router.get("/public/branding")
@router.get("/api/public/branding")
@router.get("/api/v1/crm/public/branding")
async def get_public_branding(domain: Optional[str] = Query(None), slug: Optional[str] = Query(None)):
    """
    Public metadata endpoint for dynamic white-label theme injection and brand identity.
    Resolves branding by custom domain or tenant slug.
    Falls back to default Boldlabs platform identity if domain is default or unmatched.
    """
    default_branding = {
        "is_whitelabel": False,
        "brand_name": "Boldlabs CRM",
        "brand_logo_url": "",
        "brand_favicon_url": "/favicon.ico",
        "brand_primary_color": "#059669",
        "brand_support_email": "support@goboldlabs.com",
        "brand_support_phone": "+91 99999 99999",
        "hide_platform_branding": False,
        "custom_domain": None,
        "tenant_id": None,
        "tenant_slug": None,
        "tenant_name": "Boldlabs",
    }

    clean_domain = ""
    if domain:
        clean_domain = domain.strip().lower()
        clean_domain = re.sub(r"^https?://", "", clean_domain)
        clean_domain = clean_domain.split(":")[0].split("/")[0].strip()

    clean_slug = slug.strip().lower() if slug else ""

    # Known platform defaults that use standard Boldlabs branding
    if (not clean_domain or clean_domain in ("crm.goboldlabs.com", "goboldlabs.com", "localhost", "127.0.0.1", "168.138.172.197")) and not clean_slug:
        return default_branding

    async with database.db_pool.acquire() as conn:
        tenant = None
        partner = None

        if clean_domain and clean_domain not in ("crm.goboldlabs.com", "goboldlabs.com", "localhost", "127.0.0.1", "168.138.172.197"):
            alt_domain = clean_domain[4:] if clean_domain.startswith("www.") else f"www.{clean_domain}"
            tenant = await conn.fetchrow(
                """
                SELECT id, name, slug, settings
                FROM tenants
                WHERE LOWER(TRIM(COALESCE(settings->>'custom_domain', ''))) = $1
                   OR LOWER(TRIM(COALESCE(settings->>'custom_domain', ''))) = $2
                LIMIT 1
                """,
                clean_domain,
                alt_domain
            )
            # Also check partner agency templates for partner white-label domain
            partner = await conn.fetchrow(
                """
                SELECT *
                FROM partner_agency_templates
                WHERE LOWER(TRIM(COALESCE(custom_domain, ''))) = $1
                   OR LOWER(TRIM(COALESCE(custom_domain, ''))) = $2
                LIMIT 1
                """,
                clean_domain,
                alt_domain
            )

        if not tenant and clean_slug:
            tenant = await conn.fetchrow(
                """
                SELECT id, name, slug, settings
                FROM tenants
                WHERE LOWER(slug) = $1
                LIMIT 1
                """,
                clean_slug
            )

        # If tenant has a partner_name, resolve partner template for fallback branding
        if tenant and not partner:
            t_settings = tenant["settings"] if tenant and tenant["settings"] else {}
            if isinstance(t_settings, str):
                try: t_settings = json.loads(t_settings)
                except Exception: t_settings = {}
            t_partner = (t_settings.get("partner_name") or "").strip()
            if t_partner:
                partner = await conn.fetchrow(
                    "SELECT * FROM partner_agency_templates WHERE LOWER(partner_name) = $1 LIMIT 1",
                    t_partner.lower()
                )

    if not tenant and not partner:
        return default_branding

    s = tenant["settings"] if tenant and tenant["settings"] else {}
    if isinstance(s, str):
        try:
            s = json.loads(s)
        except Exception:
            s = {}

    p_dict = dict(partner) if partner else {}
    c_dom = (s.get("custom_domain") or p_dict.get("custom_domain") or "").strip().lower()
    b_name = (s.get("brand_name") or p_dict.get("brand_name") or (tenant["name"] if tenant else "") or p_dict.get("partner_name") or "Boldlabs CRM").strip()
    b_logo = (s.get("brand_logo_url") or s.get("logo_url") or p_dict.get("brand_logo_url") or "").strip()
    b_fav = (s.get("brand_favicon_url") or p_dict.get("brand_favicon_url") or "/favicon.ico").strip()
    b_color = (s.get("brand_primary_color") or p_dict.get("brand_primary_color") or "#059669").strip()
    b_email = (s.get("brand_support_email") or p_dict.get("brand_support_email") or "").strip()
    b_phone = (s.get("brand_support_phone") or p_dict.get("brand_support_phone") or "").strip()

    hide_platform = bool(s.get("hide_platform_branding", p_dict.get("hide_platform_branding", True if (c_dom or partner) else False)))
    is_wl = bool(c_dom or partner)

    return {
        "is_whitelabel": is_wl,
        "brand_name": b_name,
        "brand_logo_url": b_logo,
        "brand_favicon_url": b_fav or "/favicon.ico",
        "brand_primary_color": b_color,
        "brand_support_email": b_email,
        "brand_support_phone": b_phone,
        "hide_platform_branding": hide_platform,
        "custom_domain": c_dom or clean_domain or None,
        "tenant_id": str(tenant["id"]) if tenant else None,
        "tenant_slug": tenant["slug"] if tenant else None,
        "tenant_name": tenant["name"] if tenant else b_name,
        "partner_name": (s.get("partner_name") or p_dict.get("partner_name") or "").strip() or None,
    }


@router.put("/settings")
@router.patch("/settings")
async def update_tenant_settings(
    payload: TenantSettingsUpdate,
    tenant_id: str = Depends(get_tenant_id),
    target_tenant_id: Optional[str] = Query(None),
    caller: dict = Depends(get_caller_context)
):
    """Update settings & credentials for the currently logged-in tenant."""
    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    if caller_role not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to update settings.")
    if caller_role == "super_admin":
        eff_target = None
        if isinstance(target_tenant_id, str) and target_tenant_id.strip():
            eff_target = target_tenant_id.strip()
        elif payload and payload.target_tenant_id and isinstance(payload.target_tenant_id, str) and payload.target_tenant_id.strip():
            eff_target = payload.target_tenant_id.strip()
        elif payload and payload.tenant_id and isinstance(payload.tenant_id, str) and payload.tenant_id.strip():
            eff_target = payload.tenant_id.strip()
        if eff_target:
            tenant_id = eff_target
    async with database.db_pool.acquire() as conn:
        # 1. Update tenant table settings & branding
        if payload.name:
            await conn.execute("UPDATE tenants SET name = $1 WHERE id = $2::uuid", payload.name.strip(), tenant_id)

        t_row = await conn.fetchrow("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
        cur_settings = t_row["settings"] if t_row and t_row["settings"] else {}
        if isinstance(cur_settings, str):
            try: cur_settings = json.loads(cur_settings)
            except: cur_settings = {}

        if payload.admin_name is not None:
            cur_settings["admin_name"] = payload.admin_name.strip()
            if payload.admin_name.strip():
                await conn.execute(
                    "UPDATE users SET display_name = $1 WHERE tenant_id = $2::uuid AND role IN ('admin', 'super_admin')",
                    payload.admin_name.strip(), tenant_id
                )

        if payload.logo_url is not None: cur_settings["logo_url"] = payload.logo_url.strip()
        if payload.timezone is not None: cur_settings["timezone"] = payload.timezone.strip()
        if payload.country_code is not None: cur_settings["country_code"] = payload.country_code.strip()
        if payload.currency is not None: cur_settings["currency"] = payload.currency.strip()
        if getattr(payload, "gmb_review_url", None) is not None: cur_settings["gmb_review_url"] = payload.gmb_review_url.strip()
        if payload.currency_symbol is not None: cur_settings["currency_symbol"] = payload.currency_symbol.strip()
        if payload.notification_email is not None: cur_settings["notification_email"] = payload.notification_email.strip()
        if payload.admin_whatsapp_number is not None: cur_settings["admin_whatsapp_number"] = payload.admin_whatsapp_number.strip()
        if payload.google_review_link is not None: cur_settings["google_review_link"] = payload.google_review_link.strip()
        effective_gmb_save = (cur_settings.get("gmb_review_url") or cur_settings.get("google_review_link") or "").strip()
        if effective_gmb_save:
            cur_settings["gmb_review_url"] = effective_gmb_save
            cur_settings["google_review_link"] = effective_gmb_save
        if payload.enable_auto_review is not None: cur_settings["enable_auto_review"] = payload.enable_auto_review
        if payload.full_location_text is not None: cur_settings["full_location_text"] = payload.full_location_text.strip()
        if payload.industry is not None: cur_settings["industry"] = payload.industry.strip()
        if payload.taxonomy is not None: cur_settings["taxonomy"] = payload.taxonomy
        if payload.requirement_presets is not None:
            if not isinstance(cur_settings.get("taxonomy"), dict):
                cur_settings["taxonomy"] = {}
            cur_settings["taxonomy"]["requirement_presets"] = payload.requirement_presets
            cur_settings["requirement_presets"] = payload.requirement_presets
        if payload.review_experience_tags is not None:
            cur_settings["review_experience_tags"] = payload.review_experience_tags
        if payload.opening_time is not None: cur_settings["opening_time"] = payload.opening_time.strip()
        if payload.closing_time is not None: cur_settings["closing_time"] = payload.closing_time.strip()
        if payload.slot_booking_mode is not None: cur_settings["slot_booking_mode"] = payload.slot_booking_mode.strip().lower()
        if payload.max_concurrent_bookings is not None: cur_settings["max_concurrent_bookings"] = int(payload.max_concurrent_bookings)

        # Dual-sync all 12 configurable template names into tenants.settings
        if payload.template_booking_confirmation is not None: cur_settings["template_booking_confirmation"] = payload.template_booking_confirmation.strip()
        if payload.template_admin_notification is not None: cur_settings["template_admin_notification"] = payload.template_admin_notification.strip()
        if payload.template_admin_human_request is not None: cur_settings["template_admin_human_request"] = payload.template_admin_human_request.strip()
        if payload.template_cancellation_confirmation is not None: cur_settings["template_cancellation_confirmation"] = payload.template_cancellation_confirmation.strip()
        if payload.template_admin_cancellation_notice is not None: cur_settings["template_admin_cancellation_notice"] = payload.template_admin_cancellation_notice.strip()
        if payload.template_reschedule_confirmation is not None: cur_settings["template_reschedule_confirmation"] = payload.template_reschedule_confirmation.strip()
        if payload.template_admin_reschedule_notice is not None: cur_settings["template_admin_reschedule_notice"] = payload.template_admin_reschedule_notice.strip()
        if payload.template_post_service_review is not None: cur_settings["template_post_service_review"] = payload.template_post_service_review.strip()
        if payload.template_appointment_reminder is not None: cur_settings["template_appointment_reminder"] = payload.template_appointment_reminder.strip()
        if payload.template_reschedule_nudge is not None: cur_settings["template_reschedule_nudge"] = payload.template_reschedule_nudge.strip()
        if payload.template_review_request is not None: cur_settings["template_review_request"] = payload.template_review_request.strip()
        if payload.template_admin_daily_digest is not None: cur_settings["template_admin_daily_digest"] = payload.template_admin_daily_digest.strip()
        if payload.template_admin_appointment_reminder is not None: cur_settings["template_admin_appointment_reminder"] = payload.template_admin_appointment_reminder.strip()
        if payload.template_client_followup is not None: cur_settings["template_client_followup"] = payload.template_client_followup.strip()
        if payload.allow_text_fallback is not None: cur_settings["allow_text_fallback"] = payload.allow_text_fallback
        if payload.disable_template_text_fallback is not None: cur_settings["disable_template_text_fallback"] = payload.disable_template_text_fallback
        if getattr(payload, "razorpay_short_url", None) is not None:
            cur_settings["razorpay_short_url"] = payload.razorpay_short_url.strip()
            await conn.execute("UPDATE tenants SET razorpay_short_url = $1 WHERE id = $2::uuid", payload.razorpay_short_url.strip(), tenant_id)
        if getattr(payload, "monthly_price", None) is not None:
            cur_settings["monthly_price"] = float(payload.monthly_price)

        # White-Label & Partner Settings persistence
        if payload.custom_domain is not None:
            cur_settings["custom_domain"] = payload.custom_domain.strip().lower()
        if payload.brand_name is not None:
            cur_settings["brand_name"] = payload.brand_name.strip()
        if payload.brand_logo_url is not None:
            cur_settings["brand_logo_url"] = payload.brand_logo_url.strip()
        if payload.brand_favicon_url is not None:
            cur_settings["brand_favicon_url"] = payload.brand_favicon_url.strip()
        if payload.brand_primary_color is not None:
            cur_settings["brand_primary_color"] = payload.brand_primary_color.strip()
        if payload.brand_support_email is not None:
            cur_settings["brand_support_email"] = payload.brand_support_email.strip()
        if payload.brand_support_phone is not None:
            cur_settings["brand_support_phone"] = payload.brand_support_phone.strip()
        if payload.hide_platform_branding is not None:
            cur_settings["hide_platform_branding"] = bool(payload.hide_platform_branding)
        if getattr(payload, "sales_channel", None) is not None:
            cur_settings["sales_channel"] = payload.sales_channel.strip()
        if getattr(payload, "partner_name", None) is not None:
            cur_settings["partner_name"] = payload.partner_name.strip()
        if getattr(payload, "partner_share_pct", None) is not None:
            cur_settings["partner_share_pct"] = float(payload.partner_share_pct)
        if getattr(payload, "owner_share_pct", None) is not None:
            cur_settings["owner_share_pct"] = float(payload.owner_share_pct)

        await conn.execute(
            "UPDATE tenants SET settings = $1::jsonb WHERE id = $2::uuid",
            json.dumps(cur_settings), tenant_id
        )

        # 2. Update WhatsApp credentials & location/templates
        wa_row = await conn.fetchrow("SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp'", tenant_id)
        wa_data = {}
        wa_cred_id = str(wa_row["id"]) if wa_row else str(uuid.uuid4())
        if wa_row and wa_row["credential_data"]:
            d = wa_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            wa_data = dict(d)

        if payload.meta_phone_id is not None: wa_data["phone_number_id"] = payload.meta_phone_id.strip()
        if payload.meta_waba_id is not None: wa_data["waba_id"] = payload.meta_waba_id.strip()
        if payload.meta_access_token is not None and payload.meta_access_token.strip(): wa_data["access_token"] = payload.meta_access_token.strip()
        if payload.meta_app_secret is not None and payload.meta_app_secret.strip(): wa_data["app_secret"] = payload.meta_app_secret.strip()
        if payload.verify_token is not None: wa_data["verify_token"] = payload.verify_token.strip()
        if payload.full_location_text is not None: wa_data["full_location_text"] = payload.full_location_text.strip()
        if payload.admin_whatsapp_number is not None: wa_data["admin_whatsapp_number"] = payload.admin_whatsapp_number.strip()
        if payload.template_booking_confirmation is not None: wa_data["template_booking_confirmation"] = payload.template_booking_confirmation.strip()
        if payload.template_admin_notification is not None: wa_data["template_admin_notification"] = payload.template_admin_notification.strip()
        if payload.template_admin_human_request is not None: wa_data["template_admin_human_request"] = payload.template_admin_human_request.strip()
        if payload.template_cancellation_confirmation is not None: wa_data["template_cancellation_confirmation"] = payload.template_cancellation_confirmation.strip()
        if payload.template_admin_cancellation_notice is not None: wa_data["template_admin_cancellation_notice"] = payload.template_admin_cancellation_notice.strip()
        if payload.template_reschedule_confirmation is not None: wa_data["template_reschedule_confirmation"] = payload.template_reschedule_confirmation.strip()
        if payload.template_admin_reschedule_notice is not None: wa_data["template_admin_reschedule_notice"] = payload.template_admin_reschedule_notice.strip()
        if payload.template_post_service_review is not None: wa_data["template_post_service_review"] = payload.template_post_service_review.strip()
        if payload.template_appointment_reminder is not None: wa_data["template_appointment_reminder"] = payload.template_appointment_reminder.strip()
        if payload.template_reschedule_nudge is not None: wa_data["template_reschedule_nudge"] = payload.template_reschedule_nudge.strip()
        if payload.template_review_request is not None: wa_data["template_review_request"] = payload.template_review_request.strip()
        if payload.template_admin_daily_digest is not None: wa_data["template_admin_daily_digest"] = payload.template_admin_daily_digest.strip()
        if payload.template_admin_appointment_reminder is not None: wa_data["template_admin_appointment_reminder"] = payload.template_admin_appointment_reminder.strip()
        if getattr(payload, "google_review_link", None) is not None or getattr(payload, "gmb_review_url", None) is not None:
            eff_gmb = (getattr(payload, "gmb_review_url", None) or getattr(payload, "google_review_link", None) or "").strip()
            wa_data["google_review_link"] = eff_gmb
            wa_data["gmb_review_url"] = eff_gmb
        if payload.primary_model_provider is not None: wa_data["primary_model_provider"] = payload.primary_model_provider.strip()
        if payload.allow_text_fallback is not None: wa_data["allow_text_fallback"] = payload.allow_text_fallback
        if payload.disable_template_text_fallback is not None: wa_data["disable_template_text_fallback"] = payload.disable_template_text_fallback

        if wa_row:
            await conn.execute("UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid", json.dumps(wa_data), wa_cred_id)
        else:
            await conn.execute("INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'whatsapp', $3::jsonb, true)", wa_cred_id, tenant_id, json.dumps(wa_data))

        # Auto-provision Meta templates if WABA credentials are present or updated
        if wa_data.get("waba_id") and wa_data.get("access_token"):
            try:
                asyncio.create_task(execute_meta_template_sync(tenant_id, database.db_pool))
            except Exception as _st_err:
                logger.warning("meta_template_sync_on_update_warn", tenant_id=tenant_id, error=str(_st_err))

        # 3. Update Model API Keys
        if payload.gemini_api_key is not None and payload.gemini_api_key.strip():
            g_row = await conn.fetchrow("SELECT id FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'gemini'", tenant_id)
            if g_row:
                await conn.execute("UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid", json.dumps({"api_key": payload.gemini_api_key.strip()}), str(g_row["id"]))
            else:
                await conn.execute("INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'gemini', $3::jsonb, true)", str(uuid.uuid4()), tenant_id, json.dumps({"api_key": payload.gemini_api_key.strip()}))

        if payload.groq_api_key is not None and payload.groq_api_key.strip():
            gr_row = await conn.fetchrow("SELECT id FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'groq'", tenant_id)
            if gr_row:
                await conn.execute("UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid", json.dumps({"api_key": payload.groq_api_key.strip()}), str(gr_row["id"]))
            else:
                await conn.execute("INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'groq', $3::jsonb, true)", str(uuid.uuid4()), tenant_id, json.dumps({"api_key": payload.groq_api_key.strip()}))

        if payload.opencode_api_key is not None and payload.opencode_api_key.strip():
            op_data = {
                "api_key": payload.opencode_api_key.strip(),
                "base_url": payload.opencode_base_url.strip() if payload.opencode_base_url else "https://opencode.ai/zen/v1"
            }
            op_row = await conn.fetchrow("SELECT id FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'opencode'", tenant_id)
            if op_row:
                await conn.execute("UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid", json.dumps(op_data), str(op_row["id"]))
            else:
                await conn.execute("INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'opencode', $3::jsonb, true)", str(uuid.uuid4()), tenant_id, json.dumps(op_data))

        # 4. Update Google Calendar & Notification Email
        if payload.google_client_id is not None or payload.google_refresh_token is not None or payload.notification_email is not None:
            g_row = await conn.fetchrow("SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar'", tenant_id)
            g_data = {}
            g_id = str(g_row["id"]) if g_row else str(uuid.uuid4())
            if g_row and g_row["credential_data"]:
                d = g_row["credential_data"]
                if isinstance(d, str):
                    try: d = json.loads(d)
                    except: d = {}
                g_data = dict(d)
            if payload.google_client_id is not None: g_data["client_id"] = payload.google_client_id.strip()
            if payload.google_client_secret is not None: g_data["client_secret"] = payload.google_client_secret.strip()
            if payload.google_refresh_token is not None: g_data["refresh_token"] = payload.google_refresh_token.strip()
            if payload.google_calendar_id is not None: g_data["calendar_id"] = payload.google_calendar_id.strip()
            if payload.notification_email is not None: g_data["notification_email"] = payload.notification_email.strip()

            if g_row:
                await conn.execute("UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid", json.dumps(g_data), g_id)
            else:
                await conn.execute("INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'google_calendar', $3::jsonb, true)", g_id, tenant_id, json.dumps(g_data))

        # 5. Update AI Config (modular fields & tone instructions) with non-destructive partial updates
        ai_row = await conn.fetchrow("SELECT * FROM ai_config WHERE tenant_id = $1::uuid", tenant_id)
        
        cur_model = (ai_row["model"] if ai_row and ai_row["model"] else "gemini-3.1-flash-lite")
        cur_prompt = (ai_row["system_prompt"] if ai_row and ai_row["system_prompt"] else "")
        cur_name = (ai_row["assistant_name"] if ai_row and ai_row["assistant_name"] else "Assistant")
        cur_goal = (ai_row["bot_goal"] if ai_row and ai_row["bot_goal"] else "")
        cur_services = (ai_row["services_text"] if ai_row and ai_row["services_text"] else "")
        cur_style = (ai_row["response_style"] if ai_row and ai_row["response_style"] else "short")
        cur_meth = (ai_row["methodology"] if ai_row and ai_row["methodology"] else "dogfooding")
        cur_rules = (ai_row["strict_rules"] if ai_row and ai_row["strict_rules"] else "")
        cur_obj = (ai_row["objection_handling"] if ai_row and ai_row["objection_handling"] else "")

        assistant_name = payload.assistant_name if payload.assistant_name is not None else cur_name
        bot_goal = payload.bot_goal if payload.bot_goal is not None else cur_goal
        services_text = payload.services_text if payload.services_text is not None else cur_services
        custom_instructions = payload.ai_prompt if payload.ai_prompt is not None else cur_prompt
        response_style = payload.response_style if payload.response_style is not None else cur_style
        methodology = payload.methodology if payload.methodology is not None else cur_meth
        strict_rules = payload.strict_rules if payload.strict_rules is not None else cur_rules
        objection_handling = payload.objection_handling if payload.objection_handling is not None else cur_obj
        ai_model = payload.ai_model if payload.ai_model is not None else cur_model

        if ai_row:
            await conn.execute(
                """UPDATE ai_config SET
                     model = $1,
                     system_prompt = $2,
                     assistant_name = $3,
                     bot_goal = $4,
                     services_text = $5,
                     response_style = $6,
                     methodology = $7,
                     strict_rules = $8,
                     objection_handling = $9,
                     updated_at = now()
                   WHERE tenant_id = $10::uuid""",
                ai_model, custom_instructions, assistant_name, bot_goal, services_text,
                response_style, methodology, strict_rules, objection_handling, tenant_id
            )
        else:
            await conn.execute(
                """INSERT INTO ai_config (tenant_id, model, system_prompt, assistant_name, bot_goal, services_text, response_style, methodology, strict_rules, objection_handling, temperature, max_tokens)
                   VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0.3, 2048)""",
                tenant_id, ai_model, custom_instructions, assistant_name, bot_goal, services_text,
                response_style, methodology, strict_rules, objection_handling
            )

    return await get_tenant_settings(tenant_id, target_tenant_id=tenant_id, caller=caller if isinstance(caller, dict) else {"role": "admin"})


# ── AI Prompt Optimizer ──────────────────────────────────────────────────────

class OptimizePromptRequest(BaseModel):
    raw_dump: str  # The free-form business brain-dump text

@router.post("/settings/optimize-prompt")
@router.post("/api/v1/crm/settings/optimize-prompt")
async def optimize_ai_prompt(
    payload: OptimizePromptRequest,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context),
):
    """
    Admin-only: Convert a raw business brain-dump into structured ai_config fields.
    Uses Gemini Flash to intelligently extract and structure the content.
    Returns the 7 prompt fields ready to paste/save.
    """
    caller_role = caller.get("role") if isinstance(caller, dict) else "agent"
    if caller_role not in ("admin", "super_admin", "owner"):
        raise HTTPException(status_code=403, detail="Admin access required.")

    raw_dump = (payload.raw_dump or "").strip()
    if len(raw_dump) < 30:
        raise HTTPException(status_code=400, detail="Please provide more business details (at least 30 characters).")

    # Get tenant's Gemini key (fallback to platform key)
    gem_key = ""
    async with database.db_pool.acquire() as conn:
        gem_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'gemini' AND is_active = true",
            tenant_id
        )
        if gem_row and gem_row["credential_data"]:
            d = gem_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            gem_key = d.get("api_key", "")
    if not gem_key:
        gem_key = os.getenv("GEMINI_API_KEY", "")
    if not gem_key:
        raise HTTPException(status_code=503, detail="No Gemini API key configured. Please add a Gemini API key in AI Settings.")

    # Meta-prompt: what NOT to include (auto-injected by the system)
    meta_prompt = """You are an expert AI sales agent configuration specialist for a high-converting WhatsApp CRM platform.

A business owner has provided raw business information below. Your job is to extract and structure this into exactly 7 configuration fields for their WhatsApp AI Consultative Sales Closer.

CRITICAL ROLE DEFINITIONS:
- The AI is a PROACTIVE CONSULTATIVE SALES CLOSER, NOT a passive customer support desk.
- All replies must be in easy, natural Indian English (simple words, warm, conversational, 2-3 short sentences, 25-45 words max, no robotic filler, no corporate jargon, no marketing essays).
- Follow the 3-Beat Consultative Sales Formula: (1) Direct Answer & Value Anchor in sentence 1, (2) Diagnostic Qualification Hook to understand customer requirement/pain, (3) Binary Assumptive Close (e.g. 'morning or evening?', 'tomorrow 11:30 AM or 4:30 PM?') instead of passive 'do you want to book?'.

IMPORTANT — The following are ALREADY auto-injected by the system and must NEVER be included in your output:
- Current date/time and timezone
- Live calendar availability / appointment slots
- Booking confirmation / reschedule / cancellation action tags
- Customer's name, phone, existing bookings
- Conversation history
- Format rules (no emojis, 1-2 lines, no bullets, no hyphens) — these are global
- Anti-hallucination directives & security/injection defense rules
- Universal objection handling fallback (auto-applied if field is empty)
- Language/dialect mirroring logic

OUTPUT FORMAT — Return ONLY a valid JSON object with these exact 7 keys. No markdown, no explanation:
{
  "assistant_name": "String. The AI sales receptionist's first name (e.g. Aadhi, Priya, Alex, Rakshaya). Pick a name that fits the business tone if not explicitly stated.",
  "ai_prompt": "String. The PRIMARY business knowledge base and consultative sales playbook. Structure with: (1) Business Context & Value Proposition: who they are, unique results/track record, location. (2) Consultative 3-Beat Sales Flow: Beat 1 (Direct Answer & Value Anchor), Beat 2 (Diagnostic Qualification Hook to understand customer need/pain), Beat 3 (Binary Assumptive Close: provide binary slot choices). (3) Lead Qualification criteria and boundaries.",
  "services_text": "String. Formatted services + pricing catalog. Each service on its own line. Format: Service Name — Description (Duration) — ₹Price. If currency not specified, use ₹.",
  "bot_goal": "String. 2-3 sentences defining the AI as a proactive consultative sales closer. Must state: Qualify leads through consultative discovery, answer pricing/service questions with value anchoring, and guide them to schedule appointments, consults, or demo calls using binary closing choices.",
  "strict_rules": "String. Hard business rules and absolute restrictions the AI must never violate (e.g. never quote unconfirmed prices, only book during clinic hours, no medical prescriptions over chat). One rule per line.",
  "objection_handling": "String. Specific playbooks for price resistance ('too expensive'), delay ('will think about it' / 'will let you know'), or skepticism. Reframe value/ROI in 1 sentence and offer a zero-friction micro-step (such as a 5-minute call or holding a tentative slot with binary choices). NEVER repeatedly ask about inquiry volume in objection handling.",
  "response_style": "String. Must enforce Easy Indian English: 'Warm, friendly, and natural. Sounds like an authentic human texting on WhatsApp in Easy Indian English. 2 to 3 short sentences (25 to 45 words max), no corporate jargon, no robotic filler, no marketing essays.'"
}

RULES:
- Extract information only from the business dump below. Do not invent facts.
- If a field has no relevant info in the dump, return an empty string "" for it (except response_style and bot_goal, which must always establish the Consultative Sales Closer in Easy Indian English).
- ai_prompt should be thorough — include persona, consultative discovery flow, what to ask and when, any qualification criteria.
- services_text should be clean and scannable — one service per line.
- Do NOT include operating hours, timezone, or location in ai_prompt (those are separate settings).
- Do NOT add generic tips like 'always be polite' — the global engine handles that.
- Output ONLY the JSON. No preamble, no explanation, no markdown fences.

--- BUSINESS INFORMATION DUMP ---
""" + raw_dump

    # Call Gemini Flash
    result_text = ""
    for model in ["gemini-flash-lite-latest", "gemini-flash-latest"]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gem_key}"
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": meta_prompt}]}],
                        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}
                    }
                )
                if res.status_code == 200:
                    raw = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                    result_text = raw.strip()
                    break
        except Exception as _err:
            logger.warning("optimize_prompt_gemini_error", model=model, error=str(_err))
            continue

    if not result_text:
        raise HTTPException(status_code=502, detail="AI generation failed. Please try again.")

    # Parse and validate the JSON response
    try:
        # Strip markdown fences if model wrapped it anyway
        cleaned = re.sub(r'^```(?:json)?\s*', '', result_text, flags=re.MULTILINE)
        cleaned = re.sub(r'\s*```$', '', cleaned, flags=re.MULTILINE).strip()
        structured = json.loads(cleaned)
    except Exception:
        raise HTTPException(status_code=502, detail="AI returned malformed response. Please try again.")

    # Validate expected keys exist
    expected_keys = {"assistant_name", "ai_prompt", "services_text", "bot_goal", "strict_rules", "objection_handling", "response_style"}
    for key in expected_keys:
        if key not in structured:
            structured[key] = ""

    return {
        "success": True,
        "optimized": {
            "assistant_name": str(structured.get("assistant_name", "")).strip(),
            "ai_prompt": str(structured.get("ai_prompt", "")).strip(),
            "services_text": str(structured.get("services_text", "")).strip(),
            "bot_goal": str(structured.get("bot_goal", "")).strip(),
            "strict_rules": str(structured.get("strict_rules", "")).strip(),
            "objection_handling": str(structured.get("objection_handling", "")).strip(),
            "response_style": str(structured.get("response_style", "")).strip(),
        }
    }


# ── WhatsApp Connection Status & Health Monitor ──────────────────────────────

from pydantic import BaseModel

class WhatsAppCredentialsPayload(BaseModel):
    phone_number_id: str
    waba_id: str
    access_token: Optional[str] = None
    app_secret: Optional[str] = None
    verify_token: Optional[str] = None
    target_tenant_id: Optional[str] = None

class WhatsAppTestMessagePayload(BaseModel):
    recipient_phone: str
    target_tenant_id: Optional[str] = None


@router.get("/settings/whatsapp/status")
@router.get("/api/v1/crm/settings/whatsapp/status")
async def get_whatsapp_status(
    tenant_id: str = Depends(get_tenant_id),
    target_tenant_id: Optional[str] = Query(None),
    caller: dict = Depends(get_caller_context)
):
    """
    Live WhatsApp Business API health monitor:
    - Queries Meta Graph API live to verify token, phone number ID, verified name, quality rating.
    - Queries DB for last inbound & outbound message times and message totals.
    - Returns structured health metrics.
    """
    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    if isinstance(target_tenant_id, str) and target_tenant_id.strip() and caller_role in ("super_admin", "owner"):
        tenant_id = target_tenant_id.strip()

    async with database.db_pool.acquire() as conn:
        tenant_row = await conn.fetchrow("SELECT id, name, slug FROM tenants WHERE id = $1::uuid", tenant_id)
        if not tenant_row:
            raise HTTPException(404, "Tenant not found")

        tenant_slug = tenant_row["slug"]
        webhook_url = f"{APP_BASE_URL}/webhooks/whatsapp/{tenant_slug}"

        wa_cred_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
            tenant_id
        )
        wa_data = {}
        if wa_cred_row and wa_cred_row["credential_data"]:
            d = wa_cred_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except Exception: d = {}
            wa_data = dict(d)

        # Query messaging activity stats
        msg_stats = await conn.fetchrow("""
            SELECT 
                MAX(created_at) FILTER (WHERE direction = 'inbound') as last_inbound_at,
                MAX(created_at) FILTER (WHERE direction = 'outbound') as last_outbound_at,
                COUNT(*) FILTER (WHERE direction = 'inbound') as total_inbound,
                COUNT(*) FILTER (WHERE direction = 'outbound') as total_outbound
            FROM messages
            WHERE tenant_id = $1::uuid
        """, tenant_id)

    last_inbound = msg_stats["last_inbound_at"].isoformat() if msg_stats and msg_stats["last_inbound_at"] else None
    last_outbound = msg_stats["last_outbound_at"].isoformat() if msg_stats and msg_stats["last_outbound_at"] else None
    total_inbound = int(msg_stats["total_inbound"]) if msg_stats and msg_stats["total_inbound"] else 0
    total_outbound = int(msg_stats["total_outbound"]) if msg_stats and msg_stats["total_outbound"] else 0

    phone_number_id = str(wa_data.get("phone_number_id") or "").strip()
    waba_id = str(wa_data.get("waba_id") or "").strip()
    access_token = str(wa_data.get("access_token") or "").strip()
    verify_token = str(wa_data.get("verify_token") or "").strip()

    if not phone_number_id or not access_token or access_token.lower() == "none":
        return {
            "is_configured": False,
            "is_connected": False,
            "phone_number_id": phone_number_id or None,
            "waba_id": waba_id or None,
            "webhook_url": webhook_url,
            "verify_token": verify_token or None,
            "last_inbound_at": last_inbound,
            "last_outbound_at": last_outbound,
            "total_inbound": total_inbound,
            "total_outbound": total_outbound,
            "message": "WhatsApp Business API credentials are not configured for this workspace."
        }

    # Query Meta Graph API live
    import httpx
    meta_url = f"https://graph.facebook.com/v21.0/{phone_number_id}?fields=display_phone_number,verified_name,code_verification_status,quality_rating,status"
    try:
        async with httpx.AsyncClient(timeout=7.0) as client:
            resp = await client.get(meta_url, headers={"Authorization": f"Bearer {access_token}"})
            if resp.status_code == 200:
                meta_res = resp.json()
                return {
                    "is_configured": True,
                    "is_connected": True,
                    "phone_number_id": phone_number_id,
                    "waba_id": waba_id,
                    "display_phone_number": meta_res.get("display_phone_number"),
                    "verified_name": meta_res.get("verified_name"),
                    "quality_rating": meta_res.get("quality_rating", "UNKNOWN"),
                    "status": meta_res.get("status", "CONNECTED"),
                    "code_verification_status": meta_res.get("code_verification_status"),
                    "webhook_url": webhook_url,
                    "verify_token": verify_token,
                    "last_inbound_at": last_inbound,
                    "last_outbound_at": last_outbound,
                    "total_inbound": total_inbound,
                    "total_outbound": total_outbound
                }
            else:
                err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                err_obj = err_data.get("error", {})
                err_msg = err_obj.get("message") or f"Meta API returned status {resp.status_code}"
                err_code = err_obj.get("code")

                # Proactive Alert: notify Super Admin if token is expired or revoked
                if err_code in (190, 102, 100, 200):
                    try:
                        from services.alert_service import send_super_admin_alert
                        asyncio.create_task(send_super_admin_alert(
                            title="Meta WhatsApp Token Invalid or Expired",
                            error_message=err_msg,
                            tenant_id=tenant_id,
                            source="Meta WhatsApp Health Monitor",
                            severity="CRITICAL",
                            metadata={"error_code": err_code, "status_code": resp.status_code}
                        ))
                    except Exception:
                        pass

                return {
                    "is_configured": True,
                    "is_connected": False,
                    "phone_number_id": phone_number_id,
                    "waba_id": waba_id,
                    "webhook_url": webhook_url,
                    "verify_token": verify_token,
                    "error_code": err_code,
                    "error_message": err_msg,
                    "last_inbound_at": last_inbound,
                    "last_outbound_at": last_outbound,
                    "total_inbound": total_inbound,
                    "total_outbound": total_outbound
                }
    except Exception as e:
        logger.warning("whatsapp_health_check_meta_error", tenant_id=tenant_id, error=str(e))
        return {
            "is_configured": True,
            "is_connected": False,
            "phone_number_id": phone_number_id,
            "waba_id": waba_id,
            "webhook_url": webhook_url,
            "verify_token": verify_token,
            "error_message": f"Failed to connect to Meta Graph API: {str(e)}",
            "last_inbound_at": last_inbound,
            "last_outbound_at": last_outbound,
            "total_inbound": total_inbound,
            "total_outbound": total_outbound
        }


@router.post("/settings/whatsapp/credentials")
@router.post("/api/v1/crm/settings/whatsapp/credentials")
async def update_whatsapp_credentials(
    payload: WhatsAppCredentialsPayload,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """
    Update WhatsApp credentials with pre-validation against Meta Graph API:
    - Validates token & phone number with Meta before saving.
    - Saves to tenant_credentials.
    - Fires background template sync.
    """
    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    if payload.target_tenant_id and payload.target_tenant_id.strip() and caller_role in ("super_admin", "owner"):
        tenant_id = payload.target_tenant_id.strip()
    elif caller_role not in ("admin", "owner", "super_admin"):
        raise HTTPException(403, "Admin privileges required to update WhatsApp credentials.")

    clean_phone_id = payload.phone_number_id.strip() if payload.phone_number_id else ""
    clean_waba_id = payload.waba_id.strip() if payload.waba_id else ""
    clean_token = payload.access_token.strip() if payload.access_token else ""

    # If token is not provided in payload, fall back to existing active token in DB
    if not clean_token:
        async with database.db_pool.acquire() as conn:
            existing_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp'",
                tenant_id
            )
            if existing_row and existing_row["credential_data"]:
                d = existing_row["credential_data"]
                if isinstance(d, str):
                    try: d = json.loads(d)
                    except Exception: d = {}
                clean_token = str(d.get("access_token") or "").strip()

    if not clean_phone_id or not clean_token:
        raise HTTPException(400, "Phone Number ID and Access Token are required.")

    # Validate against Meta Graph API
    import httpx
    meta_url = f"https://graph.facebook.com/v21.0/{clean_phone_id}?fields=display_phone_number,verified_name,quality_rating,status"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(meta_url, headers={"Authorization": f"Bearer {clean_token}"})
            if resp.status_code != 200:
                err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                err_msg = err_data.get("error", {}).get("message") or f"Meta returned HTTP {resp.status_code}"
                raise HTTPException(400, f"Meta validation failed: {err_msg}")
            meta_data = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to verify credentials with Meta: {str(e)}")

    # Update database
    async with database.db_pool.acquire() as conn:
        wa_row = await conn.fetchrow(
            "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp'",
            tenant_id
        )
        wa_data = {}
        wa_cred_id = str(wa_row["id"]) if wa_row else str(uuid.uuid4())
        if wa_row and wa_row["credential_data"]:
            d = wa_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except Exception: d = {}
            wa_data = dict(d)

        wa_data["phone_number_id"] = clean_phone_id
        wa_data["waba_id"] = clean_waba_id
        wa_data["access_token"] = clean_token
        if payload.app_secret is not None and payload.app_secret.strip():
            wa_data["app_secret"] = payload.app_secret.strip()
        if payload.verify_token is not None and payload.verify_token.strip():
            wa_data["verify_token"] = payload.verify_token.strip()

        if wa_row:
            await conn.execute(
                "UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true, updated_at = now() WHERE id = $2::uuid",
                json.dumps(wa_data), wa_cred_id
            )
        else:
            await conn.execute(
                "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'whatsapp', $3::jsonb, true)",
                wa_cred_id, tenant_id, json.dumps(wa_data)
            )

    # Trigger background template sync
    if clean_waba_id and clean_token:
        try:
            asyncio.create_task(execute_meta_template_sync(tenant_id, database.db_pool))
        except Exception as e:
            logger.warning("template_sync_after_cred_update_warn", tenant_id=tenant_id, error=str(e))

    return {
        "status": "success",
        "message": "WhatsApp credentials verified and updated successfully.",
        "display_phone_number": meta_data.get("display_phone_number"),
        "verified_name": meta_data.get("verified_name"),
        "quality_rating": meta_data.get("quality_rating")
    }


@router.post("/settings/whatsapp/test-message")
@router.post("/api/v1/crm/settings/whatsapp/test-message")
async def send_whatsapp_test_message(
    payload: WhatsAppTestMessagePayload,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """
    Send a live test message to verify outbound WhatsApp delivery:
    - Rejects sending to business's own phone number with clear guidance.
    - Attempts text message first; if restricted by Meta's 24h conversation window, falls back to pre-approved hello_world template.
    - Returns detailed, actionable error messages from Meta Graph API.
    """
    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    if payload.target_tenant_id and payload.target_tenant_id.strip() and caller_role in ("super_admin", "owner"):
        tenant_id = payload.target_tenant_id.strip()
    elif caller_role not in ("admin", "owner", "super_admin"):
        raise HTTPException(403, "Admin privileges required to send test messages.")

    phone = payload.recipient_phone.strip()
    if not phone:
        raise HTTPException(400, "Recipient phone number is required.")

    clean_phone = "".join(filter(str.isdigit, phone))
    if len(clean_phone) == 10:
        clean_phone = f"91{clean_phone}"

    # 1. Fetch credentials
    async with database.db_pool.acquire() as conn:
        cred_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
            tenant_id
        )
    if not cred_row or not cred_row["credential_data"]:
        raise HTTPException(400, "WhatsApp credentials not found. Please configure your credentials first.")

    d = cred_row["credential_data"]
    if isinstance(d, str):
        try: d = json.loads(d)
        except Exception: d = {}
    creds = dict(d)
    phone_id = creds.get("phone_number_id")
    access_token = creds.get("access_token")

    if not phone_id or not access_token:
        raise HTTPException(400, "Phone Number ID or Access Token is missing from credentials.")

    import httpx

    # 2. Check if recipient is the business's own WhatsApp number
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            meta_info_resp = await client.get(
                f"https://graph.facebook.com/v21.0/{phone_id}?fields=display_phone_number",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if meta_info_resp.status_code == 200:
                biz_phone_raw = meta_info_resp.json().get("display_phone_number", "")
                biz_phone_clean = "".join(filter(str.isdigit, biz_phone_raw))
                if biz_phone_clean and clean_phone[-10:] == biz_phone_clean[-10:]:
                    raise HTTPException(
                        400,
                        f"Cannot send a test message to your own business WhatsApp number ({biz_phone_raw}). "
                        "Meta Cloud API does not allow a phone number to message itself. "
                        "Please enter a different recipient number (such as your personal mobile phone)."
                    )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("meta_phone_check_warn", error=str(e))

    # 3. Attempt to dispatch text message first
    test_text = "🟢 Test message from your WhatsApp CRM: Meta WhatsApp Business API connection is active and healthy!"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"

    text_payload = {
        "messaging_product": "whatsapp",
        "to": clean_phone,
        "type": "text",
        "text": {"body": test_text}
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, headers=headers, json=text_payload)
        if resp.status_code in (200, 201):
            return {
                "status": "success",
                "message": f"Test message dispatched successfully to +{clean_phone}!",
                "details": resp.json()
            }

        err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        err_obj = err_data.get("error", {})
        err_code = err_obj.get("code")
        err_msg = err_obj.get("message") or f"HTTP {resp.status_code}"
        err_details = err_obj.get("error_data", {}).get("details")

        # 4. If failed because of 24h window (code 131047 or similar), fallback to pre-approved hello_world template
        if err_code in (131047, 131026, 100):
            template_payload = {
                "messaging_product": "whatsapp",
                "to": clean_phone,
                "type": "template",
                "template": {
                    "name": "hello_world",
                    "language": {"code": "en_US"}
                }
            }
            tpl_resp = await client.post(url, headers=headers, json=template_payload)
            if tpl_resp.status_code in (200, 201):
                return {
                    "status": "success",
                    "message": f"Test message dispatched successfully to +{clean_phone} via Meta's verification template (hello_world)!",
                    "details": tpl_resp.json()
                }

        # If still failed, construct detailed actionable error message
        full_err = err_msg
        if err_details:
            full_err = f"{err_msg}: {err_details}"
        raise HTTPException(400, f"Meta rejected test message: {full_err}")


@router.post("/settings/telegram/test-alert")
@router.post("/api/v1/crm/settings/telegram/test-alert")
async def send_test_telegram_alert(
    caller: dict = Depends(get_caller_context)
):
    """Test ping to verify Super Admin Telegram alert bot."""
    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    if caller_role not in ("super_admin", "owner"):
        raise HTTPException(403, "Super Admin privileges required.")

    from services.alert_service import send_super_admin_alert
    await send_super_admin_alert(
        title="Test Incident Alert Ping",
        error_message="This is a test notification from your WhatsApp CRM platform. Proactive incident alerting is active and connected!",
        tenant_id=None,
        source="Admin Diagnostic Test",
        severity="INFO"
    )
    return {"status": "success", "message": "Test alert dispatched to Telegram and system_alerts table."}


# ── Tenant Onboarding Status & Checklist ──────────────────────────────────

@router.get("/onboarding/status")
@router.get("/api/v1/crm/onboarding/status")
async def get_tenant_onboarding_status(
    tenant_id: str = Depends(get_tenant_id),
    target_tenant_id: Optional[str] = Query(None),
    caller: dict = Depends(get_caller_context)
):
    """
    Computes real-time onboarding checklist state for the tenant:
    1. WhatsApp Business API Connected
    2. Google Calendar Connected
    3. AI Persona & Services Configured
    4. Outbound Test Message Dispatched
    """
    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    if caller_role not in ("super_admin", "owner", "admin"):
        raise HTTPException(403, "Access restricted: Tenant onboarding checklist requires administrator permissions.")

    # Only super_admin or owner can inspect a different tenant
    if isinstance(target_tenant_id, str) and target_tenant_id.strip():
        if caller_role not in ("super_admin", "owner"):
            raise HTTPException(403, "Access restricted: Target tenant inspection is exclusively available to Super Administrators.")
        tenant_id = target_tenant_id.strip()

    async with database.db_pool.acquire() as conn:
        # 1. WhatsApp credentials check
        wa_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
            tenant_id
        )
        wa_connected = False
        if wa_row and wa_row["credential_data"]:
            d = wa_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except Exception: d = {}
            if d.get("phone_number_id") and d.get("access_token") and not str(d.get("access_token", "")).startswith("EAAB_test"):
                wa_connected = True

        # 2. Google Calendar check
        gcal_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
            tenant_id
        )
        tenant_row = await conn.fetchrow("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
        t_settings = {}
        if tenant_row and tenant_row["settings"]:
            s = tenant_row["settings"]
            if isinstance(s, str):
                try: s = json.loads(s)
                except Exception: s = {}
            t_settings = dict(s)

        cal_connected = False
        if gcal_row and gcal_row["credential_data"]:
            cal_connected = True
        elif t_settings.get("google_calendar_configured") or t_settings.get("google_calendar_connected"):
            cal_connected = True

        # 3. AI Persona & Services check
        ai_row = await conn.fetchrow("SELECT assistant_name, services_text, system_prompt FROM ai_config WHERE tenant_id = $1::uuid", tenant_id)
        ai_configured = False
        if ai_row:
            name = (ai_row["assistant_name"] or "").strip()
            services = (ai_row["services_text"] or "").strip()
            prompt = (ai_row["system_prompt"] or "").strip()
            if name and (services or prompt):
                ai_configured = True

        # 4. Outbound messaging activity check
        outbound_count = await conn.fetchval(
            "SELECT COUNT(*) FROM messages WHERE tenant_id = $1::uuid AND direction = 'outbound'",
            tenant_id
        ) or 0
        test_sent = outbound_count > 0

    steps = [
        {
            "id": "whatsapp",
            "title": "Connect WhatsApp Business API",
            "description": "Connect your Meta WABA to enable live chat, automated reminders, and AI replies.",
            "is_completed": wa_connected,
            "action_type": "modal",
            "action_target": "whatsapp_creds",
            "action_label": "Configure WhatsApp" if not wa_connected else "Connected"
        },
        {
            "id": "calendar",
            "title": "Connect Google Calendar",
            "description": "Sync real-time availability so the AI only books open, unoccupied time slots.",
            "is_completed": cal_connected,
            "action_type": "tab",
            "action_target": "calendar",
            "action_label": "Connect Calendar" if not cal_connected else "Synced"
        },
        {
            "id": "ai_persona",
            "title": "Customize AI Persona & Services",
            "description": "Set your assistant name, service catalog, and conversational guidelines.",
            "is_completed": ai_configured,
            "action_type": "tab",
            "action_target": "ai_persona",
            "action_label": "Customize AI" if not ai_configured else "Configured"
        },
        {
            "id": "test_ping",
            "title": "Send a Test WhatsApp Ping",
            "description": "Verify live outbound messaging to your personal phone.",
            "is_completed": test_sent,
            "action_type": "modal",
            "action_target": "test_ping",
            "action_label": "Send Test Ping" if not test_sent else "Verified"
        }
    ]

    completed_count = sum(1 for s in steps if s["is_completed"])
    total_count = len(steps)
    pct = int((completed_count / total_count) * 100)

    return {
        "total_steps": total_count,
        "completed_steps": completed_count,
        "completion_percentage": pct,
        "is_fully_onboarded": completed_count == total_count,
        "steps": steps
    }




