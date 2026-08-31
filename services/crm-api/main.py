import os
import uuid
import json
import asyncio
import bcrypt
from contextlib import asynccontextmanager
from typing import Optional
from datetime import datetime, timedelta
import asyncpg
import httpx
import structlog
from fastapi import FastAPI, Depends, HTTPException, Query, Header, BackgroundTasks
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

logger = structlog.get_logger("crm-api")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform")

db_pool: asyncpg.Pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=4)
    yield
    await db_pool.close()

app = FastAPI(lifespan=lifespan, title="CRM API")

# --- Dummy auth dependency for MVP (in real app, validate JWT from auth-service) ---
async def get_tenant_id(x_tenant_id: str = Header(...)) -> str:
    if not x_tenant_id:
        raise HTTPException(status_code=401, detail="Missing X-Tenant-ID header")
    return x_tenant_id

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/contacts")
async def list_contacts(
    tenant_id: str = Depends(get_tenant_id),
    q: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0
):
    """List contacts with optional trigram search on name/phone."""
    async with db_pool.acquire() as conn:
        if q:
            # PostgreSQL trigram similarity search
            rows = await conn.fetch(
                """SELECT id, phone, name, wa_profile_name, created_at
                   FROM contacts
                   WHERE tenant_id = $1 AND (name ILIKE $2 OR phone ILIKE $2)
                   ORDER BY created_at DESC LIMIT $3 OFFSET $4""",
                tenant_id, f"%{q}%", limit, offset
            )
        else:
            rows = await conn.fetch(
                """SELECT id, phone, name, wa_profile_name, created_at
                   FROM contacts WHERE tenant_id = $1
                   ORDER BY created_at DESC LIMIT $2 OFFSET $3""",
                tenant_id, limit, offset
            )
    return [dict(r) for r in rows]


@app.get("/bookings")
async def list_bookings(
    tenant_id: str = Depends(get_tenant_id),
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0
):
    """List appointments/bookings joined with contacts for this tenant."""
    async with db_pool.acquire() as conn:
        query = """
            SELECT b.id, b.service, b.start_time, b.end_time, b.status,
                   b.notes, b.price, b.currency, b.created_at,
                   c.name as contact_name, c.phone as contact_phone
            FROM bookings b
            JOIN contacts c ON c.id = b.contact_id
            WHERE b.tenant_id = $1::uuid
        """
        args = [tenant_id]
        if status:
            query += " AND b.status = $2"
            args.append(status)
            query += " ORDER BY b.start_time DESC LIMIT $3 OFFSET $4"
            args.extend([limit, offset])
        else:
            query += " ORDER BY b.start_time DESC LIMIT $2 OFFSET $3"
            args.extend([limit, offset])

        rows = await conn.fetch(query, *args)
    return [
        {
            "id": str(r["id"]),
            "service": r["service"],
            "start_time": r["start_time"].isoformat() if r["start_time"] else "",
            "end_time": r["end_time"].isoformat() if r["end_time"] else "",
            "status": r["status"],
            "notes": r["notes"] or "",
            "price": float(r["price"]) if r["price"] is not None else 0.0,
            "currency": r["currency"] or "INR",
            "contact_name": r["contact_name"] or "",
            "contact_phone": r["contact_phone"] or "",
            "created_at": r["created_at"].isoformat() if r["created_at"] else "",
        }
        for r in rows
    ]


class BookingCreatePayload(BaseModel):
    contact_name: str
    contact_phone: str
    service: str
    start_time: str
    end_time: Optional[str] = None
    price: Optional[float] = 0.0
    notes: Optional[str] = ""


@app.post("/bookings")
async def create_booking(
    payload: BookingCreatePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Manually create a new appointment/booking from CRM:
    1. Finds or creates the contact.
    2. Inserts booking record.
    3. Pushes WhatsApp confirmation to client.
    4. Pushes Admin WhatsApp notification.
    5. Syncs event with Google Calendar if connected.
    """
    if not payload.contact_phone or not payload.service or not payload.start_time:
        raise HTTPException(400, "Missing contact phone, service, or start time")

    clean_phone = payload.contact_phone.strip().replace(" ", "").replace("-", "")
    clean_name = payload.contact_name.strip() if payload.contact_name else "Client"

    # Parse start and end time
    try:
        st_dt = datetime.fromisoformat(payload.start_time.replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(400, "Invalid start_time format. Use ISO format (e.g. 2026-08-30T10:00:00).")

    if payload.end_time:
        try:
            et_dt = datetime.fromisoformat(payload.end_time.replace("Z", "+00:00"))
        except Exception:
            et_dt = st_dt + timedelta(minutes=30)
    else:
        et_dt = st_dt + timedelta(minutes=30)

    async with db_pool.acquire() as conn:
        # 1. Find or create contact
        contact_row = await conn.fetchrow(
            "SELECT id, name, phone FROM contacts WHERE tenant_id = $1::uuid AND phone = $2",
            tenant_id, clean_phone
        )
        if contact_row:
            contact_id = str(contact_row["id"])
            if payload.contact_name and (not contact_row["name"] or contact_row["name"] != clean_name):
                await conn.execute("UPDATE contacts SET name = $1 WHERE id = $2::uuid", clean_name, contact_id)
        else:
            contact_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO contacts (id, tenant_id, phone, name) VALUES ($1::uuid, $2::uuid, $3, $4)",
                contact_id, tenant_id, clean_phone, clean_name
            )

        # Ensure conversation exists
        conv_row = await conn.fetchrow(
            "SELECT id FROM conversations WHERE contact_id = $1::uuid AND tenant_id = $2::uuid",
            contact_id, tenant_id
        )
        if conv_row:
            conv_id = str(conv_row["id"])
        else:
            conv_id = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO conversations (id, tenant_id, contact_id, status, last_message_at)
                   VALUES ($1::uuid, $2::uuid, $3::uuid, 'bot', now())""",
                conv_id, tenant_id, contact_id
            )

        # Double Booking Conflict Check
        conflict = await conn.fetchrow(
            """SELECT id, service, start_time, end_time FROM bookings
               WHERE tenant_id = $1::uuid AND status = 'confirmed'
                 AND start_time < $3 AND end_time > $2""",
            tenant_id, st_dt, et_dt
        )
        if conflict:
            c_time = conflict["start_time"].strftime("%I:%M %p")
            raise HTTPException(409, f"Timeslot conflict: An appointment for '{conflict['service']}' is already scheduled at {c_time}.")

        # 2. Insert booking
        booking_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO bookings (id, tenant_id, contact_id, conversation_id, service, start_time, end_time, status, notes, price, currency)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, 'confirmed', $8, $9, 'INR')""",
            booking_id, tenant_id, contact_id, conv_id, payload.service.strip(), st_dt, et_dt, payload.notes or "", float(payload.price or 0.0)
        )

        # 3. Fetch WhatsApp credentials & templates
        cred_row = await conn.fetchrow(
            """SELECT credential_data FROM tenant_credentials
               WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true""",
            tenant_id
        )
        creds = {}
        if cred_row and cred_row["credential_data"]:
            d = cred_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            creds = dict(d)

        # 4. Push WhatsApp confirmation to customer
        time_str = st_dt.strftime("%d %b %Y at %I:%M %p")
        confirmation_msg = f"🎉 *Appointment Confirmed!*\n\nHi {clean_name},\nYour booking for *{payload.service.strip()}* has been scheduled for *{time_str}*.\n\nFee: ₹{payload.price or 0}\n\nIf you need to make any changes or have questions, simply reply here anytime!"

        if creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
            try:
                import httpx
                async with httpx.AsyncClient(timeout=8.0) as client:
                    await client.post(
                        f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages",
                        headers={"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"},
                        json={"messaging_product": "whatsapp", "recipient_type": "individual", "to": clean_phone, "type": "text", "text": {"body": confirmation_msg}}
                    )
            except Exception as e:
                logger.error("manual_booking_wa_confirm_error", error=str(e))

        # Record confirmation message in DB
        msg_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO messages (id, conversation_id, tenant_id, direction, content_type, body, status, ai_used_fallback)
               VALUES ($1::uuid, $2::uuid, $3::uuid, 'outbound', 'text', $4, 'sent', false)""",
            msg_id, conv_id, tenant_id, confirmation_msg
        )
        await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid", conv_id)

        # 4b. Send Business Address & Google Maps Location (if configured)
        full_location = (creds.get("full_location_text") or "").strip()
        if not full_location:
            tenant_st = await conn.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
            if tenant_st:
                if isinstance(tenant_st, str):
                    try: tenant_st = json.loads(tenant_st)
                    except: tenant_st = {}
                full_location = (tenant_st.get("full_location_text") or "").strip()

        if full_location and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
            loc_msg = f"📍 *Location & Directions:*\n{full_location}"
            try:
                import httpx
                async with httpx.AsyncClient(timeout=8.0) as client:
                    await client.post(
                        f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages",
                        headers={"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"},
                        json={"messaging_product": "whatsapp", "recipient_type": "individual", "to": clean_phone, "type": "text", "text": {"body": loc_msg}}
                    )
                loc_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO messages (id, conversation_id, tenant_id, direction, content_type, body, status, ai_used_fallback)
                       VALUES ($1::uuid, $2::uuid, $3::uuid, 'outbound', 'text', $4, 'sent', false)""",
                    loc_id, conv_id, tenant_id, loc_msg
                )
                await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid", conv_id)
            except Exception as e:
                logger.error("manual_booking_location_send_error", error=str(e))

        # 5. Push Admin WhatsApp notification (if configured)
        admin_phone = creds.get("admin_whatsapp_number")
        if admin_phone and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
            admin_notify_msg = f"📅 *New Booking Alert!*\n\n• Client: {clean_name} ({clean_phone})\n• Service: {payload.service.strip()}\n• Date/Time: {time_str}\n• Fee: ₹{payload.price or 0}\n• Notes: {payload.notes or 'None'}"
            try:
                import httpx
                async with httpx.AsyncClient(timeout=8.0) as client:
                    await client.post(
                        f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages",
                        headers={"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"},
                        json={"messaging_product": "whatsapp", "recipient_type": "individual", "to": admin_phone, "type": "text", "text": {"body": admin_notify_msg}}
                    )
            except Exception as e:
                logger.error("admin_booking_wa_notify_error", error=str(e))

        # 6. Trigger Google Calendar Sync (if configured)
        try:
            gcal_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                tenant_id
            )
            if gcal_row and gcal_row["credential_data"]:
                g_data = gcal_row["credential_data"]
                if isinstance(g_data, str):
                    try: g_data = json.loads(g_data)
                    except: g_data = {}

                if g_data.get("refresh_token") and g_data.get("client_id"):
                    try:
                        from google.oauth2.credentials import Credentials
                        from googleapiclient.discovery import build
                        
                        g_creds = Credentials(
                            token=g_data.get("access_token"),
                            refresh_token=g_data.get("refresh_token"),
                            token_uri="https://oauth2.googleapis.com/token",
                            client_id=g_data.get("client_id"),
                            client_secret=g_data.get("client_secret"),
                        )
                        g_service = build("calendar", "v3", credentials=g_creds)
                        cal_id = g_data.get("calendar_id") or "primary"
                        
                        event_body = {
                            "summary": f"{payload.service.strip()} - {clean_name} ({clean_phone})",
                            "description": f"Appointment Booked via CRM\n\n• Client: {clean_name}\n• Phone: {clean_phone}\n• Service: {payload.service.strip()}\n• Notes: {payload.notes or 'None'}",
                            "start": {"dateTime": st_dt.isoformat()},
                            "end": {"dateTime": et_dt.isoformat()},
                        }
                        
                        attendees = []
                        notif_email = g_data.get("notification_email")
                        if notif_email and "@" in notif_email:
                            attendees.append({"email": notif_email})

                        contact_meta = contact_row.get("metadata") if contact_row else {}
                        if isinstance(contact_meta, str):
                            try: contact_meta = json.loads(contact_meta)
                            except: contact_meta = {}
                        cust_email = contact_meta.get("email") if isinstance(contact_meta, dict) else None
                        if cust_email and "@" in cust_email and cust_email.lower() != (notif_email or "").lower():
                            attendees.append({"email": cust_email})

                        if attendees:
                            event_body["attendees"] = attendees
                        
                        event = g_service.events().insert(calendarId=cal_id, body=event_body, sendUpdates="all").execute()
                        if event and event.get("id"):
                            await conn.execute(
                                "UPDATE bookings SET google_event_id = $1 WHERE id = $2::uuid",
                                event["id"], booking_id
                            )
                            logger.info("google_calendar_event_created_from_crm", event_id=event["id"], booking_id=booking_id)
                    except Exception as e:
                        logger.error("google_calendar_sync_error_from_crm", error=str(e), booking_id=booking_id)
        except Exception as e:
            logger.warning("calendar_sync_trigger_error", error=str(e))

    return {
        "status": "created",
        "id": booking_id,
        "service": payload.service.strip(),
        "start_time": st_dt.isoformat(),
        "end_time": et_dt.isoformat(),
        "price": float(payload.price or 0.0),
        "contact_name": clean_name,
        "contact_phone": clean_phone,
        "whatsapp_confirmed": True
    }


class BookingPricePayload(BaseModel):
    price: float

@app.patch("/bookings/{booking_id}/price")
async def update_booking_price(
    booking_id: str,
    payload: BookingPricePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Update price / fee for an existing booking."""
    async with db_pool.acquire() as conn:
        booking = await conn.fetchrow(
            "SELECT id FROM bookings WHERE id = $1::uuid AND tenant_id = $2::uuid",
            booking_id, tenant_id
        )
        if not booking:
            raise HTTPException(404, "Booking not found")

        await conn.execute(
            "UPDATE bookings SET price = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
            float(payload.price), booking_id, tenant_id
        )

    return {
        "status": "updated",
        "id": booking_id,
        "price": float(payload.price)
    }


class BookingStatusPayload(BaseModel):
    status: str

async def dispatch_automated_status_whatsapp(
    tenant_id: str,
    conv_id: str,
    phone: str,
    text: str,
    delay_seconds: int = 0,
    template_name: Optional[str] = None,
    template_params: Optional[list] = None,
):
    try:
        if delay_seconds > 0:
            logger.info("delayed_automated_wa_scheduled", tenant_id=tenant_id, delay=delay_seconds, phone=phone, template=template_name)
            await asyncio.sleep(delay_seconds)

        async with db_pool.acquire() as conn:
            cred_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
                tenant_id
            )
            creds = {}
            if cred_row and cred_row["credential_data"]:
                d = cred_row["credential_data"]
                if isinstance(d, str):
                    try: d = json.loads(d)
                    except: d = {}
                creds = dict(d)

            clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "").strip()

            # Dispatch via Meta Graph API
            template_sent = False
            if creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                import httpx
                headers = {"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"}
                url = f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages"

                # 1. Try Meta Approved Template first
                if template_name and template_params:
                    components = [
                        {
                            "type": "body",
                            "parameters": [{"type": "text", "text": str(p)} for p in template_params if str(p).strip()]
                        }
                    ]
                    payload = {
                        "messaging_product": "whatsapp",
                        "to": clean_phone,
                        "type": "template",
                        "template": {
                            "name": template_name,
                            "language": {"code": "en"},
                            "components": components,
                        }
                    }
                    try:
                        async with httpx.AsyncClient(timeout=10.0) as client:
                            res = await client.post(url, headers=headers, json=payload)
                            if res.status_code in (200, 201):
                                template_sent = True
                                logger.info("automated_status_template_dispatched", template=template_name, phone=clean_phone)
                            elif "132000" in res.text and "expected number of params" in res.text:
                                # Dynamic retry with adapted parameter count
                                import re
                                m_count = re.search(r'expected number of params \((\d+)\)', res.text)
                                if m_count:
                                    exp_c = int(m_count.group(1))
                                    payload["template"]["components"][0]["parameters"] = components[0]["parameters"][:exp_c]
                                    res_retry = await client.post(url, headers=headers, json=payload)
                                    if res_retry.status_code in (200, 201):
                                        template_sent = True
                                        logger.info("automated_status_template_retry_succeeded", template=template_name, phone=clean_phone)
                    except Exception as e:
                        logger.warning("template_dispatch_failed_trying_text", error=str(e), template=template_name)

                # 2. Fallback to Text if template was not sent
                if not template_sent:
                    try:
                        async with httpx.AsyncClient(timeout=10.0) as client:
                            await client.post(
                                url,
                                headers=headers,
                                json={"messaging_product": "whatsapp", "recipient_type": "individual", "to": clean_phone, "type": "text", "text": {"body": text}}
                            )
                    except Exception as e:
                        logger.error("automated_wa_text_dispatch_failed", error=str(e), phone=clean_phone)

            # Record message in database
            msg_id = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO messages (id, conversation_id, tenant_id, direction, content_type, body, status, ai_used_fallback)
                   VALUES ($1::uuid, $2::uuid, $3::uuid, 'outbound', 'text', $4, 'sent', false)""",
                msg_id, conv_id, tenant_id, text
            )
            await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid", conv_id)
            logger.info("automated_status_message_dispatched", tenant_id=tenant_id, phone=clean_phone, delay=delay_seconds)
    except Exception as e:
        logger.error("automated_task_exception", error=str(e))


@app.patch("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    payload: BookingStatusPayload,
    background_tasks: BackgroundTasks,
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Update booking status (confirmed, completed/attended, no_show, cancelled, rescheduled).
    - If status = 'completed': Schedules post-service review request to patient WhatsApp in 15 minutes.
    - If status = 'no_show': Sends friendly reschedule nudge template to patient WhatsApp.
    - If status = 'confirmed': Sends official booking confirmation template to patient WhatsApp.
    - If status = 'cancelled': Sends cancellation notice template to patient WhatsApp.
    """
    async with db_pool.acquire() as conn:
        # Fetch booking with contact, tenant & conversation details
        booking = await conn.fetchrow(
            """SELECT b.id, b.service, b.status, b.start_time, b.conversation_id, b.google_event_id,
                      c.id as contact_id, c.name, c.phone,
                      t.name as tenant_name, t.settings as tenant_settings
               FROM bookings b
               JOIN contacts c ON c.id = b.contact_id
               JOIN tenants t ON t.id = b.tenant_id
               WHERE b.id = $1::uuid AND b.tenant_id = $2::uuid""",
            booking_id, tenant_id
        )
        if not booking:
            raise HTTPException(404, "Booking not found")

        # Update booking status
        await conn.execute(
            "UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
            payload.status, booking_id, tenant_id
        )

        # Build automated trigger message based on tenant branding
        patient_name = booking["name"] or "there"
        service_name = booking["service"] or "appointment"
        tenant_name = booking["tenant_name"] or "our team"
        
        # Accurate Time formatting
        t_settings_dict = booking["tenant_settings"] if booking.get("tenant_settings") else {}
        if isinstance(t_settings_dict, str):
            try: t_settings_dict = json.loads(t_settings_dict)
            except: t_settings_dict = {}
        tz_name = t_settings_dict.get("timezone", "Asia/Kolkata").strip()

        import zoneinfo
        try:
            local_tz = zoneinfo.ZoneInfo(tz_name)
        except Exception:
            local_tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

        time_str = ""
        date_str = ""
        clock_str = ""
        if booking["start_time"]:
            st = booking["start_time"]
            if hasattr(st, "astimezone"):
                st_local = st.astimezone(local_tz)
            else:
                st_local = st.replace(tzinfo=datetime.timezone.utc).astimezone(local_tz)
            time_str = st_local.strftime("%A, %d %b %Y at %I:%M %p")
            date_str = st_local.strftime("%d-%m-%Y")
            clock_str = st_local.strftime("%I:%M %p")
        
        # If cancelled and synced to Google Calendar, remove the Google Calendar event
        if payload.status == "cancelled" and booking.get("google_event_id"):
            try:
                gcal_row = await conn.fetchrow(
                    "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                    tenant_id
                )
                if gcal_row and gcal_row["credential_data"]:
                    g_data = gcal_row["credential_data"]
                    if isinstance(g_data, str):
                        try: g_data = json.loads(g_data)
                        except: g_data = {}
                    if g_data.get("refresh_token") and g_data.get("client_id"):
                        from google.oauth2.credentials import Credentials
                        from googleapiclient.discovery import build
                        g_creds = Credentials(
                            token=g_data.get("access_token"),
                            refresh_token=g_data.get("refresh_token"),
                            token_uri="https://oauth2.googleapis.com/token",
                            client_id=g_data.get("client_id"),
                            client_secret=g_data.get("client_secret"),
                        )
                        g_service = build("calendar", "v3", credentials=g_creds)
                        cal_id = g_data.get("calendar_id") or "primary"
                        g_service.events().delete(calendarId=cal_id, eventId=booking["google_event_id"], sendUpdates="all").execute()
                        logger.info("google_calendar_event_deleted_on_cancellation", event_id=booking["google_event_id"])
            except Exception as e:
                logger.warning("google_calendar_cancellation_sync_failed", error=str(e))

        # Fetch WhatsApp creds for template names
        wa_row = await conn.fetchrow("SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp'", tenant_id)
        wa_data = {}
        if wa_row and wa_row["credential_data"]:
            wd = wa_row["credential_data"]
            if isinstance(wd, str):
                try: wd = json.loads(wd)
                except: wd = {}
            wa_data = dict(wd)

        automated_text = None
        delay_seconds = 0
        dispatch_template = None
        dispatch_params = []

        google_review_link = (t_settings_dict.get("google_review_link") or wa_data.get("google_review_link") or "").strip()

        if payload.status in ["completed", "attended"]:
            # 15 minutes delay for review request (900 seconds)
            delay_seconds = 900
            review_link_block = f"\n\n⭐ *Leave a quick Google Review here:*\n{google_review_link}" if google_review_link else ""
            automated_text = (
                f"Hi {patient_name}, thank you for attending your {service_name} session with {tenant_name} today! 😊\n\n"
                f"We hope you had a wonderful experience! Could you please take 30 seconds to share your review with us?{review_link_block}\n\n"
                f"Your feedback helps us maintain the highest standard of service. Thank you for choosing {tenant_name}!"
            )
            dispatch_template = wa_data.get("template_review_request") or "review_request"
            dispatch_params = [patient_name, service_name, google_review_link]
            # Update review_sent_at timestamp
            await conn.execute("UPDATE bookings SET review_sent_at = now() WHERE id = $1::uuid", booking_id)

        elif payload.status in ["no_show", "no-show"]:
            # 15 minutes delay for reschedule nudge (900 seconds)
            delay_seconds = 900
            automated_text = (
                f"Hi {patient_name}, we missed you today for your scheduled {service_name} appointment with {tenant_name}.\n\n"
                f"We understand that plans can change unexpectedly! Would you like to reschedule for tomorrow or another time?\n\n"
                f"Simply reply to this message anytime and we'll gladly help you pick a convenient new slot."
            )
            dispatch_template = wa_data.get("template_reschedule_nudge") or "reschedule_nudge"
            dispatch_params = [patient_name, service_name]

        elif payload.status == "confirmed":
            timing_line = f" on *{time_str}*" if time_str else ""
            automated_text = (
                f"Hi {patient_name}, your booking for *{service_name}*{timing_line} is officially confirmed! ✅\n\n"
                f"Location: {tenant_name}\n\n"
                f"We look forward to seeing you. Reply to this chat if you have any questions or need directions."
            )
            dispatch_template = wa_data.get("template_booking_confirmation") or "booking_confirmationn"
            dispatch_params = [patient_name, service_name, date_str or "Today", clock_str or "Scheduled Time"]

        elif payload.status == "cancelled":
            timing_line = f" on {time_str}" if time_str else ""
            automated_text = (
                f"Hi {patient_name}, your {service_name} booking{timing_line} has been cancelled as requested.\n\n"
                f"If you'd like to book a new appointment in the future, just message us here anytime!\n\n"
                f"Best regards,\n{tenant_name}"
            )
            dispatch_template = wa_data.get("template_cancellation_confirmation") or "cancellation_confirmation"
            dispatch_params = [patient_name, service_name, date_str or "Today", clock_str or "Scheduled Time"]

        if automated_text and booking["phone"]:
            # Ensure conversation exists
            conv_id = booking["conversation_id"]
            if not conv_id:
                conv_row = await conn.fetchrow(
                    "SELECT id FROM conversations WHERE contact_id = $1::uuid AND tenant_id = $2::uuid",
                    booking["contact_id"], tenant_id
                )
                if conv_row:
                    conv_id = conv_row["id"]
                else:
                    conv_id = str(uuid.uuid4())
                    await conn.execute(
                        """INSERT INTO conversations (id, tenant_id, contact_id, status, last_message_at)
                           VALUES ($1::uuid, $2::uuid, $3::uuid, 'bot', now())""",
                        conv_id, tenant_id, booking["contact_id"]
                    )

            background_tasks.add_task(
                dispatch_automated_status_whatsapp,
                tenant_id,
                str(conv_id),
                booking["phone"],
                automated_text,
                delay_seconds,
                dispatch_template,
                dispatch_params,
            )

    return {
        "status": "updated",
        "id": booking_id,
        "new_status": payload.status,
        "automated_message_scheduled": bool(automated_text),
        "delay_seconds": delay_seconds,
        "template_configured": dispatch_template,
    }


@app.get("/conversations")
async def list_conversations(
    tenant_id: str = Depends(get_tenant_id),
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0
):
    async with db_pool.acquire() as conn:
        query = """
            SELECT c.id, c.status, c.last_message_at, c.unread_count,
                   ct.name, ct.phone
            FROM conversations c
            JOIN contacts ct ON ct.id = c.contact_id
            WHERE c.tenant_id = $1
        """
        args = [tenant_id]
        if status:
            query += " AND c.status = $2"
            args.append(status)
            query += " ORDER BY c.last_message_at DESC NULLS LAST LIMIT $3 OFFSET $4"
            args.extend([limit, offset])
        else:
            query += " ORDER BY c.last_message_at DESC NULLS LAST LIMIT $2 OFFSET $3"
            args.extend([limit, offset])

        rows = await conn.fetch(query, *args)
    return [dict(r) for r in rows]


async def mark_wa_message_as_read(phone_number_id: str, access_token: str, wa_message_id: str):
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"https://graph.facebook.com/v19.0/{phone_number_id}/messages",
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                json={
                    "messaging_product": "whatsapp",
                    "status": "read",
                    "message_id": wa_message_id,
                },
            )
    except Exception as e:
        logger.error("mark_as_read_failed", error=str(e), wa_id=wa_message_id)


@app.get("/conversations/{conv_id}/messages")
async def get_messages(
    conv_id: str,
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(50, le=100),
    offset: int = 0
):
    async with db_pool.acquire() as conn:
        # Check for unread inbound messages to mark as read on WhatsApp Meta Cloud API
        unread_rows = await conn.fetch(
            """SELECT wa_message_id FROM messages
               WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid
                 AND direction = 'inbound' AND status != 'read' AND wa_message_id IS NOT NULL""",
            conv_id, tenant_id
        )
        if unread_rows:
            # Mark messages as read in database
            await conn.execute(
                """UPDATE messages SET status = 'read'
                   WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid
                     AND direction = 'inbound' AND status != 'read'""",
                conv_id, tenant_id
            )
            # Reset conversation unread_count
            await conn.execute(
                "UPDATE conversations SET unread_count = 0 WHERE id = $1::uuid",
                conv_id
            )
            # Dispatch Meta Cloud API read receipts (turns customer's ticks into 2 Blue Ticks)
            cred_row = await conn.fetchrow(
                """SELECT credential_data FROM tenant_credentials
                   WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true""",
                tenant_id
            )
            if cred_row and cred_row["credential_data"]:
                d = cred_row["credential_data"]
                if isinstance(d, str):
                    try: d = json.loads(d)
                    except: d = {}
                creds = dict(d)
                phone_id = creds.get("phone_number_id")
                token = creds.get("access_token")
                if phone_id and token and not str(token).startswith("EAAB_test"):
                    for m in unread_rows:
                        wa_mid = m["wa_message_id"]
                        if wa_mid:
                            asyncio.create_task(
                                mark_wa_message_as_read(phone_id, token, wa_mid)
                            )

        rows = await conn.fetch(
            """SELECT id, direction, body, status, created_at
               FROM messages
               WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid
               ORDER BY created_at DESC LIMIT $3 OFFSET $4""",
            conv_id, tenant_id, limit, offset
        )
    return [dict(r) for r in rows]


class MessageCreate(BaseModel):
    body: str

@app.post("/conversations/{conv_id}/messages")
async def send_manual_message(
    conv_id: str,
    payload: MessageCreate,
    tenant_id: str = Depends(get_tenant_id)
):
    """Send manual message from CRM agent to contact via WhatsApp and persist in DB."""
    if not payload.body or not payload.body.strip():
        raise HTTPException(400, "Message body cannot be empty")

    async with db_pool.acquire() as conn:
        # Get conversation and contact details
        conv = await conn.fetchrow(
            """SELECT c.id, c.status, ct.phone
               FROM conversations c
               JOIN contacts ct ON ct.id = c.contact_id
               WHERE c.id = $1::uuid AND c.tenant_id = $2::uuid""",
            conv_id, tenant_id
        )
        if not conv:
            raise HTTPException(404, "Conversation not found")

        # Get WhatsApp credentials
        cred_row = await conn.fetchrow(
            """SELECT credential_data FROM tenant_credentials
               WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true""",
            tenant_id
        )
        creds = {}
        if cred_row and cred_row["credential_data"]:
            d = cred_row["credential_data"]
            if isinstance(d, str):
                import json
                try: d = json.loads(d)
                except: d = {}
            creds = dict(d)

        # Insert outbound message
        msg_id = str(uuid.uuid4())
        wa_id = None
        status = "sent"

        # Attempt to send via Meta WhatsApp API if credentials present
        if creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
            try:
                import httpx
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages",
                        headers={"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"},
                        json={"messaging_product": "whatsapp", "recipient_type": "individual", "to": conv["phone"], "type": "text", "text": {"body": payload.body.strip()}}
                    )
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        wa_id = data.get("messages", [{}])[0].get("id")
            except Exception as e:
                logger.error("manual_send_error", error=str(e))

        # Insert message row
        inserted = await conn.fetchrow(
            """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, status, ai_used_fallback)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'outbound', 'text', $5, $6, false)
               RETURNING id, direction, body, status, created_at""",
            msg_id, conv_id, tenant_id, wa_id, payload.body.strip(), status
        )

        # Update conversation last_message_at
        await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid", conv_id)

    return {
        "id": str(inserted["id"]),
        "direction": inserted["direction"],
        "body": inserted["body"],
        "status": inserted["status"],
        "created_at": inserted["created_at"].isoformat() if inserted["created_at"] else ""
    }


@app.delete("/conversations/{conv_id}")
async def delete_conversation(
    conv_id: str,
    delete_type: str = Query("for_everyone", regex="^(for_me|for_everyone)$"),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a conversation and its messages. Unlinks any linked appointments."""
    async with db_pool.acquire() as conn:
        # Unlink any linked bookings
        await conn.execute(
            "UPDATE bookings SET conversation_id = NULL WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid",
            conv_id, tenant_id
        )
        # Delete messages
        await conn.execute(
            "DELETE FROM messages WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid",
            conv_id, tenant_id
        )
        # Delete conversation
        res = await conn.execute(
            "DELETE FROM conversations WHERE id = $1::uuid AND tenant_id = $2::uuid",
            conv_id, tenant_id
        )
        if res == "DELETE 0":
            raise HTTPException(404, "Conversation not found")
    return {"status": "deleted", "id": conv_id, "delete_type": delete_type}


@app.delete("/messages/{msg_id}")
async def delete_message(
    msg_id: str,
    delete_type: str = Query("for_everyone", regex="^(for_me|for_everyone)$"),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete an individual message.
    'for_everyone': replaces body with '🚫 This message was deleted' like official WhatsApp.
    'for_me': permanently wipes message from CRM database.
    """
    async with db_pool.acquire() as conn:
        msg_row = await conn.fetchrow(
            "SELECT id, conversation_id, direction, wa_message_id FROM messages WHERE id = $1::uuid AND tenant_id = $2::uuid",
            msg_id, tenant_id
        )
        if not msg_row:
            raise HTTPException(404, "Message not found")

        if delete_type == "for_everyone":
            await conn.execute(
                "UPDATE messages SET body = '🚫 This message was deleted', status = 'deleted' WHERE id = $1::uuid",
                msg_id
            )
            return {"status": "deleted", "id": msg_id, "delete_type": "for_everyone", "body": "🚫 This message was deleted"}
        else:
            await conn.execute(
                "DELETE FROM messages WHERE id = $1::uuid",
                msg_id
            )
            return {"status": "deleted", "id": msg_id, "delete_type": "for_me"}


class ConvStatusUpdate(BaseModel):
    status: str

@app.patch("/conversations/{conv_id}/status")
async def update_conversation_status(
    conv_id: str,
    payload: ConvStatusUpdate,
    tenant_id: str = Depends(get_tenant_id)
):
    """Update conversation status between 'bot' (AI on) and 'human' (manual human takeover)."""
    raw_st = payload.status.lower().strip()
    new_status = "human" if raw_st in ["human", "human_takeover", "false", "off", "manual"] else "bot"
    
    async with db_pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE conversations SET status = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
            new_status, conv_id, tenant_id
        )
        if result == "UPDATE 0":
            raise HTTPException(404, "Conversation not found")
    return {"status": "updated", "conv_status": new_status, "ai_enabled": new_status == "bot"}


class ToggleAllPayload(BaseModel):
    ai_enabled: bool

@app.patch("/conversations/toggle-all")
async def toggle_all_conversations_ai(
    payload: ToggleAllPayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Turn AI auto-reply ON or OFF for all conversations belonging to this tenant."""
    new_status = "bot" if payload.ai_enabled else "human"
    async with db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE conversations SET status = $1, updated_at = now() WHERE tenant_id = $2::uuid",
            new_status, tenant_id
        )
    return {"status": "updated", "ai_enabled": payload.ai_enabled, "new_status": new_status}


@app.get("/messages/search")
async def search_messages(
    q: str,
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(20, le=50)
):
    """Full-text search on messages using PostgreSQL tsvector (replaces Elasticsearch)."""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT m.id, m.body, m.created_at, c.id as conversation_id, ct.name
               FROM messages m
               JOIN conversations c ON c.id = m.conversation_id
               JOIN contacts ct ON ct.id = c.contact_id
               WHERE m.tenant_id = $1
                 AND to_tsvector('english', coalesce(m.body, '')) @@ plainto_tsquery('english', $2)
               ORDER BY m.created_at DESC LIMIT $3""",
            tenant_id, q, limit
        )
    return [dict(r) for r in rows]


# ── Client Dashboard Settings Endpoints ─────────────────────────────────────

class TenantSettingsUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    meta_phone_id: Optional[str] = None
    meta_waba_id: Optional[str] = None
    meta_access_token: Optional[str] = None
    meta_app_secret: Optional[str] = None
    verify_token: Optional[str] = None
    
    primary_model_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    opencode_api_key: Optional[str] = None
    opencode_base_url: Optional[str] = None
    
    assistant_name: Optional[str] = None
    bot_goal: Optional[str] = None
    services_text: Optional[str] = None
    ai_prompt: Optional[str] = None
    ai_model: Optional[str] = None
    response_style: Optional[str] = None
    methodology: Optional[str] = None
    strict_rules: Optional[str] = None
    objection_handling: Optional[str] = None
    
    full_location_text: Optional[str] = None
    timezone: Optional[str] = None
    country_code: Optional[str] = None
    currency: Optional[str] = None
    currency_symbol: Optional[str] = None
    admin_whatsapp_number: Optional[str] = None
    template_booking_confirmation: Optional[str] = None
    template_admin_notification: Optional[str] = None
    template_admin_human_request: Optional[str] = None
    template_cancellation_confirmation: Optional[str] = None
    template_admin_cancellation_notice: Optional[str] = None
    template_reschedule_confirmation: Optional[str] = None
    template_post_service_review: Optional[str] = None
    template_appointment_reminder: Optional[str] = None
    template_reschedule_nudge: Optional[str] = None
    template_review_request: Optional[str] = None
    google_review_link: Optional[str] = None
    
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_calendar_id: Optional[str] = None
    notification_email: Optional[str] = None


@app.get("/settings")
async def get_tenant_settings(tenant_id: str = Depends(get_tenant_id)):
    """Retrieve full settings for the currently logged-in tenant / client."""
    async with db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT id, name, slug, plan, is_active, settings FROM tenants WHERE id = $1::uuid", tenant_id)
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
        opencode_base = "https://api.openai.com/v1"
        if opencode_row and opencode_row["credential_data"]:
            d = opencode_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            opencode_key = d.get("api_key", "")
            opencode_base = d.get("base_url", "https://api.openai.com/v1")

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

    return {
        "tenant_id": str(tenant["id"]),
        "name": tenant["name"],
        "slug": tenant["slug"],
        "logo_url": logo_url,
        "webhook_url": f"https://whatsapp-automation-system-eta.vercel.app/webhooks/whatsapp/{tenant['slug']}",
        
        # Meta WhatsApp
        "meta_phone_id": wa_data.get("phone_number_id", ""),
        "meta_waba_id": wa_data.get("waba_id", ""),
        "meta_access_token": wa_data.get("access_token", ""),
        "meta_app_secret": wa_data.get("app_secret", ""),
        "verify_token": wa_data.get("verify_token", ""),
        "has_access_token": bool(wa_data.get("access_token")),
        "has_app_secret": bool(wa_data.get("app_secret")),
        
        # AI Config & BYOK
        "primary_model_provider": wa_data.get("primary_model_provider", "gemini"),
        "ai_model": ai_cfg.get("model", "gemini-2.0-flash"),
        "gemini_api_key": gem_key,
        "groq_api_key": groq_key,
        "opencode_api_key": opencode_key,
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
        "full_location_text": wa_data.get("full_location_text", ""),
        "timezone": tenant_settings.get("timezone", "Asia/Kolkata"),
        "country_code": tenant_settings.get("country_code", "+91"),
        "currency": tenant_settings.get("currency", "INR"),
        "currency_symbol": tenant_settings.get("currency_symbol", "₹"),
        "admin_whatsapp_number": wa_data.get("admin_whatsapp_number", ""),
        "template_booking_confirmation": wa_data.get("template_booking_confirmation", "booking_confirmationn"),
        "template_admin_notification": wa_data.get("template_admin_notification", "admin_notification"),
        "template_admin_human_request": wa_data.get("template_admin_human_request", "admin_human_request"),
        "template_cancellation_confirmation": wa_data.get("template_cancellation_confirmation", "cancellation_confirmation"),
        "template_admin_cancellation_notice": wa_data.get("template_admin_cancellation_notice", "admin_cancellation_notice"),
        "template_reschedule_confirmation": wa_data.get("template_reschedule_confirmation", "booking_confirmationn"),
        "template_post_service_review": wa_data.get("template_post_service_review", "post_service_review"),
        "template_appointment_reminder": wa_data.get("template_appointment_reminder", "appointment_ramainder"),
        "template_reschedule_nudge": wa_data.get("template_reschedule_nudge", "reschedule_nudge"),
        "template_review_request": wa_data.get("template_review_request", "review_request"),
        "google_review_link": tenant_settings.get("google_review_link", wa_data.get("google_review_link", "")),
        
        # Google Calendar
        "google_client_id": gcal_data.get("client_id", ""),
        "google_client_secret": gcal_data.get("client_secret", ""),
        "google_refresh_token": gcal_data.get("refresh_token", ""),
        "google_calendar_id": gcal_data.get("calendar_id", "primary"),
        "notification_email": gcal_data.get("notification_email", ""),
        "google_calendar_configured": bool(gcal_data.get("client_id") and gcal_data.get("refresh_token")),
    }


@app.put("/settings")
async def update_tenant_settings(
    payload: TenantSettingsUpdate,
    tenant_id: str = Depends(get_tenant_id)
):
    """Update settings & credentials for the currently logged-in tenant."""
    async with db_pool.acquire() as conn:
        # 1. Update tenant name, logo, timezone, country_code, currency if provided
        if payload.name:
            await conn.execute("UPDATE tenants SET name = $1 WHERE id = $2::uuid", payload.name.strip(), tenant_id)
        if payload.logo_url is not None or payload.timezone is not None or payload.country_code is not None or payload.currency is not None or payload.currency_symbol is not None or payload.notification_email is not None or payload.admin_whatsapp_number is not None or payload.google_review_link is not None:
            t_row = await conn.fetchrow("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
            cur_settings = t_row["settings"] if t_row and t_row["settings"] else {}
            if isinstance(cur_settings, str):
                try: cur_settings = json.loads(cur_settings)
                except: cur_settings = {}
            if payload.logo_url is not None: cur_settings["logo_url"] = payload.logo_url.strip()
            if payload.timezone is not None: cur_settings["timezone"] = payload.timezone.strip()
            if payload.country_code is not None: cur_settings["country_code"] = payload.country_code.strip()
            if payload.currency is not None: cur_settings["currency"] = payload.currency.strip()
            if payload.currency_symbol is not None: cur_settings["currency_symbol"] = payload.currency_symbol.strip()
            if payload.notification_email is not None: cur_settings["notification_email"] = payload.notification_email.strip()
            if payload.admin_whatsapp_number is not None: cur_settings["admin_whatsapp_number"] = payload.admin_whatsapp_number.strip()
            if payload.google_review_link is not None: cur_settings["google_review_link"] = payload.google_review_link.strip()
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
        if payload.template_post_service_review is not None: wa_data["template_post_service_review"] = payload.template_post_service_review.strip()
        if payload.template_appointment_reminder is not None: wa_data["template_appointment_reminder"] = payload.template_appointment_reminder.strip()
        if payload.template_reschedule_nudge is not None: wa_data["template_reschedule_nudge"] = payload.template_reschedule_nudge.strip()
        if payload.template_review_request is not None: wa_data["template_review_request"] = payload.template_review_request.strip()
        if payload.google_review_link is not None: wa_data["google_review_link"] = payload.google_review_link.strip()
        if payload.primary_model_provider is not None: wa_data["primary_model_provider"] = payload.primary_model_provider.strip()

        if wa_row:
            await conn.execute("UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid", json.dumps(wa_data), wa_cred_id)
        else:
            await conn.execute("INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'whatsapp', $3::jsonb, true)", wa_cred_id, tenant_id, json.dumps(wa_data))

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
                "base_url": payload.opencode_base_url.strip() if payload.opencode_base_url else "https://api.openai.com/v1"
            }
            op_row = await conn.fetchrow("SELECT id FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'opencode'", tenant_id)
            if op_row:
                await conn.execute("UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid", json.dumps(op_data), str(op_row["id"]))
            else:
                await conn.execute("INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'opencode', $3::jsonb, true)", str(uuid.uuid4()), tenant_id, json.dumps(op_data))

        # 4. Update Google Calendar
        if payload.google_client_id is not None or payload.google_refresh_token is not None:
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

        # 5. Update AI Config (modular fields & tone instructions)
        assistant_name = payload.assistant_name or "Assistant"
        bot_goal = payload.bot_goal or ""
        services_text = payload.services_text or ""
        custom_instructions = payload.ai_prompt or ""
        response_style = payload.response_style or "short"
        methodology = payload.methodology or "dogfooding"
        strict_rules = payload.strict_rules or ""
        objection_handling = payload.objection_handling or ""

        ai_row = await conn.fetchrow("SELECT tenant_id FROM ai_config WHERE tenant_id = $1::uuid", tenant_id)
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
                     objection_handling = $9
                   WHERE tenant_id = $10::uuid""",
                payload.ai_model or "gemini-1.5-flash", custom_instructions, assistant_name, bot_goal, services_text,
                response_style, methodology, strict_rules, objection_handling, tenant_id
            )
        else:
            await conn.execute(
                """INSERT INTO ai_config (tenant_id, model, system_prompt, assistant_name, bot_goal, services_text, response_style, methodology, strict_rules, objection_handling, temperature, max_tokens)
                   VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0.3, 500)""",
                tenant_id, payload.ai_model or "gemini-1.5-flash", custom_instructions, assistant_name, bot_goal, services_text,
                response_style, methodology, strict_rules, objection_handling
            )

    return await get_tenant_settings(tenant_id)


# ── Google OAuth 2.0 1-Click Calendar Sync ────────────────────────────────────

GOOGLE_OAUTH_REDIRECT_URI = "https://whatsapp-automation-system-eta.vercel.app/api/v1/crm/oauth/google/callback"

class GoogleOAuthInitPayload(BaseModel):
    client_id: str
    client_secret: str

@app.post("/oauth/google/init")
async def init_google_oauth(
    payload: GoogleOAuthInitPayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Save Google Client ID & Secret, and return the Google OAuth authorization URL."""
    c_id = payload.client_id.strip()
    c_sec = payload.client_secret.strip()
    if not c_id or not c_sec:
        raise HTTPException(400, "Google Client ID and Client Secret are required")

    async with db_pool.acquire() as conn:
        g_row = await conn.fetchrow(
            "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar'",
            tenant_id
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
                g_id, tenant_id, json.dumps(g_data)
            )

    scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={c_id}&"
        f"redirect_uri={GOOGLE_OAUTH_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope={scopes}&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={tenant_id}"
    )
    return {"auth_url": auth_url, "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI}


@app.get("/oauth/google/callback")
async def google_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """Exchange authorization code for refresh token and save to tenant credentials."""
    if error or not code or not state:
        logger.error("google_oauth_callback_error", error=error, state=state)
        return RedirectResponse(f"https://whatsapp-automation-system-eta.vercel.app/dashboard?gcal_error={error or 'missing_code'}")

    tenant_id = state
    async with db_pool.acquire() as conn:
        g_row = await conn.fetchrow(
            "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar'",
            tenant_id
        )
        if not g_row or not g_row["credential_data"]:
            return RedirectResponse("https://whatsapp-automation-system-eta.vercel.app/dashboard?gcal_error=no_credentials")

        g_data = g_row["credential_data"]
        if isinstance(g_data, str):
            try: g_data = json.loads(g_data)
            except: g_data = {}

        client_id = g_data.get("client_id")
        client_secret = g_data.get("client_secret")
        if not client_id or not client_secret:
            return RedirectResponse("https://whatsapp-automation-system-eta.vercel.app/dashboard?gcal_error=missing_client_keys")

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
            return RedirectResponse(f"https://whatsapp-automation-system-eta.vercel.app/dashboard?gcal_error=token_exchange_failed")

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

    return RedirectResponse("https://whatsapp-automation-system-eta.vercel.app/dashboard?gcal_success=true")


@app.post("/oauth/google/disconnect")
async def disconnect_google_calendar(tenant_id: str = Depends(get_tenant_id)):
    """Disconnect Google Calendar sync for this tenant."""
    async with db_pool.acquire() as conn:
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


# ── Super Admin Client Management Endpoints ────────────────────────────────────

class TenantCreate(BaseModel):
    name: str
    slug: str
    admin_email: str
    admin_password: str
    plan: Optional[str] = "pro"
    monthly_price: Optional[float] = None
    billing_cycle_day: Optional[int] = None
    razorpay_subscription_id: Optional[str] = None
    meta_phone_id: Optional[str] = ""
    meta_access_token: Optional[str] = ""
    meta_app_secret: Optional[str] = ""
    verify_token: Optional[str] = ""
    ai_prompt: Optional[str] = ""
    ai_model: Optional[str] = "gemini-1.5-flash"
    primary_model_provider: Optional[str] = "gemini"
    gemini_api_key: Optional[str] = ""
    groq_api_key: Optional[str] = ""
    opencode_api_key: Optional[str] = ""
    opencode_base_url: Optional[str] = "https://api.openai.com/v1"
    assistant_name: Optional[str] = ""
    bot_goal: Optional[str] = ""
    services_text: Optional[str] = ""
    full_location_text: Optional[str] = ""
    admin_whatsapp_number: Optional[str] = ""
    template_booking_confirmation: Optional[str] = "booking_confirmationn"
    template_admin_notification: Optional[str] = "admin_notification"
    template_admin_human_request: Optional[str] = "admin_human_request"
    template_cancellation_confirmation: Optional[str] = "cancellation_confirmation"
    template_admin_cancellation_notice: Optional[str] = "admin_cancellation_notice"
    template_reschedule_confirmation: Optional[str] = "booking_confirmationn"
    google_client_id: Optional[str] = ""
    google_client_secret: Optional[str] = ""
    google_refresh_token: Optional[str] = ""
    google_calendar_id: Optional[str] = "primary"
    notification_email: Optional[str] = ""


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    primary_model_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    opencode_api_key: Optional[str] = None
    opencode_base_url: Optional[str] = None
    assistant_name: Optional[str] = None
    bot_goal: Optional[str] = None
    services_text: Optional[str] = None
    full_location_text: Optional[str] = None
    admin_whatsapp_number: Optional[str] = None
    template_booking_confirmation: Optional[str] = None
    template_admin_notification: Optional[str] = None
    template_admin_human_request: Optional[str] = None
    template_cancellation_confirmation: Optional[str] = None
    template_admin_cancellation_notice: Optional[str] = None
    template_reschedule_confirmation: Optional[str] = None
    ai_prompt: Optional[str] = None
    meta_phone_id: Optional[str] = None
    meta_access_token: Optional[str] = None
    meta_app_secret: Optional[str] = None
    verify_token: Optional[str] = None


class PasswordReset(BaseModel):
    new_password: str


@app.get("/admin/tenants")
async def list_admin_tenants():
    """List all client tenants with metadata, stats, billing, and primary admin email."""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT 
                t.id, t.name, t.slug, t.is_active, t.plan, t.settings, t.created_at,
                (SELECT email FROM users WHERE tenant_id = t.id ORDER BY (role = 'super_admin') DESC, created_at ASC LIMIT 1) as admin_email,
                (SELECT COUNT(*) FROM contacts WHERE tenant_id = t.id) as contact_count,
                (SELECT COUNT(*) FROM conversations WHERE tenant_id = t.id) as conversation_count,
                (SELECT COUNT(*) FROM messages WHERE tenant_id = t.id) as message_count,
                (SELECT is_active FROM tenant_credentials WHERE tenant_id = t.id AND provider = 'whatsapp' LIMIT 1) as whatsapp_configured,
                (SELECT is_active FROM tenant_credentials WHERE tenant_id = t.id AND provider = 'google_calendar' LIMIT 1) as google_calendar_configured
            FROM tenants t
            ORDER BY t.created_at DESC
            """
        )
    result = []
    for r in rows:
        cfg = r["settings"] or {}
        if isinstance(cfg, str):
            try: cfg = json.loads(cfg)
            except: cfg = {}
        monthly_price = float(cfg.get("monthly_price", 999.0 if (r["plan"] or "").lower() == "starter" else (9999.0 if (r["plan"] or "").lower() == "enterprise" else 2999.0)))
        billing_day = int(cfg.get("billing_cycle_day", 1))
        razorpay_sub_id = cfg.get("razorpay_subscription_id", "")
        next_renewal = cfg.get("next_renewal_date", f"Day {billing_day} of every month")
        result.append({
            "id": str(r["id"]),
            "name": r["name"],
            "slug": r["slug"],
            "status": "active" if r["is_active"] else "inactive",
            "plan": r["plan"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else "",
            "admin_email": r["admin_email"] or "",
            "contact_count": int(r["contact_count"] or 0),
            "conversation_count": int(r["conversation_count"] or 0),
            "message_count": int(r["message_count"] or 0),
            "whatsapp_configured": bool(r["whatsapp_configured"]),
            "google_calendar_configured": bool(r["google_calendar_configured"]),
            "monthly_price": monthly_price,
            "billing_cycle_day": billing_day,
            "razorpay_subscription_id": razorpay_sub_id,
            "next_renewal_date": next_renewal,
            "billing_method": "Razorpay Auto-Debit",
        })
    return result


@app.post("/admin/tenants")
async def create_admin_tenant(payload: TenantCreate):
    """
    Onboard a brand new client:
    1. Create tenant record with billing settings
    2. Create tenant admin user with bcrypt password
    3. Save WhatsApp credentials, Meta templates & Location text
    4. Save modular AI system prompt (assistantName, botGoal, servicesText)
    5. Save Google Calendar & Email credentials (if provided)
    """
    slug = payload.slug.strip().lower().replace(" ", "-")
    async with db_pool.acquire() as conn:
        # Check slug collision
        existing = await conn.fetchval("SELECT id FROM tenants WHERE slug = $1", slug)
        if existing:
            raise HTTPException(400, f"Organization identifier (slug) '{slug}' is already in use")

        # Check email collision
        existing_email = await conn.fetchval("SELECT id FROM users WHERE email = $1", payload.admin_email.strip())
        if existing_email:
            raise HTTPException(400, f"Admin email '{payload.admin_email}' is already registered")

        tenant_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())

        password_hash = bcrypt.hashpw(payload.admin_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Compile AI System Prompt if modular fields provided
        assistant_name = payload.assistant_name.strip() if payload.assistant_name else "Assistant"
        bot_goal = payload.bot_goal.strip() if payload.bot_goal else ""
        services_text = payload.services_text.strip() if payload.services_text else ""
        full_location = payload.full_location_text.strip() if payload.full_location_text else ""

        if bot_goal or services_text or full_location:
            parts = [
                f"You are {assistant_name}, the official AI WhatsApp Assistant for {payload.name.strip()}.",
                f"Your primary goal is: {bot_goal}."
            ]
            if services_text:
                parts.append(f"### SERVICES, PRICING & BUSINESS INFORMATION\n{services_text}")
            if full_location:
                parts.append(f"### CLINIC / BUSINESS LOCATION\n{full_location}\n(When an appointment is confirmed, always share this exact location and directions warmly with the customer).")
            parts.append(
                "### CONVERSATION GUIDELINES & WHATSAPP RULES\n"
                "- Talk like a real person on WhatsApp: natural, flowing, empathetic, and concise.\n"
                "- Avoid robotic corporate scripts or overwhelming walls of text. Keep responses to 2-3 short conversational sentences.\n"
                "- React to what the user actually says in the moment rather than following a rigid fixed sequence.\n"
                "- Ask one clear question at a time to qualify their needs and guide them towards booking.\n"
                "- Reply in the same language the customer uses (English, Tamil, Hindi, etc.)."
            )
            compiled_prompt = "\n\n".join(parts)
        else:
            compiled_prompt = payload.ai_prompt.strip() or f"You are {assistant_name}, the official WhatsApp assistant for {payload.name.strip()}. Assist customers politely and accurately."

        # Prepare Billing Settings
        m_price = payload.monthly_price if payload.monthly_price is not None else (999.0 if (payload.plan or "").lower() == "starter" else (9999.0 if (payload.plan or "").lower() == "enterprise" else 2999.0))
        b_day = payload.billing_cycle_day or 1
        t_settings = {
            "monthly_price": float(m_price),
            "billing_cycle_day": int(b_day),
            "razorpay_subscription_id": (payload.razorpay_subscription_id or "").strip(),
            "next_renewal_date": f"Day {b_day} of every month",
            "country_code": "+91",
            "currency": "INR",
            "currency_symbol": "₹"
        }

        # Transactional insert
        try:
            async with conn.transaction():
                # 1. Tenant
                await conn.execute(
                    "INSERT INTO tenants (id, name, slug, is_active, plan, settings) VALUES ($1::uuid, $2, $3, true, $4, $5::jsonb)",
                    tenant_id, payload.name.strip(), slug, payload.plan or "pro", json.dumps(t_settings)
                )

                # 2. Admin User
                await conn.execute(
                    "INSERT INTO users (id, tenant_id, email, password_hash, role, display_name) VALUES ($1::uuid, $2::uuid, $3, $4, 'admin', $5)",
                    user_id, tenant_id, payload.admin_email.strip(), password_hash, payload.name.strip()
                )

                # 3. WhatsApp Credentials & Meta Templates
                cred_dict = {
                    "phone_number_id": payload.meta_phone_id.strip() if payload.meta_phone_id else "",
                    "access_token": payload.meta_access_token.strip() if payload.meta_access_token else "",
                    "app_secret": payload.meta_app_secret.strip() if payload.meta_app_secret else "",
                    "verify_token": payload.verify_token.strip() if payload.verify_token else (slug + "_verify_token"),
                    "full_location_text": full_location,
                    "admin_whatsapp_number": payload.admin_whatsapp_number.strip() if payload.admin_whatsapp_number else "",
                    "template_booking_confirmation": payload.template_booking_confirmation.strip() if payload.template_booking_confirmation else "booking_confirmationn",
                    "template_admin_notification": payload.template_admin_notification.strip() if payload.template_admin_notification else "admin_notification",
                    "template_admin_human_request": payload.template_admin_human_request.strip() if payload.template_admin_human_request else "admin_human_request",
                    "template_cancellation_confirmation": payload.template_cancellation_confirmation.strip() if payload.template_cancellation_confirmation else "cancellation_confirmation",
                    "template_admin_cancellation_notice": payload.template_admin_cancellation_notice.strip() if payload.template_admin_cancellation_notice else "admin_cancellation_notice",
                    "template_reschedule_confirmation": payload.template_reschedule_confirmation.strip() if payload.template_reschedule_confirmation else "booking_confirmationn",
                }
                await conn.execute(
                    "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'whatsapp', $3::jsonb, true)",
                    str(uuid.uuid4()), tenant_id, json.dumps(cred_dict)
                )

                # 4. AI Config (Modular + Compiled)
                await conn.execute(
                    """INSERT INTO ai_config (tenant_id, model, system_prompt, assistant_name, bot_goal, services_text, temperature, max_tokens) 
                       VALUES ($1::uuid, $2, $3, $4, $5, $6, 0.3, 500)""",
                    tenant_id, payload.ai_model or "gemini-1.5-flash", compiled_prompt, assistant_name, bot_goal, services_text
                )

                # 5. Customer Model API Keys (Gemini, Groq, OpenCode)
                if payload.gemini_api_key and payload.gemini_api_key.strip():
                    gem_cred = {"api_key": payload.gemini_api_key.strip()}
                    await conn.execute(
                        "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'gemini', $3::jsonb, true)",
                        str(uuid.uuid4()), tenant_id, json.dumps(gem_cred)
                    )

                if payload.groq_api_key and payload.groq_api_key.strip():
                    groq_cred = {"api_key": payload.groq_api_key.strip()}
                    await conn.execute(
                        "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'groq', $3::jsonb, true)",
                        str(uuid.uuid4()), tenant_id, json.dumps(groq_cred)
                    )

                if payload.opencode_api_key and payload.opencode_api_key.strip():
                    opencode_cred = {
                        "api_key": payload.opencode_api_key.strip(),
                        "base_url": payload.opencode_base_url.strip() if payload.opencode_base_url else "https://api.openai.com/v1"
                    }
                    await conn.execute(
                        "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'opencode', $3::jsonb, true)",
                        str(uuid.uuid4()), tenant_id, json.dumps(opencode_cred)
                    )

                # 6. Google Calendar & Email Sync Credentials
                if payload.google_client_id or payload.google_refresh_token:
                    g_cred_dict = {
                        "client_id": payload.google_client_id.strip() if payload.google_client_id else "",
                        "client_secret": payload.google_client_secret.strip() if payload.google_client_secret else "",
                        "refresh_token": payload.google_refresh_token.strip() if payload.google_refresh_token else "",
                        "calendar_id": payload.google_calendar_id.strip() if payload.google_calendar_id else "primary",
                        "notification_email": payload.notification_email.strip() if payload.notification_email else payload.admin_email.strip(),
                    }
                    await conn.execute(
                        "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'google_calendar', $3::jsonb, true)",
                        str(uuid.uuid4()), tenant_id, json.dumps(g_cred_dict)
                    )
        except Exception as e:
            logger.error(f"Error provisioning client tenant: {e}")
            raise HTTPException(400, f"Failed to provision client organization: {str(e)}")

    return {
        "id": tenant_id,
        "name": payload.name.strip(),
        "slug": slug,
        "admin_email": payload.admin_email.strip(),
        "webhook_url": f"https://whatsapp-automation-system-eta.vercel.app/webhooks/whatsapp/{slug}",
        "verify_token": payload.verify_token.strip() or (slug + "_verify_token"),
        "login_url": "https://whatsapp-automation-system-eta.vercel.app/login",
        "status": "active"
    }


@app.get("/admin/tenants/{tenant_id}")
async def get_admin_tenant_details(tenant_id: str):
    """Retrieve full details of a specific client including credentials and AI config."""
    async with db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT * FROM tenants WHERE id = $1::uuid", tenant_id)
        if not tenant:
            raise HTTPException(404, "Client not found")

        admin_user = await conn.fetchrow("SELECT email, role, display_name FROM users WHERE tenant_id = $1::uuid AND role = 'admin' LIMIT 1", tenant_id)
        creds = await conn.fetchrow("SELECT credential_data, is_active FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' LIMIT 1", tenant_id)
        gemini_creds = await conn.fetchrow("SELECT credential_data, is_active FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'gemini' LIMIT 1", tenant_id)
        groq_creds = await conn.fetchrow("SELECT credential_data, is_active FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'groq' LIMIT 1", tenant_id)
        opencode_creds = await conn.fetchrow("SELECT credential_data, is_active FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'opencode' LIMIT 1", tenant_id)
        ai_cfg = await conn.fetchrow("SELECT * FROM ai_config WHERE tenant_id = $1::uuid LIMIT 1", tenant_id)

        cred_data = {}
        if creds and creds["credential_data"]:
            cd = creds["credential_data"]
            if isinstance(cd, str):
                try: cd = json.loads(cd)
                except: cd = {}
            cred_data = dict(cd)

        has_gemini_key = bool(gemini_creds and gemini_creds["credential_data"])
        has_groq_key = bool(groq_creds and groq_creds["credential_data"])
        has_opencode_key = bool(opencode_creds and opencode_creds["credential_data"])

    return {
        "id": str(tenant["id"]),
        "name": tenant["name"],
        "slug": tenant["slug"],
        "status": "active" if tenant["is_active"] else "inactive",
        "plan": tenant["plan"],
        "created_at": tenant["created_at"].isoformat() if tenant["created_at"] else "",
        "admin_email": admin_user["email"] if admin_user else "",
        "webhook_url": f"http://168.138.172.197/webhooks/whatsapp/{tenant['slug']}",
        "credentials": {
            "phone_number_id": cred_data.get("phone_number_id", ""),
            "verify_token": cred_data.get("verify_token", ""),
            "has_access_token": bool(cred_data.get("access_token")),
            "has_app_secret": bool(cred_data.get("app_secret")),
            "has_gemini_key": has_gemini_key,
            "has_groq_key": has_groq_key,
            "has_opencode_key": has_opencode_key,
            "full_location_text": cred_data.get("full_location_text", ""),
            "admin_whatsapp_number": cred_data.get("admin_whatsapp_number", ""),
            "template_booking_confirmation": cred_data.get("template_booking_confirmation", "booking_confirmationn"),
            "template_admin_notification": cred_data.get("template_admin_notification", "admin_notification"),
            "template_admin_human_request": cred_data.get("template_admin_human_request", "admin_human_request"),
            "template_cancellation_confirmation": cred_data.get("template_cancellation_confirmation", "cancellation_confirmation"),
            "template_admin_cancellation_notice": cred_data.get("template_admin_cancellation_notice", "admin_cancellation_notice"),
            "template_reschedule_confirmation": cred_data.get("template_reschedule_confirmation", "booking_confirmationn"),
        },
        "ai_config": {
            "model": ai_cfg["model"] if ai_cfg else "gemini-1.5-flash",
            "assistant_name": ai_cfg.get("assistant_name", "") if (ai_cfg and "assistant_name" in ai_cfg) else "Rakshaya",
            "bot_goal": ai_cfg.get("bot_goal", "") if (ai_cfg and "bot_goal" in ai_cfg) else "",
            "services_text": ai_cfg.get("services_text", "") if (ai_cfg and "services_text" in ai_cfg) else "",
            "system_prompt": ai_cfg["system_prompt"] if ai_cfg else "",
            "temperature": float(ai_cfg["temperature"]) if ai_cfg else 0.3,
            "max_tokens": int(ai_cfg["max_tokens"]) if ai_cfg else 500,
        }
    }


@app.post("/admin/tenants/{tenant_id}/reset-password")
async def reset_admin_tenant_password(tenant_id: str, payload: PasswordReset):
    """Reset the admin password for a client."""
    if not payload.new_password or len(payload.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    password_hash = bcrypt.hashpw(payload.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    async with db_pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE users SET password_hash = $1 WHERE tenant_id = $2::uuid AND role = 'admin'",
            password_hash, tenant_id
        )
        if result == "UPDATE 0":
            raise HTTPException(404, "Admin user for client not found")

    return {"status": "password_reset_success"}


@app.patch("/admin/tenants/{tenant_id}/toggle-status")
async def toggle_admin_tenant_status(tenant_id: str):
    """Toggle tenant active / paused status (e.g. for non-payment or maintenance)."""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """UPDATE tenants 
               SET is_active = NOT is_active, updated_at = now() 
               WHERE id = $1::uuid 
               RETURNING id, name, is_active""",
            tenant_id
        )
        if not row:
            raise HTTPException(404, "Client not found")

    return {
        "id": str(row["id"]),
        "name": row["name"],
        "is_active": row["is_active"],
        "status": "active" if row["is_active"] else "paused"
    }


@app.delete("/admin/tenants/{tenant_id}")
async def delete_admin_tenant(tenant_id: str):
    """Permanently delete a client organization and all its data."""
    async with db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT id, name FROM tenants WHERE id = $1::uuid", tenant_id)
        if not tenant:
            raise HTTPException(404, "Client organization not found")
            
        async with conn.transaction():
            await conn.execute("DELETE FROM messages WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM conversations WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM bookings WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM contacts WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM tenant_credentials WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM ai_config WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM scheduled_jobs WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM users WHERE tenant_id = $1::uuid", tenant_id)
            await conn.execute("DELETE FROM tenants WHERE id = $1::uuid", tenant_id)
            
    return {"status": "deleted", "tenant_id": tenant_id, "name": tenant["name"]}


class PaymentReminderRequest(BaseModel):
    amount: float = 2999.0
    currency: str = "INR"
    due_date: str = "in 3 days"
    payment_link: Optional[str] = ""
    custom_phone: Optional[str] = None
    custom_message: Optional[str] = None


@app.get("/admin/stats")
async def get_platform_admin_stats():
    """Retrieve global multi-tenant platform metrics, MRR and health status."""
    async with db_pool.acquire() as conn:
        tenants = await conn.fetch("SELECT id, name, plan, is_active, created_at FROM tenants")
        total_msgs = await conn.fetchval("SELECT COUNT(*) FROM messages") or 0
        total_convs = await conn.fetchval("SELECT COUNT(*) FROM conversations") or 0
        total_bookings = await conn.fetchval("SELECT COUNT(*) FROM bookings") or 0
        
        # Calculate estimated MRR based on plans
        plan_prices = {
            "starter": 999.0,
            "pro": 2999.0,
            "enterprise": 9999.0
        }
        total_mrr = sum(plan_prices.get((t["plan"] or "pro").lower(), 2999.0) for t in tenants if t["is_active"])
        
    return {
        "total_tenants": len(tenants),
        "active_tenants": sum(1 for t in tenants if t["is_active"]),
        "paused_tenants": sum(1 for t in tenants if not t["is_active"]),
        "total_messages": int(total_msgs),
        "total_conversations": int(total_convs),
        "total_bookings": int(total_bookings),
        "estimated_mrr": total_mrr,
        "mrr_currency": "INR",
        "mrr_symbol": "₹",
        "system_status": "operational",
        "uptime": "99.98%"
    }


@app.post("/admin/tenants/{tenant_id}/payment-reminder")
async def send_tenant_payment_reminder(
    tenant_id: str,
    payload: PaymentReminderRequest,
    background_tasks: BackgroundTasks
):
    """Send an automated WhatsApp payment reminder to client organization admin."""
    async with db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT id, name, slug FROM tenants WHERE id = $1::uuid", tenant_id)
        if not tenant:
            raise HTTPException(404, "Client tenant not found")
            
        wa_row = await conn.fetchrow("SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp'", tenant_id)
        admin_user = await conn.fetchrow("SELECT email FROM users WHERE tenant_id = $1::uuid AND role = 'admin' LIMIT 1", tenant_id)
        
        wa_data = {}
        if wa_row and wa_row["credential_data"]:
            d = wa_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            wa_data = dict(d)
            
        target_phone = payload.custom_phone or wa_data.get("admin_whatsapp_number", "")
        clean_phone = re.sub(r'[^0-9]', '', target_phone)
        
        curr_sym = "₹" if payload.currency == "INR" else ("$" if payload.currency == "USD" else (payload.currency + " "))
        pay_url = payload.payment_link or f"https://boldlabs.ai/pay/{tenant['slug']}"
        
        if payload.custom_message and payload.custom_message.strip():
            msg_text = payload.custom_message.strip()
        else:
            msg_text = (
                f"🔔 *Boldlabs CRM — Subscription Renewal Notice*\n\n"
                f"Dear *{tenant['name']}* Team,\n\n"
                f"This is a friendly reminder that your monthly platform subscription ({curr_sym}{payload.amount:,.2f}) is scheduled for renewal *{payload.due_date}*.\n\n"
                f"💳 *Quick Payment Link:* {pay_url}\n\n"
                f"Your WhatsApp AI Automation and CRM access remain fully active. If you've already completed this payment, please disregard this note.\n\n"
                f"— Boldlabs Billing Support"
            )
            
        # Dispatch in background task if phone is available
        if clean_phone and len(clean_phone) >= 10:
            background_tasks.add_task(
                dispatch_automated_status_whatsapp,
                tenant_id,
                None,
                clean_phone,
                msg_text,
                0
            )
            
    return {
        "status": "sent",
        "tenant_id": tenant_id,
        "tenant_name": tenant["name"],
        "recipient_phone": clean_phone or "Recorded to Dashboard Log",
        "amount": payload.amount,
        "due_date": payload.due_date,
        "message_preview": msg_text
    }


class TenantBillingUpdate(BaseModel):
    plan: Optional[str] = None
    monthly_price: Optional[float] = None
    billing_cycle_day: Optional[int] = None
    razorpay_subscription_id: Optional[str] = None
    next_renewal_date: Optional[str] = None


@app.put("/admin/tenants/{tenant_id}/billing")
async def update_tenant_billing_config(tenant_id: str, payload: TenantBillingUpdate):
    """Update a client organization's plan, pricing, and Razorpay subscription details."""
    async with db_pool.acquire() as conn:
        t_row = await conn.fetchrow("SELECT plan, settings FROM tenants WHERE id = $1::uuid", tenant_id)
        if not t_row:
            raise HTTPException(404, "Client tenant not found")
            
        cur_settings = t_row["settings"] or {}
        if isinstance(cur_settings, str):
            try: cur_settings = json.loads(cur_settings)
            except: cur_settings = {}
            
        if payload.monthly_price is not None:
            cur_settings["monthly_price"] = float(payload.monthly_price)
        if payload.billing_cycle_day is not None:
            cur_settings["billing_cycle_day"] = int(payload.billing_cycle_day)
        if payload.razorpay_subscription_id is not None:
            cur_settings["razorpay_subscription_id"] = payload.razorpay_subscription_id.strip()
        if payload.next_renewal_date is not None:
            cur_settings["next_renewal_date"] = payload.next_renewal_date.strip()
            
        new_plan = payload.plan or t_row["plan"]
        await conn.execute(
            "UPDATE tenants SET plan = $1, settings = $2::jsonb, updated_at = now() WHERE id = $3::uuid",
            new_plan, json.dumps(cur_settings), tenant_id
        )
        
    return {
        "status": "updated",
        "tenant_id": tenant_id,
        "plan": new_plan,
        "settings": cur_settings
    }


class AdminDueAlertRequest(BaseModel):
    super_admin_phone: str
    tenant_id: Optional[str] = None
    custom_note: Optional[str] = None


@app.post("/admin/alerts/send-due-alert")
async def send_admin_due_date_alert(payload: AdminDueAlertRequest, background_tasks: BackgroundTasks):
    """
    Send an automated Razorpay subscription renewal due date alert to the SUPER ADMIN's WhatsApp.
    Helps the admin track which clients' auto-debit renewals are scheduled without messaging clients.
    """
    clean_phone = re.sub(r'[^0-9]', '', payload.super_admin_phone)
    if not clean_phone or len(clean_phone) < 10:
        raise HTTPException(400, "Valid 10+ digit super admin WhatsApp number required")

    async with db_pool.acquire() as conn:
        # Find any active tenant with Meta WhatsApp credentials to dispatch the message
        sender_cred = await conn.fetchrow(
            "SELECT tenant_id, credential_data FROM tenant_credentials WHERE provider = 'whatsapp' AND is_active = true LIMIT 1"
        )
        sender_tenant_id = str(sender_cred["tenant_id"]) if sender_cred else str(uuid.uuid4())

        if payload.tenant_id:
            # Single tenant alert
            tenant = await conn.fetchrow("SELECT id, name, slug, plan, settings FROM tenants WHERE id = $1::uuid", payload.tenant_id)
            if not tenant:
                raise HTTPException(404, "Tenant not found")
                
            cfg = tenant["settings"] or {}
            if isinstance(cfg, str):
                try: cfg = json.loads(cfg)
                except: cfg = {}
                
            plan_str = (tenant["plan"] or "pro").upper()
            fee = float(cfg.get("monthly_price", 999.0 if plan_str == "STARTER" else (9999.0 if plan_str == "ENTERPRISE" else 2999.0)))
            day = cfg.get("billing_cycle_day", 1)
            next_date = cfg.get("next_renewal_date", f"Day {day} of this month")
            sub_id = cfg.get("razorpay_subscription_id", "Direct Auto-Debit")
            
            msg_text = (
                f"🔔 *Boldlabs Super Admin — Razorpay Client Renewal Alert*\n\n"
                f"🏢 *Client Organization:* {tenant['name']}\n"
                f"📦 *Subscription Tier:* {plan_str} (₹{fee:,.2f}/mo)\n"
                f"💳 *Payment Gateway:* Razorpay Auto-Debit\n"
                f"📅 *Scheduled Renewal:* {next_date} (Cycle Day {day})\n"
                f"🆔 *Razorpay Sub ID:* {sub_id}\n\n"
                f"💡 *Action:* Razorpay will automatically attempt debit. Please verify settlement status in your Razorpay Dashboard."
            )
        else:
            # Consolidated digest of all active client renewals
            tenants = await conn.fetch("SELECT id, name, plan, settings FROM tenants WHERE is_active = true ORDER BY name")
            summary_lines = []
            total_mrr = 0.0
            
            for t in tenants:
                cfg = t["settings"] or {}
                if isinstance(cfg, str):
                    try: cfg = json.loads(cfg)
                    except: cfg = {}
                plan_str = (t["plan"] or "pro").upper()
                fee = float(cfg.get("monthly_price", 999.0 if plan_str == "STARTER" else (9999.0 if plan_str == "ENTERPRISE" else 2999.0)))
                total_mrr += fee
                day = cfg.get("billing_cycle_day", 1)
                next_date = cfg.get("next_renewal_date", f"Day {day}")
                sub_id = cfg.get("razorpay_subscription_id", "Auto-Debit")
                summary_lines.append(f"• *{t['name']}* ({plan_str}): ₹{fee:,.0f} | Due: {next_date} | Sub ID: {sub_id}")
                
            summary_block = "\n".join(summary_lines) if summary_lines else "No active clients."
            
            msg_text = (
                f"📊 *Boldlabs Super Admin — Client Subscription Renewal Digest*\n\n"
                f"💰 *Total Platform MRR:* ₹{total_mrr:,.2f}/mo\n"
                f"🏢 *Active Client Workspaces:* {len(tenants)}\n\n"
                f"*Upcoming Razorpay Auto-Debit Schedule:*\n"
                f"{summary_block}\n\n"
                f"⚡ *Billing Gateway:* Razorpay Subscriptions (Automatic)\n"
                f"— Boldlabs Automation Monitoring"
            )
            
        background_tasks.add_task(
            dispatch_automated_status_whatsapp,
            sender_tenant_id,
            None,
            clean_phone,
            msg_text,
            0
        )

    return {
        "status": "alert_dispatched",
        "recipient_phone": clean_phone,
        "message_preview": msg_text
    }



