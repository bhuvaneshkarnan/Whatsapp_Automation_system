"""
Tenant-Scoped Razorpay Payment Service.

CRITICAL ARCHITECTURE RULES:
1. Strictly multi-tenant: All operations REQUIRE a tenant_id and use only that tenant's
   credentials stored in `tenant_credentials` WHERE provider = 'razorpay'.
2. PLATFORM ISOLATION: NEVER imports, references, or falls back to the central platform
   credentials in .env.
   Platform subscription billing and tenant client booking payments are strictly decoupled.
3. SQL queries strictly use asyncpg positional parameters ($1, $2) and include tenant_id.
"""

import hmac
import hashlib
import json
import re
from typing import Optional, Dict, Any
import httpx
try:
    from fastapi import HTTPException
except ImportError:
    from starlette.exceptions import HTTPException

try:
    import structlog
    logger = structlog.get_logger("tenant-payment-service")
except ImportError:
    import logging
    logger = logging.getLogger("tenant-payment-service")
RAZORPAY_API_BASE = "https://api.razorpay.com/v1"


def clean_phone_number(phone: Optional[str]) -> str:
    """Normalize phone number to 10 digits for Indian numbers or numeric string."""
    if not phone:
        return ""
    digits = "".join(filter(str.isdigit, str(phone)))
    if len(digits) >= 10:
        return digits[-10:]
    return digits


def verify_tenant_webhook_signature(raw_body: bytes, signature: str, webhook_secret: str) -> bool:
    """
    Verifies x-razorpay-signature header against raw webhook payload using HMAC-SHA256
    with the tenant's dedicated webhook secret.
    """
    if not signature or not webhook_secret:
        return False
    try:
        expected = hmac.new(
            webhook_secret.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
    except Exception as e:
        logger.error("tenant_razorpay_signature_verify_error", error=str(e))
        return False


def _resolve_db(db: Any = None):
    """Auto-resolve active database pool if db connection is None."""
    if db is not None:
        return db
    try:
        import database
        if getattr(database, "db_pool", None):
            return database.db_pool
    except Exception:
        pass
    try:
        import crm_api.database as crm_db
        if getattr(crm_db, "db_pool", None):
            return crm_db.db_pool
    except Exception:
        pass
    return None


async def get_tenant_razorpay_creds(tenant_id: str, db: Any = None) -> Optional[Dict[str, str]]:
    """
    Retrieve and parse Razorpay credentials strictly for the given tenant_id.
    Returns dict with keys: 'key_id', 'key_secret', 'webhook_secret', or None if unconfigured.
    NEVER falls back to platform environment variables.
    """
    if not tenant_id:
        return None

    db = _resolve_db(db)
    if db is None:
        return None

    # Handle connection pool or single connection
    fetch_fn = getattr(db, "fetchrow", None)
    if not fetch_fn and hasattr(db, "acquire"):
        async with db.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT credential_data, is_active FROM tenant_credentials
                   WHERE tenant_id = $1::uuid AND provider = 'razorpay' AND is_active = true""",
                tenant_id
            )
    elif fetch_fn:
        row = await fetch_fn(
            """SELECT credential_data, is_active FROM tenant_credentials
               WHERE tenant_id = $1::uuid AND provider = 'razorpay' AND is_active = true""",
            tenant_id
        )
    else:
        return None

    if not row or not row["credential_data"]:
        return None

    raw_data = row["credential_data"]
    if isinstance(raw_data, str):
        try:
            raw_data = json.loads(raw_data)
        except Exception:
            return None

    if not isinstance(raw_data, dict):
        return None

    key_id = (raw_data.get("key_id") or "").strip()
    key_secret = (raw_data.get("key_secret") or "").strip()
    webhook_secret = (raw_data.get("webhook_secret") or "").strip()

    if not key_id or not key_secret:
        return None

    return {
        "key_id": key_id,
        "key_secret": key_secret,
        "webhook_secret": webhook_secret,
        "account_name": (raw_data.get("account_name") or "").strip(),
    }


async def create_booking_payment_link(
    tenant_id: str,
    booking_id: str,
    amount: float,
    customer_name: str,
    customer_phone: str,
    customer_email: Optional[str] = None,
    description: Optional[str] = None,
    currency: str = "INR",
    db = None,
    callback_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a standard Razorpay Payment Link using the specific tenant's Razorpay credentials.
    Updates the booking record with razorpay_payment_link_id, razorpay_payment_link_url,
    and sets payment_status = 'pending', payment_mode = 'online'.
    """
    if not tenant_id:
        raise HTTPException(400, "Missing tenant_id for payment link creation")
    if not booking_id:
        raise HTTPException(400, "Missing booking_id for payment link creation")
    if amount <= 0:
        raise HTTPException(400, "Payment amount must be greater than zero")

    creds = await get_tenant_razorpay_creds(tenant_id, db)
    if not creds or not creds.get("key_id") or not creds.get("key_secret"):
        raise HTTPException(
            400,
            "This business has not configured their Razorpay payment credentials. "
            "Please configure Razorpay Key ID and Key Secret in Settings -> Integrations."
        )

    # Razorpay requires amount in smallest currency unit (paise for INR, cents for USD)
    amount_in_subunits = int(round(amount * 100))
    clean_phone = clean_phone_number(customer_phone)

    customer_obj: Dict[str, Any] = {
        "name": customer_name or "Valued Customer",
    }
    if clean_phone:
        customer_obj["contact"] = clean_phone
    if customer_email and "@" in customer_email:
        customer_obj["email"] = customer_email.strip().lower()

    link_desc = (description or f"Appointment Booking ({booking_id[:8]})").strip()

    payload: Dict[str, Any] = {
        "amount": amount_in_subunits,
        "currency": currency.upper(),
        "accept_partial": False,
        "description": link_desc[:250],
        "customer": customer_obj,
        "notify": {
            "sms": False,
            "email": bool(customer_email and "@" in customer_email),
        },
        "reminder_enable": False,
        "notes": {
            "booking_id": booking_id,
            "tenant_id": tenant_id,
            "source": "tenant_booking_payment",
        },
    }

    if callback_url:
        payload["callback_url"] = callback_url
        payload["callback_method"] = "get"

    # Execute HTTP call to Razorpay API with tenant credentials
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(
                f"{RAZORPAY_API_BASE}/payment_links",
                json=payload,
                auth=(creds["key_id"], creds["key_secret"])
            )
        except Exception as e:
            logger.error("razorpay_api_request_failed", tenant_id=tenant_id, error=str(e))
            raise HTTPException(502, f"Failed to connect to Razorpay payment gateway: {str(e)}")

        if res.status_code not in (200, 201):
            logger.error(
                "razorpay_payment_link_creation_failed",
                tenant_id=tenant_id,
                status=res.status_code,
                response_text=res.text
            )
            err_msg = "Razorpay payment link creation failed"
            try:
                err_json = res.json()
                if "error" in err_json and "description" in err_json["error"]:
                    err_msg = f"Razorpay error: {err_json['error']['description']}"
            except Exception:
                err_msg = f"Razorpay error: {res.text}"
            raise HTTPException(502, err_msg)

        data = res.json()

    plink_id = data.get("id")
    short_url = data.get("short_url") or data.get("url") or ""
    status = data.get("status", "created")

    # Update booking in database with strictly scoped tenant_id
    sql_update = """
        UPDATE bookings
        SET razorpay_payment_link_id = $1,
            razorpay_payment_link_url = $2,
            payment_status = 'pending',
            payment_mode = 'online',
            price = $3,
            currency = $4,
            updated_at = NOW()
        WHERE id = $5::uuid AND tenant_id = $6::uuid
    """

    db = _resolve_db(db)
    if db is None:
        raise HTTPException(500, "Database connection not available for payment link creation")

    exec_fn = getattr(db, "execute", None)
    if not exec_fn and hasattr(db, "acquire"):
        async with db.acquire() as conn:
            await conn.execute(sql_update, plink_id, short_url, float(amount), currency.upper(), booking_id, tenant_id)
    elif exec_fn:
        await exec_fn(sql_update, plink_id, short_url, float(amount), currency.upper(), booking_id, tenant_id)

    logger.info(
        "tenant_booking_payment_link_created",
        tenant_id=tenant_id,
        booking_id=booking_id,
        payment_link_id=plink_id,
        amount=amount,
    )

    return {
        "booking_id": booking_id,
        "payment_link_id": plink_id,
        "payment_link_url": short_url,
        "amount": amount,
        "currency": currency.upper(),
        "status": status,
    }


async def fetch_tenant_payment_link(tenant_id: str, payment_link_id: str, db: Any = None) -> Dict[str, Any]:
    """Fetch status of an existing payment link using tenant's credentials."""
    db = _resolve_db(db)
    creds = await get_tenant_razorpay_creds(tenant_id, db)
    if not creds:
        raise HTTPException(400, "Tenant Razorpay credentials not configured")

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(
            f"{RAZORPAY_API_BASE}/payment_links/{payment_link_id}",
            auth=(creds["key_id"], creds["key_secret"])
        )
        if res.status_code != 200:
            raise HTTPException(res.status_code, f"Failed to fetch payment link: {res.text}")
        return res.json()
