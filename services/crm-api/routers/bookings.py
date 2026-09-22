from services.whatsapp_service import dispatch_automated_status_whatsapp, dispatch_admin_reschedule_whatsapp, dispatch_admin_cancellation_whatsapp
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
from utils import safe_json_loads
from zoneinfo import ZoneInfo

import json
import uuid
from datetime import datetime, timezone
import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from typing import Optional, List
import database
from models import BookingCreatePayload, BookingStatusPayload, BookingPricePayload
from dependencies import get_tenant_id, get_caller_context
from services.crm_service import *
from services.whatsapp_service import *
from routers.auth import get_admin_tenant_settings
import utils
from services.crm_service import create_google_calendar_event, send_gmail_direct_notification
from utils import sanitize_and_fix_email
from services.crm_service import build_cancellation_admin_email_html, build_cancellation_customer_email_html, build_reschedule_admin_email_html, build_reschedule_customer_email_html, build_review_customer_email_html

router = APIRouter()
logger = structlog.get_logger('crm-api-bookings')

@router.get("/bookings")
@router.get("/api/v1/crm/bookings")
async def list_bookings(
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context),
    status: Optional[str] = None,
    limit: int = Query(50, le=1000),
    offset: int = 0
):
    """List appointments/bookings joined with contacts for this tenant."""
    async with database.db_pool.acquire() as conn:
        query = """
            SELECT b.id, b.service, b.staff_member, b.start_time, b.end_time, b.status,
                   b.notes, b.price, b.currency, b.created_at,
                   COALESCE(b.source, b.metadata->>'source', 'crm') AS source,
                   c.name as contact_name, c.phone as contact_phone,
                   (SELECT cu.health_concern FROM customers cu WHERE cu.tenant_id = b.tenant_id AND (cu.phone = c.phone OR RIGHT(REGEXP_REPLACE(cu.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g'), 10)) LIMIT 1) as customer_health_concern
            FROM bookings b
            JOIN contacts c ON c.id = b.contact_id AND c.tenant_id = b.tenant_id
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

    caller_concerns = caller.get("assigned_health_concerns", [])
    caller_doc = caller.get("assigned_doctor")
    is_admin = caller.get("role") in ("admin", "super_admin", "owner")

    result = []
    for r in rows:
        c_concern = r["customer_health_concern"] or ""
        doc_val = r["staff_member"] or ""
        # If user is a restricted sales rep or doctor and booking belongs to a different concern/doctor:
        is_restricted_concern = bool(caller_concerns and not is_admin and (c_concern not in caller_concerns))
        is_restricted_doc = bool(caller_doc and not is_admin and doc_val and (doc_val.lower() != caller_doc.lower()))
        if is_restricted_concern or is_restricted_doc:
            result.append({
                "id": str(r["id"]),
                "service": "Reserved Slot",
                "staff_member": "Staff",
                "doctor": "Staff",
                "start_time": r["start_time"].isoformat() if r["start_time"] else "",
                "end_time": r["end_time"].isoformat() if r["end_time"] else "",
                "status": r["status"],
                "notes": "Booked by another specialty team",
                "price": 0.0,
                "currency": r["currency"] or "INR",
                "contact_name": "Occupied Slot",
                "contact_phone": "",
                "created_at": r["created_at"].isoformat() if r["created_at"] else "",
                "is_occupied_only": True,
                "health_concern": "Other Department",
                "source": r.get("source") or "crm",
            })
        else:
            result.append({
                "id": str(r["id"]),
                "service": r["service"],
                "staff_member": doc_val,
                "doctor": doc_val,
                "start_time": r["start_time"].isoformat() if r["start_time"] else "",
                "end_time": r["end_time"].isoformat() if r["end_time"] else "",
                "status": r["status"],
                "notes": r["notes"] or "",
                "price": float(r["price"]) if r["price"] is not None else 0.0,
                "currency": r["currency"] or "INR",
                "contact_name": r["contact_name"] or "",
                "contact_phone": r["contact_phone"] or "",
                "created_at": r["created_at"].isoformat() if r["created_at"] else "",
                "is_occupied_only": False,
                "health_concern": c_concern or None,
                "source": r["source"] or "crm",
            })
    return result


@router.post("/bookings")
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

    # Fetch tenant configured timezone
    tenant_tz_str = "Asia/Kolkata"
    async with database.db_pool.acquire() as conn:
        t_row = await conn.fetchrow("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
        if t_row and t_row["settings"]:
            s_data = safe_json_loads(t_row["settings"])
            if isinstance(s_data, dict) and s_data.get("timezone"):
                tenant_tz_str = s_data["timezone"]
    try:
        tenant_tz = ZoneInfo(tenant_tz_str)
    except Exception:
        tenant_tz = ZoneInfo("Asia/Kolkata")

    # Parse start and end time
    try:
        st_dt = datetime.fromisoformat(payload.start_time.replace("Z", "+00:00"))
        if st_dt.tzinfo is None:
            st_dt = st_dt.replace(tzinfo=tenant_tz)
    except Exception:
        raise HTTPException(400, "Invalid start_time format. Use ISO format (e.g. 2026-08-30T10:00:00).")

    if payload.end_time:
        try:
            et_dt = datetime.fromisoformat(payload.end_time.replace("Z", "+00:00"))
            if et_dt.tzinfo is None:
                et_dt = et_dt.replace(tzinfo=tenant_tz)
        except Exception:
            et_dt = st_dt + timedelta(minutes=30)
    else:
        et_dt = st_dt + timedelta(minutes=30)

    async with database.db_pool.acquire() as conn:
        # 1. Find or create contact using normalized phone matching
        contact_row = await conn.fetchrow(
            """SELECT id, name, phone FROM contacts 
               WHERE tenant_id = $1::uuid 
                 AND (
                   phone = $2
                   OR phone = ('+' || $2)
                   OR replace(phone, '+', '') = replace($2, '+', '')
                   OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($2, '[^0-9]', '', 'g'), 10)
                 )
               ORDER BY created_at ASC LIMIT 1""",
            tenant_id, clean_phone
        )
        if contact_row:
            contact_id = str(contact_row["id"])
            if payload.contact_name and (not contact_row["name"] or contact_row["name"] != clean_name):
                await conn.execute("UPDATE contacts SET name = $1 WHERE id = $2::uuid AND tenant_id = $3::uuid", clean_name, contact_id, tenant_id)
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

        # Double Booking Conflict Check & Insert in a single transaction
        booking_id = str(uuid.uuid4())
        staff = (payload.doctor_name or payload.staff_member or "").strip() or None
        slot_booking_mode = s_data.get("slot_booking_mode", "single") if isinstance(s_data, dict) else "single"
        max_concurrent = int(s_data.get("max_concurrent_bookings", 1)) if isinstance(s_data, dict) else 1

        send_wa = payload.send_whatsapp_confirmation is not False
        initial_reminder_sent = datetime.now(timezone.utc) if not send_wa else None
        initial_review_sent = datetime.now(timezone.utc) if not send_wa else None
        initial_metadata = json.dumps({"send_whatsapp_confirmation": False, "internal_only": True}) if not send_wa else "{}"

        async with conn.transaction():
            # Transactional advisory lock: serializes concurrent booking requests for the same tenant/staff on this day,
            # eliminating phantom reads where two simultaneous requests see an empty slot and both insert.
            slot_lock_key = f"{tenant_id}:{staff or 'general'}:{st_dt.date().isoformat()}"
            await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", slot_lock_key)

            if slot_booking_mode != "multiple":
                conflict = await conn.fetchrow(
                    """SELECT id, service, start_time, end_time FROM bookings
                       WHERE tenant_id = $1::uuid AND status = 'confirmed'
                          AND (COALESCE(staff_member, 'general')) = (COALESCE($4, 'general'))
                          AND start_time < $3 AND end_time > $2
                       FOR UPDATE""",
                    tenant_id, st_dt, et_dt, staff
                )
                if conflict:
                    c_start = conflict["start_time"]
                    if hasattr(c_start, "astimezone"):
                        c_start = c_start.astimezone(tenant_tz)
                    c_time = c_start.strftime("%I:%M %p")
                    raise HTTPException(409, f"Timeslot conflict: An appointment for '{conflict['service']}' is already scheduled at {c_time}. Change booking mode to 'Multiple' in Calendar Settings to allow concurrent bookings.")
            elif max_concurrent > 1:
                existing_count = await conn.fetchval(
                    """SELECT COUNT(*) FROM bookings
                       WHERE tenant_id = $1::uuid AND status = 'confirmed'
                          AND (COALESCE(staff_member, 'general')) = (COALESCE($4, 'general'))
                          AND start_time < $3 AND end_time > $2""",
                    tenant_id, st_dt, et_dt, staff
                ) or 0
                if existing_count >= max_concurrent:
                    raise HTTPException(409, f"Timeslot capacity reached: This slot has reached the maximum of {max_concurrent} concurrent bookings.")

            # 2. Insert or update booking (deduplicating if contact already booked this slot)
            window_start = st_dt - timedelta(hours=1)
            window_end = st_dt + timedelta(hours=1)
            existing_booking = await conn.fetchrow(
                """SELECT id FROM bookings
                   WHERE tenant_id = $1::uuid AND contact_id = $2::uuid
                     AND status IN ('confirmed', 'pending')
                     AND start_time >= $3
                     AND start_time <= $4""",
                tenant_id, contact_id, window_start, window_end
            )
            if existing_booking:
                booking_id = str(existing_booking["id"])
                await conn.execute(
                    """UPDATE bookings
                       SET service = $1, start_time = $2, end_time = $3, notes = $4, price = $5,
                           staff_member = $6, updated_at = NOW()
                       WHERE id = $7::uuid AND tenant_id = $8::uuid""",
                    payload.service.strip(), st_dt, et_dt, payload.notes or "", float(payload.price or 0.0), staff, booking_id, tenant_id
                )
            else:
                await conn.execute(
                    """INSERT INTO bookings (id, tenant_id, contact_id, conversation_id, service, start_time, end_time, status, notes, price, currency, staff_member, reminder_sent_at, review_sent_at, metadata)
                       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, 'confirmed', $8, $9, 'INR', $10, $11, $12, $13::jsonb)""",
                    booking_id, tenant_id, contact_id, conv_id, payload.service.strip(), st_dt, et_dt, payload.notes or "", float(payload.price or 0.0), staff, initial_reminder_sent, initial_review_sent, initial_metadata
                )

        # 2b. Auto-link/upsert customer in CRM by phone so booking history is visible on customer profile
        try:
            existing_cust = await conn.fetchrow(
                "SELECT id FROM customers WHERE tenant_id = $1::uuid AND phone = $2",
                tenant_id, clean_phone
            )
            if not existing_cust:
                new_cust_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO customers (id, tenant_id, phone, name, status, lead_probability, converted, health_concern, preferred_doctor, followup_date, followup_time, created_at, updated_at)
                       VALUES ($1::uuid, $2::uuid, $3, $4, 'converted', 'hot', true, $5, $6, CURRENT_DATE + 7, '10:00 AM', now(), now())
                       ON CONFLICT (tenant_id, phone) DO UPDATE SET status = 'converted', converted = true, lead_probability = 'hot', preferred_doctor = COALESCE(customers.preferred_doctor, EXCLUDED.preferred_doctor), updated_at = now()""",
                    new_cust_id, tenant_id, clean_phone, clean_name, payload.service.strip() or "General Consultation", staff
                )
            else:
                # Update status to converted, name if empty, and link preferred_doctor if assigned
                await conn.execute(
                    """UPDATE customers 
                       SET name = COALESCE(NULLIF(name, ''), $1), 
                           status = 'converted', 
                           converted = true, 
                           lead_probability = 'hot', 
                           preferred_doctor = COALESCE(preferred_doctor, $2),
                           updated_at = now() 
                       WHERE id = $3::uuid AND tenant_id = $4::uuid""",
                    clean_name, staff, str(existing_cust["id"]), tenant_id
                )
        except Exception as e_cust_link:
            logger.warning("booking_customer_auto_link_warn", error=str(e_cust_link))

        # 3. Fetch Tenant & WhatsApp credentials & templates
        tenant_row = await conn.fetchrow("SELECT name, slug, settings FROM tenants WHERE id = $1::uuid", tenant_id)
        tenant_settings = {}
        tenant_name = "our team"
        if tenant_row:
            tenant_name = tenant_row["name"] or "our team"
            if tenant_row["settings"]:
                if isinstance(tenant_row["settings"], str):
                    try: tenant_settings = json.loads(tenant_row["settings"])
                    except: tenant_settings = {}
                elif isinstance(tenant_row["settings"], dict):
                    tenant_settings = tenant_row["settings"]

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

        # Timezone formatting
        tz_name = (tenant_settings.get("timezone") or "Asia/Kolkata").strip()
        import zoneinfo
        try:
            local_tz = zoneinfo.ZoneInfo(tz_name or "Asia/Kolkata")
        except Exception:
            local_tz = zoneinfo.ZoneInfo("Asia/Kolkata")

        if hasattr(st_dt, "astimezone"):
            st_local = st_dt.astimezone(local_tz)
        else:
            st_local = st_dt.replace(tzinfo=timezone.utc).astimezone(local_tz)

        date_str = st_local.strftime("%d %b %Y")
        clock_str = st_local.strftime("%I:%M %p")
        time_str = st_local.strftime("%d %b %Y at %I:%M %p")

        # 4. Push Approved WhatsApp Confirmation Template to customer (if enabled)
        template_sent = False
        if send_wa:
            tpl_name = (
                tenant_settings.get("template_booking_confirmation") or
                creds.get("template_booking_confirmation") or
                "booking_confirmationn"
            )
            
            # Mind Body Recovery alone: strictly protect patient privacy (no doctor, concern, or service)
            is_mbr = (
                str(tenant_id) == "b97ca3e5-7d43-44cf-8021-6e3659def878"
                or (tenant_row and (tenant_row.get("slug") or "").lower() in ("mindbodyrecovery", "mind-body-recovery"))
            )
            if is_mbr:
                if tpl_name in ("mbr_appointment_confirmed", "appointment_confirmation_simple"):
                    tpl_params = [clean_name or "Valued Customer", date_str, clock_str]
                else:
                    tpl_params = [clean_name or "Valued Customer", "Appointment", date_str, clock_str]
                confirmation_msg = f"Hello {clean_name},\n\nYour appointment has been confirmed.\nDate: {date_str}\nTime: {clock_str}\n\nIf you need to make any changes, just reply to this chat. We look forward to seeing you."
            else:
                tpl_params = [clean_name or "Valued Customer", payload.service.strip(), date_str, clock_str]
                confirmation_msg = f"Hello {clean_name},\n\nYour appointment is confirmed.\nService: {payload.service.strip()}\nDate: {date_str}\nTime: {clock_str}\n\nIf you need to make any changes, just reply to this chat. We look forward to seeing you."

            if creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                headers = {"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"}
                url = f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages"
                
                clean_wa_phone = "".join(filter(str.isdigit, clean_phone))
                if len(clean_wa_phone) == 10:
                    clean_wa_phone = f"91{clean_wa_phone}"

                # 1. Try approved Meta template first
                payload_tpl = {
                    "messaging_product": "whatsapp",
                    "to": clean_wa_phone,
                    "type": "template",
                    "template": {
                        "name": tpl_name,
                        "language": {"code": "en"},
                        "components": [
                            {
                                "type": "body",
                                "parameters": [{"type": "text", "text": str(p) if str(p).strip() else "—"} for p in tpl_params]
                            }
                        ]
                    }
                }
                template_wamid = None
                try:
                    import httpx
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        res = await client.post(url, headers=headers, json=payload_tpl)
                        logger.info("manual_booking_template_response", status=res.status_code, template=tpl_name, body=res.text)
                        if res.status_code in (200, 201):
                            template_sent = True
                            template_wamid = res.json().get("messages", [{}])[0].get("id")
                            logger.info("manual_booking_wa_template_dispatched", template=tpl_name, phone=clean_wa_phone, wa_id=template_wamid)
                        elif "132000" in res.text or "132001" in res.text or "does not exist in" in res.text:
                            # Try language retry en_US
                            payload_tpl["template"]["language"] = {"code": "en_US"}
                            res_retry = await client.post(url, headers=headers, json=payload_tpl)
                            if res_retry.status_code in (200, 201):
                                template_sent = True
                                template_wamid = res_retry.json().get("messages", [{}])[0].get("id")
                                logger.info("manual_booking_wa_template_retry_succeeded", template=tpl_name, phone=clean_wa_phone, wa_id=template_wamid)
                except Exception as e:
                    logger.error("manual_booking_wa_template_error", error=str(e))

                # 2. Text fallback is strictly suppressed for message templates
                if not template_sent:
                    logger.info("manual_booking_wa_text_fallback_suppressed", template=tpl_name, phone=clean_wa_phone)

            # Record confirmation message in DB if template was sent
            if template_sent:
                msg_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, template_name, template_params, status, ai_used_fallback)
                       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'outbound', 'template', $5, $6, $7::jsonb, 'sent', false)""",
                    msg_id, conv_id, tenant_id, template_wamid, confirmation_msg, tpl_name, json.dumps(tpl_params or [])
                )
                await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", conv_id, tenant_id)

            # 4b. Send Business Address & Google Maps Location (if configured)
            full_location = (creds.get("full_location_text") or tenant_settings.get("full_location_text") or "").strip()

            if full_location and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                loc_msg = f"*Location & Directions:*\n{full_location}"
                location_wamid = None
                try:
                    import httpx
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        loc_res = await client.post(
                            f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages",
                            headers={"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"},
                            json={"messaging_product": "whatsapp", "recipient_type": "individual", "to": clean_phone, "type": "text", "text": {"body": loc_msg}}
                        )
                        if loc_res.status_code in (200, 201):
                            location_wamid = loc_res.json().get("messages", [{}])[0].get("id")
                    loc_id = str(uuid.uuid4())
                    await conn.execute(
                        """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, status, ai_used_fallback)
                           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'outbound', 'text', $5, 'sent', false)""",
                        loc_id, conv_id, tenant_id, location_wamid, loc_msg
                    )
                    await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", conv_id, tenant_id)
                except Exception as e:
                    logger.error("manual_booking_location_send_error", error=str(e))

            # 5. Push Admin WhatsApp notification (if configured)
            admin_phone = creds.get("admin_whatsapp_number") or tenant_settings.get("admin_whatsapp_number")
            if admin_phone and creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                clean_admin_phone = admin_phone.replace("+", "").replace(" ", "").replace("-", "").strip()
                admin_tpl_name = (
                    tenant_settings.get("template_admin_notification") or
                    creds.get("template_admin_notification") or
                    "admin_notification"
                )
                admin_tpl_params = [clean_name or "Client", clean_phone, payload.service.strip(), date_str, clock_str]
                admin_notify_msg = f"New appointment booked.\n\nCustomer: {clean_name}\nPhone: {clean_phone}\nService: {payload.service.strip()}\nDate: {date_str}\nTime: {clock_str}"

                try:
                    import httpx
                    headers = {"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"}
                    url = f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages"
                    admin_payload_tpl = {
                        "messaging_product": "whatsapp",
                        "to": clean_admin_phone,
                        "type": "template",
                        "template": {
                            "name": admin_tpl_name,
                            "language": {"code": "en"},
                            "components": [
                                {
                                    "type": "body",
                                    "parameters": [{"type": "text", "text": str(p) if str(p).strip() else "—"} for p in admin_tpl_params]
                                }
                            ]
                        }
                    }
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        admin_res = await client.post(url, headers=headers, json=admin_payload_tpl)
                        if admin_res.status_code not in (200, 201):
                            logger.warning("admin_booking_wa_template_failed_text_suppressed", status=admin_res.status_code, text=admin_res.text)
                except Exception as e:
                    logger.error("admin_booking_wa_notify_error", error=str(e))
        else:
            logger.info("manual_booking_whatsapp_notifications_skipped_by_user", booking_id=booking_id, phone=clean_phone)

        # 6. Trigger Google Calendar Sync (if configured)
        contact_meta = contact_row.get("metadata") if contact_row else {}
        if isinstance(contact_meta, str):
            try: contact_meta = json.loads(contact_meta)
            except: contact_meta = {}
        cust_email = contact_meta.get("email") if isinstance(contact_meta, dict) else None

        await create_google_calendar_event(
            conn=conn,
            tenant_id=tenant_id,
            booking_id=booking_id,
            service_name=payload.service.strip(),
            clean_name=clean_name,
            clean_phone=clean_phone,
            notes=payload.notes or "",
            st_dt=st_dt,
            et_dt=et_dt,
            customer_email=cust_email,
            source="CRM",
            date_str=date_str,
            clock_str=clock_str,
            full_location=full_location if send_wa else ""
        )

        # Schedule automatic 2h reminder and 30m admin reminder (only if WhatsApp notifications enabled)
        # Note: 24h reminder is omitted because Meta template 'appointment_ramainder' explicitly states 'coming up today'
        if send_wa:
            try:
                now_dt = datetime.now(tenant_tz)
                remind_2h = st_dt - timedelta(hours=2)
                if remind_2h > now_dt:
                    await conn.execute(
                        """INSERT INTO scheduled_jobs (id, tenant_id, job_type, booking_id, scheduled_at, status, created_at)
                           VALUES (gen_random_uuid(), $1::uuid, 'reminder', $2::uuid, $3, 'pending', now())""",
                        tenant_id, booking_id, remind_2h
                    )
                remind_admin_30m = st_dt - timedelta(minutes=30)
                if remind_admin_30m > now_dt:
                    await conn.execute(
                        """INSERT INTO scheduled_jobs (id, tenant_id, job_type, booking_id, scheduled_at, status, created_at)
                           VALUES (gen_random_uuid(), $1::uuid, 'admin_reminder', $2::uuid, $3, 'pending', now())""",
                        tenant_id, booking_id, remind_admin_30m
                    )
                logger.info("scheduled_reminder_jobs_queued", booking_id=booking_id)
            except Exception as e_job:
                logger.warning("scheduled_jobs_queue_failed", error=str(e_job))
        else:
            logger.info("scheduled_reminder_jobs_skipped_internal_booking", booking_id=booking_id)

    return {
        "status": "created",
        "id": booking_id,
        "service": payload.service.strip(),
        "start_time": st_dt.isoformat(),
        "end_time": et_dt.isoformat(),
        "price": float(payload.price or 0.0),
        "contact_name": clean_name,
        "contact_phone": clean_phone,
        "whatsapp_confirmed": template_sent if send_wa else False
    }


@router.patch("/bookings/{booking_id}/price")
@router.patch("/api/v1/crm/bookings/{booking_id}/price")
async def update_booking_price(
    booking_id: str,
    payload: BookingPricePayload,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Update price / fee for an existing booking."""
    if caller.get("role") not in ("admin", "super_admin", "owner"):
        raise HTTPException(403, "Access denied: Only administrators or owners can modify booking prices.")

    async with database.db_pool.acquire() as conn:
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


@router.patch("/bookings/{booking_id}/status")
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
    async with database.db_pool.acquire() as conn:
        # Fetch booking with contact, tenant & conversation details
        booking = await conn.fetchrow(
            """SELECT b.id, b.service, b.status, b.start_time, b.conversation_id, b.google_event_id,
                      c.id as contact_id, c.name, c.phone,
                      t.name as tenant_name, t.settings as tenant_settings
               FROM bookings b
                JOIN contacts c ON c.id = b.contact_id AND c.tenant_id = b.tenant_id
                JOIN tenants t ON t.id = b.tenant_id
                WHERE b.id = $1::uuid AND b.tenant_id = $2::uuid""",
            booking_id, tenant_id
        )
        if not booking:
            raise HTTPException(404, "Booking not found")

        # Update booking status (and optionally reschedule datetime)
        if payload.start_time:
            try:
                new_st = datetime.fromisoformat(payload.start_time.replace("Z", "+00:00"))
                if new_st.tzinfo is None:
                    new_st = new_st.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                new_et = datetime.fromisoformat(payload.end_time.replace("Z", "+00:00")) if payload.end_time else (new_st + timedelta(minutes=30))
                if new_et.tzinfo is None:
                    new_et = new_et.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                await conn.execute(
                    "UPDATE bookings SET status = $1, start_time = $2, end_time = $3, updated_at = now() WHERE id = $4::uuid AND tenant_id = $5::uuid",
                    payload.status, new_st, new_et, booking_id, tenant_id
                )
                booking = dict(booking)
                booking["start_time"] = new_st
                booking["end_time"] = new_et
            except Exception as ex:
                logger.warning("booking_reschedule_datetime_parse_warn", error=str(ex))
                await conn.execute(
                    "UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
                    payload.status, booking_id, tenant_id
                )
        else:
            await conn.execute(
                "UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
                payload.status, booking_id, tenant_id
            )

        # Update customer last_visited_at if booking is completed or attended
        if payload.status in ("completed", "attended"):
            try:
                b_phone = booking.get("phone")
                b_st = booking.get("start_time")
                if b_phone and b_st:
                    await conn.execute("""
                        UPDATE customers 
                        SET last_visited_at = GREATEST(COALESCE(last_visited_at, $1), $1), updated_at = now()
                        WHERE tenant_id = $2::uuid 
                          AND (phone = $3 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($3, '[^0-9]', '', 'g'), 10))
                    """, b_st, tenant_id, b_phone)
            except Exception as ex:
                logger.warning("booking_update_customer_last_visited_warn", error=str(ex))

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
            local_tz = timezone(timedelta(hours=5, minutes=30))

        time_str = ""
        date_str = ""
        clock_str = ""
        if booking["start_time"]:
            st = booking["start_time"]
            if hasattr(st, "astimezone"):
                st_local = st.astimezone(local_tz)
            else:
                st_local = st.replace(tzinfo=timezone.utc).astimezone(local_tz)
            time_str = st_local.strftime("%A, %d %b %Y at %I:%M %p")
            date_str = st_local.strftime("%d-%m-%Y")
            clock_str = st_local.strftime("%I:%M %p")
        
        # 1. Handle Cancellation
        if payload.status == "cancelled":
            await conn.execute(
                "UPDATE scheduled_jobs SET status = 'cancelled' WHERE booking_id = $1::uuid AND tenant_id = $2::uuid AND status = 'pending'",
                booking_id, tenant_id
            )
            if booking.get("google_event_id"):
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
                            g_service = await asyncio.to_thread(build, "calendar", "v3", credentials=g_creds)
                            cal_id = g_data.get("calendar_id") or "primary"
                            del_cal_req = g_service.events().delete(calendarId=cal_id, eventId=booking["google_event_id"], sendUpdates="all")
                            await asyncio.to_thread(lambda: del_cal_req.execute())
                            logger.info("google_calendar_event_deleted_on_cancellation", event_id=booking["google_event_id"])

                            # Direct Gmail API Cancellation Email to Admin & Customer
                            admin_notif_email = g_data.get("notification_email") or t_settings_dict.get("notification_email")
                            customer_email = ""
                            c_meta = await conn.fetchval("SELECT metadata FROM contacts WHERE id = $1::uuid AND tenant_id = $2::uuid", booking["contact_id"], tenant_id)
                            if c_meta:
                                if isinstance(c_meta, str):
                                    try: c_meta = json.loads(c_meta)
                                    except: c_meta = {}
                                customer_email = c_meta.get("email") or ""

                            # Send tailored copy to Admin
                            if admin_notif_email and "@" in admin_notif_email:
                                admin_email_html = build_cancellation_admin_email_html(
                                    service_name=service_name,
                                    formatted_date=date_str or "Scheduled Date",
                                    formatted_time=clock_str or "Scheduled Time",
                                    name=patient_name,
                                    contact_phone=booking["phone"],
                                    customer_email=customer_email,
                                )
                                admin_subject = f"[Admin Notice] Booking Cancelled: {service_name} - {patient_name} ({date_str} at {clock_str})"
                                await send_gmail_direct_notification(g_creds, admin_notif_email, admin_subject, admin_email_html)

                            customer_email = sanitize_and_fix_email(customer_email)

                            # Send tailored copy to Customer
                            if customer_email and "@" in customer_email:
                                customer_email_html = build_cancellation_customer_email_html(
                                    service_name=service_name,
                                    formatted_date=date_str or "Scheduled Date",
                                    formatted_time=clock_str or "Scheduled Time",
                                    name=patient_name,
                                )
                                customer_subject = f"Appointment Cancelled: {service_name} on {date_str}"
                                await send_gmail_direct_notification(g_creds, customer_email, customer_subject, customer_email_html)
                                logger.info("crm_cancellation_email_sent_to_customer", to=customer_email)
                except Exception as e:
                    logger.warning("google_calendar_cancellation_sync_failed", error=str(e))

        # 2. Handle Reschedule
        if payload.status == "rescheduled":
            # Re-time pending reminder to 2 hours before new start time
            if booking.get("start_time"):
                try:
                    new_reminder_time = booking["start_time"] - timedelta(hours=2)
                    await conn.execute(
                        """UPDATE scheduled_jobs
                           SET scheduled_at = $1, status = 'pending'
                           WHERE booking_id = $2::uuid AND tenant_id = $3::uuid AND job_type = 'reminder'""",
                        new_reminder_time, booking_id, tenant_id
                    )
                    new_admin_reminder_time = booking["start_time"] - timedelta(minutes=30)
                    await conn.execute(
                        """UPDATE scheduled_jobs
                           SET scheduled_at = $1, status = 'pending'
                           WHERE booking_id = $2::uuid AND tenant_id = $3::uuid AND job_type = 'admin_reminder'""",
                        new_admin_reminder_time, booking_id, tenant_id
                    )
                    # Reset reminder_sent_at so the fallback _process_appointment_reminders
                    # can also fire at the new appointment time if the scheduled_jobs path misses.
                    await conn.execute(
                        "UPDATE bookings SET reminder_sent_at = NULL WHERE id = $1::uuid AND tenant_id = $2::uuid",
                        booking_id, tenant_id
                    )
                except Exception as e_rem:
                    logger.warning("reminder_job_reschedule_failed", error=str(e_rem))

            # Sync with Google Calendar & Send Direct Reschedule Emails
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
                    if g_data.get("refresh_token") and g_data.get("client_id") and booking.get("start_time"):
                        from google.oauth2.credentials import Credentials
                        from googleapiclient.discovery import build
                        g_creds = Credentials(
                            token=g_data.get("access_token"),
                            refresh_token=g_data.get("refresh_token"),
                            token_uri="https://oauth2.googleapis.com/token",
                            client_id=g_data.get("client_id"),
                            client_secret=g_data.get("client_secret"),
                        )
                        g_service = await asyncio.to_thread(build, "calendar", "v3", credentials=g_creds)
                        cal_id = g_data.get("calendar_id") or "primary"
                        st_iso = booking["start_time"].isoformat()
                        et_val = booking.get("end_time") or (booking["start_time"] + timedelta(minutes=30))
                        et_iso = et_val.isoformat()
                        event_body = {
                            "summary": f"{service_name} - {patient_name} ({booking['phone']})",
                            "description": (
                                f"WhatsApp Booking (Rescheduled via CRM)\n\n"
                                f"• Client Name: {patient_name}\n"
                                f"• Client Phone: {booking['phone']}\n"
                                f"• Service: {service_name}\n"
                                f"• Scheduled Time: {time_str}\n"
                            ),
                            "start": {"dateTime": st_iso},
                            "end": {"dateTime": et_iso},
                        }
                        if booking.get("google_event_id"):
                            try:
                                patch_req = g_service.events().patch(calendarId=cal_id, eventId=booking["google_event_id"], body=event_body, sendUpdates="all")
                                await asyncio.to_thread(lambda: patch_req.execute())
                                logger.info("google_calendar_reschedule_patched", event_id=booking["google_event_id"])
                            except Exception as patch_err:
                                logger.warning("google_calendar_patch_failed_inserting", error=str(patch_err))
                                ins_req = g_service.events().insert(calendarId=cal_id, body=event_body, sendUpdates="all")
                                event = await asyncio.to_thread(lambda: ins_req.execute())
                                if event and event.get("id"):
                                    await conn.execute("UPDATE bookings SET google_event_id = $1 WHERE id = $2::uuid AND tenant_id = $3::uuid", event["id"], booking_id, tenant_id)
                        else:
                            ins_req = g_service.events().insert(calendarId=cal_id, body=event_body, sendUpdates="all")
                            event = await asyncio.to_thread(lambda: ins_req.execute())
                            if event and event.get("id"):
                                await conn.execute("UPDATE bookings SET google_event_id = $1 WHERE id = $2::uuid AND tenant_id = $3::uuid", event["id"], booking_id, tenant_id)

                        # Fetch customer & admin emails for direct Gmail notifications
                        admin_notif_email = g_data.get("notification_email") or t_settings_dict.get("notification_email")
                        customer_email = ""
                        c_meta = await conn.fetchval("SELECT metadata FROM contacts WHERE id = $1::uuid AND tenant_id = $2::uuid", booking["contact_id"], tenant_id)
                        if c_meta:
                            if isinstance(c_meta, str):
                                try: c_meta = json.loads(c_meta)
                                except: c_meta = {}
                            customer_email = c_meta.get("email") or ""
                        if not customer_email:
                            customer_email = await conn.fetchval(
                                "SELECT metadata->>'email' FROM contacts WHERE tenant_id = $1::uuid AND (phone = $2 OR phone = replace($2, '+', '')) LIMIT 1",
                                tenant_id, booking["phone"]
                            ) or ""

                        # Send tailored copy to Admin
                        if admin_notif_email and "@" in admin_notif_email:
                            admin_email_html = build_reschedule_admin_email_html(
                                service_name=service_name,
                                formatted_date=date_str or "Rescheduled Date",
                                formatted_time=clock_str or "Rescheduled Time",
                                name=patient_name,
                                contact_phone=booking["phone"],
                                customer_email=customer_email,
                            )
                            admin_subject = f"[Admin Notice] Booking Rescheduled: {service_name} - {patient_name} to {date_str} at {clock_str}"
                            await send_gmail_direct_notification(g_creds, admin_notif_email, admin_subject, admin_email_html)
                            logger.info("crm_reschedule_email_sent_to_admin", to=admin_notif_email)

                        # Send tailored copy to Customer
                        full_loc = (t_settings_dict.get("full_location_text") or "").strip()
                        if not full_loc:
                            full_loc = (wa_data.get("full_location_text") if "wa_data" in locals() else "").strip()
                        if not full_loc:
                            wa_loc_row = await conn.fetchrow("SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp'", tenant_id)
                            if wa_loc_row and wa_loc_row["credential_data"]:
                                try:
                                    w_loc_data = json.loads(wa_loc_row["credential_data"]) if isinstance(wa_loc_row["credential_data"], str) else dict(wa_loc_row["credential_data"])
                                    full_loc = (w_loc_data.get("full_location_text") or "").strip()
                                except:
                                    pass

                        customer_email = sanitize_and_fix_email(customer_email)

                        if customer_email and "@" in customer_email:
                            customer_email_html = build_reschedule_customer_email_html(
                                service_name=service_name,
                                formatted_date=date_str or "Rescheduled Date",
                                formatted_time=clock_str or "Rescheduled Time",
                                name=patient_name,
                                full_location=full_loc,
                            )
                            customer_subject = f"Reschedule Confirmed: Your {service_name} is now on {date_str} at {clock_str}"
                            await send_gmail_direct_notification(g_creds, customer_email, customer_subject, customer_email_html)
                            logger.info("crm_reschedule_email_sent_to_customer", to=customer_email)
            except Exception as e_gcal:
                logger.warning("crm_reschedule_gcal_email_failed", error=str(e_gcal))

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

        google_review_link = (t_settings_dict.get("google_review_link") or t_settings_dict.get("gmb_review_url") or wa_data.get("google_review_link") or "").strip()
        if not google_review_link:
            google_review_link = f"https://search.google.com/local/writereview?placeid={tenant_name.replace(' ', '+')}"

        # Build smart CRM review URL with customer details pre-filled
        from urllib.parse import quote as _url_quote
        _tenant_slug = t_settings_dict.get("slug", "")
        _customer_phone_raw = (booking.get("phone") or "").strip()
        _custom_domain = (t_settings_dict.get("custom_domain") or "").strip()
        if not _custom_domain and t_settings_dict.get("partner_name"):
            p_row = await conn.fetchrow(
                "SELECT custom_domain FROM partner_agency_templates WHERE LOWER(partner_name) = $1 LIMIT 1",
                t_settings_dict["partner_name"].strip().lower()
            )
            if p_row and p_row["custom_domain"]:
                _custom_domain = p_row["custom_domain"].strip()

        _crm_origin = f"https://{_custom_domain}" if _custom_domain else "https://crm.goboldlabs.com"
        if _tenant_slug:
            _encoded_name = _url_quote(patient_name or "", safe="")
            _encoded_phone = _url_quote(_customer_phone_raw or "", safe="")
            smart_review_url = f"{_crm_origin}/{_tenant_slug}/review?name={_encoded_name}&phone={_encoded_phone}"
        else:
            smart_review_url = google_review_link

        if payload.status in ["completed", "attended"]:
            auto_review_enabled = t_settings_dict.get("enable_auto_review", True) if t_settings_dict.get("enable_auto_review") is not None else True
            # Check if caller explicitly opted out (send_review=False) or if tenant settings disabled auto-reviews
            if payload.send_review is False or (payload.send_review is None and not auto_review_enabled):
                dispatch_template = None
                automated_text = None
                logger.info("review_request_suppressed_by_caller_or_settings", tenant_id=tenant_id, booking_id=booking_id, send_review=payload.send_review, auto_review_enabled=auto_review_enabled)
                await conn.execute(
                    "UPDATE scheduled_jobs SET status = 'cancelled' WHERE booking_id = $1::uuid AND tenant_id = $2::uuid AND job_type = 'review_request' AND status = 'pending'",
                    booking_id, tenant_id
                )
            else:
                t_review_tpl = (
                    t_settings_dict.get("template_review_request") or
                    t_settings_dict.get("template_post_service_review") or
                    wa_data.get("template_review_request") or
                    wa_data.get("template_post_service_review")
                )
                # 1. If explicitly empty, none, or disabled: DO NOT SEND REVIEW REQUEST AT ALL
                if not t_review_tpl or str(t_review_tpl).strip().lower() in ("", "none", "disabled", "off", "false"):
                    dispatch_template = None
                    automated_text = None
                    logger.info("review_request_disabled_or_empty_skipping", tenant_id=tenant_id, booking_id=booking_id)
                    # Cancel any pending review_request scheduled jobs for this booking
                    await conn.execute(
                        "UPDATE scheduled_jobs SET status = 'cancelled' WHERE booking_id = $1::uuid AND tenant_id = $2::uuid AND job_type = 'review_request' AND status = 'pending'",
                        booking_id, tenant_id
                    )
                # 2. If review has ALREADY been sent for this booking (review_sent_at is not null), DO NOT SEND AGAIN
                elif booking.get("review_sent_at") is not None:
                    dispatch_template = None
                    automated_text = None
                    logger.info("review_request_already_sent_skipping_duplicate", tenant_id=tenant_id, booking_id=booking_id)
                else:
                    delay_seconds = 10
                    review_link_block = f"\n\nTap the link below to share your experience:\n{smart_review_url}"
                    automated_text = (
                        f"Hi {patient_name}, thank you for attending your {service_name} session with {tenant_name} today.\n\n"
                        f"We hope you had a wonderful experience! Could you please take 30 seconds to share your review with us?{review_link_block}\n\n"
                        f"Your feedback helps us maintain the highest standard of service. Thank you for choosing {tenant_name}."
                    )
                    dispatch_template = str(t_review_tpl).strip()
                    dispatch_params = [patient_name or "Valued Customer", service_name or "Appointment", smart_review_url]
                    # Update review_sent_at timestamp immediately to avoid race conditions
                    await conn.execute("UPDATE bookings SET review_sent_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", booking_id, tenant_id)

                    # Cancel any pending scheduled_jobs for review_request for this booking since we are sending it now
                    await conn.execute(
                        "UPDATE scheduled_jobs SET status = 'cancelled' WHERE booking_id = $1::uuid AND tenant_id = $2::uuid AND job_type = 'review_request' AND status = 'pending'",
                        booking_id, tenant_id
                    )

                    # Direct Review Email to Customer
                    try:
                        c_email = customer_email
                        if not c_email and booking.get("contact_id"):
                            c_email = await conn.fetchval("SELECT metadata->>'email' FROM contacts WHERE id = $1::uuid AND tenant_id = $2::uuid", booking["contact_id"], tenant_id)
                        c_email = sanitize_and_fix_email(c_email)
                        if c_email and "@" in c_email:
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
                                    g_creds = Credentials(
                                        token=g_data.get("access_token"),
                                        refresh_token=g_data.get("refresh_token"),
                                        token_uri="https://oauth2.googleapis.com/token",
                                        client_id=g_data.get("client_id"),
                                        client_secret=g_data.get("client_secret"),
                                    )
                                    review_email_html = build_review_customer_email_html(
                                        service_name=service_name,
                                        formatted_date=date_str or "Today",
                                        formatted_time=clock_str or "Scheduled Time",
                                        name=patient_name,
                                        full_location=""
                                    )
                                    review_subject = f"Thank You: Your {service_name} Appointment with {tenant_name}"
                                    await send_gmail_direct_notification(g_creds, c_email, review_subject, review_email_html)
                                    logger.info("crm_review_email_sent_to_customer", to=c_email)
                    except Exception as re_err:
                        logger.warning("crm_review_email_dispatch_failed", error=str(re_err))


        elif payload.status in ["no_show", "no-show"]:
            delay_seconds = 0
            automated_text = (
                f"Hi {patient_name}, we missed you for your {service_name} appointment today. No worries, life happens! "
                f"Whenever you're ready, simply reply to this message and we'll get you rescheduled right away.\n\n"
                f"Looking forward to seeing you soon!"
            )
            dispatch_template = (
                t_settings_dict.get("template_reschedule_nudge") or
                wa_data.get("template_reschedule_nudge") or
                "reschedule_nudge"
            )
            dispatch_params = [patient_name or "Valued Customer", service_name or "Appointment"]

        elif payload.status == "confirmed":
            delay_seconds = 0
            timing_line = f" on *{time_str}*" if time_str else ""
            dispatch_template = (
                t_settings_dict.get("template_booking_confirmation") or
                wa_data.get("template_booking_confirmation") or
                "booking_confirmationn"
            )
            is_mbr = (
                str(tenant_id) == "b97ca3e5-7d43-44cf-8021-6e3659def878"
                or ("mind body recovery" in (tenant_name or "").lower())
            )
            if is_mbr:
                automated_text = (
                    f"Hi {patient_name}, your appointment{timing_line} has been confirmed.\n\n"
                    f"Location: {tenant_name}\n\n"
                    f"We look forward to seeing you. Reply to this chat if you have any questions or need directions."
                )
                if dispatch_template in ("mbr_appointment_confirmed", "appointment_confirmation_simple"):
                    dispatch_params = [patient_name or "Valued Customer", date_str or "Today", clock_str or "Scheduled Time"]
                else:
                    dispatch_params = [patient_name or "Valued Customer", "Appointment", date_str or "Today", clock_str or "Scheduled Time"]
            else:
                automated_text = (
                    f"Hi {patient_name}, your booking for *{service_name}*{timing_line} is officially confirmed.\n\n"
                    f"Location: {tenant_name}\n\n"
                    f"We look forward to seeing you. Reply to this chat if you have any questions or need directions."
                )
                dispatch_params = [patient_name or "Valued Customer", service_name or "Appointment", date_str or "Today", clock_str or "Scheduled Time"]

        elif payload.status == "cancelled":
            delay_seconds = 0
            timing_line = f" on {time_str}" if time_str else ""
            automated_text = (
                f"Hi {patient_name}, your {service_name} booking{timing_line} has been cancelled as requested.\n\n"
                f"If you'd like to book a new appointment in the future, just message us here anytime!\n\n"
                f"Best regards,\n{tenant_name}"
            )
            dispatch_template = (
                t_settings_dict.get("template_cancellation_confirmation") or
                wa_data.get("template_cancellation_confirmation") or
                "cancellation_confirmation"
            )
            dispatch_params = [patient_name or "Valued Customer", service_name or "Appointment", date_str or "Today", clock_str or "Scheduled Time"]

        elif payload.status == "rescheduled":
            delay_seconds = 0
            timing_line = f" to {time_str}" if time_str else ""
            automated_text = (
                f"Hi {patient_name}, your {service_name} booking has been successfully rescheduled{timing_line}.\n\n"
                f"If you need to make any further changes, please reply to this chat anytime.\n\n"
                f"Best regards,\n{tenant_name}"
            )
            dispatch_template = (
                t_settings_dict.get("template_reschedule_confirmation") or
                wa_data.get("template_reschedule_confirmation") or
                "booking_reschedule_confirmation"
            )
            dispatch_params = [patient_name or "Valued Customer", service_name or "Appointment", date_str or "Today", clock_str or "Scheduled Time"]

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

            allow_text = payload.status not in ["completed", "attended"]
            background_tasks.add_task(
                dispatch_automated_status_whatsapp,
                tenant_id,
                str(conv_id),
                booking["phone"],
                automated_text,
                delay_seconds,
                dispatch_template,
                dispatch_params,
                allow_text,
            )

        # Dispatch Admin WhatsApp notification if rescheduled or cancelled
        admin_phone = (wa_data.get("admin_whatsapp_number") or t_settings_dict.get("admin_whatsapp_number") or "").strip()
        if admin_phone:
            if payload.status == "rescheduled":
                background_tasks.add_task(
                    dispatch_admin_reschedule_whatsapp,
                    tenant_id,
                    admin_phone,
                    patient_name,
                    booking["phone"],
                    service_name,
                    date_str,
                    clock_str,
                )
            elif payload.status == "cancelled":
                background_tasks.add_task(
                    dispatch_admin_cancellation_whatsapp,
                    tenant_id,
                    admin_phone,
                    patient_name,
                    booking["phone"],
                    service_name,
                    date_str,
                    clock_str,
                )

    return {
        "status": "updated",
        "id": booking_id,
        "new_status": payload.status,
        "automated_message_scheduled": bool(automated_text),
        "delay_seconds": delay_seconds,
        "template_configured": dispatch_template,
    }


@router.delete("/bookings/{booking_id}")
@router.delete("/api/v1/crm/bookings/{booking_id}")
async def delete_booking(
    booking_id: str,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """
    Permanently delete a booking.
    Strict rule: Only cancelled bookings can be deleted.
    """
    if caller.get("role") not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to delete a booking.")
    async with database.db_pool.acquire() as conn:
        booking = await conn.fetchrow(
            "SELECT id, status FROM bookings WHERE id = $1::uuid AND tenant_id = $2::uuid",
            booking_id, tenant_id
        )
        if not booking:
            raise HTTPException(404, "Booking not found")

        if booking["status"] != "cancelled":
            raise HTTPException(
                status_code=400,
                detail="Only cancelled bookings can be deleted. Please cancel the booking first."
            )

        async with conn.transaction():
            # Clean up scheduled jobs associated with this booking
            await conn.execute("DELETE FROM scheduled_jobs WHERE booking_id = $1::uuid AND tenant_id = $2::uuid", booking_id, tenant_id)
            # Remove any rescheduled_from pointers pointing to this booking
            await conn.execute("UPDATE bookings SET rescheduled_from = NULL WHERE rescheduled_from = $1::uuid AND tenant_id = $2::uuid", booking_id, tenant_id)
            # Delete the booking record
            await conn.execute("DELETE FROM bookings WHERE id = $1::uuid AND tenant_id = $2::uuid", booking_id, tenant_id)

    return {"status": "deleted", "id": booking_id}


