from utils import get_tenant_base_url
from routers.reviews import google_business_oauth_callback
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
import uuid
from datetime import datetime, timezone, timedelta, time
import structlog
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode
import httpx
import database
from dependencies import get_tenant_id, get_caller_context, verify_super_admin
from models import *
from tasks_service import sync_completed_google_tasks_for_tenant
import utils
import urllib
import base64
import hmac
from fastapi.responses import RedirectResponse
from dependencies import JWT_SECRET

router = APIRouter()
logger = structlog.get_logger('crm-api-calendar')

GOOGLE_OAUTH_REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", f"{utils.APP_BASE_URL}/api/v1/crm/oauth/google/callback")

@router.post("/oauth/google/init")
async def init_google_oauth(
    payload: GoogleOAuthInitPayload,
    request: Request,
    tenant_id: str = Depends(get_tenant_id)
):
    """Save Google Client ID & Secret, and return the Google OAuth authorization URL."""
    c_id = (payload.client_id or "").strip() or os.getenv("GOOGLE_CLIENT_ID", "").strip()
    c_sec = (payload.client_secret or "").strip() or os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    if not c_id or not c_sec:
        raise HTTPException(400, "Google Client ID and Client Secret are required. Please configure master GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env or enter them manually.")

    effective_tenant_id = tenant_id

    async with database.db_pool.acquire() as conn:
        g_row = await conn.fetchrow(
            "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar'",
            effective_tenant_id
        )
        g_data = {}
        g_id = str(g_row["id"]) if g_row else str(uuid.uuid4())
        if g_row and g_row["credential_data"]:
            d = g_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            g_data = dict(d)
        
        g_data["client_id"] = c_id
        g_data["client_secret"] = c_sec
        
        if g_row:
            await conn.execute(
                "UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid",
                json.dumps(g_data), g_id
            )
        else:
            await conn.execute(
                "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'google_calendar', $3::jsonb, true)",
                g_id, effective_tenant_id, json.dumps(g_data)
            )

    scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid"
    src = (payload.source or "dashboard").strip()

    req_origin = ""
    if request:
        req_origin = request.headers.get("origin") or ""
        if not req_origin and request.headers.get("referer"):
            parsed = urllib.parse.urlparse(request.headers.get("referer"))
            if parsed.scheme and parsed.netloc:
                req_origin = f"{parsed.scheme}://{parsed.netloc}"

    # Sign state parameter with HMAC-SHA256 containing tenant_id, a random nonce, and an expiry timestamp
    state_nonce = os.urandom(16).hex()
    state_exp = int(datetime.now(timezone.utc).timestamp()) + 600  # 10 minutes expiry
    state_payload_dict = {
        "tenant_id": effective_tenant_id,
        "source": src,
        "nonce": state_nonce,
        "exp": state_exp,
        "return_origin": req_origin
    }
    state_raw_json = json.dumps(state_payload_dict, separators=(',', ':'))
    state_b64 = base64.urlsafe_b64encode(state_raw_json.encode("utf-8")).decode("utf-8").rstrip("=")
    state_sig = hmac.new(JWT_SECRET.encode("utf-8"), state_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    state_payload = f"{state_b64}.{state_sig}"

    oauth_params = {
        "client_id": c_id,
        "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": scopes,
        "access_type": "offline",
        "prompt": "consent",
        "state": state_payload
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(oauth_params)}"
    return {"auth_url": auth_url, "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI}


@router.get("/oauth/google/callback")
async def google_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """Exchange authorization code for refresh token and save to tenant credentials."""
    # Strict verification of cryptographic state signature, nonce, and expiry
    if not state or "." not in state:
        logger.error("google_oauth_callback_missing_or_malformed_state", state=state)
        raise HTTPException(status_code=400, detail="Invalid or missing OAuth state parameter.")

    try:
        parts = state.split(".", 1)
        state_b64, state_sig = parts[0], parts[1]
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), state_b64.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, state_sig):
            logger.error("google_oauth_callback_state_signature_mismatch", state=state)
            raise HTTPException(status_code=400, detail="OAuth state signature verification failed.")

        padded_b64 = state_b64 + "=" * ((4 - len(state_b64) % 4) % 4)
        raw_json = base64.urlsafe_b64decode(padded_b64.encode("utf-8")).decode("utf-8")
        state_data = json.loads(raw_json)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("google_oauth_callback_state_decode_error", error=str(e), state=state)
        raise HTTPException(status_code=400, detail=f"Corrupt or invalid OAuth state parameter: {str(e)}")

    if not state_data.get("nonce"):
        raise HTTPException(status_code=400, detail="OAuth state missing nonce.")

    exp_ts = state_data.get("exp")
    if not exp_ts or int(datetime.now(timezone.utc).timestamp()) > int(exp_ts):
        raise HTTPException(status_code=400, detail="OAuth state has expired. Please initiate connection again.")

    tenant_id = state_data.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="OAuth state missing tenant context.")

    # Unified Redirect URI: if this OAuth flow was initiated for Google Business Profile, delegate seamlessly
    if state_data.get("provider") == "google_business":
        return await google_business_oauth_callback(code=code, state=state, error=error)

    is_admin = (state_data.get("source") == "admin")
    ret_origin = (state_data.get("return_origin") or "").rstrip("/")

    async with database.db_pool.acquire() as conn:
        tenant_slug = await conn.fetchval("SELECT slug FROM tenants WHERE id = $1::uuid", tenant_id)
        if not ret_origin:
            ret_origin = await get_tenant_base_url(conn, tenant_id)
        
        base_redir = f"{ret_origin}/admin/clients" if is_admin else (f"{ret_origin}/{tenant_slug}" if tenant_slug else f"{ret_origin}/dashboard")
        t_param = f"&tenant_id={tenant_id}" if is_admin else ""

        if error or not code:
            logger.error("google_oauth_callback_error", error=error, state=state)
            return RedirectResponse(f"{base_redir}?gcal_error={error or 'missing_code'}{t_param}")

    async with database.db_pool.acquire() as conn:
        tenant_slug = await conn.fetchval("SELECT slug FROM tenants WHERE id = $1::uuid", tenant_id)
        if not is_admin and tenant_slug:
            base_redir = f"{utils.APP_BASE_URL}/{tenant_slug}"

        g_row = await conn.fetchrow(
            "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar'",
            tenant_id
        )
        if not g_row or not g_row["credential_data"]:
            return RedirectResponse(f"{base_redir}?gcal_error=no_credentials{t_param}")

        g_data = g_row["credential_data"]
        if isinstance(g_data, str):
            try: g_data = json.loads(g_data)
            except: g_data = {}

        client_id = g_data.get("client_id")
        client_secret = g_data.get("client_secret")
        if not client_id or not client_secret:
            return RedirectResponse(f"{base_redir}?gcal_error=missing_client_keys{t_param}")

        # Exchange code with Google
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI,
                    "grant_type": "authorization_code"
                },
                timeout=15.0
            )

        if token_res.status_code != 200:
            logger.error("google_token_exchange_failed", status=token_res.status_code, body=token_res.text)
            return RedirectResponse(f"{base_redir}?gcal_error=token_exchange_failed{t_param}")

        token_data = token_res.json()
        refresh_token = token_data.get("refresh_token")
        access_token = token_data.get("access_token")

        if refresh_token:
            g_data["refresh_token"] = refresh_token
        if access_token:
            g_data["access_token"] = access_token
        g_data["calendar_id"] = g_data.get("calendar_id", "primary")

        # Fetch user's Google email
        if access_token:
            try:
                async with httpx.AsyncClient() as client:
                    userinfo = await client.get(
                        "https://www.googleapis.com/oauth2/v2/userinfo",
                        headers={"Authorization": f"Bearer {access_token}"},
                        timeout=10.0
                    )
                    if userinfo.status_code == 200:
                        u_json = userinfo.json()
                        if u_json.get("email"):
                            g_data["notification_email"] = u_json["email"]
            except Exception as e:
                logger.warning("google_userinfo_fetch_failed", error=str(e))

        await conn.execute(
            "UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid",
            json.dumps(g_data), str(g_row["id"])
        )

    return RedirectResponse(f"{base_redir}?gcal_success=true{t_param}")


@router.post("/oauth/google/disconnect")
async def disconnect_google_calendar(
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Disconnect Google Calendar sync for this tenant."""
    if caller.get("role") not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to disconnect Google Calendar.")
    async with database.db_pool.acquire() as conn:
        g_row = await conn.fetchrow(
            "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar'",
            tenant_id
        )
        if g_row:
            d = g_row["credential_data"] or {}
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            d.pop("refresh_token", None)
            d.pop("access_token", None)
            await conn.execute(
                "UPDATE tenant_credentials SET credential_data = $1::jsonb WHERE id = $2::uuid",
                json.dumps(d), str(g_row["id"])
            )
    return {"status": "disconnected"}


@router.post("/admin/tenants/{target_tenant_id}/oauth/google/init")
async def admin_init_google_oauth(
    target_tenant_id: str,
    payload: GoogleOAuthInitPayload,
    request: Request,
    admin_user: dict = Depends(verify_super_admin)
):
    """Super Admin initiates Google OAuth for a specific client organization."""
    payload.target_tenant_id = target_tenant_id
    payload.source = "admin"
    return await init_google_oauth(payload, request=request, tenant_id=target_tenant_id)


@router.post("/admin/tenants/{target_tenant_id}/oauth/google/disconnect")
async def admin_disconnect_google_oauth(
    target_tenant_id: str,
    admin_user: dict = Depends(verify_super_admin)
):
    """Super Admin disconnects Google Calendar sync for a specific client organization."""
    return await disconnect_google_calendar(tenant_id=target_tenant_id, caller={"role": "super_admin"})


@router.get("/calendar/live-availability")
async def get_live_calendar_availability(
    target_tenant_id: Optional[str] = None,
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Returns real-time Google Calendar and CRM occupied slots,
    connection status, target calendar, and verified availability window.
    Accessible by both workspace users and super admins.
    """
    effective_id = tenant_id
    async with database.db_pool.acquire() as conn:
        # Auto-sync Google Tasks completions so calendar follow-ups are always up-to-date
        try:
            await sync_completed_google_tasks_for_tenant(conn, effective_id)
        except Exception as e_sync:
            logger.debug("calendar_google_tasks_sync_error", error=str(e_sync))

        tenant_st = await conn.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", effective_id)
        if tenant_st:
            if isinstance(tenant_st, str):
                try: tenant_st = json.loads(tenant_st)
                except: tenant_st = {}
        else:
            tenant_st = {}
        
        tz_str = tenant_st.get("timezone", "Asia/Kolkata")
        try:
            import zoneinfo
            tenant_tz = zoneinfo.ZoneInfo(tz_str)
        except Exception:
            tenant_tz = timezone(timedelta(hours=5, minutes=30))

        now_dt = datetime.now(tenant_tz)
        min_dt = now_dt - timedelta(days=30)
        max_dt = now_dt + timedelta(days=60)

        # 1. CRM Bookings
        db_rows = await conn.fetch(
            """SELECT service, start_time, end_time
               FROM bookings
               WHERE tenant_id = $1::uuid
                 AND status = 'confirmed'
                 AND start_time >= $2
                 AND start_time <= $3
               ORDER BY start_time ASC LIMIT 50""",
            effective_id, min_dt, max_dt
        )
        busy_slots = []
        for r in db_rows:
            st = r['start_time'].astimezone(tenant_tz) if hasattr(r['start_time'], 'astimezone') else r['start_time']
            et = r['end_time'].astimezone(tenant_tz) if hasattr(r['end_time'], 'astimezone') else r['end_time']
            busy_slots.append({
                "start": st.strftime('%Y-%m-%dT%H:%M:%S%z'),
                "end": et.strftime('%Y-%m-%dT%H:%M:%S%z'),
                "start_formatted": st.strftime('%A, %d %b %Y at %I:%M %p'),
                "end_formatted": et.strftime('%I:%M %p'),
                "source": "CRM Booking",
                "desc": r.get('service', 'Booked Appointment')
            })

        # 2. Google Calendar Free/Busy
        gcal_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
            effective_id
        )
        gcal_connected = False
        cal_id = "primary"
        notif_email = ""
        if gcal_row and gcal_row["credential_data"]:
            g_data = gcal_row["credential_data"]
            if isinstance(g_data, str):
                try: g_data = json.loads(g_data)
                except: g_data = {}
            cal_id = g_data.get("calendar_id") or "primary"
            notif_email = g_data.get("notification_email") or ""
            if g_data.get("client_id") and g_data.get("refresh_token"):
                try:
                    def fetch_gcal():
                        from google.oauth2.credentials import Credentials
                        from googleapiclient.discovery import build
                        g_creds = Credentials(
                            token=g_data.get("access_token"),
                            refresh_token=g_data.get("refresh_token"),
                            token_uri="https://oauth2.googleapis.com/token",
                            client_id=g_data.get("client_id") or os.getenv("GOOGLE_CLIENT_ID", "").strip(),
                            client_secret=g_data.get("client_secret") or os.getenv("GOOGLE_CLIENT_SECRET", "").strip(),
                        )
                        service = build("calendar", "v3", credentials=g_creds, cache_discovery=False)
                        events_res = service.events().list(
                            calendarId=cal_id,
                            timeMin=min_dt.isoformat(),
                            timeMax=max_dt.isoformat(),
                            singleEvents=True,
                            orderBy='startTime'
                        ).execute()
                        events_items = events_res.get("items", [])
                        parsed_gcal = []
                        for item in events_items:
                            start_obj = item.get("start", {})
                            end_obj = item.get("end", {})
                            st_str = start_obj.get("dateTime") or start_obj.get("date")
                            et_str = end_obj.get("dateTime") or end_obj.get("date")
                            if st_str and et_str:
                                summary = item.get("summary") or "Google Calendar Event"
                                description = item.get("description", "")
                                parsed_gcal.append({
                                    "start": st_str,
                                    "end": et_str,
                                    "summary": summary,
                                    "description": description,
                                    "id": item.get("id"),
                                    "html_link": item.get("htmlLink")
                                })
                        return parsed_gcal

                    gcal_events = await asyncio.wait_for(asyncio.to_thread(fetch_gcal), timeout=5.0)
                    gcal_connected = True
                    for item in gcal_events:
                        try:
                            st_raw = item["start"].replace("Z", "+00:00")
                            et_raw = item["end"].replace("Z", "+00:00")
                            if "T" in st_raw:
                                st = datetime.fromisoformat(st_raw).astimezone(tenant_tz)
                                et = datetime.fromisoformat(et_raw).astimezone(tenant_tz)
                            else:
                                st = datetime.strptime(st_raw[:10], "%Y-%m-%d").replace(tzinfo=tenant_tz)
                                et = st + timedelta(hours=23, minutes=59)
                            
                            busy_slots.append({
                                "id": item.get("id"),
                                "start": st.strftime('%Y-%m-%dT%H:%M:%S%z'),
                                "end": et.strftime('%Y-%m-%dT%H:%M:%S%z'),
                                "start_formatted": st.strftime('%A, %d %b %Y at %I:%M %p'),
                                "end_formatted": et.strftime('%I:%M %p'),
                                "source": "Google Calendar",
                                "desc": item.get("summary") or "Google Calendar Event",
                                "html_link": item.get("html_link")
                            })
                        except Exception:
                            pass
                except Exception as ex:
                    logger.warning("gcal_live_availability_endpoint_error", error=str(ex))

        # Format operating hours
        ot_raw = tenant_st.get("opening_time", "09:00")
        ct_raw = tenant_st.get("closing_time", "20:00")
        ot_parts = ["09", "00"]
        ct_parts = ["20", "00"]
        try:
            ot_parts = str(ot_raw).split(":")
            ct_parts = str(ct_raw).split(":")
            ot_fmt = datetime(2000, 1, 1, int(ot_parts[0]), int(ot_parts[1]) if len(ot_parts) > 1 else 0).strftime("%I:%M %p")
            ct_fmt = datetime(2000, 1, 1, int(ct_parts[0]), int(ct_parts[1]) if len(ct_parts) > 1 else 0).strftime("%I:%M %p")
            op_hours_str = f"{ot_fmt} – {ct_fmt}"
        except Exception:
            ot_parts = ["09", "00"]
            ct_parts = ["20", "00"]
            op_hours_str = "09:00 AM – 08:00 PM"

        # Compute exact verified live empty slots for next 7 days from Google Calendar and CRM
        empty_slots = []
        try:
            op_h = int(ot_parts[0])
            op_m = int(ot_parts[1]) if len(ot_parts) > 1 else 0
            cl_h = int(ct_parts[0])
            cl_m = int(ct_parts[1]) if len(ct_parts) > 1 else 0
            slot_dur = 30
            for d in range(7):
                day_d = (now_dt + timedelta(days=d)).date()
                d_start = datetime.combine(day_d, time(op_h, op_m), tzinfo=tenant_tz)
                d_end = datetime.combine(day_d, time(cl_h, cl_m), tzinfo=tenant_tz)
                cur_slot = d_start
                while cur_slot + timedelta(minutes=slot_dur) <= d_end:
                    s_end = cur_slot + timedelta(minutes=slot_dur)
                    if d == 0 and cur_slot <= now_dt + timedelta(minutes=15):
                        cur_slot += timedelta(minutes=slot_dur)
                        continue
                    overlaps = any(
                        not (s_end.strftime('%Y-%m-%dT%H:%M:%S%z') <= b["start"] or cur_slot.strftime('%Y-%m-%dT%H:%M:%S%z') >= b["end"])
                        for b in busy_slots
                    )
                    if not overlaps:
                        empty_slots.append({
                            "date": day_d.strftime("%Y-%m-%d"),
                            "day_formatted": day_d.strftime("%A, %d %b"),
                            "start": cur_slot.strftime('%Y-%m-%dT%H:%M:%S%z'),
                            "end": s_end.strftime('%Y-%m-%dT%H:%M:%S%z'),
                            "start_formatted": cur_slot.strftime("%I:%M %p"),
                            "end_formatted": s_end.strftime("%I:%M %p"),
                        })
                    cur_slot += timedelta(minutes=slot_dur)
        except Exception as e_err:
            logger.warning("compute_empty_slots_err", error=str(e_err))

        # Sort chronologically
        busy_slots.sort(key=lambda x: x["start"])
        return {
            "status": "ok",
            "google_calendar_connected": gcal_connected,
            "calendar_id": cal_id,
            "notification_email": notif_email,
            "timezone": tz_str,
            "total_occupied_slots": len(busy_slots),
            "occupied_slots": busy_slots,
            "total_empty_slots": len(empty_slots),
            "empty_slots": empty_slots,
            "operating_hours": op_hours_str,
            "opening_time": ot_raw,
            "closing_time": ct_raw,
            "message": "AI Assistant verifies this schedule in real time and strictly books in open free time without hallucinating occupied slots."
        }


# ── Super Admin Client Management Endpoints ────────────────────────────────────

GLOBAL_DEFAULT_STRICT_RULES = """- GOOGLE CALENDAR AVAILABILITY & FREE-TIME BOOKING: Check live availability from Google Calendar. Propose and book only during verified open free time. Never invent, hallucinate, or state incorrect, wrong, or occupied timeslots.
- ZERO FALSE 'FULLY BOOKED' CLAIMS: If a day (including today) or time slot is not in the occupied list, it is open and available. Never falsely tell a customer that today or any day is 'fully booked' when the calendar has open hours remaining."""
