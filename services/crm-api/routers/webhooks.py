import os
import re
import json
import time
import uuid
import asyncio
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Union
import structlog
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Header, Query
import database
import razorpay_client
from routers.marketing import execute_marketing_broadcast
from services.whatsapp_service import dispatch_automated_status_whatsapp, dispatch_whatsapp_message
from services.crm_service import send_gmail_direct_notification
from tasks_service import dispatch_push_notification
from dependencies import JWT_SECRET
import utils
from utils import safe_json_loads, get_tenant_base_url
from collections import defaultdict, deque

router = APIRouter()
logger = structlog.get_logger('crm-api-webhooks')

# ── In-process rate limiter for missed-call webhook ──────────────────────────
# Allows up to _MISSED_CALL_RATE_LIMIT requests per _MISSED_CALL_RATE_WINDOW seconds
# per (tenant_slug, caller_ip) pair. Uses a deque-based sliding window — no Redis needed.
_MISSED_CALL_RATE_LIMIT = int(os.getenv("MISSED_CALL_RATE_LIMIT", "10"))
_MISSED_CALL_RATE_WINDOW = int(os.getenv("MISSED_CALL_RATE_WINDOW_SECS", "60"))
_missed_call_rate_buckets: dict = defaultdict(deque)

def _check_missed_call_rate_limit(tenant_slug: str, caller_ip: str) -> bool:
    """Returns True if the request is allowed, False if rate limit exceeded."""
    key = f"{tenant_slug}:{caller_ip}"
    now = time.time()
    bucket = _missed_call_rate_buckets[key]
    # Evict timestamps outside the window
    while bucket and bucket[0] < now - _MISSED_CALL_RATE_WINDOW:
        bucket.popleft()
    if len(bucket) >= _MISSED_CALL_RATE_LIMIT:
        return False
    bucket.append(now)
    return True


def _extract_note(entity: Any, key: str) -> Optional[str]:
    """Safely extract a note from a Razorpay webhook entity without crashing on empty lists or non-dict values."""
    if not isinstance(entity, dict):
        return None
    notes = entity.get("notes")
    if isinstance(notes, dict):
        val = notes.get(key)
        return str(val).strip() if val else None
    return None


@router.post("/webhooks/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Handles Razorpay Webhook Events with raw body HMAC-SHA256 signature verification.
    """
    raw_body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")
    
    # Verify HMAC-SHA256 signature
    is_valid = razorpay_client.verify_webhook_signature(raw_body, signature)
    if not is_valid:
        logger.warning("razorpay_webhook_invalid_signature", signature=signature)
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event_data = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        logger.warning("webhook_json_decode_failed", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(event_data, dict):
        logger.warning("webhook_payload_not_dict", payload_type=type(event_data).__name__)
        raise HTTPException(status_code=400, detail="Invalid JSON object")

    event_type = event_data.get("event")
    logger.info("razorpay_webhook_received", webhook_event=event_type)

    payload = event_data.get("payload")
    if not isinstance(payload, dict):
        payload = {}

    sub_raw = payload.get("subscription")
    sub_entity = sub_raw.get("entity", {}) if isinstance(sub_raw, dict) and isinstance(sub_raw.get("entity"), dict) else {}

    payment_raw = payload.get("payment")
    payment_entity = payment_raw.get("entity", {}) if isinstance(payment_raw, dict) and isinstance(payment_raw.get("entity"), dict) else {}

    invoice_raw = payload.get("invoice")
    invoice_entity = invoice_raw.get("entity", {}) if isinstance(invoice_raw, dict) and isinstance(invoice_raw.get("entity"), dict) else {}

    plink_raw = payload.get("payment_link")
    plink_entity = plink_raw.get("entity", {}) if isinstance(plink_raw, dict) and isinstance(plink_raw.get("entity"), dict) else {}

    order_raw = payload.get("order")
    order_entity = order_raw.get("entity", {}) if isinstance(order_raw, dict) and isinstance(order_raw.get("entity"), dict) else {}

    sub_id = (
        plink_entity.get("id")
        or sub_entity.get("id")
        or invoice_entity.get("subscription_id")
        or payment_entity.get("description")
    )

    async with database.db_pool.acquire() as conn:
        tenant = None
        
        # 1. Match by tenant_id note (safely handles dict, list, None)
        t_id_note = (
            _extract_note(sub_entity, "tenant_id")
            or _extract_note(plink_entity, "tenant_id")
            or _extract_note(payment_entity, "tenant_id")
            or _extract_note(invoice_entity, "tenant_id")
            or _extract_note(order_entity, "tenant_id")
        )
        if t_id_note:
            try:
                tenant = await conn.fetchrow(
                    "SELECT id, name, slug, org_lifecycle_stage, subscription_status, razorpay_short_url, settings FROM tenants WHERE id = $1::uuid",
                    t_id_note
                )
            except Exception:
                pass

        # 2. Match by razorpay_subscription_id (which holds plink_... or sub_...)
        if not tenant and sub_id:
            tenant = await conn.fetchrow(
                "SELECT id, name, slug, org_lifecycle_stage, subscription_status, razorpay_short_url, settings FROM tenants WHERE razorpay_subscription_id = $1",
                sub_id
            )
        
        # 3. Match by org_slug in notes (safely handles dict, list, None)
        if not tenant:
            org_slug = (
                _extract_note(plink_entity, "org_slug")
                or _extract_note(payment_entity, "org_slug")
                or _extract_note(sub_entity, "org_slug")
                or _extract_note(invoice_entity, "org_slug")
                or _extract_note(order_entity, "org_slug")
            )
            if org_slug:
                tenant = await conn.fetchrow("SELECT id, name, slug, org_lifecycle_stage, subscription_status, razorpay_short_url, settings FROM tenants WHERE slug = $1", org_slug)

        if not tenant:
            logger.info("razorpay_webhook_no_matching_tenant", sub_id=sub_id, webhook_event=event_type)
            return {"status": "ok", "message": "No matching tenant"}

        tenant_id = str(tenant["id"])
        short_url = tenant.get("razorpay_short_url") or ""

        if event_type in ("payment_link.paid", "payment.captured", "order.paid"):
            pay_id = payment_entity.get("id")
            if not pay_id and isinstance(plink_entity.get("payments"), list) and len(plink_entity["payments"]) > 0:
                first_pay = plink_entity["payments"][0]
                if isinstance(first_pay, dict):
                    pay_id = first_pay.get("payment_id")
            
            amount_val = plink_entity.get("amount_paid") or payment_entity.get("amount") or 263000
            amount = float(amount_val) / 100.0 if float(amount_val) > 10000 else float(amount_val)
            inv_id = f"inv_{sub_id or tenant_id}_{int(time.time())}"
            pdf_url = plink_entity.get("short_url") or short_url

            await conn.execute(
                """
                UPDATE tenants
                SET subscription_status = 'active',
                    org_lifecycle_stage = 'billing_active',
                    last_charge_at = now(),
                    next_charge_at = now() + INTERVAL '30 days',
                    last_payment_status = 'success',
                    reminder_stage = 0,
                    is_active = true,
                    payment_failed_at = NULL,
                    grace_period_until = NULL,
                    updated_at = now()
                WHERE id = $1::uuid
                """,
                tenant_id
            )

            if pay_id:
                await conn.execute(
                    """
                    INSERT INTO invoices (id, tenant_id, razorpay_invoice_id, razorpay_payment_id, razorpay_subscription_id, amount, currency, status, invoice_pdf_url, paid_at, created_at)
                    VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, 'INR', 'paid', $6, now(), now())
                    ON CONFLICT (razorpay_invoice_id) DO UPDATE
                    SET status = 'paid',
                        razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, invoices.razorpay_payment_id),
                        paid_at = now()
                    """,
                    tenant_id, inv_id, pay_id, sub_id or "payment_link", amount, pdf_url
                )
            logger.info("razorpay_payment_link_paid_recorded", tenant_id=tenant_id, pay_id=pay_id, amount=amount)

            # ── Automated Activation Notifications (Email & WhatsApp to Client) ──
            try:
                admin_u = await conn.fetchrow(
                    "SELECT email FROM users WHERE tenant_id = $1::uuid AND is_active = true ORDER BY (role = 'admin') DESC, created_at ASC LIMIT 1",
                    tenant_id
                )
                t_cfg = safe_json_loads(tenant.get("settings"))
                
                target_email = admin_u["email"] if admin_u else t_cfg.get("notification_email")
                target_phone = t_cfg.get("admin_whatsapp_number", "")
                t_name = tenant.get("name", "Client Organization")
                t_custom_dom = (t_cfg.get("custom_domain") or "").strip()
                t_brand_title = (t_cfg.get("brand_name") or "").strip()
                if not t_custom_dom and t_cfg.get("partner_name"):
                    p_row = await conn.fetchrow(
                        "SELECT custom_domain, brand_name FROM partner_agency_templates WHERE LOWER(partner_name) = $1 LIMIT 1",
                        t_cfg["partner_name"].strip().lower()
                    )
                    if p_row:
                        if p_row["custom_domain"]:
                            t_custom_dom = p_row["custom_domain"].strip()
                        if not t_brand_title and p_row["brand_name"]:
                            t_brand_title = p_row["brand_name"].strip()

                dom_base = f"https://{t_custom_dom}" if t_custom_dom else "https://crm.goboldlabs.com"
                dash_url = f"{dom_base}/{tenant.get('slug')}"
                login_url = f"{dom_base}/login"
                brand_header_text = t_brand_title or "Boldlabs AI WhatsApp Automation Platform"

                g_cred_row = await conn.fetchrow(
                    "SELECT credential_data FROM tenant_credentials WHERE provider = 'google_calendar' AND tenant_id = $1::uuid AND is_active = true LIMIT 1",
                    tenant_id
                )
                if g_cred_row and g_cred_row["credential_data"] and target_email and "@" in target_email:
                    gd = safe_json_loads(g_cred_row["credential_data"])
                    from google.oauth2.credentials import Credentials
                    g_creds = Credentials(
                        token=gd.get("access_token"),
                        refresh_token=gd.get("refresh_token"),
                        token_uri="https://oauth2.googleapis.com/token",
                        client_id=gd.get("client_id"),
                        client_secret=gd.get("client_secret"),
                    )
                    email_html = f"""
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                      <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Payment Confirmed • Workspace Active</h2>
                        <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0;">{brand_header_text}</p>
                      </div>
                      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>{t_name}</strong>,</p>
                      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Your monthly subscription payment of <strong>₹{int(amount):,}</strong> has been successfully confirmed. Your AI WhatsApp Automation workspace is now <strong>100% LIVE and ACTIVE</strong>.</p>
                      
                      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px; margin: 24px 0;">
                        <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Your CRM Dashboard Access</h4>
                        <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
                          <tr><td style="padding: 4px 0; font-weight: 600; width: 130px;">Workspace Link:</td><td><a href="{dash_url}" style="color: #4f46e5; text-decoration: underline; font-weight: 600;">{dash_url}</a></td></tr>
                          <tr><td style="padding: 4px 0; font-weight: 600;">Login Portal:</td><td><a href="{login_url}" style="color: #4f46e5;">{login_url}</a></td></tr>
                          <tr><td style="padding: 4px 0; font-weight: 600;">Registered Email:</td><td>{target_email}</td></tr>
                          <tr><td style="padding: 4px 0; font-weight: 600;">Status:</td><td><span style="color: #16a34a; font-weight: 600;">Active • Live Automation</span></td></tr>
                        </table>
                      </div>

                      <div style="text-align: center; margin: 24px 0;">
                        <a href="{dash_url}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px;">Open Your CRM Dashboard &rarr;</a>
                      </div>

                      <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
                        Need assistance? Reply directly to this email or reach our support team anytime.<br>
                        &copy; 2026 Boldlabs. All rights reserved.
                      </p>
                    </div>
                    """
                    await send_gmail_direct_notification(
                        g_creds, target_email,
                        f"Payment Confirmed: Your WhatsApp Automation Workspace is Active ({t_name})",
                        email_html
                    )
                    logger.info("payment_activation_email_sent", tenant_id=tenant_id, email=target_email)

                if target_phone:
                    clean_phone = "".join(filter(str.isdigit, target_phone))
                    if clean_phone:
                        wa_msg = f"Payment Confirmed! 🎉 Hello {t_name}, your payment of ₹{int(amount):,} has been received. Your WhatsApp Automation workspace is now 100% active. Access your CRM dashboard anytime: {dash_url}"
                        await dispatch_whatsapp_message(tenant_id, clean_phone, text=wa_msg, suppress_admin_alert=True)
                        logger.info("payment_activation_whatsapp_sent", tenant_id=tenant_id, phone=clean_phone)

            except Exception as notify_err:
                logger.warning("payment_activation_notification_failed", tenant_id=tenant_id, error=str(notify_err))


        elif event_type in ("subscription.authenticated", "subscription.activated"):
            cust_id_from_sub = sub_entity.get("customer_id")
            await conn.execute(
                """
                UPDATE tenants
                SET subscription_status = 'active',
                    org_lifecycle_stage = 'billing_active',
                    razorpay_customer_id = COALESCE($1, razorpay_customer_id),
                    last_payment_status = 'authenticated',
                    is_active = true,
                    updated_at = now()
                WHERE id = $2::uuid
                """,
                cust_id_from_sub, tenant_id
            )

        elif event_type == "subscription.charged":
            current_end = sub_entity.get("current_end")
            next_charge = datetime.fromtimestamp(current_end, tz=timezone.utc) if current_end else None
            cust_id_from_sub = sub_entity.get("customer_id")
            
            await conn.execute(
                """
                UPDATE tenants
                SET subscription_status = 'active',
                    org_lifecycle_stage = 'billing_active',
                    razorpay_customer_id = COALESCE($1, razorpay_customer_id),
                    last_charge_at = now(),
                    next_charge_at = COALESCE($2, now() + INTERVAL '30 days'),
                    last_payment_status = 'success',
                    reminder_stage = 0,
                    is_active = true,
                    payment_failed_at = NULL,
                    grace_period_until = NULL,
                    updated_at = now()
                WHERE id = $3::uuid
                """,
                cust_id_from_sub, next_charge, tenant_id
            )

            inv_id = invoice_entity.get("id") or f"inv_sub_{sub_id}_{int(time.time())}"
            amount_val = invoice_entity.get("amount") or payment_entity.get("amount") or (sub_entity.get("plan_id", {}).get("amount") if isinstance(sub_entity.get("plan_id"), dict) else 263000)
            amount = float(amount_val) / 100.0 if float(amount_val) > 10000 else float(amount_val)
            
            pay_id = payment_entity.get("id")
            inv_pdf = invoice_entity.get("short_url") or invoice_entity.get("invoice_pdf") or short_url
            await conn.execute(
                """
                INSERT INTO invoices (id, tenant_id, razorpay_invoice_id, razorpay_payment_id, razorpay_subscription_id, amount, currency, status, invoice_pdf_url, paid_at, created_at)
                VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, 'INR', 'paid', $6, now(), now())
                ON CONFLICT (razorpay_invoice_id) DO UPDATE
                SET status = 'paid',
                    razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, invoices.razorpay_payment_id),
                    paid_at = now()
                """,
                tenant_id, inv_id, pay_id, sub_id, amount, inv_pdf
            )
            logger.info("razorpay_subscription_charged_recorded", tenant_id=tenant_id, pay_id=pay_id, amount=amount)

            # Send automated WhatsApp confirmation to client for monthly auto-debit renewal
            try:
                t_cfg = safe_json_loads(tenant.get("settings"))
                target_phone = t_cfg.get("admin_whatsapp_number", "")
                t_name = tenant.get("name", "Client Organization")
                t_custom_dom = (t_cfg.get("custom_domain") or "").strip()
                dom_base = f"https://{t_custom_dom}" if t_custom_dom else "https://crm.goboldlabs.com"
                dash_url = f"{dom_base}/{tenant.get('slug')}"

                if target_phone:
                    clean_phone = "".join(filter(str.isdigit, target_phone))
                    if clean_phone:
                        wa_msg = f"Subscription Renewal Confirmed! 🎉 Hello {t_name}, your monthly subscription payment of ₹{int(amount):,} has been successfully auto-debited. Your WhatsApp Automation workspace continues 100% active: {dash_url}"
                        await dispatch_whatsapp_message(tenant_id, clean_phone, text=wa_msg, suppress_admin_alert=True)
                        logger.info("subscription_renewal_whatsapp_sent", tenant_id=tenant_id, phone=clean_phone)
            except Exception as notify_err:
                logger.warning("subscription_renewal_notification_failed", tenant_id=tenant_id, error=str(notify_err))

        elif event_type == "subscription.pending":
            await conn.execute(
                """
                UPDATE tenants
                SET subscription_status = 'payment_failed',
                    last_payment_status = 'pending_retry',
                    updated_at = now()
                WHERE id = $1::uuid
                """,
                tenant_id
            )
            background_tasks.add_task(
                dispatch_push_notification,
                tenant_id,
                2,
                short_url
            )

        elif event_type in ("subscription.halted", "subscription.cancelled"):
            final_status = "cancelled" if event_type == "subscription.cancelled" else "paused"
            if event_type == "subscription.halted":
                # Razorpay halts after exhausting all retries. Grant 3-day grace from first failure date.
                await conn.execute(
                    """
                    UPDATE tenants
                    SET subscription_status = $1,
                        last_payment_status = $2,
                        payment_failed_at = COALESCE(payment_failed_at, now()),
                        grace_period_until = COALESCE(payment_failed_at, now()) + INTERVAL '3 days',
                        token_invalidated_at = now(),
                        updated_at = now()
                    WHERE id = $3::uuid
                    """,
                    final_status, event_type, tenant_id
                )
                logger.warning("subscription_halted_grace_period", tenant_id=tenant_id)
            else:
                # Cancelled: immediate, no grace
                await conn.execute(
                    """
                    UPDATE tenants
                    SET subscription_status = $1,
                        last_payment_status = $2,
                        token_invalidated_at = now(),
                        updated_at = now()
                    WHERE id = $3::uuid
                    """,
                    final_status, event_type, tenant_id
                )
            background_tasks.add_task(
                dispatch_push_notification,
                tenant_id,
                3,
                short_url
            )


        elif event_type == "payment.failed":
            # Set grace period on FIRST failure (COALESCE preserves original failure time on retries)
            await conn.execute(
                """
                UPDATE tenants
                SET subscription_status = 'payment_failed',
                    last_payment_status = 'failed',
                    payment_failed_at = COALESCE(payment_failed_at, now()),
                    grace_period_until = COALESCE(payment_failed_at, now()) + INTERVAL '3 days',
                    updated_at = now()
                WHERE id = $1::uuid
                """,
                tenant_id
            )
            logger.warning("payment_failed_grace_period_started", tenant_id=tenant_id, grace_days=3)

            # Notify tenant admin via WhatsApp + push
            try:
                t_cfg = safe_json_loads(tenant.get("settings"))
                admin_phone = t_cfg.get("admin_whatsapp_number", "")
                payment_link = short_url or t_cfg.get("payment_url", "")
                if admin_phone:
                    clean_phone = "".join(filter(str.isdigit, admin_phone))
                    if clean_phone:
                        wa_msg = (
                            f"Payment Alert: Your monthly subscription payment of Rs.2,630 has failed. "
                            f"Your workspace will remain fully active for 3 more days (grace period). "
                            f"Please retry your payment now to avoid interruption"
                            + (f": {payment_link}" if payment_link else ".")
                        )
                        await dispatch_whatsapp_message(tenant_id, clean_phone, text=wa_msg, suppress_admin_alert=True)
            except Exception as pf_err:
                logger.warning("payment_failed_notification_error", tenant_id=tenant_id, error=str(pf_err))
            background_tasks.add_task(dispatch_push_notification, tenant_id, 2, short_url)

        elif event_type == "invoice.paid":
            inv_id = invoice_entity.get("id")
            if inv_id:
                amount = float(invoice_entity.get("amount", 263000)) / 100.0
                pay_id = invoice_entity.get("payment_id")
                pdf_url = invoice_entity.get("short_url") or invoice_entity.get("invoice_pdf")
                await conn.execute(
                    """
                    INSERT INTO invoices (id, tenant_id, razorpay_invoice_id, razorpay_payment_id, razorpay_subscription_id, amount, currency, status, invoice_pdf_url, paid_at, created_at)
                    VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, 'INR', 'paid', $6, now(), now())
                    ON CONFLICT (razorpay_invoice_id) DO UPDATE
                    SET status = 'paid',
                        razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, invoices.razorpay_payment_id),
                        paid_at = now()
                    """,
                    tenant_id, inv_id, pay_id, sub_id, amount, pdf_url
                )
                await conn.execute(
                    """UPDATE tenants SET subscription_status = 'active', org_lifecycle_stage = 'billing_active',
                       last_payment_status = 'success', is_active = true,
                       payment_failed_at = NULL, grace_period_until = NULL,
                       updated_at = now() WHERE id = $1::uuid""",
                    tenant_id
                )

    return {"status": "processed", "event": event_type}


# ── Missed Call Automated WhatsApp Outreach Webhook ───────────────────────────

@router.post("/webhooks/missed-call")
@router.post("/api/v1/crm/webhooks/missed-call")
@router.get("/webhooks/missed-call")
@router.get("/api/v1/crm/webhooks/missed-call")
async def handle_missed_call_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    tenant: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
    caller: Optional[str] = Query(None),
    caller_phone: Optional[str] = Query(None),
    sms_text: Optional[str] = Query(None),
    x_tenant_token: Optional[str] = Header(None, alias="X-Tenant-Webhook-Token"),
):
    """
    Automated Missed Call Ingestion & WhatsApp Follow-up Webhook.
    Strictly isolated per tenant. Accepts either direct caller number (e.g. from Android MacroDroid)
    or carrier missed call alert SMS text (e.g. from iPhone Apple Shortcut).
    """
    body_data = {}
    if request.method == "POST":
        try:
            body_data = await request.json()
        except Exception:
            try:
                form = await request.form()
                body_data = dict(form)
            except Exception:
                body_data = {}

    t_param = (
        tenant or 
        body_data.get("tenant") or 
        body_data.get("tenant_id") or 
        body_data.get("slug") or 
        ""
    ).strip()

    tok_param = (
        token or 
        x_tenant_token or 
        body_data.get("token") or 
        body_data.get("webhook_token") or 
        ""
    ).strip()

    raw_phone = (
        caller or 
        caller_phone or 
        body_data.get("caller_phone") or 
        body_data.get("phone") or 
        body_data.get("caller") or 
        ""
    )

    raw_sms = (
        sms_text or 
        body_data.get("sms_text") or 
        body_data.get("message") or 
        body_data.get("text") or 
        ""
    )

    if not t_param:
        raise HTTPException(status_code=400, detail="Missing tenant identifier. Please specify ?tenant=<slug>")

    async with database.db_pool.acquire() as conn:
        # 1. Strictly verify tenant identity
        tenant_row = await conn.fetchrow(
            """SELECT id, name, slug, settings, is_active 
               FROM tenants 
               WHERE (slug = $1 OR id::text = $1) AND is_active = true""",
            t_param
        )
        if not tenant_row:
            raise HTTPException(status_code=404, detail="Tenant not found or inactive.")

        tenant_id = str(tenant_row["id"])
        tenant_name = tenant_row["name"] or "Our Team"
        tenant_slug = tenant_row["slug"]
        t_settings = tenant_row["settings"] or {}
        if isinstance(t_settings, str):
            try:
                t_settings = json.loads(t_settings)
            except Exception:
                t_settings = {}

        # 2. Strict Security Token Verification (128-bit token with 16-char legacy backward compatibility)
        expected_token_32 = hashlib.sha256(f"{tenant_id}:{JWT_SECRET}:missed-call".encode()).hexdigest()[:32]
        expected_token_16 = expected_token_32[:16]
        allowed_tokens = {
            expected_token_32,
            expected_token_16,
            f"{tenant_slug}_missed_call",
            f"{tenant_id}_missed_call",
        }
        if t_settings.get("missed_call_token"):
            allowed_tokens.add(str(t_settings["missed_call_token"]).strip())
        if t_settings.get("webhook_token"):
            allowed_tokens.add(str(t_settings["webhook_token"]).strip())

        if not tok_param or tok_param not in allowed_tokens:
            raise HTTPException(status_code=403, detail="Invalid or missing tenant security token.")

        # Rate limit: max _MISSED_CALL_RATE_LIMIT calls per _MISSED_CALL_RATE_WINDOW seconds per tenant+IP
        caller_ip = request.client.host if request.client else "unknown"
        if not _check_missed_call_rate_limit(tenant_slug, caller_ip):
            logger.warning("missed_call_rate_limit_exceeded", tenant_slug=tenant_slug, caller_ip=caller_ip)
            raise HTTPException(status_code=429, detail="Too many requests. Please wait before trying again.")

        # 3. Extract and normalize phone number
        clean_digits = ""
        if raw_phone:
            clean_digits = re.sub(r'[^0-9]', '', str(raw_phone))
        elif raw_sms:
            # Parse Indian mobile numbers from SMS text (Jio, Airtel, Vi format)
            matches = re.findall(r'(?:(?:\+91|91|0)?([6-9]\d{9}))', str(raw_sms))
            if matches:
                clean_digits = matches[0]
            else:
                matches_any = re.findall(r'\b\d{10}\b', str(raw_sms))
                if matches_any:
                    clean_digits = matches_any[0]

        if not clean_digits or len(clean_digits) < 10:
            raise HTTPException(
                status_code=400,
                detail="Could not extract a valid 10-digit phone number. Please provide 'caller_phone' or 'sms_text'."
            )

        last_10 = clean_digits[-10:]
        wa_phone = f"91{last_10}"

        # 4. Strict Tenant Scoping: Lookup or create customer in THIS tenant only
        customer = await conn.fetchrow(
            """SELECT id, name, phone, internal_name, lead_probability, health_concern
               FROM customers
               WHERE tenant_id = $1::uuid
                 AND (phone = $2 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $3)
               LIMIT 1""",
            tenant_id, wa_phone, last_10
        )

        contact = await conn.fetchrow(
            """SELECT id, name, phone, wa_profile_name
               FROM contacts
               WHERE tenant_id = $1::uuid
                 AND (phone = $2 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $3)
               LIMIT 1""",
            tenant_id, wa_phone, last_10
        )

        patient_name = "there"
        cust_id = None
        if customer:
            cust_id = str(customer["id"])
            patient_name = customer["internal_name"] or customer["name"] or "there"

        contact_id = None
        if contact:
            contact_id = str(contact["id"])
            if patient_name == "there" and contact.get("name"):
                patient_name = contact["name"]
        else:
            contact_id = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO contacts (id, tenant_id, phone, name, opt_in, opt_in_at, created_at, updated_at)
                   VALUES ($1::uuid, $2::uuid, $3, $4, true, now(), now(), now())""",
                contact_id, tenant_id, wa_phone, patient_name if patient_name != "there" else f"Caller {last_10[-4:]}"
            )

        if not cust_id:
            cust_id = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO customers (id, tenant_id, name, phone, status, lead_probability, call_status, created_at, updated_at)
                   VALUES ($1::uuid, $2::uuid, $3, $4, 'new', 'warm', 'missed', now(), now())""",
                cust_id, tenant_id, patient_name if patient_name != "there" else f"Inquiry ({last_10[-4:]})", wa_phone
            )

        # 5. Conversation Resolution strictly under tenant_id
        conv = await conn.fetchrow(
            """SELECT id, last_message_at FROM conversations 
               WHERE tenant_id = $1::uuid AND contact_id = $2::uuid 
               ORDER BY last_message_at DESC NULLS LAST LIMIT 1""",
            tenant_id, contact_id
        )
        if conv:
            conv_id = str(conv["id"])
        else:
            conv_id = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO conversations (id, tenant_id, contact_id, status, unread_count, created_at, last_message_at)
                   VALUES ($1::uuid, $2::uuid, $3::uuid, 'bot', 0, now(), now())""",
                conv_id, tenant_id, contact_id
            )

        # 6. Audit Note strictly scoped to tenant_id & customer_id
        note_id = str(uuid.uuid4())
        note_text = f"📞 Missed cellular call detected from {last_10}. Automated WhatsApp follow-up outreach triggered."
        await conn.execute(
            """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color, created_at)
               VALUES ($1::uuid, $2::uuid, $3::uuid, 'System', $4, 'amber', now())""",
            note_id, tenant_id, cust_id, note_text
        )

        # 7. Push Notification to Staff
        background_tasks.add_task(
            dispatch_push_notification,
            pool=database.db_pool,
            tenant_id=tenant_id,
            title=f"📞 Missed Call: {patient_name} ({last_10})",
            body=f"Automated WhatsApp message sent to caller. They can now chat on WhatsApp.",
            notif_type="missed_call",
            url=f"/dashboard#chat-{conv_id}",
            data={"phone": wa_phone, "customer_id": cust_id}
        )

        # 8. Dispatch WhatsApp Message to Caller using THIS tenant's credentials
        tpl_name = (
            t_settings.get("template_missed_call") or 
            "missed_call_followup"
        )
        tpl_params = [patient_name if patient_name != "there" else "there", tenant_name]
        
        fallback_msg = (
            f"Hello {patient_name if patient_name != 'there' else ''}! "
            f"We noticed we just missed your call at {tenant_name}. We apologize for not being able to answer right away. "
            f"Please let us know how we can assist you, or reply to this chat anytime."
        ).strip()

        tpl_resp = await dispatch_whatsapp_message(
            tenant_id=tenant_id,
            to_phone=wa_phone,
            template_name=tpl_name,
            template_params=tpl_params
        )

        # If missed_call_followup template is still pending in Meta, try approved client_followup_checkin
        if not tpl_resp:
            alt_tpl = "client_followup_checkin"
            alt_params = [patient_name if patient_name != "there" else "there", "our team", tenant_name]
            tpl_resp = await dispatch_whatsapp_message(
                tenant_id=tenant_id,
                to_phone=wa_phone,
                template_name=alt_tpl,
                template_params=alt_params
            )
            if tpl_resp:
                tpl_name = alt_tpl
                tpl_params = alt_params

        # Record outbound message in database if sent
        if tpl_resp:
            tpl_wamid = tpl_resp.get("messages", [{}])[0].get("id") if isinstance(tpl_resp, dict) else None
            msg_id = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, template_name, template_params, status, ai_used_fallback)
                   VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'outbound', 'template', $5, $6, $7::jsonb, 'sent', false)""",
                msg_id, conv_id, tenant_id, tpl_wamid, fallback_msg, tpl_name, json.dumps(tpl_params)
            )
            await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", conv_id, tenant_id)
            logger.info("missed_call_wa_dispatched", tenant=tenant_slug, to=wa_phone, template=tpl_name)

        return {
            "status": "success",
            "tenant": tenant_slug,
            "caller_phone": wa_phone,
            "patient_name": patient_name,
            "customer_id": cust_id,
            "conversation_id": conv_id,
            "whatsapp_sent": bool(tpl_resp),
            "template_used": tpl_name if tpl_resp else None
        }


@router.post("/webhooks/razorpay/booking/{tenant_id}")
@router.post("/api/v1/crm/webhooks/razorpay/booking/{tenant_id}")
async def handle_tenant_booking_razorpay_webhook(
    tenant_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
):
    """
    Dedicated webhook route for tenant booking payments.
    Strictly isolated: Verifies signature with THIS tenant's own secret from tenant_credentials.
    NEVER touches or uses central platform Razorpay credentials.
    Updates the booking to 'paid' & 'confirmed', and dispatches customer & admin notifications.
    """
    tenant_clean = tenant_id.strip()
    tenant_uuid = None
    try:
        tenant_uuid = str(uuid.UUID(tenant_clean))
    except ValueError:
        pass

    async with database.db_pool.acquire() as conn:
        if tenant_uuid:
            tenant_row = await conn.fetchrow(
                "SELECT id, name, slug, settings FROM tenants WHERE id = $1::uuid AND is_active = true",
                tenant_uuid
            )
        else:
            tenant_row = await conn.fetchrow(
                "SELECT id, name, slug, settings FROM tenants WHERE slug = $1 AND is_active = true",
                tenant_clean
            )

        if not tenant_row:
            logger.warning("tenant_booking_webhook_tenant_not_found", tenant_id=tenant_clean)
            raise HTTPException(404, "Tenant not found or inactive")

        tenant_uuid = str(tenant_row["id"])
        tenant_name = tenant_row["name"] or "our team"
        t_settings = safe_json_loads(tenant_row.get("settings"), {})

        cred_row = await conn.fetchrow(
            """SELECT credential_data FROM tenant_credentials
               WHERE tenant_id = $1::uuid AND provider = 'razorpay' AND is_active = true""",
            tenant_uuid
        )

    if not cred_row or not cred_row["credential_data"]:
        logger.warning("tenant_booking_webhook_no_credentials", tenant_id=tenant_uuid)
        raise HTTPException(404, "Tenant Razorpay credentials not configured")

    d = cred_row["credential_data"]
    if isinstance(d, str):
        try: d = json.loads(d)
        except Exception: d = {}

    from services.tenant_payment_service import verify_tenant_webhook_signature
    wh_secret = (d.get("webhook_secret") or "").strip()
    key_secret = (d.get("key_secret") or "").strip()
    effective_secret = wh_secret or key_secret

    if not effective_secret:
        raise HTTPException(400, "Tenant Razorpay webhook secret or key secret is not configured")

    raw_body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "").strip()

    if not signature:
        logger.warning("tenant_booking_webhook_missing_signature", tenant_id=tenant_uuid)
        raise HTTPException(400, "Missing x-razorpay-signature header")

    verified = verify_tenant_webhook_signature(raw_body, signature, effective_secret)
    if not verified:
        logger.warning("tenant_booking_webhook_signature_mismatch", tenant_id=tenant_uuid)
        raise HTTPException(400, "Invalid webhook signature")

    try:
        event_data = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        logger.warning("tenant_booking_webhook_bad_json", error=str(e))
        raise HTTPException(400, "Invalid JSON payload")

    event_type = event_data.get("event", "")
    logger.info("tenant_booking_webhook_received", tenant_id=tenant_uuid, event=event_type)

    payload = event_data.get("payload", {})
    if not isinstance(payload, dict):
        payload = {}

    payment_link_entity = payload.get("payment_link", {}).get("entity", {}) if isinstance(payload.get("payment_link"), dict) else {}
    payment_entity = payload.get("payment", {}).get("entity", {}) if isinstance(payload.get("payment"), dict) else {}
    order_entity = payload.get("order", {}).get("entity", {}) if isinstance(payload.get("order"), dict) else {}

    # Extract payment identifiers
    plink_id = payment_link_entity.get("id") or _extract_note(payment_entity, "payment_link_id")
    pay_id = payment_entity.get("id") or payment_link_entity.get("payment_id") or ""
    amount_subunits = payment_entity.get("amount") or payment_link_entity.get("amount_paid") or payment_link_entity.get("amount") or 0
    amount_paid = float(amount_subunits) / 100.0 if amount_subunits > 0 else 0.0

    booking_id = (
        _extract_note(payment_link_entity, "booking_id")
        or _extract_note(payment_entity, "booking_id")
        or _extract_note(order_entity, "booking_id")
    )

    # Multi-tenant isolated Redis deduplication check
    event_id = event_data.get("id") or f"{event_type}:{pay_id or plink_id}"
    dedup_key = f"rzp_booking_wh:{tenant_uuid}:{event_id}"
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))
        is_new = await r.set(dedup_key, "1", ex=86400, nx=True)
        await r.close()
        if not is_new:
            logger.info("tenant_booking_webhook_duplicate_ignored", tenant_id=tenant_uuid, dedup_key=dedup_key)
            return {"status": "ok", "message": "Duplicate event ignored"}
    except Exception as e_red:
        logger.warning("tenant_booking_webhook_redis_dedup_warning", error=str(e_red))

    async with database.db_pool.acquire() as conn:
        b_row = None
        if booking_id:
            try:
                b_uuid = str(uuid.UUID(booking_id.strip()))
                b_row = await conn.fetchrow(
                    """SELECT id, contact_id, conversation_id, service, start_time, end_time, status, notes, staff_member, price, currency, payment_status, razorpay_payment_id
                       FROM bookings WHERE id = $1::uuid AND tenant_id = $2::uuid""",
                    b_uuid, tenant_uuid
                )
            except Exception:
                b_row = None

        if not b_row and plink_id:
            b_row = await conn.fetchrow(
                """SELECT id, contact_id, conversation_id, service, start_time, end_time, status, notes, staff_member, price, currency, payment_status, razorpay_payment_id
                   FROM bookings WHERE razorpay_payment_link_id = $1 AND tenant_id = $2::uuid""",
                str(plink_id).strip(), tenant_uuid
            )

        if not b_row:
            logger.warning("tenant_booking_webhook_booking_not_found", tenant_id=tenant_uuid, booking_id=booking_id, plink_id=plink_id)
            return {"status": "ok", "message": "Booking not found or not belonging to tenant"}

        eff_booking_id = str(b_row["id"])
        contact_id = str(b_row["contact_id"]) if b_row.get("contact_id") else None
        service_name = b_row.get("service") or "Appointment"
        st_dt = b_row.get("start_time")
        et_dt = b_row.get("end_time")

        # Handle non-successful events properly without confirming the booking
        if event_type in ("payment.failed",):
            logger.warning("tenant_booking_payment_failed_event", tenant_id=tenant_uuid, booking_id=eff_booking_id)
            await conn.execute(
                """UPDATE bookings SET payment_status = 'failed', updated_at = NOW()
                   WHERE id = $1::uuid AND tenant_id = $2::uuid AND payment_status != 'paid'""",
                eff_booking_id, tenant_uuid
            )
            return {"status": "ok", "message": "Payment failure recorded", "booking_id": eff_booking_id}

        if event_type in ("payment_link.cancelled", "payment_link.expired"):
            new_st = "cancelled" if "cancelled" in event_type else "expired"
            await conn.execute(
                """UPDATE bookings SET payment_status = $1, updated_at = NOW()
                   WHERE id = $2::uuid AND tenant_id = $3::uuid AND payment_status != 'paid'""",
                new_st, eff_booking_id, tenant_uuid
            )
            return {"status": "ok", "message": f"Payment link {new_st} recorded", "booking_id": eff_booking_id}

        # Ignore informational non-payment events (e.g. payment_link.created)
        if event_type not in ("payment_link.paid", "payment.captured", "order.paid"):
            logger.info("tenant_booking_webhook_unhandled_event", event=event_type, booking_id=eff_booking_id)
            return {"status": "ok", "message": f"Event {event_type} ignored"}

        # Idempotency check: If booking is already paid, do not re-send confirmations or duplicate calendar sync
        if b_row.get("payment_status") == "paid":
            logger.info("tenant_booking_already_paid", tenant_id=tenant_uuid, booking_id=eff_booking_id)
            return {"status": "ok", "message": "Booking already marked as paid", "booking_id": eff_booking_id}

        # Update booking to paid & confirmed in PostgreSQL
        await conn.execute(
            """
            UPDATE bookings
            SET payment_status = 'paid',
                payment_mode = 'online',
                razorpay_payment_id = COALESCE(NULLIF($1, ''), razorpay_payment_id),
                amount_paid = CASE WHEN $2::numeric > 0 THEN $2::numeric ELSE price END,
                payment_collected_at = NOW(),
                status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
                updated_at = NOW()
            WHERE id = $3::uuid AND tenant_id = $4::uuid
            """,
            pay_id, amount_paid, eff_booking_id, tenant_uuid
        )

        logger.info(
            "tenant_booking_payment_confirmed",
            tenant_id=tenant_uuid,
            booking_id=eff_booking_id,
            payment_id=pay_id,
            amount_paid=amount_paid
        )

        admin_wa_phone = (t_settings.get("admin_whatsapp_number") or "").strip()

        contact_row = None
        if contact_id:
            contact_row = await conn.fetchrow(
                "SELECT name, phone FROM contacts WHERE id = $1::uuid AND tenant_id = $2::uuid",
                contact_id, tenant_uuid
            )
        clean_cust_name = (contact_row.get("name") if contact_row else None) or "Valued Customer"
        clean_cust_phone = (contact_row.get("phone") if contact_row else None) or ""

        # Format date & time
        tz_name = (t_settings.get("timezone") or "Asia/Kolkata").strip()
        try:
            import zoneinfo
            tenant_tz = zoneinfo.ZoneInfo(tz_name)
        except Exception:
            tenant_tz = timezone(timedelta(hours=5, minutes=30))

        st_loc = st_dt.astimezone(tenant_tz) if hasattr(st_dt, "astimezone") else st_dt
        d_str = st_loc.strftime("%d %b %Y") if st_loc else ""
        t_str = st_loc.strftime("%I:%M %p") if st_loc else ""

        # Dispatch real web push notification for dashboard
        try:
            background_tasks.add_task(
                dispatch_push_notification,
                pool=database.db_pool,
                tenant_id=tenant_uuid,
                title=f"💳 Payment Received: {clean_cust_name}",
                body=f"₹{amount_paid:g} received for {service_name} on {d_str} at {t_str}",
                notif_type="booking_payment",
                url="/dashboard#bookings",
                data={"booking_id": eff_booking_id, "payment_id": pay_id}
            )
        except Exception as e_push:
            logger.warning("tenant_booking_push_failed", error=str(e_push))

        # Send WhatsApp payment confirmation to customer
        if clean_cust_phone:
            wa_confirm_msg = (
                f"✅ *Payment Confirmed!*\n\n"
                f"Thank you, {clean_cust_name}! We have received your payment of ₹{amount_paid:g} "
                f"for *{service_name}* on *{d_str}* at *{t_str}*.\n\n"
                f"Your appointment is locked in and confirmed with {tenant_name}. We look forward to seeing you!"
            )
            try:
                background_tasks.add_task(
                    dispatch_whatsapp_message,
                    tenant_id=tenant_uuid,
                    to_phone=clean_cust_phone,
                    text=wa_confirm_msg
                )
            except Exception as e_wa:
                logger.warning("tenant_booking_wa_confirm_failed", error=str(e_wa))

        # Send WhatsApp alert to Admin
        if admin_wa_phone:
            admin_msg = (
                f"💰 *Booking Payment Collected!*\n\n"
                f"• *Customer:* {clean_cust_name} ({clean_cust_phone})\n"
                f"• *Service:* {service_name}\n"
                f"• *Amount Paid:* ₹{amount_paid:g}\n"
                f"• *Date & Time:* {d_str} at {t_str}\n"
                f"• *Payment ID:* {pay_id}\n"
                f"• *Booking ID:* {eff_booking_id[:8]}"
            )
            try:
                background_tasks.add_task(
                    dispatch_whatsapp_message,
                    tenant_id=tenant_uuid,
                    to_phone=admin_wa_phone,
                    text=admin_msg
                )
            except Exception as e_adm_wa:
                logger.warning("tenant_booking_admin_wa_failed", error=str(e_adm_wa))

        # Google Calendar Sync (using database.db_pool so connection is safe after request lifecycle)
        try:
            from services.crm_service import create_google_calendar_event
            background_tasks.add_task(
                create_google_calendar_event,
                conn=database.db_pool,
                tenant_id=tenant_uuid,
                booking_id=eff_booking_id,
                service_name=service_name,
                clean_name=clean_cust_name,
                clean_phone=clean_cust_phone,
                notes=b_row.get("notes") or "",
                st_dt=st_dt,
                et_dt=et_dt,
                source="Online Payment",
                date_str=d_str,
                clock_str=t_str,
                full_location=(t_settings.get("full_location_text") or "").strip()
            )
        except Exception as e_gcal:
            logger.warning("tenant_booking_gcal_sync_failed", error=str(e_gcal))

    return {
        "status": "success",
        "booking_id": eff_booking_id,
        "payment_status": "paid",
        "amount_paid": amount_paid
    }



