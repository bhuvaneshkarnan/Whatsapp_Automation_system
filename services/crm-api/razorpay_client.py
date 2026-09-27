import os
import re
import hmac
import hashlib
import json
from typing import Optional, Dict, Any, List
import httpx
import structlog

logger = structlog.get_logger("razorpay-client")

def is_valid_subscription_id(sub_id: Optional[str]) -> bool:
    """Validates Razorpay subscription ID format: starts with sub_, alphanumeric, <= 40 chars."""
    if not sub_id or not isinstance(sub_id, str):
        return False
    clean = sub_id.strip()
    return len(clean) <= 40 and bool(re.match(r"^sub_[A-Za-z0-9]+$", clean))

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_PLAN_ID = os.getenv("RAZORPAY_PLAN_ID", "plan_TeIaa7OueqVKIK")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

def validate_razorpay_config():
    """Validates Razorpay environment variables in production."""
    env = (os.getenv("ENV") or os.getenv("ENVIRONMENT") or "development").lower()
    if env == "production":
        missing = [
            name for name, val in [
                ("RAZORPAY_KEY_ID", RAZORPAY_KEY_ID),
                ("RAZORPAY_KEY_SECRET", RAZORPAY_KEY_SECRET),
                ("RAZORPAY_PLAN_ID", RAZORPAY_PLAN_ID),
                ("RAZORPAY_WEBHOOK_SECRET", RAZORPAY_WEBHOOK_SECRET),
            ] if not val
        ]
        if missing:
            raise RuntimeError(f"Missing required Razorpay environment variable(s) in production: {', '.join(missing)}")

validate_razorpay_config()

BASE_URL = "https://api.razorpay.com/v1"

def get_auth() -> tuple:
    k_id = os.getenv("RAZORPAY_KEY_ID") or RAZORPAY_KEY_ID
    k_sec = os.getenv("RAZORPAY_KEY_SECRET") or RAZORPAY_KEY_SECRET
    return (k_id, k_sec)

def is_configured() -> bool:
    k_id, k_sec = get_auth()
    return bool(k_id and k_sec)

def verify_webhook_signature(raw_body: bytes, signature: str, secret: Optional[str] = None) -> bool:
    """
    Verifies the x-razorpay-signature header against raw webhook payload using HMAC-SHA256.
    """
    sec = secret or RAZORPAY_WEBHOOK_SECRET
    if not signature or not sec:
        return False
    try:
        expected = hmac.new(
            sec.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
    except Exception as e:
        logger.error("razorpay_signature_verify_error", error=str(e))
        return False

async def create_customer(name: str, email: Optional[str] = None, contact: Optional[str] = None) -> Dict[str, Any]:
    """Create customer in Razorpay."""
    payload: Dict[str, Any] = {"name": name}
    if email and "@" in email:
        payload["email"] = email.strip()
    if contact:
        clean_phone = "".join(filter(str.isdigit, contact))
        if clean_phone:
            payload["contact"] = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            f"{BASE_URL}/customers",
            json=payload,
            auth=get_auth()
        )
        if res.status_code not in (200, 201):
            logger.error("razorpay_customer_creation_failed", status=res.status_code, body=res.text)
            raise Exception(f"Razorpay customer creation failed: {res.text}")
        return res.json()

async def create_subscription(
    plan_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    org_slug: str = "org",
    total_count: int = 120,
) -> Dict[str, Any]:
    """
    Create recurring subscription for an organization with Autopay enabled.
    Note: Do not attach customer_id to hosted subscriptions, as Razorpay disables
    the hosted checkout page ("Hosted page is not available") when customer_id is bound upfront.
    The customer enters/verifies their details directly on the hosted checkout page.
    """
    p_id = plan_id or RAZORPAY_PLAN_ID
    notes: Dict[str, Any] = {
        "org_slug": org_slug,
    }
    if tenant_id:
        notes["tenant_id"] = str(tenant_id)

    payload: Dict[str, Any] = {
        "plan_id": p_id,
        "customer_notify": 1,
        "total_count": total_count,
        "notes": notes
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            f"{BASE_URL}/subscriptions",
            json=payload,
            auth=get_auth()
        )
        if res.status_code not in (200, 201):
            logger.error("razorpay_subscription_creation_failed", status=res.status_code, body=res.text)
            raise Exception(f"Razorpay subscription creation failed: {res.text}")
        return res.json()

async def fetch_subscription(subscription_id: str) -> Dict[str, Any]:
    """Fetch live subscription state from Razorpay."""
    if not is_valid_subscription_id(subscription_id):
        logger.warning("invalid_subscription_id_format_skipped", sub_id=subscription_id)
        return {}
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(
            f"{BASE_URL}/subscriptions/{subscription_id}",
            auth=get_auth()
        )
        if res.status_code != 200:
            logger.warning("razorpay_subscription_fetch_failed", sub_id=subscription_id, status=res.status_code, body=res.text)
            return {}
        return res.json()

async def fetch_invoices_for_subscription(subscription_id: str) -> List[Dict[str, Any]]:
    """Fetch invoices associated with a specific subscription."""
    if not is_valid_subscription_id(subscription_id):
        logger.warning("invalid_subscription_id_format_skipped", sub_id=subscription_id)
        return []
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(
            f"{BASE_URL}/invoices?subscription_id={subscription_id}",
            auth=get_auth()
        )
        if res.status_code != 200:
            logger.warning("razorpay_invoices_fetch_failed", sub_id=subscription_id, status=res.status_code, body=res.text)
            return []
        data = res.json()
        return data.get("items", [])

async def get_or_create_plan(
    amount: int,
    name: str = "WhatsApp Automation & CRM Plan",
    period: str = "monthly"
) -> str:
    """Find an existing plan matching amount and period, or create one dynamically."""
    if not is_configured():
        return RAZORPAY_PLAN_ID
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.get(f"{BASE_URL}/plans", auth=get_auth())
            if res.status_code == 200:
                for p in res.json().get("items", []):
                    if p.get("period") == period and p.get("item", {}).get("amount") == amount:
                        return p.get("id")

            payload = {
                "period": period,
                "interval": 1,
                "item": {
                    "name": name,
                    "amount": amount,
                    "currency": "INR",
                    "description": f"{name} ({period})"
                }
            }
            res2 = await client.post(f"{BASE_URL}/plans", json=payload, auth=get_auth())
            if res2.status_code in (200, 201):
                return res2.json().get("id")
        except Exception as e:
            logger.warning("get_or_create_plan_error", error=str(e))
    return RAZORPAY_PLAN_ID


async def create_payment_link(
    amount: int = 263000,  # in paise: 263000 = ₹2,630 (net ~₹2,500 after Razorpay fees)
    currency: str = "INR",
    customer_name: Optional[str] = None,
    customer_email: Optional[str] = None,
    customer_contact: Optional[str] = None,
    description: str = "Boldlabs CRM Platform Subscription (₹2,499/month)",
    org_slug: str = "boldlabs",
    tenant_id: Optional[str] = None,
    callback_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a standard Razorpay Payment Link (checkout page) for an organization."""
    if not is_configured():
        raise ValueError("Razorpay API credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured on the server.")
    payload: Dict[str, Any] = {
        "amount": amount,
        "currency": currency,
        "accept_partial": False,
        "description": description,
        "notify": {
            "sms": bool(customer_contact),
            "email": bool(customer_email and "@" in customer_email)
        },
        "reminder_enable": True,
        "notes": {
            "org_slug": org_slug,
            "tenant_id": str(tenant_id) if tenant_id else "",
            "type": "monthly_subscription"
        }
    }
    if callback_url:
        payload["callback_url"] = callback_url
        payload["callback_method"] = "get"

    cust: Dict[str, str] = {}
    if customer_name:
        cust["name"] = customer_name
    if customer_email and "@" in customer_email:
        cust["email"] = customer_email.strip()
    if customer_contact:
        clean_phone = "".join(filter(str.isdigit, customer_contact))
        if clean_phone:
            cust["contact"] = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    if cust:
        payload["customer"] = cust

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            f"{BASE_URL}/payment_links",
            json=payload,
            auth=get_auth()
        )
        if res.status_code not in (200, 201):
            logger.error("razorpay_payment_link_creation_failed", status=res.status_code, body=res.text)
            raise Exception(f"Razorpay payment link creation failed: {res.text}")
        return res.json()

async def fetch_payment_link(payment_link_id: str) -> Dict[str, Any]:
    """Fetch live status of a Razorpay Payment Link."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(
            f"{BASE_URL}/payment_links/{payment_link_id}",
            auth=get_auth()
        )
        if res.status_code != 200:
            logger.error("razorpay_payment_link_fetch_failed", plink_id=payment_link_id, status=res.status_code, body=res.text)
            raise Exception(f"Razorpay payment link fetch failed: {res.text}")
        return res.json()


