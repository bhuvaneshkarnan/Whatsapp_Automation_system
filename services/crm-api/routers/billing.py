import os
import re
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union
import structlog
from fastapi import APIRouter, Depends, Query, HTTPException, Request, Header
from pydantic import BaseModel
import database
from dependencies import get_tenant_id, get_caller_context, verify_super_admin
from models import TenantPaymentLinkUpdate
import razorpay_client

router = APIRouter()
logger = structlog.get_logger('crm-api-billing')



@router.get("/settings/invoices")
async def get_client_billing_invoices(
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Retrieve authentic Razorpay billing invoice receipts and history for the authenticated tenant.
    Syncs live from Razorpay API whenever a subscription exists, ensuring genuine Razorpay receipts.
    """
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow(
            """
            SELECT id, name, slug, settings, subscription_status,
                   razorpay_customer_id, razorpay_subscription_id, razorpay_short_url
            FROM tenants WHERE id = $1::uuid
            """,
            tenant_id
        )
        if not tenant:
            return []

        sub_id = (tenant.get("razorpay_subscription_id") or "").strip()

        # If tenant has a real Razorpay subscription (sub_...), sync latest invoices from Razorpay
        if sub_id and sub_id.startswith("sub_") and len(sub_id) <= 18 and re.match(r"^sub_[A-Za-z0-9]+$", sub_id):
            try:
                rzp_invoices = await razorpay_client.fetch_invoices_for_subscription(sub_id)
                for rzp_inv in rzp_invoices:
                    inv_id = rzp_inv.get("id")
                    if not inv_id:
                        continue
                    amt_val = float(rzp_inv.get("amount", 263000))
                    amt = amt_val / 100.0 if amt_val > 10000 else amt_val
                    inv_status = rzp_inv.get("status", "paid")
                    short_url = rzp_inv.get("short_url") or rzp_inv.get("invoice_pdf") or ""
                    
                    paid_ts = rzp_inv.get("paid_at")
                    paid_dt = datetime.fromtimestamp(paid_ts, tz=timezone.utc) if paid_ts else None
                    issued_ts = rzp_inv.get("issued_at") or rzp_inv.get("date")
                    issued_dt = datetime.fromtimestamp(issued_ts, tz=timezone.utc) if issued_ts else datetime.now(timezone.utc)
                    pay_id = rzp_inv.get("payment_id") or ""

                    await conn.execute(
                        """
                        INSERT INTO invoices (id, tenant_id, razorpay_invoice_id, razorpay_payment_id, razorpay_subscription_id, amount, currency, status, invoice_pdf_url, paid_at, created_at)
                        VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, 'INR', $6, $7, $8, $9)
                        ON CONFLICT (razorpay_invoice_id) DO UPDATE
                        SET status = EXCLUDED.status,
                            razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, invoices.razorpay_payment_id),
                            invoice_pdf_url = COALESCE(EXCLUDED.invoice_pdf_url, invoices.invoice_pdf_url),
                            paid_at = COALESCE(EXCLUDED.paid_at, invoices.paid_at)
                        """,
                        tenant_id, inv_id, pay_id, sub_id, amt, inv_status, short_url, paid_dt, issued_dt
                    )
            except Exception as e:
                logger.warning("razorpay_invoice_sync_warn", tenant_id=tenant_id, sub_id=sub_id, error=str(e))

        # Query authentic invoices from database
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

        # Return only genuine invoices (never fake mock records)
        return [
            {
                "id": str(r["id"]),
                "razorpay_invoice_id": r["razorpay_invoice_id"] or "",
                "razorpay_payment_id": r["razorpay_payment_id"] or "",
                "razorpay_subscription_id": r["razorpay_subscription_id"] or "",
                "amount": float(r["amount"] or 2630.0),
                "currency": r["currency"] or "INR",
                "status": r["status"] or "paid",
                "invoice_pdf_url": r["invoice_pdf_url"] or "",
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "paid_at": r["paid_at"].isoformat() if r["paid_at"] else None,
            }
            for r in rows
            if not str(r["razorpay_invoice_id"]).startswith("INV-20260830")  # filter any legacy mock data
        ]


@router.post("/tenant/billing/initiate-payment")
async def initiate_tenant_payment(
    force_new: bool = Query(False),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Dynamically generates or fetches an authentic Razorpay Payment Link for the authenticated tenant.
    Strictly tenant-scoped: only accesses and updates the authenticated tenant's record.
    """
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow(
            """
            SELECT id, name, slug, settings, subscription_status, org_lifecycle_stage,
                   razorpay_customer_id, razorpay_subscription_id, razorpay_short_url
            FROM tenants WHERE id = $1::uuid
            """,
            tenant_id
        )
        if not tenant:
            raise HTTPException(404, "Tenant workspace not found")

        existing_sub_id = tenant.get("razorpay_subscription_id") or ""
        existing_short_url = tenant.get("razorpay_short_url") or ""

        # If already has a genuine active payment link and not forced, return it
        if not force_new and existing_short_url and "boldlabs-crm" not in existing_short_url and (existing_short_url.startswith("https://rzp.io/") or existing_short_url.startswith("https://pages.razorpay.com/")):
            return {
                "status": "active",
                "short_url": existing_short_url,
                "subscription_id": existing_sub_id,
                "tenant_id": tenant_id,
                "tenant_slug": tenant["slug"],
                "message": "Existing payment link is active"
            }

        cfg = tenant.get("settings") or {}
        if isinstance(cfg, str):
            try: cfg = json.loads(cfg)
            except: cfg = {}

        monthly_price = float(cfg.get("monthly_price", 2630.0))
        amount_paisa = int(monthly_price * 100)

        # Check Razorpay credentials
        k_id = os.getenv("RAZORPAY_KEY_ID")
        k_sec = os.getenv("RAZORPAY_KEY_SECRET")
        if not k_id or not k_sec:
            raise HTTPException(
                status_code=400,
                detail="Razorpay API credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured on the server. Please set them in server .env or paste your custom Razorpay link directly."
            )

        admin_contact = await conn.fetchrow(
            "SELECT email, display_name FROM users WHERE tenant_id = $1::uuid AND role IN ('admin', 'owner', 'super_admin') ORDER BY created_at ASC LIMIT 1",
            tenant_id
        )
        customer_email = admin_contact["email"] if admin_contact else f"{tenant['slug']}@boldlabs.ai"
        customer_name = tenant["name"] or "CRM Client"
        admin_phone = cfg.get("admin_whatsapp_number", "")

        try:
            plink_res = await razorpay_client.create_payment_link(
                amount=amount_paisa,
                currency="INR",
                customer_name=customer_name,
                customer_email=customer_email,
                customer_contact=admin_phone,
                description=f"{customer_name} - Platform Subscription (₹{int(monthly_price):,}/mo)",
                org_slug=tenant["slug"],
                tenant_id=tenant_id
            )
        except Exception as e:
            logger.error("tenant_payment_link_generation_error", tenant_id=tenant_id, error=str(e))
            raise HTTPException(status_code=502, detail=f"Failed to generate payment link with Razorpay: {str(e)}")

        sub_id = plink_res.get("id")
        short_url = plink_res.get("short_url")

        await conn.execute(
            """
            UPDATE tenants
            SET razorpay_subscription_id = $1,
                razorpay_short_url = $2,
                updated_at = now()
            WHERE id = $3::uuid
            """,
            sub_id, short_url, tenant_id
        )

        logger.info("tenant_payment_link_created", tenant_id=tenant_id, sub_id=sub_id, short_url=short_url)
        return {
            "status": "created",
            "short_url": short_url,
            "subscription_id": sub_id,
            "tenant_id": tenant_id,
            "tenant_slug": tenant["slug"],
            "amount": monthly_price,
            "message": "Payment link generated successfully"
        }


@router.post("/tenant/billing/create-subscription")
async def create_tenant_subscription(
    force_new: bool = Query(False),
    plan_id: Optional[str] = Query(None),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Creates an authentic Razorpay Recurring Subscription (sub_...) for auto-debit on renewal.
    When the client completes authentication via UPI Autopay or Card, Razorpay automatically
    charges the client on every renewal date.
    """
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow(
            """
            SELECT id, name, slug, settings, subscription_status, org_lifecycle_stage,
                   razorpay_customer_id, razorpay_subscription_id, razorpay_short_url
            FROM tenants WHERE id = $1::uuid
            """,
            tenant_id
        )
        if not tenant:
            raise HTTPException(404, "Tenant workspace not found")

        existing_sub_id = tenant.get("razorpay_subscription_id") or ""
        existing_short_url = tenant.get("razorpay_short_url") or ""

        # If already has an active recurring subscription link and not forced, return it
        if not force_new and existing_sub_id.startswith("sub_") and existing_short_url.startswith("https://rzp.io/"):
            return {
                "status": "active",
                "short_url": existing_short_url,
                "subscription_id": existing_sub_id,
                "tenant_id": tenant_id,
                "tenant_slug": tenant["slug"],
                "message": "Existing recurring subscription is active"
            }

        target_plan = plan_id or os.getenv("RAZORPAY_PLAN_ID", "plan_TeICRz2cZId1i2")
        customer_id = tenant.get("razorpay_customer_id")

        try:
            sub_res = await razorpay_client.create_subscription(
                plan_id=target_plan,
                customer_id=customer_id,
                org_slug=tenant["slug"]
            )
        except Exception as e:
            logger.error("tenant_subscription_creation_error", tenant_id=tenant_id, error=str(e))
            raise HTTPException(status_code=502, detail=f"Failed to create recurring subscription with Razorpay: {str(e)}")

        sub_id = sub_res.get("id")
        short_url = sub_res.get("short_url")

        await conn.execute(
            """
            UPDATE tenants
            SET razorpay_subscription_id = $1,
                razorpay_short_url = $2,
                updated_at = now()
            WHERE id = $3::uuid
            """,
            sub_id, short_url, tenant_id
        )

        logger.info("tenant_recurring_subscription_created", tenant_id=tenant_id, sub_id=sub_id, short_url=short_url)
        return {
            "status": "created",
            "short_url": short_url,
            "subscription_id": sub_id,
            "tenant_id": tenant_id,
            "tenant_slug": tenant["slug"],
            "message": "Recurring subscription created successfully for auto-debit"
        }


@router.post("/tenant/billing/set-payment-link")
async def set_tenant_payment_link(
    payload: TenantPaymentLinkUpdate,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """
    Manually attach an official Razorpay payment page/link directly to the authenticated tenant.
    Strictly tenant-scoped.
    """
    caller_role = caller.get("role") if isinstance(caller, dict) else "admin"
    if caller_role not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to update payment link.")

    url = payload.payment_url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="Invalid payment URL. Must start with http:// or https://")

    async with database.db_pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE tenants
            SET razorpay_short_url = $1,
                updated_at = now()
            WHERE id = $2::uuid
            """,
            url, tenant_id
        )
        return {
            "status": "updated",
            "short_url": url,
            "tenant_id": tenant_id,
            "message": "Payment link updated successfully"
        }
