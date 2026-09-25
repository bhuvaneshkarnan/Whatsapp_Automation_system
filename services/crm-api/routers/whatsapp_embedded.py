import os
import json
import uuid
import structlog
import httpx
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any

import database
from dependencies import get_tenant_id, get_caller_context, verify_super_admin
from utils import invalidate_tenant_cache

router = APIRouter()
logger = structlog.get_logger("crm-api-whatsapp-embedded")

META_APP_ID = os.getenv("META_APP_ID", "966476346452663").strip()
META_APP_SECRET = os.getenv("META_APP_SECRET", "41f3800785777866e283d53195b7e5b6").strip()
META_CONFIG_ID = os.getenv("META_CONFIG_ID", "2164202260830085").strip()
META_GRAPH_API_VERSION = os.getenv("META_GRAPH_API_VERSION", "v19.0").strip()


class WhatsAppEmbeddedSignupPayload(BaseModel):
    code: str
    waba_id: Optional[str] = ""
    phone_number_id: Optional[str] = ""
    target_tenant_id: Optional[str] = None


@router.get("/oauth/whatsapp/config")
async def get_whatsapp_oauth_config():
    """Return public Meta App ID and config ID for Facebook SDK initialization."""
    return {
        "app_id": META_APP_ID,
        "config_id": META_CONFIG_ID,
        "version": META_GRAPH_API_VERSION,
        "is_configured": bool(META_APP_ID and META_APP_SECRET)
    }


async def execute_embedded_signup(conn, tenant_id: str, code: str, waba_id: Optional[str] = "", phone_number_id: Optional[str] = "") -> dict:
    """
    Exchanges Meta authorization code for an access token, subscribes webhook to WABA,
    registers the phone number on WhatsApp Cloud API, and saves credentials in PostgreSQL.
    """
    clean_code = (code or "").strip()
    clean_waba = (waba_id or "").strip()
    clean_phone_id = (phone_number_id or "").strip()

    if not clean_code:
        raise HTTPException(
            status_code=400,
            detail="Missing required authorization code from Meta Embedded Signup."
        )

    # 1. Exchange authorization code for system/access token
    token_url = f"https://graph.facebook.com/{META_GRAPH_API_VERSION}/oauth/access_token"
    token_params = {
        "client_id": META_APP_ID,
        "client_secret": META_APP_SECRET,
        "code": clean_code
    }

    async with httpx.AsyncClient() as client:
        try:
            token_resp = await client.get(token_url, params=token_params, timeout=15.0)
        except Exception as ex:
            logger.error("meta_token_exchange_network_error", error=str(ex))
            raise HTTPException(status_code=502, detail=f"Network error communicating with Meta Graph API: {str(ex)}")

    if token_resp.status_code != 200:
        logger.error("meta_token_exchange_failed", status=token_resp.status_code, response=token_resp.text)
        err_msg = "Meta code exchange failed."
        try:
            err_json = token_resp.json()
            err_msg = err_json.get("error", {}).get("message", err_msg)
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f"Failed to exchange authorization code with Meta: {err_msg}")

    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Meta response did not contain an access_token.")

    # 1b. If waba_id or phone_number_id is missing, auto-discover from Meta token
    if not clean_waba or not clean_phone_id:
        async with httpx.AsyncClient() as client:
            try:
                debug_url = f"https://graph.facebook.com/{META_GRAPH_API_VERSION}/debug_token"
                d_resp = await client.get(
                    debug_url,
                    params={"input_token": access_token, "access_token": f"{META_APP_ID}|{META_APP_SECRET}"},
                    timeout=10.0
                )
                if d_resp.status_code == 200:
                    scopes = d_resp.json().get("data", {}).get("granular_scopes", [])
                    for s in scopes:
                        if s.get("scope") in ("whatsapp_business_management", "whatsapp_business_messaging"):
                            target_ids = s.get("target_ids", [])
                            if target_ids and not clean_waba:
                                clean_waba = str(target_ids[0])
            except Exception as ex_waba:
                logger.warning("meta_autodiscover_waba_warn", error=str(ex_waba))

        if clean_waba and not clean_phone_id:
            async with httpx.AsyncClient() as client:
                try:
                    p_url = f"https://graph.facebook.com/{META_GRAPH_API_VERSION}/{clean_waba}/phone_numbers"
                    p_resp = await client.get(p_url, headers={"Authorization": f"Bearer {access_token}"}, timeout=10.0)
                    if p_resp.status_code == 200:
                        numbers = p_resp.json().get("data", [])
                        if numbers:
                            clean_phone_id = str(numbers[0].get("id", ""))
                except Exception as ex_phone:
                    logger.warning("meta_autodiscover_phone_warn", error=str(ex_phone))

    if not clean_waba or not clean_phone_id:
        logger.warning("meta_signup_missing_ids", waba=clean_waba, phone=clean_phone_id)
        raise HTTPException(
            status_code=400,
            detail="Could not resolve WhatsApp Business Account (WABA) or Phone Number ID from Meta. Please ensure your WhatsApp Business number is set up in your Meta Business Manager."
        )

    # 2. Subscribe Boldlabs Webhook to client's WABA
    # Allows our platform to receive inbound webhook messages from this WhatsApp account
    async with httpx.AsyncClient() as client:
        try:
            sub_url = f"https://graph.facebook.com/{META_GRAPH_API_VERSION}/{clean_waba}/subscribed_apps"
            sub_resp = await client.post(
                sub_url,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0
            )
            logger.info("meta_waba_webhook_subscribe", status=sub_resp.status_code, body=sub_resp.text)
        except Exception as e_sub:
            logger.warning("meta_waba_webhook_subscribe_warn", error=str(e_sub))

    # 3. Register Phone Number on WhatsApp Cloud API (with standard PIN)
    async with httpx.AsyncClient() as client:
        try:
            reg_url = f"https://graph.facebook.com/{META_GRAPH_API_VERSION}/{clean_phone_id}/register"
            reg_resp = await client.post(
                reg_url,
                headers={"Authorization": f"Bearer {access_token}"},
                json={"messaging_product": "whatsapp", "pin": "123456"},
                timeout=10.0
            )
            logger.info("meta_phone_register_status", status=reg_resp.status_code, body=reg_resp.text)
        except Exception as e_reg:
            logger.warning("meta_phone_register_warn", error=str(e_reg))

    # 4. Fetch tenant info and persist credentials to database
    tenant_row = await conn.fetchrow("SELECT id, slug, name FROM tenants WHERE id = $1::uuid", tenant_id)
    if not tenant_row:
        raise HTTPException(status_code=404, detail="Tenant organization not found.")

    slug = tenant_row["slug"]
    g_row = await conn.fetchrow(
        "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp'",
        tenant_id
    )

    wa_data: Dict[str, Any] = {}
    cred_id = str(g_row["id"]) if g_row else str(uuid.uuid4())
    if g_row and g_row["credential_data"]:
        d = g_row["credential_data"]
        if isinstance(d, str):
            try:
                d = json.loads(d)
            except Exception:
                d = {}
        wa_data = dict(d)

    wa_data["phone_number_id"] = clean_phone_id
    wa_data["waba_id"] = clean_waba
    wa_data["access_token"] = access_token
    wa_data["app_secret"] = META_APP_SECRET
    if not wa_data.get("verify_token"):
        wa_data["verify_token"] = f"{slug}_token" if slug else f"wa_{uuid.uuid4().hex[:12]}"

    if g_row:
        await conn.execute(
            "UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid AND tenant_id = $3::uuid",
            json.dumps(wa_data), cred_id, tenant_id
        )
    else:
        await conn.execute(
            """INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active)
               VALUES ($1::uuid, $2::uuid, 'whatsapp', $3::jsonb, true)""",
            cred_id, tenant_id, json.dumps(wa_data)
        )

    # 5. Mark tenant WhatsApp status active
    await conn.execute(
        """UPDATE tenants 
           SET whatsapp_configured = true, 
               settings = jsonb_set(coalesce(settings, '{}'::jsonb), '{whatsapp_configured}', 'true'),
               updated_at = now() 
           WHERE id = $1::uuid""",
        tenant_id
    )

    await invalidate_tenant_cache(tenant_id)

    # 6. Automatically trigger background Meta template sync so all standard templates are immediately provisioned
    try:
        import asyncio
        from routers.marketing import execute_meta_template_sync
        asyncio.create_task(execute_meta_template_sync(tenant_id, database.db_pool))
        logger.info("meta_embedded_signup_auto_template_sync_scheduled", tenant_id=tenant_id)
    except Exception as e_sync:
        logger.warning("meta_embedded_signup_auto_template_sync_warn", error=str(e_sync))

    return {
        "status": "connected",
        "phone_number_id": clean_phone_id,
        "waba_id": clean_waba,
        "message": "WhatsApp Business successfully connected with 1-Click Meta Embedded Signup."
    }


class WhatsAppPublicCallbackPayload(BaseModel):
    code: str
    target_tenant_id: Optional[str] = None
    state: Optional[str] = None
    waba_id: Optional[str] = ""
    phone_number_id: Optional[str] = ""


@router.post("/oauth/whatsapp/public-callback")
async def whatsapp_public_callback(payload: WhatsAppPublicCallbackPayload):
    """
    Public callback endpoint invoked when a client completes the shareable onboarding link.
    Does not require CRM user authentication because the client is external.
    Security is guaranteed by exchanging the one-time Meta authorization code with META_APP_SECRET.
    """
    target_tenant_id = payload.target_tenant_id
    if not target_tenant_id and payload.state:
        try:
            state_data = json.loads(payload.state)
            target_tenant_id = state_data.get("target_tenant_id")
        except Exception:
            try:
                state_data = json.loads(urllib.parse.unquote(payload.state))
                target_tenant_id = state_data.get("target_tenant_id")
            except Exception:
                pass

    if not target_tenant_id:
        raise HTTPException(status_code=400, detail="Missing target tenant identifier in callback.")

    async with database.db_pool.acquire() as conn:
        tenant_exists = await conn.fetchval("SELECT id FROM tenants WHERE id = $1::uuid", target_tenant_id)
        if not tenant_exists:
            raise HTTPException(status_code=404, detail="Target tenant organization not found.")

        return await execute_embedded_signup(
            conn=conn,
            tenant_id=str(target_tenant_id),
            code=payload.code,
            waba_id=payload.waba_id,
            phone_number_id=payload.phone_number_id
        )


@router.get("/oauth/whatsapp/callback")
async def whatsapp_get_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    waba_id: Optional[str] = None,
    phone_number_id: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
):
    """
    Direct GET redirect endpoint if Meta redirects directly to the API server.
    """
    if error:
        err_msg = error_description or error or "Meta signup was cancelled or failed."
        return RedirectResponse(url=f"https://crm.goboldlabs.com/dashboard?whatsapp_status=error&error={urllib.parse.quote(err_msg)}")

    if not code:
        return RedirectResponse(url="https://crm.goboldlabs.com/dashboard?whatsapp_status=error&error=Missing+authorization+code")

    target_tenant_id = None
    if state:
        try:
            state_data = json.loads(state)
            target_tenant_id = state_data.get("target_tenant_id")
        except Exception:
            try:
                state_data = json.loads(urllib.parse.unquote(state))
                target_tenant_id = state_data.get("target_tenant_id")
            except Exception:
                pass

    if not target_tenant_id:
        return RedirectResponse(url="https://crm.goboldlabs.com/dashboard?whatsapp_status=error&error=Missing+target+tenant")

    try:
        async with database.db_pool.acquire() as conn:
            res = await execute_embedded_signup(
                conn=conn,
                tenant_id=str(target_tenant_id),
                code=code,
                waba_id=waba_id,
                phone_number_id=phone_number_id
            )
        return RedirectResponse(url=f"https://crm.goboldlabs.com/dashboard?whatsapp_status=connected&phone_id={urllib.parse.quote(res.get('phone_number_id', ''))}")
    except Exception as e:
        logger.error("whatsapp_get_callback_failed", error=str(e))
        return RedirectResponse(url=f"https://crm.goboldlabs.com/dashboard?whatsapp_status=error&error={urllib.parse.quote(str(e))}")


@router.post("/oauth/whatsapp/embedded-signup")
async def tenant_whatsapp_embedded_signup(
    payload: WhatsAppEmbeddedSignupPayload,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """
    Called by tenant dashboard after Meta Embedded Signup popup completes.
    Saves credentials to the active tenant workspace.
    """
    if caller.get("role") not in ("admin", "owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin permissions required to connect WhatsApp.")

    async with database.db_pool.acquire() as conn:
        return await execute_embedded_signup(
            conn=conn,
            tenant_id=tenant_id,
            code=payload.code,
            waba_id=payload.waba_id,
            phone_number_id=payload.phone_number_id
        )


@router.post("/admin/tenants/{target_tenant_id}/oauth/whatsapp/embedded-signup")
async def admin_whatsapp_embedded_signup(
    target_tenant_id: str,
    payload: WhatsAppEmbeddedSignupPayload,
    admin_user: dict = Depends(verify_super_admin)
):
    """
    Super Admin endpoint to complete 1-Click WhatsApp Embedded Signup for a target client tenant.
    """
    async with database.db_pool.acquire() as conn:
        return await execute_embedded_signup(
            conn=conn,
            tenant_id=target_tenant_id,
            code=payload.code,
            waba_id=payload.waba_id,
            phone_number_id=payload.phone_number_id
        )
