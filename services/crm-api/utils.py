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

import re
import json
import urllib.parse
from typing import Any, Optional, Dict
from fastapi import Request

APP_BASE_URL = os.getenv("APP_BASE_URL", "https://crm.goboldlabs.com").rstrip("/")

def safe_json_loads(val: Any, default: Any = None) -> Any:
    if val is None:
        return default if default is not None else {}
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return default if default is not None else {}
    return default if default is not None else {}


async def get_tenant_base_url(conn, tenant_id: str, request: Optional[Request] = None) -> str:
    """Resolve the preferred base URL for a tenant (custom domain or partner agency domain, falling back to APP_BASE_URL)."""
    if request:
        req_origin = request.headers.get("origin") or ""
        if not req_origin and request.headers.get("referer"):
            parsed = urllib.parse.urlparse(request.headers.get("referer"))
            if parsed.scheme and parsed.netloc:
                req_origin = f"{parsed.scheme}://{parsed.netloc}"
        if req_origin:
            return req_origin.rstrip("/")
    try:
        t_row = await conn.fetchrow("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
        if t_row and t_row["settings"]:
            st = safe_json_loads(t_row["settings"], {})
            cd = (st.get("custom_domain") or "").strip()
            if cd:
                if not cd.startswith("http"):
                    cd = f"https://{cd}"
                return cd.rstrip("/")
            p_name = (st.get("partner_name") or "").strip()
            if p_name:
                p_cd = await conn.fetchval(
                    "SELECT custom_domain FROM partner_agency_templates WHERE LOWER(TRIM(partner_name)) = LOWER(TRIM($1))",
                    p_name
                )
                if p_cd and p_cd.strip():
                    p_cd = p_cd.strip()
                    if not p_cd.startswith("http"):
                        p_cd = f"https://{p_cd}"
                    return p_cd.rstrip("/")
    except Exception:
        pass
    return APP_BASE_URL



KNOWN_TEMPLATES_EXPANSION: Dict[str, str] = {
    "mbr_appointment_confirmed": "Hello {0},\n\nYour appointment has been confirmed.\nDate: {1}\nTime: {2}\n\nIf you need to make any changes, just reply to this chat. We look forward to seeing you.",
    "booking_confirmationn": "Hello {0},\n\nYour appointment is confirmed.\nService: {1}\nDate: {2}\nTime: {3}\n\nIf you need to make any changes, just reply to this chat. We look forward to seeing you.",
    "booking_reschedule_confirmation": "Hello {0}, Your {1} appointment has been rescheduled to {2} at {3}.\n\nIf you need to make any changes, just reply to this chat. We look forward to seeing you.",
    "cancellation_confirmation": "Hello {0},\n\nYour {1} appointment on {2} at {3} has been cancelled as requested.\n\nWhenever you would like to book again, just message us here.",
    "appointment_ramainder": "Hi {0}, quick reminder that your {1} appointment is coming up today at {2}.\nSee you shortly, reply here if you need to reschedule.",
    "reschedule_nudge": "Hi {0}, this is an update regarding your {1} appointment today. We noticed you could not make it for your scheduled time. Whenever you are ready, simply reply to this message to update your schedule.",
    "client_followup_checkin": "Hi {0}, this is {1} from {2} with an update regarding your service inquiry. Please let us know if you need any assistance or have questions.",
    "review_request": "Hi {0}, thank you for visiting us for your {1}!\n\nWe would really appreciate it if you could take a minute to share your experience with a quick Google review.\nLink: {2}\nThank you!",
    "admin_notification": "New appointment booked.\n\nCustomer Name: {0}\nPhone: {1}\nService: {2}\nDate: {3}\nTime: {4}",
    "utility_general_update": "Hello {0}, this is a service update from {1} regarding your {2}. Please reply to this message if you require assistance.",
    "missed_call_followup": "Hello {0},\n\nWe noticed we just missed your call at {1}. We apologize for being unable to answer right away.\n\nPlease let us know how we can assist you, or reply to this chat anytime.",
}

def expand_template_body(template_name: Optional[str], template_params: Any, fallback_body: Optional[str] = None) -> str:
    """Format human-readable text for WhatsApp templates from parameters."""
    if not template_name:
        return fallback_body or "[Template Message]"
    
    params_list = []
    if isinstance(template_params, str):
        try:
            template_params = json.loads(template_params)
        except Exception:
            template_params = []
    
    if isinstance(template_params, list):
        for item in template_params:
            if isinstance(item, dict) and "parameters" in item:
                for sub in item.get("parameters", []):
                    if isinstance(sub, dict):
                        params_list.append(str(sub.get("text", "")))
                    else:
                        params_list.append(str(sub))
            elif isinstance(item, dict) and "text" in item:
                params_list.append(str(item.get("text", "")))
            else:
                params_list.append(str(item))
    elif isinstance(template_params, dict):
        params_list = [str(v) for v in template_params.values()]

    pattern = KNOWN_TEMPLATES_EXPANSION.get(template_name)
    if pattern:
        try:
            text = pattern
            for idx, p in enumerate(params_list):
                text = text.replace(f"{{{idx}}}", p)
            text = re.sub(r'\{\d+\}', '—', text)
            return text
        except Exception:
            pass

    if fallback_body and not fallback_body.startswith("[Template:"):
        return fallback_body
    if params_list:
        return f"[{template_name}]: {', '.join(params_list)}"
    return fallback_body or f"[Template: {template_name}]"


def sanitize_and_fix_email(email: str) -> str:
    if not email:
        return ""
    email = str(email).strip().lower()
    # Basic fix for common typos like .con -> .com
    if email.endswith(".con"):
        email = email[:-4] + ".com"
    return email
