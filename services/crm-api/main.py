import os
import re
import random
import uuid
import json
import asyncio
import bcrypt
import hmac
import hashlib
import base64
import html
import urllib.parse
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta, time, timezone
from zoneinfo import ZoneInfo
import asyncpg
import httpx
import structlog
from fastapi import FastAPI, Depends, HTTPException, Query, Header, BackgroundTasks, Request, File, UploadFile, Form, Response
from fastapi.responses import RedirectResponse, FileResponse
from pydantic import BaseModel
from models import *

try:
    import razorpay_client
except ImportError:
    try:
        from crm_api import razorpay_client
    except ImportError:
        try:
            import services.crm_api.razorpay_client as razorpay_client
        except ImportError:
            razorpay_client = None

logger = structlog.get_logger("crm-api")
from utils import safe_json_loads, get_tenant_base_url, expand_template_body, KNOWN_TEMPLATES_EXPANSION, APP_BASE_URL
from services.crm_service import *
from services.whatsapp_service import dispatch_whatsapp_message, dispatch_automated_status_whatsapp, dispatch_admin_reschedule_whatsapp, dispatch_admin_cancellation_whatsapp
from tasks_service import set_tasks_db_pool, sync_completed_google_tasks_for_tenant, sync_all_tenants_google_tasks_completed, dispatch_push_notification, check_and_notify_due_tasks, due_tasks_worker_loop, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CLAIM_EMAIL
import database
from dependencies import get_tenant_id, get_caller_context, verify_super_admin, JWT_SECRET, ALGORITHM
from routers import billing
from routers import customers
from routers import marketing
from routers import calendar
from routers import auth
from routers import webhooks
from routers import bookings
from routers import conversations
from routers import settings
from routers import reviews

from services.alert_service import GlobalErrorAlertMiddleware, init_global_error_traps

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.db_pool = await database.init_db_pool()
    set_tasks_db_pool(database.db_pool)
    try:
        await database.run_migrations(database.db_pool)
    except Exception as e:
        logger.error("db_lifespan_init_error", error=str(e))

    # Initialize global error traps (structlog, asyncio, middleware)
    init_global_error_traps(app)

    # Production startup validation checks
    env = (os.getenv("ENV") or os.getenv("ENVIRONMENT") or "development").lower()
    if env == "production":
        if not os.getenv("VAPID_PRIVATE_KEY"):
            raise RuntimeError("Missing required environment variable VAPID_PRIVATE_KEY in production.")
        if hasattr(razorpay_client, "validate_razorpay_config"):
            razorpay_client.validate_razorpay_config()

    due_worker_task = asyncio.create_task(due_tasks_worker_loop())
    yield
    due_worker_task.cancel()
    try:
        await due_worker_task
    except asyncio.CancelledError:
        pass
    await database.db_pool.close()

app = FastAPI(lifespan=lifespan, title="CRM API")
app.add_middleware(GlobalErrorAlertMiddleware)
app.include_router(billing.router)
app.include_router(customers.router)
app.include_router(marketing.router)
app.include_router(calendar.router)
app.include_router(auth.router)
app.include_router(webhooks.router)
app.include_router(bookings.router)
app.include_router(conversations.router)
app.include_router(settings.router)
app.include_router(reviews.router)

# --- Auth dependencies ---



@app.get("/health")
def health():
    return {"status": "ok"}





