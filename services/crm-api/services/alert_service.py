import os
import re
import json
import asyncio
import logging
import traceback
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import httpx
import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

import database

logger = structlog.get_logger('crm-alert-service')

# In-memory deduplication cache: dedup_key -> timestamp
_recent_alerts: Dict[str, float] = {}
_DEDUP_WINDOW_SECONDS = 120  # Debounce identical errors within 2 minutes


def get_db_pool():
    """Find active db_pool across crm_api.database or database modules."""
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
    return None


async def get_tenant_display_name(tenant_id: Optional[str]) -> str:
    """Fetch tenant name and slug from database or return fallback."""
    if not tenant_id:
        return "System / Global"
    try:
        pool = get_db_pool()
        if pool:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT name, slug FROM tenants WHERE id = $1::uuid",
                    tenant_id
                )
                if row:
                    return f"{row['name']} ({row['slug']})"
    except Exception as e:
        logger.debug("tenant_lookup_failed", tenant_id=tenant_id, error=str(e))

    clean_id = str(tenant_id)
    return f"Tenant {clean_id[:8]}..." if len(clean_id) > 8 else clean_id


async def send_super_admin_alert(
    title: str,
    error_message: str,
    tenant_id: Optional[str] = None,
    source: str = "System",
    severity: str = "ERROR",  # INFO, WARNING, ERROR, CRITICAL
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Central dispatch for Super Admin proactive alerts:
    - Resolves tenant name
    - Logs to DB table 'system_alerts'
    - Dispatches instant formatted push notification via Telegram Bot
    - Debounces identical errors to avoid notification storms
    """
    try:
        tenant_name = await get_tenant_display_name(tenant_id)

        # 1. Deduplication check
        dedup_key = f"{tenant_id}:{source}:{error_message[:120]}"
        try:
            loop = asyncio.get_running_loop()
            now_ts = loop.time()
        except RuntimeError:
            now_ts = 0

        if dedup_key in _recent_alerts and (now_ts - _recent_alerts[dedup_key]) < _DEDUP_WINDOW_SECONDS:
            logger.debug("alert_suppressed_dedup", key=dedup_key)
            return
        _recent_alerts[dedup_key] = now_ts

        # Prune old cache entries
        for k in list(_recent_alerts.keys()):
            if (now_ts - _recent_alerts[k]) > _DEDUP_WINDOW_SECONDS * 2:
                _recent_alerts.pop(k, None)

        # IST Timestamp
        ist_now = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%Y-%m-%d %I:%M:%S %p IST")

        # 2. Persist in system_alerts database table
        pool = get_db_pool()
        if pool:
            try:
                async with pool.acquire() as conn:
                    await conn.execute("""
                        CREATE TABLE IF NOT EXISTS system_alerts (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            tenant_id UUID,
                            tenant_name TEXT,
                            source TEXT,
                            severity TEXT,
                            title TEXT,
                            message TEXT,
                            metadata JSONB,
                            created_at TIMESTAMPTZ DEFAULT now()
                        );
                    """)
                    await conn.execute("""
                        INSERT INTO system_alerts (tenant_id, tenant_name, source, severity, title, message, metadata)
                        VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb)
                    """, tenant_id if tenant_id else None, tenant_name, source, severity, title, error_message, json.dumps(metadata or {}))
            except Exception as db_err:
                logger.debug("save_system_alert_db_warn", error=str(db_err))

        # 3. Dispatch to Telegram Bot
        tg_token = os.environ.get("TELEGRAM_BOT_TOKEN")
        tg_chat_id = os.environ.get("TELEGRAM_ADMIN_CHAT_ID")

        if tg_token and tg_chat_id:
            emoji = "🔥" if severity == "CRITICAL" else "🚨" if severity == "ERROR" else "⚠️" if severity == "WARNING" else "ℹ️"

            clean_err = error_message.replace("`", "'")
            if len(clean_err) > 800:
                clean_err = clean_err[:800] + "... (truncated)"

            tg_text = (
                f"{emoji} *[{severity}] {title}*\n\n"
                f"🏢 *Tenant:* `{tenant_name}`\n"
                f"📍 *Source:* `{source}`\n"
                f"❌ *Error:*\n```{clean_err}```\n"
            )

            if metadata:
                if metadata.get("path"):
                    tg_text += f"🌐 *Route:* `{metadata.get('method', 'GET')} {metadata.get('path')}`\n"
                if metadata.get("phone"):
                    tg_text += f"📱 *Recipient:* `{metadata.get('phone')}`\n"
                if metadata.get("status_code"):
                    tg_text += f"🔢 *HTTP Code:* `{metadata.get('status_code')}`\n"
                if metadata.get("template_name"):
                    tg_text += f"📋 *Template:* `{metadata.get('template_name')}`\n"
                if metadata.get("error_code"):
                    tg_text += f"⚠️ *Meta Code:* `{metadata.get('error_code')}`\n"

            tg_text += f"⏰ *Time:* `{ist_now}`"

            tg_url = f"https://api.telegram.org/bot{tg_token}/sendMessage"
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(tg_url, json={
                    "chat_id": tg_chat_id,
                    "text": tg_text,
                    "parse_mode": "Markdown"
                })
                if res.status_code in (200, 201):
                    logger.debug("telegram_alert_dispatched_success", tenant=tenant_name, title=title)
                else:
                    logger.warning("telegram_alert_dispatch_failed", status_code=res.status_code, body=res.text)
        else:
            logger.debug("telegram_alert_skipped_no_creds", tenant=tenant_name, title=title)

    except Exception as e:
        logger.debug("send_super_admin_alert_unhandled", error=str(e))


# ── Global Structlog Processor ────────────────────────────────────────────────
def telegram_structlog_processor(logger, method_name, event_dict):
    """
    Catch-all structlog processor:
    Intercepts any logger.error, logger.critical, or logger.exception call anywhere in the system.
    """
    level = str(event_dict.get("level", method_name)).lower()
    if level in ("error", "critical", "exception"):
        logger_name = str(event_dict.get("logger") or getattr(logger, "name", ""))
        # Prevent self-recursion
        if "crm-alert-service" in logger_name or "telegram" in logger_name:
            return event_dict

        event_name = event_dict.get("event", "Error Logged")
        error_detail = str(event_dict.get("error") or event_dict.get("exception") or event_dict.get("body") or "")
        tenant_id = event_dict.get("tenant_id") or event_dict.get("tenant")

        full_msg = f"{event_name}"
        if error_detail and error_detail != event_name:
            full_msg += f": {error_detail}"

        # Suppress transient polling and network hiccups that auto-recover in background loops
        lower_full = full_msg.lower()
        if "timeout reading from redis" in lower_full or "connection closed by server" in lower_full:
            return event_dict

        metadata = {
            k: str(v) for k, v in event_dict.items()
            if k not in ("event", "level", "timestamp", "logger") and not str(k).startswith("_")
        }

        try:
            loop = asyncio.get_running_loop()
            if loop.is_running():
                loop.create_task(send_super_admin_alert(
                    title=f"Error in {logger_name or 'Backend'}",
                    error_message=full_msg,
                    tenant_id=tenant_id,
                    source=f"Logger: {logger_name or 'System'}",
                    severity="CRITICAL" if level == "critical" else "ERROR",
                    metadata=metadata
                ))
        except (RuntimeError, Exception):
            pass

    return event_dict


# ── Global FastAPI Middleware ──────────────────────────────────────────────────
class GlobalErrorAlertMiddleware(BaseHTTPMiddleware):
    """
    FastAPI / Starlette middleware:
    Catches all 500 responses and unhandled exceptions across all HTTP endpoints.
    Extracts tenant_id from headers, query params, or JWT Bearer token.
    """
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            if response.status_code >= 500:
                tenant_id = request.headers.get("X-Tenant-ID") or request.query_params.get("tenant_id")
                if not tenant_id:
                    auth_h = request.headers.get("Authorization")
                    if auth_h and auth_h.startswith("Bearer "):
                        try:
                            from jose import jwt
                            from dependencies import JWT_SECRET, ALGORITHM
                            token = auth_h.split(" ", 1)[1].strip()
                            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
                            tenant_id = payload.get("tenant_id")
                        except Exception:
                            pass

                asyncio.create_task(send_super_admin_alert(
                    title=f"HTTP {response.status_code} on {request.method} {request.url.path}",
                    error_message=f"Endpoint {request.method} {request.url.path} responded with HTTP {response.status_code}.",
                    tenant_id=tenant_id,
                    source="API Gateway",
                    severity="CRITICAL",
                    metadata={"method": request.method, "path": request.url.path, "status_code": response.status_code}
                ))
            return response
        except Exception as exc:
            tb = traceback.format_exc()
            tenant_id = request.headers.get("X-Tenant-ID") or request.query_params.get("tenant_id")
            asyncio.create_task(send_super_admin_alert(
                title=f"Unhandled Crash on {request.method} {request.url.path}",
                error_message=f"Exception: {str(exc)}\n\nTraceback:\n{tb[:600]}",
                tenant_id=tenant_id,
                source="API Unhandled Crash",
                severity="CRITICAL",
                metadata={"method": request.method, "path": request.url.path}
            ))
            raise exc


# ── Global Asyncio Exception Handler ──────────────────────────────────────────
def setup_asyncio_exception_handler():
    """Captures unhandled background task crashes in asyncio worker loops."""
    try:
        loop = asyncio.get_running_loop()
        existing_handler = loop.get_exception_handler()

        def custom_exception_handler(loop, context):
            msg = context.get("message") or "Unhandled Asyncio Task Exception"
            exc = context.get("exception")
            tb_str = ""
            if exc:
                tb_str = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))

            full_msg = f"{msg}\n{str(exc or '')}"
            if tb_str:
                full_msg += f"\n\n{tb_str[:600]}"

            try:
                loop.create_task(send_super_admin_alert(
                    title="Background Task Crash",
                    error_message=full_msg,
                    tenant_id=None,
                    source="Asyncio Background Worker",
                    severity="CRITICAL"
                ))
            except Exception:
                pass

            if existing_handler:
                existing_handler(loop, context)
            else:
                loop.default_exception_handler(context)

        loop.set_exception_handler(custom_exception_handler)
    except Exception as e:
        logger.debug("setup_asyncio_exception_handler_failed", error=str(e))


# ── Master Setup Function ──────────────────────────────────────────────────────
def init_global_error_traps(app=None):
    """
    Initializes all global error traps across the entire backend:
    1. Structlog processor for logger.error and logger.exception.
    2. FastAPI middleware for HTTP 500s and unhandled endpoint crashes.
    3. Asyncio exception handler for background workers.
    """
    # 1. Attach Structlog Processor
    try:
        structlog.configure(
            processors=[
                structlog.processors.add_log_level,
                structlog.processors.TimeStamper(fmt="iso"),
                telegram_structlog_processor,
                structlog.processors.JSONRenderer()
            ]
        )
    except Exception as e:
        logger.debug("structlog_configure_failed", error=str(e))

    # 2. Attach FastAPI Middleware (if app provided)
    if app:
        try:
            app.add_middleware(GlobalErrorAlertMiddleware)
        except Exception as e:
            logger.debug("middleware_attach_failed", error=str(e))

    # 3. Attach Asyncio Exception Handler
    setup_asyncio_exception_handler()
    logger.info("global_error_traps_initialized")
