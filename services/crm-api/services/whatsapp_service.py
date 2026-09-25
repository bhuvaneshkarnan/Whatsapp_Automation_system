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
import asyncio
import re
import structlog
from typing import Optional
import httpx
import database
from utils import expand_template_body

logger = structlog.get_logger('crm-api-whatsapp')


async def get_active_pool():
    """Find active db_pool across crm_api.database or database modules, or auto-initialize."""
    import sys
    for mod_name in ("crm_api.database", "database"):
        m = sys.modules.get(mod_name)
        if m and getattr(m, "db_pool", None):
            return m.db_pool
    try:
        import database as db_mod
        if getattr(db_mod, "db_pool", None):
            return db_mod.db_pool
    except Exception:
        pass
    try:
        import crm_api.database as crm_db
        if getattr(crm_db, "db_pool", None):
            return crm_db.db_pool
    except Exception:
        pass
    try:
        import database
        if not getattr(database, "db_pool", None):
            await database.init_db_pool()
        return database.db_pool
    except Exception as e:
        logger.error("failed_to_initialize_fallback_pool", error=str(e))
        return None


async def dispatch_whatsapp_message(
    tenant_id: str,
    to_phone: str,
    text: Optional[str] = None,
    template_name: Optional[str] = None,
    template_params: Optional[list] = None
) -> Optional[dict]:
    """Helper to dispatch WhatsApp text message or approved Meta template to any destination phone."""
    clean_phone = "".join(filter(str.isdigit, to_phone))
    if not clean_phone:
        return None
    if len(clean_phone) == 10:
        clean_phone = f"91{clean_phone}"
    try:
        pool = await get_active_pool()
        if not pool:
            logger.error("dispatch_whatsapp_message_no_pool", tenant_id=tenant_id)
            return None

        async with pool.acquire() as conn:
            cred_row = await conn.fetchrow(
                """SELECT credential_data FROM tenant_credentials
                   WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true""",
                tenant_id
            )
        if not cred_row or not cred_row["credential_data"]:
            return None
        d = cred_row["credential_data"]
        if isinstance(d, str):
            try: d = json.loads(d)
            except: d = {}
        creds = dict(d)
        phone_id = creds.get("phone_number_id")
        access_token = creds.get("access_token")
        if not phone_id or not access_token or str(access_token).startswith("EAAB_test"):
            return None

        import httpx
        url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

        payload = None
        if template_name:
            payload = {
                "messaging_product": "whatsapp",
                "to": clean_phone,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {"code": "en"},
                    "components": [
                        {
                            "type": "body",
                            "parameters": [{"type": "text", "text": str(p)} for p in (template_params or [])]
                        }
                    ]
                }
            }
        elif text:
            payload = {
                "messaging_product": "whatsapp",
                "to": clean_phone,
                "type": "text",
                "text": {"body": text}
            }
        if not payload:
            return None

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 201):
                logger.info("dispatch_whatsapp_message_success", tenant_id=tenant_id, phone=clean_phone)
                return resp.json()

            # Retry with en_US if en returns template not found
            if template_name and ("132000" in resp.text or "132001" in resp.text or "does not exist in" in resp.text):
                payload["template"]["language"] = {"code": "en_US"}
                resp_retry = await client.post(url, headers=headers, json=payload)
                if resp_retry.status_code in (200, 201):
                    logger.info("dispatch_whatsapp_message_retry_lang_success", tenant_id=tenant_id, phone=clean_phone)
                    return resp_retry.json()

            logger.warning("dispatch_whatsapp_message_status_error", status_code=resp.status_code, body=resp.text, phone=clean_phone)

            # Proactive Alert: notify Super Admin of dispatch failure with tenant name
            try:
                from services.alert_service import send_super_admin_alert
                err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                err_obj = err_data.get("error", {})
                err_msg = err_obj.get("message") or f"Meta returned HTTP {resp.status_code}: {resp.text}"
                err_code = err_obj.get("code")
                err_details = err_obj.get("error_data", {}).get("details")
                if err_details:
                    err_msg = f"{err_msg} ({err_details})"
                asyncio.create_task(send_super_admin_alert(
                    title="WhatsApp Outbound Dispatch Failed",
                    error_message=err_msg,
                    tenant_id=tenant_id,
                    source="WhatsApp Outbound Dispatch",
                    severity="ERROR",
                    metadata={
                        "phone": clean_phone,
                        "status_code": resp.status_code,
                        "error_code": err_code,
                        "template_name": template_name
                    }
                ))
            except Exception as _al_err:
                logger.debug("alert_dispatch_trigger_failed", error=str(_al_err))

            return None
    except Exception as e:
        logger.warning("dispatch_whatsapp_message_failed", error=str(e), phone=clean_phone)
        try:
            from services.alert_service import send_super_admin_alert
            asyncio.create_task(send_super_admin_alert(
                title="WhatsApp Dispatch Exception",
                error_message=str(e),
                tenant_id=tenant_id,
                source="WhatsApp Outbound Dispatch",
                severity="ERROR",
                metadata={"phone": clean_phone}
            ))
        except Exception:
            pass
        return None

# ── Gmail Direct Dispatch & Email Builders ─────────────────────────────────────


async def dispatch_automated_status_whatsapp(
    tenant_id: str,
    conv_id: str,
    phone: str,
    text: str,
    delay_seconds: int = 0,
    template_name: Optional[str] = None,
    template_params: Optional[list] = None,
    allow_text_fallback: bool = False,
):
    try:
        # Strict global policy: never use fallback text when a message template is designated
        if template_name:
            allow_text_fallback = False

        if delay_seconds > 0:
            logger.info("delayed_automated_wa_scheduled", tenant_id=tenant_id, delay=delay_seconds, phone=phone, template=template_name)
            await asyncio.sleep(delay_seconds)

        pool = await get_active_pool()
        if not pool:
            logger.error("dispatch_automated_status_whatsapp_no_pool", tenant_id=tenant_id)
            return

        async with pool.acquire() as conn:
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

            if creds.get("allow_text_fallback") is False or creds.get("disable_template_text_fallback") is True:
                allow_text_fallback = False

            clean_phone = re.sub(r'[^0-9]', '', str(phone))
            if len(clean_phone) == 10:
                clean_phone = f"91{clean_phone}"

            # Dispatch via Meta Graph API
            template_sent = False
            dispatched_wamid = None
            if creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test"):
                import httpx
                headers = {"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"}
                url = f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages"

                # 1. Try Meta Approved Template first
                if template_name and template_params:
                    components = [
                        {
                            "type": "body",
                            "parameters": [{"type": "text", "text": str(p) if str(p).strip() else "—"} for p in template_params]
                        }
                    ]
                    payload = {
                        "messaging_product": "whatsapp",
                        "recipient_type": "individual",
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
                            logger.info("meta_template_api_response", status=res.status_code, template=template_name, text=res.text)
                            if res.status_code in (200, 201):
                                template_sent = True
                                dispatched_wamid = res.json().get("messages", [{}])[0].get("id")
                                logger.info("automated_status_template_dispatched", template=template_name, phone=clean_phone, wa_id=dispatched_wamid)
                            elif "132000" in res.text or "132001" in res.text or "does not exist in" in res.text:
                                # Try with en_US if en fails
                                payload["template"]["language"] = {"code": "en_US"}
                                res_retry_lang = await client.post(url, headers=headers, json=payload)
                                logger.info("meta_template_retry_lang_response", status=res_retry_lang.status_code, text=res_retry_lang.text)
                                if res_retry_lang.status_code in (200, 201):
                                    template_sent = True
                                    dispatched_wamid = res_retry_lang.json().get("messages", [{}])[0].get("id")
                                    logger.info("automated_status_template_retry_lang_succeeded", template=template_name, phone=clean_phone, wa_id=dispatched_wamid)
                                else:
                                    # Adapt parameter count dynamically if mismatch
                                    m_count = re.search(r'expected number of params \((\d+)\)', res.text) or re.search(r'expected number of params \((\d+)\)', res_retry_lang.text)
                                    if m_count:
                                        exp_c = int(m_count.group(1))
                                        payload["template"]["language"] = {"code": "en"}
                                        payload["template"]["components"][0]["parameters"] = components[0]["parameters"][:exp_c]
                                        res_retry = await client.post(url, headers=headers, json=payload)
                                        if res_retry.status_code in (200, 201):
                                            template_sent = True
                                            dispatched_wamid = res_retry.json().get("messages", [{}])[0].get("id")
                                            logger.info("automated_status_template_param_retry_succeeded", template=template_name, phone=clean_phone, wa_id=dispatched_wamid)
                    except Exception as e:
                        logger.warning("template_dispatch_failed", error=str(e), template=template_name)

                # 2. Strict policy: Do NOT fallback to text when a template is used
                if not template_sent:
                    if not template_name and allow_text_fallback and text:
                        try:
                            async with httpx.AsyncClient(timeout=10.0) as client:
                                res_txt = await client.post(
                                    url,
                                    headers=headers,
                                    json={"messaging_product": "whatsapp", "recipient_type": "individual", "to": clean_phone, "type": "text", "text": {"body": text}}
                                )
                                logger.info("fallback_text_dispatch_response", status=res_txt.status_code, text=res_txt.text)
                                if res_txt.status_code in (200, 201):
                                    dispatched_wamid = res_txt.json().get("messages", [{}])[0].get("id")
                        except Exception as e:
                            logger.error("automated_wa_text_dispatch_failed", error=str(e), phone=clean_phone)
                    else:
                        logger.info("automated_wa_text_fallback_suppressed", template=template_name, phone=clean_phone)

                # Proactive Alert: notify Super Admin if neither template nor text delivered
                if not template_sent and not dispatched_wamid:
                    try:
                        from services.alert_service import send_super_admin_alert
                        asyncio.create_task(send_super_admin_alert(
                            title="Automated Status WhatsApp Failed",
                            error_message=f"Template '{template_name or 'N/A'}' failed to dispatch to {clean_phone}.",
                            tenant_id=tenant_id,
                            source="Automated Status Dispatch",
                            severity="WARNING",
                            metadata={"phone": clean_phone, "template_name": template_name}
                        ))
                    except Exception:
                        pass

            # Record message in database
            try:
                if not conv_id:
                    c_row = await conn.fetchrow(
                        "SELECT id FROM contacts WHERE tenant_id = $1::uuid AND phone = $2",
                        tenant_id, clean_phone
                    )
                    if not c_row:
                        c_id = str(uuid.uuid4())
                        await conn.execute(
                            "INSERT INTO contacts (id, tenant_id, phone, name) VALUES ($1::uuid, $2::uuid, $3, 'Customer')",
                            c_id, tenant_id, clean_phone
                        )
                    else:
                        c_id = str(c_row["id"])

                    conv_row = await conn.fetchrow(
                        "SELECT id FROM conversations WHERE contact_id = $1::uuid AND tenant_id = $2::uuid",
                        c_id, tenant_id
                    )
                    if not conv_row:
                        conv_id = str(uuid.uuid4())
                        await conn.execute(
                            "INSERT INTO conversations (id, tenant_id, contact_id, status, last_message_at) VALUES ($1::uuid, $2::uuid, $3::uuid, 'bot', now())",
                            conv_id, tenant_id, c_id
                        )
                    else:
                        conv_id = str(conv_row["id"])

                msg_id = str(uuid.uuid4())
                if template_sent and template_name:
                    logged_body = expand_template_body(template_name, template_params, f"[Template: {template_name}]")
                    await conn.execute(
                        """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, template_name, template_params, status, ai_used_fallback)
                           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'outbound', 'template', $5, $6, $7::jsonb, 'sent', false)""",
                        msg_id, conv_id, tenant_id, dispatched_wamid, logged_body, template_name, json.dumps(template_params or [])
                    )
                    await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", conv_id, tenant_id)
                elif not template_name and allow_text_fallback and text:
                    await conn.execute(
                        """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, status, ai_used_fallback)
                           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'outbound', 'text', $5, 'sent', false)""",
                        msg_id, conv_id, tenant_id, dispatched_wamid, text
                    )
                    await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", conv_id, tenant_id)
            except Exception as db_rec_err:
                logger.warning("automated_msg_record_warn", error=str(db_rec_err))
            logger.info("automated_status_message_dispatched", tenant_id=tenant_id, phone=clean_phone, delay=delay_seconds, template_sent=template_sent)
    except Exception as e:
        logger.error("automated_task_exception", error=str(e))


async def dispatch_admin_reschedule_whatsapp(
    tenant_id: str,
    admin_phone: str,
    customer_name: str,
    customer_phone: str,
    service_name: str,
    formatted_date: str,
    formatted_time: str,
):
    """
    Push admin reschedule notification via WhatsApp template (with fallback to approved admin_notification, then text).
    """
    try:
        pool = await get_active_pool()
        if not pool:
            logger.error("dispatch_admin_reschedule_whatsapp_no_pool", tenant_id=tenant_id)
            return

        async with pool.acquire() as conn:
            wa_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
                tenant_id
            )
            t_st_val = await conn.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)

        creds = {}
        if wa_row and wa_row["credential_data"]:
            d = wa_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            creds = dict(d)

        t_st = {}
        if t_st_val:
            if isinstance(t_st_val, str):
                try: t_st = json.loads(t_st_val)
                except: t_st = {}
            else:
                t_st = dict(t_st_val)

        if not (creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test")):
            return

        clean_admin_phone = re.sub(r'[^0-9+]', '', admin_phone)
        if not clean_admin_phone.startswith("+"):
            clean_admin_phone = f"+91{clean_admin_phone}" if len(clean_admin_phone) == 10 else f"+{clean_admin_phone}"

        tpl_name = (
            creds.get("template_admin_reschedule_notice") or
            t_st.get("template_admin_reschedule_notice") or
            "admin_reschedule_notice"
        )
        tpl_params = [customer_name or "Client", customer_phone, service_name or "Appointment", formatted_date or "Rescheduled Date", formatted_time or "Rescheduled Time"]

        import httpx
        headers = {"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"}
        url = f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages"

        # 1. Try admin reschedule template
        admin_payload_tpl = {
            "messaging_product": "whatsapp",
            "to": clean_admin_phone.replace("+", ""),
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
        admin_sent = False
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, headers=headers, json=admin_payload_tpl)
            logger.info("crm_admin_reschedule_template_response", status=res.status_code, template=tpl_name, body=res.text)
            if res.status_code in (200, 201):
                admin_sent = True
            elif "132000" in res.text or "132001" in res.text or "does not exist in" in res.text:
                # 2. Try fallback to admin_notification (APPROVED in Meta with identical 5 params)
                fallback_template = creds.get("template_admin_notification") or t_st.get("template_admin_notification") or "admin_notification"
                admin_payload_tpl["template"]["name"] = fallback_template
                res_fb = await client.post(url, headers=headers, json=admin_payload_tpl)
                logger.info("crm_admin_reschedule_fallback_template_response", status=res_fb.status_code, template=fallback_template, body=res_fb.text)
                if res_fb.status_code in (200, 201):
                    admin_sent = True

            # 3. Fallback to direct WhatsApp text
            if not admin_sent:
                logger.warning("crm_admin_reschedule_template_failed_text_fallback_suppressed", to=clean_admin_phone)
    except Exception as e:
        logger.error("crm_admin_reschedule_wa_failed", error=str(e))


async def dispatch_admin_cancellation_whatsapp(
    tenant_id: str,
    admin_phone: str,
    customer_name: str,
    customer_phone: str,
    service_name: str,
    formatted_date: str,
    formatted_time: str,
):
    """
    Push admin cancellation notification via approved Meta template admin_cancellation_notice (with fallback to text).
    """
    try:
        pool = await get_active_pool()
        if not pool:
            logger.error("dispatch_admin_cancellation_whatsapp_no_pool", tenant_id=tenant_id)
            return

        async with pool.acquire() as conn:
            wa_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
                tenant_id
            )
            t_st_val = await conn.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)

        creds = {}
        if wa_row and wa_row["credential_data"]:
            d = wa_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            creds = dict(d)

        t_st = {}
        if t_st_val:
            if isinstance(t_st_val, str):
                try: t_st = json.loads(t_st_val)
                except: t_st = {}
            else:
                t_st = dict(t_st_val)

        if not (creds.get("phone_number_id") and creds.get("access_token") and not str(creds.get("access_token", "")).startswith("EAAB_test")):
            return

        clean_admin_phone = re.sub(r'[^0-9+]', '', admin_phone)
        if not clean_admin_phone.startswith("+"):
            clean_admin_phone = f"+91{clean_admin_phone}" if len(clean_admin_phone) == 10 else f"+{clean_admin_phone}"

        tpl_name = (
            creds.get("template_admin_cancellation_notice") or
            t_st.get("template_admin_cancellation_notice") or
            "admin_cancellation_notice"
        )
        tpl_params = [customer_name or "Client", customer_phone, service_name or "Appointment", formatted_date or "Scheduled Date", formatted_time or "Scheduled Time"]

        import httpx
        headers = {"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"}
        url = f"https://graph.facebook.com/v19.0/{creds['phone_number_id']}/messages"

        admin_payload_tpl = {
            "messaging_product": "whatsapp",
            "to": clean_admin_phone.replace("+", ""),
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
        admin_sent = False
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, headers=headers, json=admin_payload_tpl)
            logger.info("crm_admin_cancellation_template_response", status=res.status_code, template=tpl_name, body=res.text)
            if res.status_code in (200, 201):
                admin_sent = True
            elif "132000" in res.text or "132001" in res.text or "does not exist in" in res.text:
                fallback_template = creds.get("template_admin_notification") or t_st.get("template_admin_notification") or "admin_notification"
                admin_payload_tpl["template"]["name"] = fallback_template
                res_fb = await client.post(url, headers=headers, json=admin_payload_tpl)
                logger.info("crm_admin_cancellation_fallback_template_response", status=res_fb.status_code, template=fallback_template, body=res_fb.text)
                if res_fb.status_code in (200, 201):
                    admin_sent = True

            if not admin_sent:
                logger.warning("crm_admin_cancellation_template_failed_text_fallback_suppressed", to=clean_admin_phone)
    except Exception as e:
        logger.error("crm_admin_cancellation_wa_failed", error=str(e))


