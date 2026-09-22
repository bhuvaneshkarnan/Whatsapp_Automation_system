import os
import re
import json
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Union
import structlog
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Request, File, UploadFile, Form, Response
from fastapi.responses import FileResponse
import database
from models import DirectWhatsAppPayload, MessageCreate, ConvStatusUpdate, AssignConversationRequest, ToggleAllPayload
from dependencies import get_tenant_id, get_caller_context
from services.whatsapp_service import dispatch_whatsapp_message
import utils
from utils import expand_template_body

router = APIRouter()
logger = structlog.get_logger('crm-api-conversations')

@router.get("/conversations")
@router.get("/api/v1/crm/conversations")
async def list_conversations(
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context),
    status: Optional[str] = None,
    limit: int = Query(200, le=1000),
    offset: int = 0
):
    async with database.db_pool.acquire() as conn:
        # Auto-ensure all contacts have a conversation record
        try:
            await conn.execute("""
                INSERT INTO conversations (id, tenant_id, contact_id, status, last_message_at, created_at, updated_at)
                SELECT gen_random_uuid(), c.tenant_id, c.id, 'bot', c.created_at, c.created_at, now()
                FROM contacts c
                WHERE c.tenant_id = $1::uuid
                  AND NOT EXISTS (
                      SELECT 1 FROM conversations cv WHERE cv.contact_id = c.id AND cv.tenant_id = c.tenant_id
                  )
            """, tenant_id)
        except Exception as e:
            logger.warning("conversation_sync_from_contacts_failed", error=str(e))

        query = """
            SELECT c.id, c.status, c.last_message_at, c.unread_count, c.assigned_to,
                   ct.name, ct.phone,
                   u.display_name as assigned_staff_name, u.email as assigned_staff_email,
                   lm.last_message,
                   lib.last_inbound_at,
                   COALESCE(bk.completed_bookings_count, 0) AS completed_bookings_count,
                   bk.last_visit_date,
                   bk.last_visit_service,
                   bk.last_visit_doctor,
                   cust_info.preferred_doctor,
                   cust_info.health_concern
            FROM conversations c
            JOIN contacts ct ON ct.id = c.contact_id AND ct.tenant_id = c.tenant_id
            LEFT JOIN users u ON u.id = c.assigned_to AND u.tenant_id = c.tenant_id
            LEFT JOIN LATERAL (
                SELECT 
                    COALESCE(
                        NULLIF(TRIM(m.body), ''),
                        CASE 
                            WHEN m.content_type = 'image' THEN '📷 [Photo]'
                            WHEN m.content_type = 'video' THEN '🎥 [Video]'
                            WHEN m.content_type = 'document' THEN '📄 [Document]'
                            WHEN m.content_type = 'audio' THEN '🎵 [Audio]'
                            WHEN m.content_type = 'sticker' THEN '🏷️ [Sticker]'
                            WHEN m.content_type = 'location' THEN '📍 [Location]'
                            WHEN m.template_name IS NOT NULL AND m.template_name != '' THEN '📋 [Template]'
                            ELSE '[Message]'
                        END
                    ) AS last_message
                FROM messages m 
                WHERE m.conversation_id = c.id AND m.tenant_id = c.tenant_id 
                ORDER BY m.created_at DESC 
                LIMIT 1
            ) lm ON true
            LEFT JOIN LATERAL (
                SELECT MAX(m.created_at) AS last_inbound_at
                FROM messages m 
                WHERE m.conversation_id = c.id AND m.tenant_id = c.tenant_id AND m.direction = 'inbound'
            ) lib ON true
            LEFT JOIN LATERAL (
                SELECT 
                    COUNT(*) AS completed_bookings_count,
                    MAX(b.start_time) AS last_visit_date,
                    (ARRAY_AGG(b.service ORDER BY b.start_time DESC))[1] AS last_visit_service,
                    (ARRAY_AGG(b.staff_member ORDER BY b.start_time DESC))[1] AS last_visit_doctor
                FROM bookings b 
                WHERE b.contact_id = c.contact_id AND b.tenant_id = c.tenant_id AND (b.status = 'completed' OR b.status = 'attended')
            ) bk ON true
            LEFT JOIN LATERAL (
                SELECT cust.preferred_doctor, cust.health_concern 
                FROM customers cust 
                WHERE cust.tenant_id = c.tenant_id AND (cust.phone = ct.phone OR RIGHT(REGEXP_REPLACE(cust.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10)) 
                LIMIT 1
            ) cust_info ON true
            WHERE c.tenant_id = $1::uuid
        """
        args = [tenant_id]
        next_idx = 2

        # Health concern isolation: non-admin staff only see conversations for their assigned concerns or directly assigned to them
        caller_concerns = caller.get("assigned_health_concerns", [])
        caller_user_id = caller.get("user_id")
        if caller_concerns and caller.get("role") not in ("admin", "super_admin", "owner"):
            if caller_user_id:
                query += f""" AND (EXISTS (
                    SELECT 1 FROM customers cu
                    WHERE cu.tenant_id = c.tenant_id
                      AND (cu.phone = ct.phone OR RIGHT(REGEXP_REPLACE(cu.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10))
                      AND cu.health_concern = ANY(${next_idx}::text[])
                ) OR c.assigned_to = ${next_idx + 1}::uuid)"""
                args.extend([caller_concerns, caller_user_id])
                next_idx += 2
            else:
                query += f""" AND EXISTS (
                    SELECT 1 FROM customers cu
                    WHERE cu.tenant_id = c.tenant_id
                      AND (cu.phone = ct.phone OR RIGHT(REGEXP_REPLACE(cu.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10))
                      AND cu.health_concern = ANY(${next_idx}::text[])
                )"""
                args.append(caller_concerns)
                next_idx += 1

        if status:
            query += f" AND c.status = ${next_idx}"
            args.append(status)
            next_idx += 1

        query += f" ORDER BY c.last_message_at DESC NULLS LAST LIMIT ${next_idx} OFFSET ${next_idx + 1}"
        args.extend([limit, offset])

        rows = await conn.fetch(query, *args)

    out = []
    for r in rows:
        completed_cnt = int(r["completed_bookings_count"] or 0)
        c_type = "repeat" if completed_cnt > 0 else "new_lead"
        out.append({
            "id": str(r["id"]),
            "status": r["status"] or "bot",
            "last_message_at": r["last_message_at"].isoformat() if r["last_message_at"] else None,
            "last_inbound_at": r["last_inbound_at"].isoformat() if r["last_inbound_at"] else None,
            "last_message": r["last_message"] or "",
            "unread_count": r["unread_count"] or 0,
            "name": r["name"] or "",
            "phone": r["phone"] or "",
            "contact_name": r["name"] or "",
            "contact_phone": r["phone"] or "",
            "assigned_to": str(r["assigned_to"]) if r["assigned_to"] else None,
            "assigned_staff_name": r["assigned_staff_name"] or r["assigned_staff_email"] or None,
            "assigned_staff_email": r["assigned_staff_email"] or None,
            "completed_bookings_count": completed_cnt,
            "client_type": c_type,
            "last_visit_date": r["last_visit_date"].isoformat() if r["last_visit_date"] else None,
            "last_visit_service": r["last_visit_service"] or None,
            "last_visit_doctor": r["last_visit_doctor"] or None,
            "preferred_doctor": r["preferred_doctor"] or r["last_visit_doctor"] or None,
            "health_concern": r["health_concern"] or None,
        })
    return out


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


@router.get("/conversations/{conv_id}/messages")
async def get_messages(
    conv_id: str,
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(50, le=100),
    offset: int = 0
):
    async with database.db_pool.acquire() as conn:
        # Unconditionally reset conversation unread_count
        await conn.execute(
            "UPDATE conversations SET unread_count = 0 WHERE id = $1::uuid AND tenant_id = $2::uuid",
            conv_id, tenant_id
        )

        # Unconditionally mark inbound messages as read in database
        await conn.execute(
            """UPDATE messages SET status = 'read'
               WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid
                 AND direction = 'inbound' AND status != 'read'""",
            conv_id, tenant_id
        )

        # Check for unread inbound messages with wa_message_id to dispatch Meta Cloud API read receipts
        unread_rows = await conn.fetch(
            """SELECT wa_message_id FROM messages
               WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid
                 AND direction = 'inbound' AND wa_message_id IS NOT NULL
                 AND status != 'read'""",
            conv_id, tenant_id
        )
        if unread_rows:
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
            """SELECT id, direction, content_type, body, media_url, template_name, template_params, status, wa_message_id, created_at
               FROM messages
               WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid
               ORDER BY created_at DESC LIMIT $3 OFFSET $4""",
            conv_id, tenant_id, limit, offset
        )
    out = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d["id"])
        if d.get("created_at") and hasattr(d["created_at"], "isoformat"):
            d["created_at"] = d["created_at"].isoformat()
        
        # Deserialise template_params if json string
        tp = d.get("template_params")
        if isinstance(tp, str):
            try:
                d["template_params"] = json.loads(tp)
            except Exception:
                d["template_params"] = []

        b = d.get("body")
        t_name = d.get("template_name")

        # If template body is raw [Template: ...], expand into human-readable text
        if t_name and (not b or str(b).startswith("[Template:") or str(b).startswith("📋 [Template:")):
            d["body"] = expand_template_body(t_name, d.get("template_params"), b)
        elif not b or not str(b).strip():
            ct = d.get("content_type")
            if ct == "image": d["body"] = "📷 [Photo]"
            elif ct == "video": d["body"] = "🎥 [Video]"
            elif ct == "document": d["body"] = "📄 [Document]"
            elif ct == "audio": d["body"] = "🎵 [Audio]"
            elif ct == "sticker": d["body"] = "🏷️ [Sticker]"
            elif ct == "location": d["body"] = "📍 [Location]"
            elif t_name: d["body"] = expand_template_body(t_name, d.get("template_params"), f"📋 [Template: {t_name}]")
            else: d["body"] = "[Message]"
        out.append(d)
    return out


@router.post("/conversations/{conv_id}/messages")
async def send_manual_message(
    conv_id: str,
    payload: MessageCreate,
    tenant_id: str = Depends(get_tenant_id)
):
    """Send manual message from CRM agent to contact via WhatsApp and persist in DB."""
    has_body = bool(payload.body and payload.body.strip())
    has_template = bool(payload.template_name and payload.template_name.strip())
    if not has_body and not has_template:
        raise HTTPException(400, "Message body or template name is required")

    async with database.db_pool.acquire() as conn:
        # Get conversation and contact details
        conv = await conn.fetchrow(
            """SELECT c.id, c.status, ct.name as contact_name, ct.phone, t.name as tenant_name, t.settings as tenant_settings
               FROM conversations c
               JOIN contacts ct ON ct.id = c.contact_id AND ct.tenant_id = c.tenant_id
               JOIN tenants t ON t.id = c.tenant_id
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

        ai_cfg_row = await conn.fetchrow("SELECT assistant_name FROM ai_config WHERE tenant_id = $1::uuid", tenant_id)
        assistant_name = (ai_cfg_row["assistant_name"] if ai_cfg_row and ai_cfg_row["assistant_name"] else "our team")

        # Insert outbound message
        msg_id = str(uuid.uuid4())
        wa_id = None
        status = "sent"
        send_error_detail = None

        # Attempt to send via Meta WhatsApp API if credentials present
        if creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
            try:
                import httpx
                clean_phone = conv["phone"].replace("+", "").replace(" ", "").replace("-", "").strip()
                if len(clean_phone) == 10:
                    clean_phone = f"91{clean_phone}"
                headers = {"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"}
                url = f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages"

                # 1. If explicit template requested
                if has_template:
                    tpl_name = payload.template_name.strip()
                    tpl_params = list(payload.template_params or [])

                    # Auto-fill missing variables for client_followup_checkin so it never fails with parameter count mismatch
                    if tpl_name == "client_followup_checkin":
                        default_p = [
                            conv["contact_name"] or "there",
                            assistant_name or "our team",
                            conv["tenant_name"] or "our clinic"
                        ]
                        tpl_params = [
                            (tpl_params[i] if i < len(tpl_params) and str(tpl_params[i]).strip() else default_p[i])
                            for i in range(3)
                        ]

                    tpl_components = []
                    if tpl_params:
                        tpl_components.append({
                            "type": "body",
                            "parameters": [{"type": "text", "text": str(p)} for p in tpl_params]
                        })
                    tpl_payload = {
                        "messaging_product": "whatsapp",
                        "to": clean_phone,
                        "type": "template",
                        "template": {
                            "name": tpl_name,
                            "language": {"code": "en"},
                            "components": tpl_components
                        }
                    }
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(url, headers=headers, json=tpl_payload)
                        if resp.status_code not in (200, 201):
                            tpl_payload["template"]["language"] = {"code": "en_US"}
                            resp = await client.post(url, headers=headers, json=tpl_payload)
                        if resp.status_code in (200, 201):
                            data = resp.json()
                            wa_id = data.get("messages", [{}])[0].get("id")
                        else:
                            status = "failed"
                            send_error_detail = resp.text
                            logger.error("manual_send_template_failed", status=resp.status_code, body=resp.text)
                else:
                    # 2. Standard text message with 24h automatic fallback to follow-up template
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(
                            url,
                            headers=headers,
                            json={"messaging_product": "whatsapp", "recipient_type": "individual", "to": clean_phone, "type": "text", "text": {"body": payload.body.strip()}}
                        )
                        if resp.status_code in (200, 201):
                            data = resp.json()
                            wa_id = data.get("messages", [{}])[0].get("id")
                        elif "131047" in resp.text:
                            # 24-hour customer window expired: Auto-send approved follow-up template!
                            t_settings = {}
                            if conv and conv.get("tenant_settings"):
                                s = conv["tenant_settings"]
                                if isinstance(s, str):
                                    try: s = json.loads(s)
                                    except: s = {}
                                t_settings = dict(s)
                            f_tpl = creds.get("template_client_followup") or t_settings.get("template_client_followup") or "client_followup_checkin"
                            c_name = conv["contact_name"] or "there"
                            b_name = conv["tenant_name"] or "our team"
                            f_params = [c_name, assistant_name, b_name]
                            f_payload = {
                                "messaging_product": "whatsapp",
                                "to": clean_phone,
                                "type": "template",
                                "template": {
                                    "name": f_tpl,
                                    "language": {"code": "en"},
                                    "components": [
                                        {
                                            "type": "body",
                                            "parameters": [{"type": "text", "text": str(p)} for p in f_params]
                                        }
                                    ]
                                }
                            }
                            resp_f = await client.post(url, headers=headers, json=f_payload)
                            if resp_f.status_code not in (200, 201):
                                f_payload["template"]["language"] = {"code": "en_US"}
                                resp_f = await client.post(url, headers=headers, json=f_payload)
                            if resp_f.status_code in (200, 201):
                                data = resp_f.json()
                                wa_id = data.get("messages", [{}])[0].get("id")
                                logger.info("sent_followup_template_due_to_24h_window", conv_id=conv_id, template=f_tpl)
                            else:
                                status = "failed"
                                send_error_detail = resp_f.text
                                logger.error("manual_send_followup_failed", status=resp_f.status_code, body=resp_f.text)
                        else:
                            status = "failed"
                            send_error_detail = resp.text
                            logger.error("manual_send_text_failed", status=resp.status_code, body=resp.text)
            except Exception as e:
                logger.error("manual_send_error", error=str(e))
                status = "failed"
                send_error_detail = str(e)

        # Insert message row
        if has_template:
            body_to_save = expand_template_body(payload.template_name, payload.template_params, payload.body.strip() if has_body else f"[Template: {payload.template_name}]")
        else:
            body_to_save = payload.body.strip() if has_body else "[Message]"
        content_type = "template" if has_template else "text"
        tpl_params_json = json.dumps(payload.template_params) if payload.template_params else None

        inserted = await conn.fetchrow(
            """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, status, template_name, template_params, ai_used_fallback)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'outbound', $5, $6, $7, $8, $9::jsonb, false)
               RETURNING id, direction, body, status, created_at""",
            msg_id, conv_id, tenant_id, wa_id, content_type, body_to_save, status, payload.template_name, tpl_params_json
        )

        # Update conversation last_message_at
        await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", conv_id, tenant_id)

    if status == "failed":
        raise HTTPException(
            status_code=502,
            detail={
                "status": "failed",
                "message": "Failed to dispatch WhatsApp message via Meta API",
                "id": str(inserted["id"]),
                "error": send_error_detail or "Meta API rejected message dispatch"
            }
        )

    return {
        "id": str(inserted["id"]),
        "direction": inserted["direction"],
        "body": inserted["body"],
        "status": inserted["status"],
        "created_at": inserted["created_at"].isoformat() if inserted["created_at"] else ""
    }


@router.post("/send-whatsapp")
@router.post("/api/v1/crm/send-whatsapp")
async def send_direct_whatsapp(
    payload: DirectWhatsAppPayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Send outbound WhatsApp message from the tenant's connected system number directly to a customer by phone."""
    has_body = bool(payload.body and payload.body.strip())
    has_template = bool(payload.template_name and payload.template_name.strip())
    if not has_body and not has_template:
        raise HTTPException(400, "Message body or template name is required")
    if not payload.phone or not payload.phone.strip():
        raise HTTPException(400, "Target phone number is required")

    async with database.db_pool.acquire() as conn:
        clean_p = payload.phone.strip()
        # Find or create contact
        contact = await conn.fetchrow(
            """SELECT id FROM contacts 
               WHERE tenant_id = $1::uuid AND (phone = $2 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($2, '[^0-9]', '', 'g'), 10))
               LIMIT 1""",
            tenant_id, clean_p
        )
        if not contact:
            cid = str(uuid.uuid4())
            cust_row = None
            if payload.customer_id:
                cust_row = await conn.fetchrow("SELECT name FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid", payload.customer_id, tenant_id)
            c_name = cust_row["name"] if cust_row and cust_row["name"] else "Client"
            await conn.execute(
                "INSERT INTO contacts (id, tenant_id, phone, name) VALUES ($1::uuid, $2::uuid, $3, $4)",
                cid, tenant_id, clean_p, c_name
            )
            contact_id = cid
        else:
            contact_id = contact["id"]

        # Find or create conversation
        conv = await conn.fetchrow(
            "SELECT id FROM conversations WHERE contact_id = $1::uuid AND tenant_id = $2::uuid LIMIT 1",
            contact_id, tenant_id
        )
        if not conv:
            cvid = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO conversations (id, tenant_id, contact_id, status, last_message_at) VALUES ($1::uuid, $2::uuid, $3::uuid, 'bot', now())",
                cvid, tenant_id, contact_id
            )
            conv_id = cvid
        else:
            conv_id = conv["id"]

        # Delegate to send_manual_message
        msg_payload = MessageCreate(
            body=payload.body,
            template_name=payload.template_name,
            template_params=payload.template_params
        )
        return await send_manual_message(conv_id, msg_payload, tenant_id)


@router.get("/media/{media_id}")
@router.get("/api/v1/crm/media/{media_id}")
async def get_media_proxy(
    media_id: str,
    tenant_id: Optional[str] = None
):
    """
    Proxy WhatsApp media files securely.
    1. Checks local cache /tmp/wa_media/{media_id}.*
    2. If not found, resolves tenant credentials and fetches media download URL from Meta Graph API.
    3. Downloads binary, writes to disk cache, and returns FileResponse/Response with proper Content-Type.
    """
    import os, mimetypes
    from fastapi.responses import Response, FileResponse

    cache_dir = "/tmp/wa_media"
    os.makedirs(cache_dir, exist_ok=True)

    # 1. Check if cached locally
    if os.path.exists(cache_dir):
        for fn in os.listdir(cache_dir):
            if fn == media_id or fn.startswith(f"{media_id}."):
                file_path = os.path.join(cache_dir, fn)
                mime, _ = mimetypes.guess_type(file_path)
                return FileResponse(
                    file_path,
                    media_type=mime or "application/octet-stream",
                    headers={"Cache-Control": "public, max-age=604800"}
                )

    # 2. Retrieve WhatsApp access token from tenant_credentials
    access_token = None
    async with database.db_pool.acquire() as conn:
        if tenant_id:
            cred_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
                tenant_id
            )
            if cred_row and cred_row["credential_data"]:
                d = json.loads(cred_row["credential_data"]) if isinstance(cred_row["credential_data"], str) else dict(cred_row["credential_data"])
                access_token = d.get("access_token")

        if not access_token:
            msg_row = await conn.fetchrow(
                "SELECT tenant_id FROM messages WHERE media_url LIKE $1 LIMIT 1",
                f"%{media_id}%"
            )
            if msg_row:
                cred_row = await conn.fetchrow(
                    "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
                    msg_row["tenant_id"]
                )
                if cred_row and cred_row["credential_data"]:
                    d = json.loads(cred_row["credential_data"]) if isinstance(cred_row["credential_data"], str) else dict(cred_row["credential_data"])
                    access_token = d.get("access_token")

        if not access_token:
            cred_rows = await conn.fetch(
                "SELECT credential_data FROM tenant_credentials WHERE provider = 'whatsapp' AND is_active = true"
            )
            for cr in cred_rows:
                d = json.loads(cr["credential_data"]) if isinstance(cr["credential_data"], str) else dict(cr["credential_data"])
                if d.get("access_token") and not str(d["access_token"]).startswith("EAAB_test"):
                    access_token = d["access_token"]
                    break

    if not access_token:
        raise HTTPException(404, "No active WhatsApp credentials found to fetch media.")

    # 3. Query Meta Graph API to get direct download URL
    async with httpx.AsyncClient(timeout=20.0) as client:
        meta_res = await client.get(
            f"https://graph.facebook.com/v19.0/{media_id}",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if meta_res.status_code != 200:
            logger.error("meta_media_query_failed", media_id=media_id, status=meta_res.status_code, body=meta_res.text)
            raise HTTPException(404, "Media not found or expired on Meta servers.")

        meta_data = meta_res.json()
        download_url = meta_data.get("url")
        mime_type = meta_data.get("mime_type", "application/octet-stream")

        if not download_url:
            raise HTTPException(404, "Download URL missing from Meta response.")

        # 4. Download binary payload
        media_res = await client.get(
            download_url,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if media_res.status_code != 200:
            logger.error("meta_media_download_failed", media_id=media_id, status=media_res.status_code)
            raise HTTPException(502, "Failed to download media binary from Meta.")

        content = media_res.content

        # 5. Cache on disk
        ext = mimetypes.guess_extension(mime_type) or ".bin"
        if ext == ".jpe": ext = ".jpg"
        cached_file_path = os.path.join(cache_dir, f"{media_id}{ext}")
        try:
            with open(cached_file_path, "wb") as f:
                f.write(content)
        except Exception as cache_err:
            logger.warning("media_cache_write_failed", error=str(cache_err))

        return Response(
            content=content,
            media_type=mime_type,
            headers={
                "Cache-Control": "public, max-age=604800",
                "Content-Disposition": f'inline; filename="{media_id}{ext}"'
            }
        )


@router.post("/conversations/{conv_id}/send-media")
@router.post("/api/v1/crm/conversations/{conv_id}/send-media")
async def send_conversation_media(
    conv_id: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Send outbound image, document, video, or audio attachment from CRM to WhatsApp contact.
    1. Uploads binary to Meta WhatsApp Media endpoint (POST /{phone_number_id}/media).
    2. Sends media message to recipient.
    3. Persists outbound message in messages table with wa_message_id, media_url, and status.
    4. Caches file locally in /tmp/wa_media.
    """
    import os, mimetypes

    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(400, "Uploaded file is empty.")

    filename = file.filename or "attachment"
    content_type_header = file.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"

    # Determine media category
    if content_type_header.startswith("image/"):
        media_category = "image"
    elif content_type_header.startswith("video/"):
        media_category = "video"
    elif content_type_header.startswith("audio/"):
        media_category = "audio"
    else:
        media_category = "document"

    async with database.db_pool.acquire() as conn:
        conv = await conn.fetchrow(
            """SELECT c.id, c.status, ct.name as contact_name, ct.phone, t.name as tenant_name
               FROM conversations c
               JOIN contacts ct ON ct.id = c.contact_id AND ct.tenant_id = c.tenant_id
               JOIN tenants t ON t.id = c.tenant_id
               WHERE c.id = $1::uuid AND c.tenant_id = $2::uuid""",
            conv_id, tenant_id
        )
        if not conv:
            raise HTTPException(404, "Conversation not found.")

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

        phone_id = creds.get("phone_number_id")
        access_token = creds.get("access_token")
        if not phone_id or not access_token or str(access_token).startswith("EAAB_test"):
            raise HTTPException(400, "WhatsApp credentials not configured or active.")

        clean_phone = conv["phone"].replace("+", "").replace(" ", "").replace("-", "").strip()
        if len(clean_phone) == 10:
            clean_phone = f"91{clean_phone}"

        # 1. Upload media binary to Meta WhatsApp Media endpoint
        upload_url = f"https://graph.facebook.com/v19.0/{phone_id}/media"
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            files_payload = {
                "file": (filename, file_bytes, content_type_header)
            }
            data_payload = {
                "messaging_product": "whatsapp",
                "type": content_type_header
            }
            up_resp = await client.post(upload_url, headers=headers, data=data_payload, files=files_payload)
            if up_resp.status_code not in (200, 201):
                logger.error("meta_media_upload_failed", status=up_resp.status_code, body=up_resp.text)
                raise HTTPException(502, f"Failed to upload media to WhatsApp: {up_resp.text}")

            meta_media_id = up_resp.json().get("id")
            if not meta_media_id:
                raise HTTPException(502, "Meta did not return a valid media ID.")

            # 2. Dispatch media message to customer
            messages_url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
            msg_payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": clean_phone,
                "type": media_category,
                media_category: {
                    "id": meta_media_id
                }
            }
            clean_caption = (caption or "").strip()
            if clean_caption:
                msg_payload[media_category]["caption"] = clean_caption
            if media_category == "document":
                msg_payload[media_category]["filename"] = filename

            send_resp = await client.post(messages_url, headers=headers, json=msg_payload)
            if send_resp.status_code not in (200, 201):
                logger.error("meta_media_message_send_failed", status=send_resp.status_code, body=send_resp.text)
                raise HTTPException(502, f"Failed to send media message on WhatsApp: {send_resp.text}")

            wamid = send_resp.json().get("messages", [{}])[0].get("id")

        # 3. Cache binary file locally
        cache_dir = "/tmp/wa_media"
        os.makedirs(cache_dir, exist_ok=True)
        ext = os.path.splitext(filename)[1] or (mimetypes.guess_extension(content_type_header) or ".bin")
        cached_path = os.path.join(cache_dir, f"{meta_media_id}{ext}")
        try:
            with open(cached_path, "wb") as f:
                f.write(file_bytes)
        except Exception as cache_err:
            logger.warning("media_cache_save_warn", error=str(cache_err))

        # 4. Persist outbound message in database
        msg_id = str(uuid.uuid4())
        media_url = f"/api/v1/crm/media/{meta_media_id}"
        body_to_save = clean_caption if clean_caption else filename

        inserted = await conn.fetchrow(
            """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, media_url, status)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'outbound', $5, $6, $7, 'sent')
               RETURNING id, direction, content_type, body, media_url, status, created_at""",
            msg_id, conv_id, tenant_id, wamid, media_category, body_to_save, media_url
        )

        await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", conv_id, tenant_id)

    return {
        "id": str(inserted["id"]),
        "direction": inserted["direction"],
        "content_type": inserted["content_type"],
        "body": inserted["body"],
        "media_url": inserted["media_url"],
        "status": inserted["status"],
        "created_at": inserted["created_at"].isoformat() if inserted["created_at"] else ""
    }





@router.delete("/conversations/{conv_id}")
async def delete_conversation(
    conv_id: str,
    delete_type: str = Query("for_everyone", pattern="^(for_me|for_everyone)$"),
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Delete a conversation and its messages. Unlinks any linked appointments."""
    if caller.get("role") not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to delete a conversation.")
    async with database.db_pool.acquire() as conn:
        async with conn.transaction():
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


@router.delete("/messages/{msg_id}")
async def delete_message(
    msg_id: str,
    delete_type: str = Query("for_everyone", pattern="^(for_me|for_everyone)$"),
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Delete an individual message.
    'for_everyone': replaces body with '🚫 This message was deleted' like official WhatsApp.
    'for_me': permanently wipes message from CRM database.
    """
    if caller.get("role") not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to delete a message.")
    async with database.db_pool.acquire() as conn:
        msg_row = await conn.fetchrow(
            "SELECT id, conversation_id, direction, wa_message_id FROM messages WHERE id = $1::uuid AND tenant_id = $2::uuid",
            msg_id, tenant_id
        )
        if not msg_row:
            raise HTTPException(404, "Message not found")

        if delete_type == "for_everyone":
            await conn.execute(
                "UPDATE messages SET body = 'This message was deleted', status = 'deleted' WHERE id = $1::uuid AND tenant_id = $2::uuid",
                msg_id, tenant_id
            )
            return {"status": "deleted", "id": msg_id, "delete_type": "for_everyone", "body": "This message was deleted"}
        else:
            await conn.execute(
                "DELETE FROM messages WHERE id = $1::uuid AND tenant_id = $2::uuid",
                msg_id, tenant_id
            )
            return {"status": "deleted", "id": msg_id, "delete_type": "for_me"}


@router.patch("/conversations/{conv_id}/status")
@router.patch("/api/v1/crm/conversations/{conv_id}/status")
async def update_conversation_status(
    conv_id: str,
    payload: ConvStatusUpdate,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Update conversation status between 'bot' (AI on) and 'human' (manual human takeover)."""
    raw_st = payload.status.lower().strip()
    new_status = "human" if raw_st in ["human", "human_takeover", "false", "off", "manual"] else "bot"
    
    async with database.db_pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE conversations SET status = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
            new_status, conv_id, tenant_id
        )
        if result == "UPDATE 0":
            raise HTTPException(404, "Conversation not found")
    return {"status": "updated", "conv_status": new_status, "ai_enabled": new_status == "bot"}


@router.patch("/conversations/{conv_id}/assign")
@router.patch("/api/v1/crm/conversations/{conv_id}/assign")
async def assign_conversation(
    conv_id: str,
    payload: AssignConversationRequest,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Assign or unassign a conversation to a staff member in this organization."""
    async with database.db_pool.acquire() as conn:
        assigned_to_uuid = None
        assigned_staff_name = None
        if payload.assigned_to and payload.assigned_to.strip():
            try:
                user_uuid = uuid.UUID(payload.assigned_to.strip())
            except (ValueError, AttributeError):
                raise HTTPException(400, "Invalid staff user ID")
            staff_row = await conn.fetchrow(
                "SELECT id, display_name, email FROM users WHERE id = $1::uuid AND tenant_id = $2::uuid",
                user_uuid, tenant_id
            )
            if not staff_row:
                raise HTTPException(404, "Staff member not found in this organization")
            assigned_to_uuid = str(user_uuid)
            assigned_staff_name = staff_row["display_name"] or staff_row["email"]

        res = await conn.execute(
            """UPDATE conversations
               SET assigned_to = $1::uuid, updated_at = now()
               WHERE id = $2::uuid AND tenant_id = $3::uuid""",
            assigned_to_uuid, conv_id, tenant_id
        )
        if res == "UPDATE 0":
            raise HTTPException(404, "Conversation not found")

        return {
            "status": "updated",
            "conversation_id": conv_id,
            "assigned_to": assigned_to_uuid,
            "assigned_staff_name": assigned_staff_name,
        }


@router.patch("/conversations/toggle-all")
@router.patch("/api/v1/crm/conversations/toggle-all")
async def toggle_all_conversations_ai(
    payload: ToggleAllPayload,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Turn AI auto-reply ON or OFF for all conversations belonging to this tenant."""
    if caller.get("role") not in ("admin", "super_admin", "owner"):
        raise HTTPException(403, "Access denied: Only administrators or owners can toggle organization-wide AI settings.")

    new_status = "bot" if payload.ai_enabled else "human"
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE conversations SET status = $1, updated_at = now() WHERE tenant_id = $2::uuid",
            new_status, tenant_id
        )
    return {"status": "updated", "ai_enabled": payload.ai_enabled, "new_status": new_status}


@router.get("/messages/search")
async def search_messages(
    q: str,
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(20, le=50)
):
    """Full-text search on messages using PostgreSQL tsvector (replaces Elasticsearch)."""
    async with database.db_pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT m.id, m.body, m.created_at, c.id as conversation_id, ct.name
               FROM messages m
               JOIN conversations c ON c.id = m.conversation_id AND c.tenant_id = m.tenant_id
               JOIN contacts ct ON ct.id = c.contact_id AND ct.tenant_id = m.tenant_id
               WHERE m.tenant_id = $1::uuid
                 AND to_tsvector('english', coalesce(m.body, '')) @@ plainto_tsquery('english', $2)
               ORDER BY m.created_at DESC LIMIT $3""",
            tenant_id, q, limit
        )
    return [dict(r) for r in rows]


# ── Client Dashboard Settings Endpoints ─────────────────────────────────────

