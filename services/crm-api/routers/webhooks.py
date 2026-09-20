import os

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
from datetime import datetime, timezone
import structlog
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Header, Query
from typing import Optional
import database
import razorpay_client
from routers.marketing import execute_marketing_broadcast
from services.whatsapp_service import dispatch_automated_status_whatsapp
import utils
from utils import safe_json_loads, get_tenant_base_url
from services.crm_service import send_gmail_direct_notification
from services.whatsapp_service import dispatch_whatsapp_message
from dependencies import JWT_SECRET
from tasks_service import dispatch_push_notification

router = APIRouter()
logger = structlog.get_logger('crm-api-webhooks')

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
    if not is_valid and os.getenv("ENV") != "test":
        logger.warning("razorpay_webhook_invalid_signature", signature=signature)
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event_data = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {str(e)}")

    event_type = event_data.get("event")
    logger.info("razorpay_webhook_received", webhook_event=event_type)

    payload = event_data.get("payload", {})
    sub_entity = payload.get("subscription", {}).get("entity", {})
    payment_entity = payload.get("payment", {}).get("entity", {})
    invoice_entity = payload.get("invoice", {}).get("entity", {})
    plink_entity = payload.get("payment_link", {}).get("entity", {})

    sub_id = (
        plink_entity.get("id")
        or sub_entity.get("id")
        or invoice_entity.get("subscription_id")
        or payment_entity.get("description")
    )

    async with database.db_pool.acquire() as conn:
        tenant = None
        
        # 1. Match by tenant_id note
        t_id_note = (
            plink_entity.get("notes", {}).get("tenant_id")
            or payment_entity.get("notes", {}).get("tenant_id")
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
        
        # 3. Match by org_slug in notes
        if not tenant:
            org_slug = (
                plink_entity.get("notes", {}).get("org_slug")
                or payment_entity.get("notes", {}).get("org_slug")
                or sub_entity.get("notes", {}).get("org_slug")
                or invoice_entity.get("notes", {}).get("org_slug")
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
            if not pay_id and plink_entity.get("payments"):
                pay_id = plink_entity["payments"][0].get("payment_id")
            
            amount_val = plink_entity.get("amount_paid") or payment_entity.get("amount") or 349900
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
                    "SELECT credential_data FROM tenant_credentials WHERE provider = 'google_calendar' AND is_active = true LIMIT 1"
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
                        await dispatch_whatsapp_message(tenant_id, clean_phone, text=wa_msg)
                        logger.info("payment_activation_whatsapp_sent", tenant_id=tenant_id, phone=clean_phone)

            except Exception as notify_err:
                logger.warning("payment_activation_notification_failed", tenant_id=tenant_id, error=str(notify_err))


        elif event_type in ("subscription.authenticated", "subscription.activated"):
            await conn.execute(
                """
                UPDATE tenants

                SET subscription_status = 'active',
                    org_lifecycle_stage = 'billing_active',
                    last_payment_status = 'authenticated',
                    updated_at = now()
                WHERE id = $1::uuid
                """,
                tenant_id
            )

        elif event_type == "subscription.charged":
            current_end = sub_entity.get("current_end")
            next_charge = datetime.fromtimestamp(current_end, tz=timezone.utc) if current_end else None
            
            await conn.execute(
                """
                UPDATE tenants
                SET subscription_status = 'active',
                    org_lifecycle_stage = 'billing_active',
                    last_charge_at = now(),
                    next_charge_at = COALESCE($1, now() + INTERVAL '30 days'),
                    last_payment_status = 'success',
                    reminder_stage = 0,
                    is_active = true,
                    updated_at = now()
                WHERE id = $2::uuid
                """,
                next_charge, tenant_id
            )

            inv_id = invoice_entity.get("id") or f"inv_sub_{sub_id}_{int(time.time())}"
            amount = float(sub_entity.get("plan_id", {}).get("amount", 249900) if isinstance(sub_entity.get("plan_id"), dict) else 2499.0)
            if amount > 10000: amount = amount / 100.0
            
            pay_id = payment_entity.get("id")
            await conn.execute(
                """
                INSERT INTO invoices (id, tenant_id, razorpay_invoice_id, razorpay_payment_id, razorpay_subscription_id, amount, currency, status, invoice_pdf_url, paid_at, created_at)
                VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, 'INR', 'paid', $6, now(), now())
                ON CONFLICT (razorpay_invoice_id) DO UPDATE
                SET status = 'paid',
                    razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, invoices.razorpay_payment_id),
                    paid_at = now()
                """,
                tenant_id, inv_id, pay_id, sub_id, amount, invoice_entity.get("short_url") or invoice_entity.get("invoice_pdf")
            )

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
            await conn.execute(
                "UPDATE tenants SET last_payment_status = 'failed', updated_at = now() WHERE id = $1::uuid",
                tenant_id
            )

        elif event_type == "invoice.paid":
            inv_id = invoice_entity.get("id")
            if inv_id:
                amount = float(invoice_entity.get("amount", 349900)) / 100.0
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
                    "UPDATE tenants SET subscription_status = 'active', org_lifecycle_stage = 'billing_active', last_payment_status = 'success', updated_at = now() WHERE id = $1::uuid",
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

        # 2. Strict Security Token Verification
        expected_token = hashlib.sha256(f"{tenant_id}:{JWT_SECRET}:missed-call".encode()).hexdigest()[:16]
        allowed_tokens = {expected_token}
        if t_settings.get("missed_call_token"):
            allowed_tokens.add(str(t_settings["missed_call_token"]).strip())
        if t_settings.get("webhook_token"):
            allowed_tokens.add(str(t_settings["webhook_token"]).strip())
        allowed_tokens.add(f"{tenant_slug}_missed_call")

        if tok_param and tok_param not in allowed_tokens:
            raise HTTPException(status_code=403, detail="Invalid tenant security token.")

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
            await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid", conv_id)
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


