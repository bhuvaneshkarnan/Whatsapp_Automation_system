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
import structlog
import asyncpg

logger = structlog.get_logger('crm-api-tasks')

db_pool: asyncpg.Pool = None
def set_tasks_db_pool(pool):
    global db_pool
    db_pool = pool

VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY', 'BMpihU9a8uXtZIkGtKTSKVJTLzTHzQf8Vz_WolZCxkgTb39GJ_0RajTa6-nI6gCBS7_p7Qk7bPHOKSi-6BwpoZU')
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '7VmcO0Iktk1j2BIrJrzH4lsCg-n3h0AX-P3WwYqHV_0')
VAPID_CLAIM_EMAIL = os.getenv('VAPID_CLAIM_EMAIL', 'mailto:admin@goboldlabs.com')

async def sync_completed_google_tasks_for_tenant(conn, tenant_id: str) -> dict:
    """
    Two-way sync: Queries Google Tasks API for tasks marked completed (or deleted)
    by the user in Google Tasks app / Gmail, and automatically clears the corresponding
    follow-up schedule from the CRM customer record and tasks table so it is removed from the calendar.
    """
    g_row = await conn.fetchrow(
        "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
        tenant_id
    )
    if not g_row or not g_row["credential_data"]:
        return {"status": "skipped", "reason": "no_credentials", "cleared_count": 0}

    d = g_row["credential_data"]
    if isinstance(d, str):
        try: d = json.loads(d)
        except Exception: d = {}
    r_token = d.get("refresh_token")
    c_id = (d.get("client_id") or "").strip() or os.getenv("GOOGLE_CLIENT_ID", "").strip()
    c_secret = (d.get("client_secret") or "").strip() or os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    if not (r_token and c_id and c_secret):
        return {"status": "skipped", "reason": "incomplete_credentials", "cleared_count": 0}

    cleared_count = 0
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        creds = Credentials(
            token=None, refresh_token=r_token, token_uri="https://oauth2.googleapis.com/token",
            client_id=c_id, client_secret=c_secret
        )
        t_svc = await asyncio.to_thread(build, "tasks", "v1", credentials=creds)
        res = await asyncio.to_thread(
            lambda: t_svc.tasks().list(tasklist="@default", maxResults=100, showCompleted=True, showHidden=True).execute()
        )
        items = res.get("items", [])
        
        # 1. Collect all completed or deleted Google Task IDs
        completed_gt_ids = set()
        for item in items:
            t_id = item.get("id")
            if not t_id:
                continue
            is_completed = item.get("status") == "completed"
            is_deleted = bool(item.get("deleted"))
            if is_completed or is_deleted:
                completed_gt_ids.add(t_id)

        if not completed_gt_ids:
            return {"status": "ok", "cleared_count": 0}

        # 2. Find matching customers with active followups
        cust_rows = await conn.fetch(
            """SELECT id, name, phone, google_task_id, google_calendar_event_id
               FROM customers
               WHERE tenant_id = $1::uuid
                 AND followup_date IS NOT NULL
                 AND google_task_id = ANY($2::text[])""",
            tenant_id, list(completed_gt_ids)
        )

        cal_svc = None
        for cust in cust_rows:
            c_id = str(cust["id"])
            gcal_id = cust.get("google_calendar_event_id")
            
            # If there's an associated Google Calendar event, delete it as well
            if gcal_id:
                try:
                    if cal_svc is None:
                        cal_svc = await asyncio.to_thread(build, "calendar", "v3", credentials=creds)
                    await asyncio.to_thread(
                        lambda gid=gcal_id: cal_svc.events().delete(calendarId="primary", eventId=gid).execute()
                    )
                except Exception as e_cal:
                    logger.debug("delete_gcal_event_on_task_complete_fail", error=str(e_cal))

            # Delete corresponding task in tasks table
            await conn.execute(
                "DELETE FROM tasks WHERE customer_id = $1::uuid AND tenant_id = $2::uuid",
                c_id, tenant_id
            )

            # Clear follow-up from customer record so it leaves the calendar
            await conn.execute(
                """UPDATE customers
                   SET followup_date = NULL, followup_time = NULL,
                       google_task_id = NULL, google_calendar_event_id = NULL,
                       updated_at = now()
                   WHERE id = $1::uuid AND tenant_id = $2::uuid""",
                c_id, tenant_id
            )
            cleared_count += 1
            logger.info("google_task_completed_cleared_customer_followup", customer_id=c_id, name=cust.get("name"))

        # Also clear any standalone tasks in tasks table that match completed_gt_ids
        await conn.execute(
            """UPDATE tasks
               SET completed = true, updated_at = now()
               WHERE tenant_id = $1::uuid
                 AND completed = false
                 AND google_task_id = ANY($2::text[])""",
            tenant_id, list(completed_gt_ids)
        )

        return {"status": "ok", "cleared_count": cleared_count}
    except Exception as ex:
        logger.warning("sync_completed_google_tasks_error", tenant_id=tenant_id, error=str(ex))
        return {"status": "error", "error": str(ex), "cleared_count": cleared_count}


async def sync_all_tenants_google_tasks_completed():
    """Background helper to sync completed Google Tasks across all active tenants."""
    global db_pool
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            tenants = await conn.fetch(
                """SELECT DISTINCT tenant_id FROM tenant_credentials 
                   WHERE provider = 'google_calendar' AND is_active = true"""
            )
            for t in tenants:
                t_id = str(t["tenant_id"])
                try:
                    await sync_completed_google_tasks_for_tenant(conn, t_id)
                except Exception as ex_t:
                    logger.debug("sync_all_tenants_gt_item_fail", tenant_id=t_id, error=str(ex_t))
    except Exception as ex:
        logger.warning("sync_all_tenants_google_tasks_error", error=str(ex))


async def dispatch_push_notification(
    pool: asyncpg.Pool,
    tenant_id: str,
    title: str,
    body: str,
    notif_type: str = "message",
    url: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Persists notification in database and dispatches real background Web Push
    to all registered devices for this tenant.
    """
    if not pool or not tenant_id:
        return {"status": "error", "message": "Missing pool or tenant_id"}

    notification_id = str(uuid.uuid4())
    merged_data = {"url": url or "/boldlabs#inbox", "type": notif_type, **(data or {})}

    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO notifications (id, tenant_id, title, body, type, data, is_read, created_at)
                   VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, false, now())""",
                notification_id, tenant_id, title, body, notif_type, json.dumps(merged_data)
            )

            subs = await conn.fetch(
                "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE tenant_id = $1::uuid",
                tenant_id
            )
    except Exception as dbe:
        logger.error("push_db_persist_failed", error=str(dbe))
        subs = []

    if not subs:
        return {"status": "ok", "notification_id": notification_id, "sent_count": 0}

    payload_json = json.dumps({
        "title": title,
        "body": body,
        "icon": "/icon-192.png",
        "badge": "/icon-192.png",
        "tag": f"{notif_type}-{int(datetime.now().timestamp())}",
        "data": merged_data
    })

    sent_count = 0
    expired_ids = []

    try:
        from pywebpush import webpush, WebPushException
        vapid_claims = {"sub": VAPID_CLAIM_EMAIL}

        for sub in subs:
            sub_info = {
                "endpoint": sub["endpoint"],
                "keys": {
                    "p256dh": sub["p256dh"],
                    "auth": sub["auth"]
                }
            }
            try:
                await asyncio.to_thread(
                    webpush,
                    subscription_info=sub_info,
                    data=payload_json,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=vapid_claims,
                    ttl=86400,
                    headers={"Urgency": "high"}
                )
                sent_count += 1
            except WebPushException as ex:
                logger.warning("webpush_send_failed", endpoint=sub["endpoint"][:30], error=str(ex))
                if ex.response is not None and ex.response.status_code in [404, 410]:
                    expired_ids.append(sub["id"])
            except Exception as e:
                logger.warning("webpush_generic_error", error=str(e))

        if expired_ids:
            try:
                async with pool.acquire() as conn:
                    await conn.execute(
                        "DELETE FROM push_subscriptions WHERE id = ANY($1::uuid[]) AND tenant_id = $2::uuid",
                        expired_ids, tenant_id
                    )
            except Exception:
                pass
    except Exception as e:
        logger.error("dispatch_push_notification_failed", error=str(e))

    return {"status": "ok", "notification_id": notification_id, "sent_count": sent_count}


async def check_and_notify_due_tasks():
    """Finds uncompleted tasks whose due_date <= now() and dispatches push and in-app notifications."""
    global db_pool
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            # First sanitize any malformed year < 2000
            await conn.execute("""
                UPDATE tasks
                SET due_date = due_date + INTERVAL '2024 years'
                WHERE due_date < '2000-01-01'::timestamptz
            """)

            # Fetch uncompleted tasks that are due now or within the past 24h and haven't been notified yet
            rows = await conn.fetch("""
                SELECT 
                    t.id, t.tenant_id, t.title, t.description, t.due_date,
                    t.customer_id, c.name AS customer_name, c.phone AS customer_phone,
                    ten.slug AS tenant_slug, ten.name AS tenant_name
                FROM tasks t
                LEFT JOIN customers c ON t.customer_id = c.id AND c.tenant_id = t.tenant_id
                LEFT JOIN tenants ten ON t.tenant_id = ten.id
                WHERE t.completed = false
                  AND t.due_date <= now()
                  AND t.due_date >= (now() - INTERVAL '24 hours')
                  AND (t.notified_due IS NULL OR t.notified_due = false)
                ORDER BY t.due_date ASC
                LIMIT 50
            """)

            for r in rows:
                task_id = str(r["id"])
                tenant_id = str(r["tenant_id"])
                slug = r["tenant_slug"] or "boldlabs"
                cust_name = r["customer_name"] or "Customer"
                title = f"Follow-up Due: {r['title']}"
                body = f"Scheduled follow-up for {cust_name} is due now. Click to review."
                target_url = f"/{slug}#follow-ups"

                try:
                    await dispatch_push_notification(
                        pool=db_pool,
                        tenant_id=tenant_id,
                        title=title,
                        body=body,
                        notif_type="task_due",
                        url=target_url,
                        data={
                            "task_id": task_id,
                            "customer_id": str(r["customer_id"]) if r["customer_id"] else None,
                            "title": r["title"],
                            "customer_name": cust_name,
                            "type": "task_due"
                        }
                    )
                except Exception as push_err:
                    logger.warning("due_task_push_failed", task_id=task_id, error=str(push_err))

                await conn.execute(
                    "UPDATE tasks SET notified_due = true, updated_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid",
                    r["id"], r["tenant_id"]
                )
                logger.info("due_task_notification_dispatched", task_id=task_id, title=r["title"])
    except Exception as ex:
        logger.error("check_and_notify_due_tasks_error", error=str(ex))


async def check_and_send_conversation_recovery_followups():
    """
    Incomplete conversation followups are handled exclusively by core-worker
    (_process_incomplete_conversation_followups) with full tenant knowledge base
    grounding, verified catalog services, multi-LLM router cascade, and dialect mirroring.
    Disabled here to prevent duplicate, ungrounded messages without tenant context.
    """
    return


async def due_tasks_worker_loop():

    """Background worker loop running periodically to check for due tasks."""
    logger.info("due_tasks_worker_loop_started")
    while True:
        try:
            await check_and_notify_due_tasks()
            await sync_all_tenants_google_tasks_completed()
            await check_and_send_conversation_recovery_followups()
            await asyncio.sleep(30)
        except asyncio.CancelledError:
            logger.info("due_tasks_worker_loop_cancelled")
            break
        except Exception as e:
            logger.error("due_tasks_worker_loop_error", error=str(e))
            await asyncio.sleep(15)


