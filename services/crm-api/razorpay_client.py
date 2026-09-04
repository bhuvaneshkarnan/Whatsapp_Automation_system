import os
import hmac
import hashlib
import json
import httpx
import structlog
from typing import Optional, Dict, Any, List

logger = structlog.get_logger("razorpay-client")

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_live_TY08mXjPJlDrY0")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "BTmUduwrNmx20GnoM4LtBecR")
RAZORPAY_PLAN_ID = os.getenv("RAZORPAY_PLAN_ID", "plan_TY0FkAowyFUgGw")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "rzp_whsec_wh_2026_secure_key_8f10b7a")

BASE_URL = "https://api.razorpay.com/v1"

def get_auth() -> tuple:
    return (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)

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
    customer_id: Optional[str] = None,
    org_slug: str = "org",
    total_count: int = 120,
) -> Dict[str, Any]:
    """Create recurring subscription for an organization."""
    p_id = plan_id or RAZORPAY_PLAN_ID
    payload: Dict[str, Any] = {
        "plan_id": p_id,
        "customer_notify": 1,
        "total_count": total_count,
        "notes": {
            "org_slug": org_slug
        }
    }
    if customer_id:
        payload["customer_id"] = customer_id

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
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(
            f"{BASE_URL}/subscriptions/{subscription_id}",
            auth=get_auth()
        )
        if res.status_code != 200:
            logger.error("razorpay_subscription_fetch_failed", sub_id=subscription_id, status=res.status_code, body=res.text)
            raise Exception(f"Razorpay subscription fetch failed: {res.text}")
        return res.json()

async def fetch_invoices_for_subscription(subscription_id: str) -> List[Dict[str, Any]]:
    """Fetch invoices associated with a specific subscription."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(
            f"{BASE_URL}/invoices?subscription_id={subscription_id}",
            auth=get_auth()
        )
        if res.status_code != 200:
            logger.error("razorpay_invoices_fetch_failed", sub_id=subscription_id, status=res.status_code, body=res.text)
            return []
        data = res.json()
        return data.get("items", [])
