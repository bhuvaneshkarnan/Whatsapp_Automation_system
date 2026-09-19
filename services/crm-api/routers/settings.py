import os
import structlog
logger = structlog.get_logger('settings')
from utils import APP_BASE_URL
from routers.marketing import execute_meta_template_sync


import os
import re
import csv
import io
import time
import uuid
import json
import asyncio
import hashlib
import html
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Union

import json
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import database
from models import TenantSettingsUpdate
from dependencies import get_tenant_id, get_caller_context

router = APIRouter()

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
        "monthly_price": float(tenant_settings.get("monthly_price") or (999.0 if (tenant.get("plan") or "").lower() == "starter" else (9999.0 if (tenant.get("plan") or "").lower() == "enterprise" else 3499.0))),
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


# ── Google OAuth 2.0 1-Click Calendar Sync ────────────────────────────────────




if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)



# ── REVIEWS & GMB FEEDBACK SYSTEM ─────────────────────────────────────────────

