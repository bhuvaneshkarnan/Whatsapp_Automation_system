import os
import re
import json
import uuid
import asyncio
from datetime import datetime, timezone, timedelta, time
from zoneinfo import ZoneInfo
from typing import Optional, Dict, Any, List, Union
import structlog
import httpx
from fastapi import APIRouter, Depends, Query, HTTPException, Request, Header
import database
from tasks_service import sync_completed_google_tasks_for_tenant
from dependencies import get_tenant_id, get_caller_context, verify_super_admin
from models import (
    ContactConsentPayload,
    BatchConsentPayload,
    CustomerCreatePayload,
    CustomerUpdatePayload,
    CustomerMergePayload,
    CrmDropdownsUpdatePayload,
    CustomerNotePayload,
    CustomerChatSendPayload,
    TaskCreatePayload,
)
import utils

router = APIRouter()
logger = structlog.get_logger('crm-api-customers')

@router.get("/contacts")
async def list_contacts(
    tenant_id: str = Depends(get_tenant_id),
    q: Optional[str] = None,
    limit: int = Query(500, le=2000),
    offset: int = 0
):
    """List contacts with optional trigram search on name/phone, including WhatsApp opt-in consent status."""
    async with database.db_pool.acquire() as conn:
        if q:
            rows = await conn.fetch(
                """SELECT id, phone, name, wa_profile_name, COALESCE(opt_in, true) AS opt_in, opt_in_at, created_at
                   FROM contacts
                   WHERE tenant_id = $1::uuid AND (name ILIKE $2 OR phone ILIKE $2)
                   ORDER BY created_at DESC LIMIT $3 OFFSET $4""",
                tenant_id, f"%{q}%", limit, offset
            )
        else:
            rows = await conn.fetch(
                """SELECT id, phone, name, wa_profile_name, COALESCE(opt_in, true) AS opt_in, opt_in_at, created_at
                   FROM contacts WHERE tenant_id = $1::uuid
                   ORDER BY created_at DESC LIMIT $2 OFFSET $3""",
                tenant_id, limit, offset
            )
    return [dict(r) for r in rows]


@router.patch("/contacts/{contact_id}/consent")
@router.patch("/api/v1/crm/contacts/{contact_id}/consent")
async def update_contact_consent(
    contact_id: str,
    payload: ContactConsentPayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Update WhatsApp marketing opt-in consent status for a specific contact."""
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            """UPDATE contacts SET opt_in = $1, opt_in_at = CASE WHEN $1 = true THEN now() ELSE opt_in_at END
               WHERE id = $2::uuid AND tenant_id = $3::uuid""",
            payload.opt_in, contact_id, tenant_id
        )
    return {"status": "ok", "contact_id": contact_id, "opt_in": payload.opt_in}


@router.post("/contacts/batch-consent")
@router.post("/api/v1/crm/contacts/batch-consent")
async def batch_update_contact_consent(
    payload: BatchConsentPayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Batch update WhatsApp marketing opt-in consent for multiple contacts."""
    if not payload.contact_ids:
        return {"status": "ok", "updated_count": 0}
    
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            """UPDATE contacts SET opt_in = $1, opt_in_at = CASE WHEN $1 = true THEN now() ELSE opt_in_at END
               WHERE id::text = ANY($2) AND tenant_id = $3::uuid""",
            payload.opt_in, payload.contact_ids, tenant_id
        )
    return {"status": "ok", "updated_count": len(payload.contact_ids), "opt_in": payload.opt_in}


# ── Customer Follow-up, Notes, Chat History & Task Calendar ────────────────────

@router.get("/customers/stats")
@router.get("/api/v1/crm/customers/stats")
async def get_customer_global_stats(
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context),
    status: Optional[str] = None,
    call_status: Optional[str] = None,
    lead_probability: Optional[str] = None,
    preferred_doctor: Optional[str] = None,
    client_type: Optional[str] = None,
    health_concern: Optional[str] = None,
    next_action: Optional[str] = None,
    q: Optional[str] = None
):
    """Get real global KPI stats for all customers regardless of current table filters."""
    async with database.db_pool.acquire() as conn:
        conditions = ["tenant_id = $1::uuid"]
        args = [tenant_id]
        idx = 2

        if call_status and call_status != "all":
            call_status_clean = call_status.strip()
            cs_lower = call_status_clean.lower()
            if cs_lower == "new":
                conditions.append(f"""(
                    (call_status ILIKE ${idx} OR (call_status IS NULL AND status = 'new'))
                    AND followup_date IS NULL
                    AND NOT EXISTS (
                        SELECT 1 FROM bookings b
                        JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
                        WHERE b.tenant_id = customers.tenant_id
                          AND (ct.phone = customers.phone OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(customers.phone, '[^0-9]', '', 'g'), 10))
                          AND b.status IN ('completed', 'attended', 'confirmed')
                    )
                    AND COALESCE(converted, false) = false
                    AND COALESCE(status, '') NOT IN ('converted', 'lost', 'follow-up', 'contacted')
                    AND COALESCE(call_status, '') NOT ILIKE '%convert%'
                    AND COALESCE(call_status, '') NOT ILIKE '%confirm%'
                    AND COALESCE(call_status, '') NOT ILIKE '%lost%'
                    AND COALESCE(call_status, '') NOT ILIKE '%wrong%'
                    AND COALESCE(call_status, '') NOT ILIKE '%blue flag%'
                    AND COALESCE(call_status, '') NOT ILIKE '%info%'
                    AND COALESCE(call_status, '') NOT ILIKE '%gather%'
                    AND COALESCE(call_status, '') NOT ILIKE '%requirement%'
                    AND COALESCE(call_status, '') NOT ILIKE '%price%'
                    AND COALESCE(call_status, '') NOT ILIKE '%pricing%'
                    AND COALESCE(call_status, '') NOT ILIKE '%book%'
                    AND COALESCE(call_status, '') NOT ILIKE '%booking%'
                    AND COALESCE(call_status, '') NOT ILIKE '%picked%'
                    AND COALESCE(call_status, '') NOT ILIKE '%busy%'
                    AND COALESCE(call_status, '') NOT ILIKE '%taken%'
                )""")
                args.append("%New%")
                idx += 1
            elif cs_lower == "converted":
                conditions.append(f"""(
                    call_status ILIKE ${idx}
                    OR status = 'converted'
                    OR COALESCE(converted, false) = true
                    OR call_status ILIKE '%confirm%'
                    OR EXISTS (
                        SELECT 1 FROM bookings b
                        JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
                        WHERE b.tenant_id = customers.tenant_id
                          AND (ct.phone = customers.phone OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(customers.phone, '[^0-9]', '', 'g'), 10))
                          AND b.status IN ('completed', 'attended')
                    )
                )""")
                args.append("%Converted%")
                idx += 1
            elif cs_lower in ("blue flag (lost)", "lost"):
                conditions.append("""(
                    call_status ILIKE '%lost%'
                    OR call_status ILIKE '%blue flag%'
                    OR status = 'lost'
                )""")
            elif cs_lower in ("out of service / busy", "busy"):
                conditions.append("""(
                    call_status ILIKE '%busy%'
                    OR call_status ILIKE '%out of service%'
                )""")
            else:
                conditions.append(f"call_status ILIKE ${idx}")
                args.append(f"%{call_status_clean}%")
                idx += 1

        if status and status != "all":
            status_clean = status.strip()
            status_lower = status_clean.lower()
            if status_lower in ("new", "contacted", "follow-up", "converted", "lost"):
                if status_lower == "new":
                    conditions.append("""(
                        (call_status ILIKE '%new%' OR (call_status IS NULL AND (status = 'new' OR status IS NULL)))
                        AND (status = 'new' OR status IS NULL OR status = '')
                        AND followup_date IS NULL
                        AND NOT EXISTS (
                            SELECT 1 FROM bookings b
                            JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
                            WHERE b.tenant_id = customers.tenant_id
                              AND (ct.phone = customers.phone OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(customers.phone, '[^0-9]', '', 'g'), 10))
                              AND b.status IN ('completed', 'attended')
                        )
                        AND COALESCE(converted, false) = false
                        AND COALESCE(status, '') NOT IN ('converted', 'lost', 'follow-up', 'contacted')
                        AND COALESCE(call_status, '') NOT ILIKE '%convert%'
                        AND COALESCE(call_status, '') NOT ILIKE '%confirm%'
                        AND COALESCE(call_status, '') NOT ILIKE '%lost%'
                        AND COALESCE(call_status, '') NOT ILIKE '%wrong%'
                        AND COALESCE(call_status, '') NOT ILIKE '%blue flag%'
                        AND COALESCE(call_status, '') NOT ILIKE '%info%'
                        AND COALESCE(call_status, '') NOT ILIKE '%gather%'
                        AND COALESCE(call_status, '') NOT ILIKE '%requirement%'
                        AND COALESCE(call_status, '') NOT ILIKE '%price%'
                        AND COALESCE(call_status, '') NOT ILIKE '%pricing%'
                        AND COALESCE(call_status, '') NOT ILIKE '%book%'
                        AND COALESCE(call_status, '') NOT ILIKE '%booking%'
                        AND COALESCE(call_status, '') NOT ILIKE '%picked%'
                        AND COALESCE(call_status, '') NOT ILIKE '%busy%'
                        AND COALESCE(call_status, '') NOT ILIKE '%taken%'
                    )""")
                elif status_lower == "converted":
                    conditions.append("""(
                        status = 'converted'
                        OR COALESCE(converted, false) = true
                        OR call_status ILIKE '%convert%'
                        OR call_status ILIKE '%confirm%'
                        OR EXISTS (
                            SELECT 1 FROM bookings b
                            JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
                            WHERE b.tenant_id = customers.tenant_id
                              AND (ct.phone = customers.phone OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(customers.phone, '[^0-9]', '', 'g'), 10))
                              AND b.status IN ('completed', 'attended')
                        )
                    )""")
                elif status_lower == "follow-up":
                    conditions.append("""(
                        (
                            followup_date IS NOT NULL
                            OR status IN ('follow-up', 'contacted')
                            OR call_status ILIKE ANY(ARRAY[
                                '%info%', '%gather%', '%requirement%', '%price%', '%pricing%',
                                '%book%', '%booking%', '%picked%', '%busy%', '%taken%', '%follow%'
                            ])
                        )
                        AND COALESCE(converted, false) = false
                        AND COALESCE(status, '') NOT IN ('converted', 'lost')
                        AND COALESCE(call_status, '') NOT ILIKE '%convert%'
                        AND COALESCE(call_status, '') NOT ILIKE '%confirm%'
                        AND COALESCE(call_status, '') NOT ILIKE '%lost%'
                        AND COALESCE(call_status, '') NOT ILIKE '%wrong%'
                        AND COALESCE(call_status, '') NOT ILIKE '%blue flag%'
                    )""")
                elif status_lower == "lost":
                    conditions.append("""(
                        status = 'lost'
                        OR call_status ILIKE '%lost%'
                        OR call_status ILIKE '%wrong%'
                        OR call_status ILIKE '%blue flag%'
                        OR (
                            (call_status ILIKE '%busy%' OR call_status ILIKE '%out of service%')
                            AND followup_date IS NULL
                        )
                    )""")
                elif status_lower == "contacted":
                    conditions.append("""(
                        (status = 'contacted' OR call_status ILIKE '%contact%' OR call_status ILIKE '%picked%')
                        AND COALESCE(converted, false) = false
                        AND COALESCE(status, '') NOT IN ('converted', 'lost')
                        AND COALESCE(call_status, '') NOT ILIKE '%convert%'
                        AND COALESCE(call_status, '') NOT ILIKE '%confirm%'
                        AND COALESCE(call_status, '') NOT ILIKE '%lost%'
                        AND COALESCE(call_status, '') NOT ILIKE '%wrong%'
                        AND COALESCE(call_status, '') NOT ILIKE '%blue flag%'
                    )""")

        if next_action and next_action != "all":
            next_act_clean = next_action.strip()
            if next_act_clean.lower() in ("unassigned", "none", "no action"):
                conditions.append("(next_action IS NULL OR TRIM(next_action) = '')")
            elif next_act_clean.lower() == "call again":
                conditions.append(f"(next_action ILIKE ${idx} OR next_action IS NULL OR TRIM(next_action) = '')")
                args.append(f"%{next_act_clean}%")
                idx += 1
            else:
                conditions.append(f"next_action ILIKE ${idx}")
                args.append(f"%{next_act_clean}%")
                idx += 1

        if lead_probability and lead_probability != "all":
            lp_lower = lead_probability.strip().lower()
            conditions.append(f"LOWER(lead_probability) = LOWER(${idx})")
            args.append(lp_lower)
            idx += 1

        if preferred_doctor and preferred_doctor != "all":
            pref_doc_clean = preferred_doctor.strip()
            if pref_doc_clean.lower() in ("unassigned", "none"):
                conditions.append("(preferred_doctor IS NULL OR TRIM(preferred_doctor) = '')")
            else:
                conditions.append(f"preferred_doctor ILIKE ${idx}")
                args.append(f"%{pref_doc_clean}%")
                idx += 1

        if client_type and client_type != "all":
            if client_type == "repeat":
                conditions.append("""EXISTS (
                    SELECT 1 FROM bookings b
                    JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
                    WHERE b.tenant_id = customers.tenant_id
                      AND (ct.phone = customers.phone OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(customers.phone, '[^0-9]', '', 'g'), 10))
                      AND b.status IN ('completed', 'attended')
                )""")
            elif client_type == "new_lead":
                conditions.append("""NOT EXISTS (
                    SELECT 1 FROM bookings b
                    JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
                    WHERE b.tenant_id = customers.tenant_id
                      AND (ct.phone = customers.phone OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(customers.phone, '[^0-9]', '', 'g'), 10))
                      AND b.status IN ('completed', 'attended')
                )""")
            elif client_type == "lapsed":
                conditions.append("""EXISTS (
                    SELECT 1 FROM bookings b
                    JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
                    WHERE b.tenant_id = customers.tenant_id
                      AND (ct.phone = customers.phone OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(customers.phone, '[^0-9]', '', 'g'), 10))
                      AND b.status IN ('completed', 'attended')
                      AND b.start_time < (now() - interval '30 days')
                )""")

        if health_concern and health_concern != "all":
            h_clean = health_concern.strip()
            conditions.append(f"""(
                health_concern ILIKE ${idx}
                OR EXISTS (
                    SELECT 1 FROM unnest(COALESCE(primary_concerns, ARRAY[]::text[])) pc
                    WHERE pc ILIKE ${idx}
                )
            )""")
            args.append(f"%{h_clean}%")
            idx += 1

        if q and q.strip():
            q_clean = q.strip()
            digits_only = re.sub(r'[^0-9]', '', q_clean)
            search_parts = [
                f"name ILIKE ${idx}",
                f"COALESCE(internal_name, '') ILIKE ${idx}",
                f"preferred_doctor ILIKE ${idx}",
                f"health_concern ILIKE ${idx}",
                f"location ILIKE ${idx}",
                f"call_status ILIKE ${idx}",
                f"next_action ILIKE ${idx}",
                f"EXISTS (SELECT 1 FROM customer_notes cn WHERE cn.customer_id = customers.id AND cn.tenant_id = customers.tenant_id AND cn.note_text ILIKE ${idx})"
            ]
            if len(digits_only) >= 3:
                search_parts.append(f"REGEXP_REPLACE(phone, '[^0-9]', '', 'g') ILIKE ${idx + 1}")
                search_parts.append(f"metadata->'merged_phones' ? ${idx + 1}")
                args.extend([f"%{q_clean}%", f"%{digits_only}%"])
                idx += 2
            else:
                search_parts.append(f"phone ILIKE ${idx}")
                args.append(f"%{q_clean}%")
                idx += 1
            conditions.append(f"({' OR '.join(search_parts)})")

        caller_concerns = caller.get("assigned_health_concerns", [])
        if caller_concerns and caller.get("role") not in ("admin", "super_admin", "owner"):
            conditions.append(f"health_concern = ANY(${idx}::text[])")
            args.append(caller_concerns)
            idx += 1

        where_clause = " AND ".join(conditions)

        query = f"""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (
                    WHERE (status IN ('new', 'follow-up') OR call_status ILIKE '%new%' OR call_status ILIKE '%info%')
                    AND COALESCE(converted, false) = false
                    AND COALESCE(status, '') NOT IN ('converted', 'lost')
                    AND COALESCE(call_status, '') NOT ILIKE '%convert%'
                    AND COALESCE(call_status, '') NOT ILIKE '%confirm%'
                ) as pending,
                COUNT(*) FILTER (
                    WHERE LOWER(lead_probability) = 'hot' 
                    AND COALESCE(converted, false) = false
                    AND COALESCE(status, '') NOT IN ('converted', 'lost')
                    AND COALESCE(call_status, '') NOT ILIKE '%convert%'
                    AND COALESCE(call_status, '') NOT ILIKE '%confirm%'
                ) as hot_leads,
                COUNT(*) FILTER (
                    WHERE status = 'converted' 
                    OR converted = true 
                    OR call_status ILIKE '%convert%' 
                    OR call_status ILIKE '%confirm%'
                ) as converted
            FROM customers
            WHERE {where_clause}
        """
            
        row = await conn.fetchrow(query, *args)
        
        return {
            "total": row["total"] or 0,
            "pending": row["pending"] or 0,
            "hot_leads": row["hot_leads"] or 0,
            "converted": row["converted"] or 0
        }

@router.get("/customers")
@router.get("/api/v1/crm/customers")
async def list_customers(
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context),
    status: Optional[str] = None,
    call_status: Optional[str] = None,
    lead_probability: Optional[str] = None,
    preferred_doctor: Optional[str] = None,
    client_type: Optional[str] = None,
    health_concern: Optional[str] = None,
    next_action: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(100, le=1000),
    offset: int = 0
):
    """List customer follow-up records with segment filters, chat activity, and notes counts."""
    try:
        limit = int(getattr(limit, 'default', limit)) if not isinstance(limit, int) else limit
    except Exception:
        limit = 100
    try:
        offset = int(getattr(offset, 'default', offset)) if not isinstance(offset, int) else offset
    except Exception:
        offset = 0

    async with database.db_pool.acquire() as conn:
        # Ensure all WhatsApp contacts/conversations have a customer record
        try:
            await conn.execute("""
                INSERT INTO customers (id, tenant_id, phone, name, status, lead_probability, last_messaged_at, created_at, updated_at)
                SELECT 
                    gen_random_uuid(), 
                    c.tenant_id, 
                    REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g'), 
                    COALESCE(c.name, c.wa_profile_name, 'Customer'), 
                    'new', 
                    'warm',
                    (SELECT MAX(m.created_at) FROM messages m JOIN conversations cv ON m.conversation_id = cv.id AND cv.tenant_id = c.tenant_id AND m.tenant_id = c.tenant_id WHERE cv.contact_id = c.id),
                    c.created_at, 
                    now()
                FROM contacts c
                WHERE c.tenant_id = $1::uuid
                  AND NOT EXISTS (
                    SELECT 1 FROM customers cust 
                    WHERE cust.tenant_id = c.tenant_id 
                      AND (
                        cust.phone = REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g')
                        OR RIGHT(REGEXP_REPLACE(cust.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g'), 10)
                      )
                )
                ON CONFLICT (tenant_id, phone) DO NOTHING
            """, tenant_id)
        except Exception as e:
            logger.warning("customer_sync_from_contacts_failed", error=str(e))

        conditions = ["c.tenant_id = $1::uuid"]
        params = [tenant_id]
        idx = 2

        if call_status and call_status != "all":
            call_status_clean = call_status.strip()
            cs_lower = call_status_clean.lower()
            if cs_lower == "new":
                conditions.append(f"""(
                    (c.call_status ILIKE ${idx} OR (c.call_status IS NULL AND (c.status = 'new' OR c.status IS NULL)))
                    AND c.followup_date IS NULL
                    AND COALESCE(b_stats.completed_bookings_count, 0) = 0
                    AND COALESCE(c.converted, false) = false
                    AND COALESCE(c.status, '') NOT IN ('converted', 'lost', 'follow-up', 'contacted')
                    AND COALESCE(c.call_status, '') NOT ILIKE '%convert%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%confirm%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%lost%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%wrong%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%blue flag%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%info%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%gather%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%requirement%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%price%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%pricing%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%book%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%booking%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%picked%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%busy%'
                    AND COALESCE(c.call_status, '') NOT ILIKE '%taken%'
                )""")
                params.append("%New%")
                idx += 1
            elif cs_lower == "converted":
                conditions.append(f"""(
                    c.call_status ILIKE ${idx}
                    OR c.status = 'converted'
                    OR COALESCE(c.converted, false) = true
                    OR c.call_status ILIKE '%confirm%'
                    OR COALESCE(b_stats.completed_bookings_count, 0) > 0
                )""")
                params.append("%Converted%")
                idx += 1
            elif cs_lower in ("blue flag (lost)", "lost"):
                conditions.append("""(
                    c.call_status ILIKE '%lost%'
                    OR c.call_status ILIKE '%blue flag%'
                    OR c.status = 'lost'
                )""")
            elif cs_lower in ("out of service / busy", "busy"):
                conditions.append("""(
                    c.call_status ILIKE '%busy%'
                    OR c.call_status ILIKE '%out of service%'
                )""")
            else:
                conditions.append(f"c.call_status ILIKE ${idx}")
                params.append(f"%{call_status_clean}%")
                idx += 1

        if status and status != "all":
            status_clean = status.strip()
            status_lower = status_clean.lower()
            if status_lower in ("new", "contacted", "follow-up", "converted", "lost"):
                if status_lower == "new":
                    conditions.append("""(
                        (c.call_status ILIKE '%new%' OR (c.call_status IS NULL AND (c.status = 'new' OR c.status IS NULL)))
                        AND (c.status = 'new' OR c.status IS NULL OR c.status = '')
                        AND c.followup_date IS NULL
                        AND COALESCE(b_stats.completed_bookings_count, 0) = 0
                        AND COALESCE(c.converted, false) = false
                        AND COALESCE(c.status, '') NOT IN ('converted', 'lost', 'follow-up', 'contacted')
                        AND COALESCE(c.call_status, '') NOT ILIKE '%convert%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%confirm%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%lost%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%wrong%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%blue flag%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%info%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%gather%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%requirement%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%price%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%pricing%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%book%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%booking%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%picked%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%busy%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%taken%'
                    )""")
                elif status_lower == "converted":
                    conditions.append("""(
                        c.status = 'converted'
                        OR COALESCE(c.converted, false) = true
                        OR c.call_status ILIKE '%convert%'
                        OR c.call_status ILIKE '%confirm%'
                        OR COALESCE(b_stats.completed_bookings_count, 0) > 0
                    )""")
                elif status_lower == "follow-up":
                    conditions.append("""(
                        (
                            c.followup_date IS NOT NULL
                            OR c.status IN ('follow-up', 'contacted')
                            OR c.call_status ILIKE ANY(ARRAY[
                                '%info%', '%gather%', '%requirement%', '%price%', '%pricing%',
                                '%book%', '%booking%', '%picked%', '%busy%', '%taken%', '%follow%'
                            ])
                        )
                        AND COALESCE(c.converted, false) = false
                        AND COALESCE(c.status, '') NOT IN ('converted', 'lost')
                        AND COALESCE(c.call_status, '') NOT ILIKE '%convert%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%confirm%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%lost%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%wrong%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%blue flag%'
                    )""")
                elif status_lower == "lost":
                    conditions.append("""(
                        c.status = 'lost'
                        OR c.call_status ILIKE '%lost%'
                        OR c.call_status ILIKE '%wrong%'
                        OR c.call_status ILIKE '%blue flag%'
                        OR (
                            (c.call_status ILIKE '%busy%' OR c.call_status ILIKE '%out of service%')
                            AND c.followup_date IS NULL
                        )
                    )""")
                elif status_lower == "contacted":
                    conditions.append("""(
                        (c.status = 'contacted' OR c.call_status ILIKE '%contact%' OR c.call_status ILIKE '%picked%')
                        AND COALESCE(c.converted, false) = false
                        AND COALESCE(c.status, '') NOT IN ('converted', 'lost')
                        AND COALESCE(c.call_status, '') NOT ILIKE '%convert%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%confirm%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%lost%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%wrong%'
                        AND COALESCE(c.call_status, '') NOT ILIKE '%blue flag%'
                    )""")

        if next_action and next_action != "all":
            next_act_clean = next_action.strip()
            if next_act_clean.lower() in ("unassigned", "none", "no action"):
                conditions.append("(c.next_action IS NULL OR TRIM(c.next_action) = '')")
            elif next_act_clean.lower() == "call again":
                conditions.append(f"(c.next_action ILIKE ${idx} OR c.next_action IS NULL OR TRIM(c.next_action) = '')")
                params.append(f"%{next_act_clean}%")
                idx += 1
            else:
                conditions.append(f"c.next_action ILIKE ${idx}")
                params.append(f"%{next_act_clean}%")
                idx += 1

        if lead_probability and lead_probability != "all":
            lp_lower = lead_probability.strip().lower()
            conditions.append(f"LOWER(c.lead_probability) = LOWER(${idx})")
            params.append(lp_lower)
            idx += 1

        if preferred_doctor and preferred_doctor != "all":
            pref_doc_clean = preferred_doctor.strip()
            if pref_doc_clean.lower() in ("unassigned", "none"):
                conditions.append("(c.preferred_doctor IS NULL OR TRIM(c.preferred_doctor) = '')")
            else:
                conditions.append(f"c.preferred_doctor ILIKE ${idx}")
                params.append(f"%{pref_doc_clean}%")
                idx += 1

        if client_type and client_type != "all":
            if client_type == "repeat":
                conditions.append("COALESCE(b_stats.completed_bookings_count, 0) > 0")
            elif client_type == "new_lead":
                conditions.append("COALESCE(b_stats.completed_bookings_count, 0) = 0")
            elif client_type == "lapsed":
                conditions.append("COALESCE(b_stats.completed_bookings_count, 0) > 0 AND b_stats.calculated_last_visited < (now() - interval '30 days')")

        if q and q.strip():
            q_clean = q.strip()
            digits_only = re.sub(r'[^0-9]', '', q_clean)
            search_parts = [
                f"c.name ILIKE ${idx}",
                f"COALESCE(c.internal_name, '') ILIKE ${idx}",
                f"c.preferred_doctor ILIKE ${idx}",
                f"c.health_concern ILIKE ${idx}",
                f"c.location ILIKE ${idx}",
                f"c.call_status ILIKE ${idx}",
                f"c.next_action ILIKE ${idx}",
                f"EXISTS (SELECT 1 FROM customer_notes cn WHERE cn.customer_id = c.id AND cn.tenant_id = c.tenant_id AND cn.note_text ILIKE ${idx})"
            ]
            if len(digits_only) >= 3:
                search_parts.append(f"REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g') ILIKE ${idx + 1}")
                search_parts.append(f"c.metadata->'merged_phones' ? ${idx + 1}")
                params.extend([f"%{q_clean}%", f"%{digits_only}%"])
                idx += 2
            else:
                search_parts.append(f"c.phone ILIKE ${idx}")
                params.append(f"%{q_clean}%")
                idx += 1
            conditions.append(f"({' OR '.join(search_parts)})")

        if health_concern and health_concern != "all":
            h_clean = health_concern.strip()
            conditions.append(f"""(
                c.health_concern ILIKE ${idx}
                OR EXISTS (
                    SELECT 1 FROM unnest(COALESCE(c.primary_concerns, ARRAY[]::text[])) pc
                    WHERE pc ILIKE ${idx}
                )
            )""")
            params.append(f"%{h_clean}%")
            idx += 1

        # Health concern isolation: non-admin staff with assigned_health_concerns only see matching patients
        caller_concerns = caller.get("assigned_health_concerns", [])
        if caller_concerns and caller.get("role") not in ("admin", "super_admin", "owner"):
            conditions.append(f"c.health_concern = ANY(${idx}::text[])")
            params.append(caller_concerns)
            idx += 1

        # Doctor assignment isolation: non-admin staff with assigned_doctor only see matching patients
        caller_doc = caller.get("assigned_doctor")
        if caller_doc and caller.get("role") not in ("admin", "super_admin", "owner") and not preferred_doctor:
            conditions.append(f"c.preferred_doctor = ${idx}")
            params.append(caller_doc)
            idx += 1

        params.extend([limit, offset])
        where_clause = " AND ".join(conditions)

        query = f"""
            WITH contact_booking_agg AS (
                SELECT 
                    b.contact_id,
                    COUNT(CASE WHEN b.status IN ('completed', 'attended') THEN 1 END) AS completed_bookings_count,
                    COUNT(*) AS total_bookings_count,
                    MAX(CASE WHEN b.status IN ('completed', 'attended') THEN b.start_time END) AS calculated_last_visited
                FROM bookings b
                WHERE b.tenant_id = $1::uuid
                GROUP BY b.contact_id
            )
            SELECT 
                c.id, c.tenant_id, c.phone, c.name, c.internal_name, c.metadata, c.age, c.location, c.preferred_doctor, c.status,
                COALESCE(NULLIF(to_jsonb(c)->>'source', ''), c.metadata->>'source', 'whatsapp') AS source,
                c.health_concern, c.lead_probability, c.converted, c.followup_date,
                c.followup_time, c.google_task_id, c.google_calendar_event_id, c.last_visited_at, c.last_messaged_at, c.preferred_language, c.created_at, c.updated_at,
                COALESCE(c.conversion_rate, CASE WHEN c.converted THEN 100 WHEN c.lead_probability = 'hot' THEN 80 WHEN c.lead_probability = 'cold' THEN 20 ELSE 50 END) AS conversion_rate,
                COALESCE(c.call_status, c.status, 'New (Fresh)') AS call_status,
                COALESCE(c.next_action, 'Call Again') AS next_action,
                COALESCE(c.primary_concerns, CASE WHEN c.health_concern IS NOT NULL AND c.health_concern != '' THEN ARRAY[c.health_concern] ELSE ARRAY[]::text[] END) AS primary_concerns,
                COALESCE(c.interested_services, ARRAY[]::text[]) AS interested_services,
                COALESCE(c.deal_value, 0) AS deal_value,
                c.ai_summary,
                b_stats.calculated_last_visited,
                COALESCE(b_stats.completed_bookings_count, 0) AS completed_bookings_count,
                COALESCE(b_stats.total_bookings_count, 0) AS total_bookings_count,
                b_last.last_visit_service,
                b_last.last_visit_doctor,
                ct_match.wa_profile_name,
                notes_info.notes_count,
                notes_info.latest_note_id,
                notes_info.latest_note,
                notes_info.latest_note_color,
                msg_info.last_chat_at,
                msg_info.last_message,
                cv_info.unread_count,
                cv_info.conversation_id
            FROM customers c
            LEFT JOIN LATERAL (
                SELECT ct.id AS contact_id, ct.wa_profile_name
                FROM contacts ct
                WHERE ct.tenant_id = c.tenant_id
                  AND (ct.phone = c.phone OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g'), 10))
                LIMIT 1
            ) ct_match ON true
            LEFT JOIN contact_booking_agg b_stats ON b_stats.contact_id = ct_match.contact_id
            LEFT JOIN LATERAL (
                SELECT b.service AS last_visit_service, b.staff_member AS last_visit_doctor
                FROM bookings b
                WHERE b.tenant_id = c.tenant_id AND b.contact_id = ct_match.contact_id
                  AND b.status IN ('completed', 'attended')
                ORDER BY b.start_time DESC LIMIT 1
            ) b_last ON true
            LEFT JOIN LATERAL (
                SELECT 
                    COUNT(*) AS notes_count,
                    (SELECT cn2.id FROM customer_notes cn2 WHERE cn2.customer_id = c.id AND cn2.tenant_id = c.tenant_id ORDER BY cn2.created_at DESC LIMIT 1) AS latest_note_id,
                    (SELECT cn2.note_text FROM customer_notes cn2 WHERE cn2.customer_id = c.id AND cn2.tenant_id = c.tenant_id ORDER BY cn2.created_at DESC LIMIT 1) AS latest_note,
                    (SELECT COALESCE(cn2.color, 'slate') FROM customer_notes cn2 WHERE cn2.customer_id = c.id AND cn2.tenant_id = c.tenant_id ORDER BY cn2.created_at DESC LIMIT 1) AS latest_note_color
                FROM customer_notes cn
                WHERE cn.customer_id = c.id AND cn.tenant_id = c.tenant_id
            ) notes_info ON true
            LEFT JOIN LATERAL (
                SELECT cv.id AS conversation_id, cv.unread_count
                FROM conversations cv
                WHERE cv.tenant_id = c.tenant_id AND cv.contact_id = ct_match.contact_id
                ORDER BY cv.last_message_at DESC NULLS LAST LIMIT 1
            ) cv_info ON true
            LEFT JOIN LATERAL (
                SELECT m.created_at AS last_chat_at,
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
                WHERE m.tenant_id = c.tenant_id AND m.conversation_id = cv_info.conversation_id
                ORDER BY m.created_at DESC LIMIT 1
            ) msg_info ON true
            WHERE {where_clause}
            ORDER BY 
                COALESCE(
                    msg_info.last_chat_at,
                    c.last_messaged_at,
                    c.created_at
                ) DESC NULLS LAST
            LIMIT ${idx} OFFSET ${idx + 1}
        """
        rows = await conn.fetch(query, *params)

    out = []
    for r in rows:
        completed_cnt = int(r["completed_bookings_count"] or 0)
        total_cnt = int(r["total_bookings_count"] or 0)
        is_repeat = completed_cnt > 0
        c_type = "repeat" if is_repeat else "new_lead"
        last_visit_dt = (r["last_visited_at"] or r["calculated_last_visited"])
        days_since_last_visit = None
        retention_status = "new"
        if last_visit_dt:
            try:
                if hasattr(last_visit_dt, "tzinfo") and last_visit_dt.tzinfo is not None:
                    from datetime import timezone
                    diff_days = (datetime.now(timezone.utc) - last_visit_dt).days
                else:
                    diff_days = (datetime.utcnow() - last_visit_dt).days
                days_since_last_visit = max(0, diff_days)
                if days_since_last_visit <= 30:
                    retention_status = "active"
                elif days_since_last_visit <= 60:
                    retention_status = "due"
                else:
                    retention_status = "lapsed"
            except Exception:
                pass

        out.append({
            "id": str(r["id"]),
            "phone": r["phone"],
            "name": r["name"] or "Customer",
            "internal_name": r["internal_name"] or None,
            "metadata": r.get("metadata") or {},
            "age": r["age"],
            "location": r["location"] or None,
            "wa_profile_name": r["wa_profile_name"] or None,
            "preferred_doctor": r["preferred_doctor"],
            "status": r["status"] or "new",
            "source": r["source"] or "whatsapp",
            "health_concern": r["health_concern"] or "General Consultation",
            "lead_probability": r["lead_probability"] or "warm",
            "converted": bool(r["converted"]),
            "followup_date": r["followup_date"].isoformat() if r["followup_date"] else None,
            "followup_time": r["followup_time"] or "10:00 AM",
            "google_task_id": r["google_task_id"],
            "google_calendar_event_id": r.get("google_calendar_event_id") if "google_calendar_event_id" in r else None,
            "last_visited": last_visit_dt.isoformat() if last_visit_dt else None,
            "last_visit_date": last_visit_dt.isoformat() if last_visit_dt else None,
            "completed_bookings_count": completed_cnt,
            "total_bookings_count": total_cnt,
            "client_type": c_type,
            "last_visit_service": r["last_visit_service"] or None,
            "last_visit_doctor": r["last_visit_doctor"] or r["preferred_doctor"] or None,
            "days_since_last_visit": days_since_last_visit,
            "retention_status": retention_status,
            "notes_count": r["notes_count"] or 0,
            "latest_note": r["latest_note"] or None,
            "latest_note_id": str(r["latest_note_id"]) if r.get("latest_note_id") else None,
            "latest_note_color": r.get("latest_note_color") or "slate",
            "last_chat_at": (r["last_chat_at"] or r["last_messaged_at"]).isoformat() if (r["last_chat_at"] or r["last_messaged_at"]) else None,
            "last_message": r["last_message"] or None,
            "unread_count": r["unread_count"] or 0,
            "conversation_id": str(r["conversation_id"]) if r["conversation_id"] else None,
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            "conversion_rate": r["conversion_rate"] if r["conversion_rate"] is not None else 50,
            "call_status": r["call_status"] or "New (Fresh)",
            "next_action": r["next_action"] or "Call Again",
            "preferred_language": r.get("preferred_language") or None,
            "primary_concerns": list(r["primary_concerns"]) if r["primary_concerns"] else [],
            "interested_services": list(r["interested_services"]) if r["interested_services"] else [],
            "deal_value": float(r["deal_value"] or 0) if r.get("deal_value") is not None else 0.0,
            "ai_summary": r.get("ai_summary") or None,
        })
    return out


@router.post("/customers")
@router.post("/api/v1/crm/customers")
async def create_customer(
    payload: CustomerCreatePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new customer follow-up record or update existing if duplicate phone."""
    raw_digits = re.sub(r"[^0-9]", "", payload.phone.strip())
    if not raw_digits:
        raise HTTPException(status_code=400, detail="Invalid phone number provided.")

    # Extract last 10 digits for robust deduplication across formats (+91, 91, 0, etc.)
    last10 = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
    canonical_phone = f"91{last10}" if len(raw_digits) == 10 else raw_digits

    f_date = None
    if payload.followup_date:
        try: f_date = datetime.strptime(payload.followup_date, "%Y-%m-%d").date()
        except: pass

    concerns_arr = payload.primary_concerns if payload.primary_concerns else ([payload.health_concern] if payload.health_concern else [])
    services_arr = payload.interested_services if payload.interested_services else []
    conv_rate = payload.conversion_rate if payload.conversion_rate is not None else (100 if payload.converted else (80 if payload.lead_probability == 'hot' else (20 if payload.lead_probability == 'cold' else 50)))
    call_stat = payload.call_status or ("Converted" if payload.converted else "New (Fresh)")
    nxt_act = payload.next_action or "Call Again"

    async with database.db_pool.acquire() as conn:
        # 1. Check if customer with same phone or last 10 digits already exists in this tenant
        existing = await conn.fetchrow("""
            SELECT id, phone, name, age, location, preferred_doctor, status, health_concern,
                   lead_probability, converted, followup_date, followup_time, conversion_rate,
                   call_status, next_action, primary_concerns, interested_services
            FROM customers
            WHERE tenant_id = $1::uuid
              AND (
                phone = $2
                OR phone = $3
                OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $4
              )
            ORDER BY updated_at DESC NULLS LAST
            LIMIT 1
        """, tenant_id, raw_digits, canonical_phone, last10)

        if existing:
            cust_id = str(existing["id"])
            new_name = payload.name.strip() if payload.name and payload.name.strip() else existing["name"]
            new_age = payload.age if payload.age is not None else existing["age"]
            new_location = payload.location.strip() if payload.location and payload.location.strip() else existing["location"]
            new_doctor = payload.preferred_doctor.strip() if payload.preferred_doctor and payload.preferred_doctor.strip() else existing["preferred_doctor"]
            new_concern = payload.health_concern.strip() if payload.health_concern and payload.health_concern.strip() else existing["health_concern"]
            new_prob = payload.lead_probability if payload.lead_probability else existing["lead_probability"]
            new_status = payload.status if payload.status and payload.status != 'new' else (existing["status"] or "new")
            new_f_date = f_date if f_date else existing["followup_date"]
            new_f_time = payload.followup_time if payload.followup_time else existing["followup_time"]

            merged_concerns = list(dict.fromkeys((existing["primary_concerns"] or []) + concerns_arr))
            merged_services = list(dict.fromkeys((existing["interested_services"] or []) + services_arr))

            await conn.execute("""
                UPDATE customers SET
                    phone = $1,
                    name = $2,
                    age = $3,
                    location = $4,
                    preferred_doctor = $5,
                    status = $6,
                    health_concern = $7,
                    lead_probability = $8,
                    followup_date = $9,
                    followup_time = $10,
                    conversion_rate = COALESCE($11, conversion_rate),
                    call_status = COALESCE($12, call_status),
                    next_action = COALESCE($13, next_action),
                    primary_concerns = $14,
                    interested_services = $15,
                    deal_value = COALESCE($16, deal_value),
                    ai_summary = COALESCE($17, ai_summary),
                    updated_at = now()
                WHERE id = $18::uuid AND tenant_id = $19::uuid
            """, canonical_phone, new_name, new_age, new_location, new_doctor, new_status, new_concern,
                 new_prob, new_f_date, new_f_time, conv_rate, call_stat, nxt_act,
                 merged_concerns, merged_services, payload.deal_value, payload.ai_summary, cust_id, tenant_id)

            if payload.initial_note and payload.initial_note.strip():
                await conn.execute(
                    """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color, created_at)
                       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'Admin', $3, 'slate', now())""",
                    tenant_id, cust_id, payload.initial_note.strip()
                )

            if new_name:
                await conn.execute("""
                    UPDATE contacts SET name = $1, updated_at = now()
                    WHERE tenant_id = $2::uuid AND (phone = $3 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $4)
                """, new_name, tenant_id, canonical_phone, last10)

            if new_concern:
                await auto_route_lead_to_specialty(conn, tenant_id, canonical_phone, new_concern)

            logger.info("customer_dedup_updated", tenant_id=tenant_id, customer_id=cust_id, phone=canonical_phone)
            return {
                "status": "ok",
                "id": cust_id,
                "phone": canonical_phone,
                "name": new_name,
                "is_duplicate": True,
                "action": "updated",
                "message": f"Customer '{new_name or canonical_phone}' already exists. Details updated instead of creating a duplicate."
            }

        # 2. Fresh record insertion
        cust_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO customers (
                id, tenant_id, phone, name, age, location, preferred_doctor, status, health_concern,
                lead_probability, converted, followup_date, followup_time,
                conversion_rate, call_status, next_action, primary_concerns, interested_services,
                deal_value, ai_summary, created_at, updated_at
               ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, now(), now())
               ON CONFLICT (tenant_id, phone) DO UPDATE SET
                name = EXCLUDED.name,
                age = COALESCE(EXCLUDED.age, customers.age),
                location = COALESCE(EXCLUDED.location, customers.location),
                preferred_doctor = EXCLUDED.preferred_doctor,
                health_concern = EXCLUDED.health_concern,
                lead_probability = EXCLUDED.lead_probability,
                followup_date = COALESCE(EXCLUDED.followup_date, customers.followup_date),
                followup_time = COALESCE(EXCLUDED.followup_time, customers.followup_time),
                conversion_rate = COALESCE(EXCLUDED.conversion_rate, customers.conversion_rate),
                call_status = COALESCE(EXCLUDED.call_status, customers.call_status),
                next_action = COALESCE(EXCLUDED.next_action, customers.next_action),
                primary_concerns = COALESCE(EXCLUDED.primary_concerns, customers.primary_concerns),
                interested_services = COALESCE(EXCLUDED.interested_services, customers.interested_services),
                deal_value = COALESCE(EXCLUDED.deal_value, customers.deal_value),
                ai_summary = COALESCE(EXCLUDED.ai_summary, customers.ai_summary),
                updated_at = now()""",
            cust_id, tenant_id, canonical_phone, payload.name, payload.age, payload.location, payload.preferred_doctor or None,
            payload.status or "new", payload.health_concern or None,
            payload.lead_probability or "warm", payload.converted or False, f_date, payload.followup_time or (payload.followup_date and "10:00 AM" or None),
            conv_rate, call_stat, nxt_act, concerns_arr, services_arr, payload.deal_value or 0.0, payload.ai_summary
        )
        if payload.initial_note and payload.initial_note.strip():
            await conn.execute(
                """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color, created_at)
                   VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'Admin', $3, 'slate', now())""",
                tenant_id, cust_id, payload.initial_note.strip()
            )
        # Also ensure record exists in contacts table
        await conn.execute(
            """INSERT INTO contacts (id, tenant_id, phone, name)
               VALUES (gen_random_uuid(), $1::uuid, $2, $3)
               ON CONFLICT (tenant_id, phone) DO UPDATE SET
                name = COALESCE(EXCLUDED.name, contacts.name)""",
            tenant_id, canonical_phone, payload.name or "Customer"
        )
        if payload.health_concern:
            await auto_route_lead_to_specialty(conn, tenant_id, canonical_phone, payload.health_concern)

        logger.info("customer_created", tenant_id=tenant_id, customer_id=cust_id, phone=canonical_phone)
        return {
            "status": "ok",
            "id": cust_id,
            "phone": canonical_phone,
            "name": payload.name,
            "is_duplicate": False,
            "action": "created",
            "message": f"Customer '{payload.name or canonical_phone}' created successfully."
        }


async def auto_route_lead_to_specialty(conn, tenant_id: str, phone: str, health_concern: str):
    """Auto-assigns conversation for a customer to matching sales rep by health concern (round-robin)."""
    if not health_concern or not health_concern.strip():
        return None
    concern_clean = health_concern.strip()
    try:
        # Find active staff members whose permissions->assigned_health_concerns contains this concern
        staff_rows = await conn.fetch("""
            SELECT u.id, u.display_name, u.email,
                   (SELECT COUNT(*) FROM conversations c WHERE c.assigned_to = u.id AND c.tenant_id = u.tenant_id) as active_assigned_count
            FROM users u
            WHERE u.tenant_id = $1::uuid
              AND u.is_active = true
              AND (u.role = 'sales' OR u.role = 'agent')
              AND u.permissions->'assigned_health_concerns' ? $2
            ORDER BY active_assigned_count ASC
        """, tenant_id, concern_clean)

        if not staff_rows:
            return None

        # Pick the rep with least current assignments (Round-Robin balance)
        best_rep = staff_rows[0]
        rep_id = best_rep["id"]

        # Assign conversation for this customer
        clean_p = re.sub(r"[^0-9]", "", phone)
        last10 = clean_p[-10:] if len(clean_p) >= 10 else clean_p
        conv = await conn.fetchrow("""
            SELECT c.id FROM conversations c
            JOIN contacts ct ON ct.id = c.contact_id AND ct.tenant_id = c.tenant_id
            WHERE c.tenant_id = $1::uuid
              AND (ct.phone = $2 OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = $3)
            LIMIT 1
        """, tenant_id, clean_p, last10)

        if conv:
            await conn.execute("""
                UPDATE conversations
                SET assigned_to = $1, updated_at = now()
                WHERE id = $2::uuid AND tenant_id = $3::uuid
            """, rep_id, conv["id"], tenant_id)
            logger.info("auto_routed_lead", concern=concern_clean, assigned_to=str(rep_id), conv_id=str(conv["id"]))
            return str(rep_id)
    except Exception as e:
        logger.warning("auto_route_lead_failed", error=str(e), health_concern=concern_clean)
    return None


async def get_customer_display_name(conn, tenant_id: str, phone: Optional[str], current_name: Optional[str] = None) -> str:
    """Resolve best display name for a customer: explicit name -> WhatsApp profile name -> ''."""
    if current_name and str(current_name).strip():
        return str(current_name).strip()
    if phone and str(phone).strip():
        try:
            wa_name = await conn.fetchval(
                """SELECT ct.wa_profile_name FROM contacts ct
                   WHERE ct.tenant_id = $1::uuid
                     AND (ct.phone = $2 OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($2, '[^0-9]', '', 'g'), 10))
                   ORDER BY ct.updated_at DESC NULLS LAST LIMIT 1""",
                tenant_id, phone
            )
            if wa_name and str(wa_name).strip():
                return str(wa_name).strip()
        except Exception:
            pass
    return ""


async def cleanup_and_delete_old_google_tasks(
    conn, tenant_id: str, customer_id: str, phone: Optional[str] = None, cust_name: str = ""
):
    """
    Find and delete ALL prior Google Tasks associated with a customer to guarantee
    strictly ONE task per customer with zero duplicates. Returns (t_svc, creds).
    """
    all_old_gt_ids = set()
    try:
        old_tasks = await conn.fetch(
            "SELECT google_task_id FROM tasks WHERE customer_id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        for ot in old_tasks:
            if ot["google_task_id"]:
                all_old_gt_ids.add(ot["google_task_id"])
        cust_gt_id = await conn.fetchval(
            "SELECT google_task_id FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        if cust_gt_id:
            all_old_gt_ids.add(cust_gt_id)
    except Exception as ex_db:
        logger.warning("google_task_cleanup_db_warn", error=str(ex_db))

    g_row = await conn.fetchrow(
        "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
        tenant_id
    )
    if not g_row or not g_row["credential_data"]:
        return None, None

    r_token, c_id, c_secret = None, None, None
    try:
        d = g_row["credential_data"]
        if isinstance(d, str):
            d = json.loads(d)
        r_token = d.get("refresh_token")
        c_id = d.get("client_id")
        c_secret = d.get("client_secret")
    except Exception:
        return None, None

    if not (r_token and c_id and c_secret):
        return None, None

    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        creds = Credentials(
            token=None, refresh_token=r_token, token_uri="https://oauth2.googleapis.com/token",
            client_id=c_id, client_secret=c_secret
        )
        t_svc = await asyncio.to_thread(build, "tasks", "v1", credentials=creds)

        # Search existing Google Tasks for this customer by phone (last 10 digits) or name
        clean_phone = re.sub(r'[^0-9]', '', phone or '')
        last10 = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
        try:
            list_res = await asyncio.to_thread(
                lambda: t_svc.tasks().list(tasklist="@default", maxResults=100, showCompleted=True, showHidden=True).execute()
            )
            for item in list_res.get("items", []):
                i_id = item.get("id")
                if not i_id:
                    continue
                i_title = (item.get("title") or "").strip()
                i_notes = (item.get("notes") or "")
                combined_text = f"{i_title} {i_notes}"
                clean_combined = re.sub(r'[^0-9]', '', combined_text)
                
                phone_match = bool(last10 and last10 in clean_combined)
                name_match = bool(cust_name and len(cust_name) >= 3 and cust_name.lower() in i_title.lower())
                if phone_match or name_match:
                    all_old_gt_ids.add(i_id)
        except Exception as ex_l:
            logger.warning("google_task_list_scan_warn", error=str(ex_l))

        # Strictly delete every old task found in Google Tasks
        for gt_id in all_old_gt_ids:
            if gt_id and not str(gt_id).startswith("gtask_"):
                try:
                    await asyncio.to_thread(lambda gid=gt_id: t_svc.tasks().delete(tasklist="@default", task=gid).execute())
                except Exception as ex_del:
                    logger.debug("google_task_delete_old_fail", task_id=gt_id, error=str(ex_del))

        return t_svc, creds
    except Exception as ex_main:
        logger.warning("google_task_cleanup_error", error=str(ex_main))
        return None, None


@router.patch("/customers/{customer_id}")
@router.patch("/api/v1/crm/customers/{customer_id}")
async def update_customer(
    customer_id: str,
    payload: CustomerUpdatePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Update customer follow-up fields with instant database persistence."""
    updates = []
    params = [customer_id, tenant_id]
    idx = 3

    if payload.name is not None:
        updates.append(f"name = ${idx}")
        params.append(payload.name.strip())
        idx += 1

    if payload.internal_name is not None:
        updates.append(f"internal_name = ${idx}")
        params.append(payload.internal_name.strip() if payload.internal_name else None)
        idx += 1

    if payload.age is not None:
        updates.append(f"age = ${idx}")
        params.append(payload.age)
        idx += 1

    if payload.location is not None:
        updates.append(f"location = ${idx}")
        params.append(payload.location.strip())
        idx += 1

    if payload.preferred_doctor is not None:
        updates.append(f"preferred_doctor = ${idx}")
        params.append(payload.preferred_doctor.strip())
        idx += 1

    status_val = payload.status
    if payload.converted is True and not status_val:
        status_val = "converted"

    if status_val is not None:
        updates.append(f"status = CASE WHEN customers.converted = true AND ${idx} = 'new' THEN 'converted' ELSE ${idx} END")
        params.append(status_val.strip())
        idx += 1

    if payload.health_concern is not None:
        updates.append(f"health_concern = ${idx}")
        params.append(payload.health_concern.strip())
        idx += 1

    if payload.lead_probability is not None:
        updates.append(f"lead_probability = ${idx}")
        params.append(payload.lead_probability.strip())
        idx += 1

    if payload.converted is not None:
        updates.append(f"converted = ${idx}")
        params.append(payload.converted)
        idx += 1

    if payload.clear_followup:
        updates.append(f"followup_date = ${idx}")
        params.append(None)
        idx += 1
        updates.append(f"followup_time = ${idx}")
        params.append(None)
        idx += 1
        updates.append(f"google_task_id = ${idx}")
        params.append(None)
        idx += 1
        updates.append(f"google_calendar_event_id = ${idx}")
        params.append(None)
        idx += 1
    else:
        if payload.followup_date is not None:
            f_date = None
            if payload.followup_date and payload.followup_date.strip():
                try: f_date = datetime.strptime(payload.followup_date.strip(), "%Y-%m-%d").date()
                except: pass
            updates.append(f"followup_date = ${idx}")
            params.append(f_date)
            idx += 1
            if f_date and payload.status is None:
                updates.append("status = CASE WHEN status = 'new' OR status IS NULL THEN 'follow-up' ELSE status END")

        if payload.followup_time is not None:
            f_time = payload.followup_time.strip() if payload.followup_time and payload.followup_time.strip() else None
            updates.append(f"followup_time = ${idx}")
            params.append(f_time)
            idx += 1

    if payload.conversion_rate is not None:
        cr = max(0, min(100, payload.conversion_rate))
        updates.append(f"conversion_rate = ${idx}")
        params.append(cr)
        idx += 1
        if payload.lead_probability is None:
            legacy_lp = "hot" if cr >= 75 else ("cold" if cr <= 35 else "warm")
            updates.append(f"lead_probability = ${idx}")
            params.append(legacy_lp)
            idx += 1
        if cr == 100 and payload.converted is None:
            updates.append(f"converted = ${idx}")
            params.append(True)
            idx += 1

    if payload.call_status is not None:
        cs = payload.call_status.strip()
        updates.append(f"call_status = ${idx}")
        params.append(cs)
        idx += 1
        if payload.status is None:
            cs_lower = cs.lower()
            if "converted" in cs_lower or "confirm" in cs_lower:
                legacy_s = "converted"
                updates.append("converted = true")
            elif "lost" in cs_lower or "wrong" in cs_lower or "blue flag" in cs_lower:
                legacy_s = "lost"
            elif cs_lower in ("new", "new (fresh)", "fresh"):
                legacy_s = "new"
            else:
                # Active in-progress outcome: info, requirements, pricing, booking, not picked, busy, etc.
                legacy_s = "follow-up"
            updates.append(f"status = CASE WHEN customers.converted = true AND ${idx} = 'new' THEN customers.status ELSE ${idx} END")
            params.append(legacy_s)
            idx += 1

    if payload.next_action is not None:
        updates.append(f"next_action = ${idx}")
        params.append(payload.next_action.strip())
        idx += 1

    if payload.primary_concerns is not None:
        clean_concerns = [c.strip() for c in payload.primary_concerns if c and c.strip()]
        updates.append(f"primary_concerns = ${idx}")
        params.append(clean_concerns)
        idx += 1
        if clean_concerns and payload.health_concern is None:
            updates.append(f"health_concern = ${idx}")
            params.append(clean_concerns[0])
            idx += 1

    if payload.interested_services is not None:
        clean_services = [s.strip() for s in payload.interested_services if s and s.strip()]
        updates.append(f"interested_services = ${idx}")
        params.append(clean_services)
        idx += 1

    if payload.deal_value is not None:
        updates.append(f"deal_value = ${idx}")
        params.append(payload.deal_value)
        idx += 1

    if payload.ai_summary is not None:
        updates.append(f"ai_summary = ${idx}")
        params.append(payload.ai_summary.strip() if payload.ai_summary else None)
        idx += 1

    if not updates:
        return {"status": "ok", "message": "No updates provided"}

    updates.append("updated_at = now()")
    set_clause = ", ".join(updates)

    async with database.db_pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""UPDATE customers SET {set_clause}
                WHERE id = $1::uuid AND tenant_id = $2::uuid
                RETURNING id, phone, name, internal_name, metadata, age, location, preferred_doctor, status, health_concern, lead_probability, converted, followup_date, followup_time, conversion_rate, call_status, next_action, primary_concerns, interested_services, deal_value, ai_summary""",
            *params
        )
        if not row:
            raise HTTPException(404, "Customer not found")

        # When follow-up date, time, next action, or customer name is updated, strictly maintain ONE fresh task per customer
        should_sync_followup = (
            payload.followup_date is not None
            or payload.followup_time is not None
            or (row["followup_date"] is not None and (payload.next_action is not None or payload.name is not None))
        )
        if should_sync_followup:
            # 1. Resolve customer display name (explicit name -> WhatsApp profile name -> phone)
            cust_name = await get_customer_display_name(conn, tenant_id, row["phone"], row.get("name"))
            display_name = cust_name if cust_name else (row.get("phone") or "Customer")

            # 2. Delete ALL previous Google Tasks for this customer to guarantee strictly ONE task
            t_svc, _ = await cleanup_and_delete_old_google_tasks(conn, tenant_id, customer_id, row["phone"], cust_name)

            target_gt_id = None
            if row["followup_date"]:
                # Prepare due datetime and notes
                f_date = row["followup_date"]
                if f_date.year < 2000 or f_date.year > 2099:
                    f_date = f_date.replace(year=datetime.now().year)
                f_time_str = row["followup_time"] or "10:00 AM"
                target_time = time(10, 0)
                try:
                    target_time = datetime.strptime(f_time_str.strip(), "%I:%M %p").time()
                except Exception:
                    try:
                        target_time = datetime.strptime(f_time_str.strip(), "%H:%M").time()
                    except Exception:
                        pass
                due_dt = datetime.combine(f_date, target_time)
                if due_dt.tzinfo is None:
                    due_dt = due_dt.replace(tzinfo=ZoneInfo("Asia/Kolkata"))

                req_label = "Requirement"
                t_row = await conn.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
                if t_row:
                    try:
                        if isinstance(t_row, str): t_row = json.loads(t_row)
                        req_label = t_row.get("taxonomy", {}).get("requirement_label") or req_label
                    except Exception:
                        pass

                task_title = f"Follow-up: {display_name}"
                next_act_str = row.get("next_action") or "Follow-up"
                task_notes = (
                    f"Customer: {display_name}\n"
                    f"Phone: {row['phone']}\n"
                    f"Action: {next_act_str}\n"
                    f"{req_label}: {row['health_concern'] or 'General'}\n"
                    f"Lead: {row['lead_probability'] or 'Warm'}\n"
                    f"Follow-up: {row['followup_date']} at {f_time_str}"
                )
                task_payload = {
                    "title": task_title,
                    "notes": task_notes,
                    "due": due_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                    "status": "needsAction",
                }

                # Insert exactly ONE brand new fresh task
                if t_svc:
                    try:
                        ins_res = await asyncio.to_thread(lambda: t_svc.tasks().insert(tasklist="@default", body=task_payload).execute())
                        if ins_res and ins_res.get("id"):
                            target_gt_id = ins_res["id"]
                    except Exception as ex_ins:
                        logger.warning("google_task_insert_warn", error=str(ex_ins))

                # 3. Local DB: delete all existing tasks for this customer to avoid any duplicates
                await conn.execute(
                    "DELETE FROM tasks WHERE customer_id = $1::uuid AND tenant_id = $2::uuid",
                    customer_id, tenant_id
                )

                # 4. Insert exactly ONE current task record
                new_task_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO tasks (id, tenant_id, customer_id, google_task_id, title, description, due_date, completed, notified_due, created_at, updated_at)
                       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, false, false, now(), now())""",
                    new_task_id, tenant_id, customer_id, target_gt_id,
                    task_title,
                    task_notes,
                    due_dt
                )
                await conn.execute(
                    "UPDATE customers SET google_task_id = $1 WHERE id = $2::uuid AND tenant_id = $3::uuid",
                    target_gt_id, customer_id, tenant_id
                )
            else:
                # 3. Follow-up cleared: delete all local tasks and clear customer google_task_id
                await conn.execute(
                    "DELETE FROM tasks WHERE customer_id = $1::uuid AND tenant_id = $2::uuid",
                    customer_id, tenant_id
                )
                await conn.execute(
                    "UPDATE customers SET google_task_id = NULL WHERE id = $1::uuid AND tenant_id = $2::uuid",
                    customer_id, tenant_id
                )

        if payload.internal_name is not None:
            await conn.execute("""
                UPDATE contacts SET internal_name = $1, updated_at = now()
                WHERE tenant_id = $2::uuid AND (phone = $3 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($3, '[^0-9]', '', 'g'), 10))
            """, payload.internal_name.strip() if payload.internal_name else None, tenant_id, row["phone"])

        if payload.health_concern and row:
            await auto_route_lead_to_specialty(conn, tenant_id, row["phone"], payload.health_concern)

    return {
        "id": str(row["id"]),
        "name": row["name"],
        "internal_name": row["internal_name"] or None,
        "metadata": row.get("metadata") or {},
        "age": row["age"],
        "location": row["location"] or None,
        "phone": row["phone"],
        "preferred_doctor": row["preferred_doctor"],
        "status": row["status"],
        "health_concern": row["health_concern"],
        "lead_probability": row["lead_probability"],
        "converted": row["converted"],
        "followup_date": row["followup_date"].isoformat() if row["followup_date"] else None,
        "followup_time": row["followup_time"],
        "conversion_rate": row["conversion_rate"],
        "call_status": row["call_status"],
        "next_action": row["next_action"],
        "primary_concerns": list(row["primary_concerns"]) if row["primary_concerns"] else [],
        "interested_services": list(row["interested_services"]) if row["interested_services"] else [],
        "deal_value": float(row["deal_value"]) if row.get("deal_value") is not None else 0.0,
        "ai_summary": row.get("ai_summary"),
    }


@router.delete("/customers/{customer_id}/followup")
@router.delete("/api/v1/crm/customers/{customer_id}/followup")
async def delete_customer_followup(customer_id: str, tenant_id: str = Depends(get_tenant_id)):
    """Clear and delete the scheduled follow-up for a customer."""
    async with database.db_pool.acquire() as conn:
        cust = await conn.fetchrow(
            "SELECT phone, name FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        if cust:
            cust_name = await get_customer_display_name(conn, tenant_id, cust["phone"], cust.get("name"))
            await cleanup_and_delete_old_google_tasks(conn, tenant_id, customer_id, cust["phone"], cust_name)

        await conn.execute("DELETE FROM tasks WHERE customer_id = $1::uuid AND tenant_id = $2::uuid", customer_id, tenant_id)

        row = await conn.fetchrow(
            """UPDATE customers 
               SET followup_date = NULL, followup_time = NULL, 
                   google_task_id = NULL, google_calendar_event_id = NULL,
                   updated_at = now()
               WHERE id = $1::uuid AND tenant_id = $2::uuid
               RETURNING id, phone, name, followup_date, followup_time""",
            customer_id, tenant_id
        )
        if not row:
            raise HTTPException(404, "Customer not found")

    return {"status": "ok", "message": "Follow-up deleted successfully", "id": customer_id}


@router.get("/customers/duplicates")
@router.get("/api/v1/crm/customers/duplicates")
async def get_duplicate_customers(
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Detect potential duplicate customers within the tenant (matching clean phones or names)."""
    async with database.db_pool.acquire() as conn:
        # Find duplicates by clean 10-digit phone number
        phone_dups = await conn.fetch("""
            WITH grouped AS (
                SELECT 
                    RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) as last10,
                    array_agg(id) as ids,
                    count(*) as cnt
                FROM customers
                WHERE tenant_id = $1::uuid
                  AND length(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) >= 10
                GROUP BY RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)
                HAVING count(*) > 1
            )
            SELECT g.last10, g.ids
            FROM grouped g
            LIMIT 20
        """, tenant_id)

        # Find duplicates by exact name match (excluding generic labels like 'Customer', '.', 'Valued Customer')
        name_dups = await conn.fetch("""
            WITH grouped AS (
                SELECT 
                    LOWER(TRIM(name)) as clean_name,
                    array_agg(id) as ids,
                    count(*) as cnt
                FROM customers
                WHERE tenant_id = $1::uuid
                  AND name IS NOT NULL
                  AND length(TRIM(name)) >= 3
                  AND LOWER(TRIM(name)) NOT IN ('customer', 'valued customer', 'new lead', 'patient', 'lead', 'client')
                GROUP BY LOWER(TRIM(name))
                HAVING count(*) > 1
            )
            SELECT g.clean_name, g.ids
            FROM grouped g
            LIMIT 20
        """, tenant_id)

        all_candidate_ids = set()
        for r in phone_dups:
            all_candidate_ids.update([str(x) for x in r["ids"]])
        for r in name_dups:
            all_candidate_ids.update([str(x) for x in r["ids"]])

        if not all_candidate_ids:
            return {"duplicates": [], "total_groups": 0}

        cust_rows = await conn.fetch("""
            SELECT c.id, c.name, c.internal_name, c.phone, c.status, c.health_concern,
                   c.preferred_doctor, c.last_messaged_at, c.created_at,
                   (SELECT COUNT(*) FROM bookings b JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
                    WHERE b.tenant_id = c.tenant_id AND (ct.phone = c.phone OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g'), 10))) as bookings_count,
                   (SELECT COUNT(*) FROM customer_notes cn WHERE cn.customer_id = c.id AND cn.tenant_id = c.tenant_id) as notes_count
            FROM customers c
            WHERE c.tenant_id = $1::uuid AND c.id = ANY($2::uuid[])
        """, tenant_id, list(all_candidate_ids))

        cust_map = {}
        for r in cust_rows:
            d = dict(r)
            d["id"] = str(d["id"])
            if d.get("last_messaged_at"):
                d["last_messaged_at"] = d["last_messaged_at"].isoformat()
            if d.get("created_at"):
                d["created_at"] = d["created_at"].isoformat()
            cust_map[d["id"]] = d

        duplicate_groups = []
        seen_pairs = set()

        for r in phone_dups:
            ids = [str(x) for x in r["ids"]]
            pair_key = tuple(sorted(ids))
            if pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                group_custs = [cust_map[x] for x in ids if x in cust_map]
                if len(group_custs) > 1:
                    duplicate_groups.append({
                        "reason": f"Same 10-digit mobile number ({r['last10']})",
                        "match_type": "phone",
                        "match_value": r["last10"],
                        "customers": group_custs
                    })

        for r in name_dups:
            ids = [str(x) for x in r["ids"]]
            pair_key = tuple(sorted(ids))
            if pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                group_custs = [cust_map[x] for x in ids if x in cust_map]
                if len(group_custs) > 1:
                    duplicate_groups.append({
                        "reason": f"Same patient name ('{group_custs[0].get('name')}')",
                        "match_type": "name",
                        "match_value": r["clean_name"],
                        "customers": group_custs
                    })

        return {"duplicates": duplicate_groups, "total_groups": len(duplicate_groups)}


@router.post("/customers/merge")
@router.post("/api/v1/crm/customers/merge")
async def merge_customers(
    payload: CustomerMergePayload,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    """Merge one or more secondary customer records into a primary customer record.
    Consolidates bookings, WhatsApp conversations, messages, notes, tasks, reviews,
    and stores secondary phones in metadata->'merged_phones' so future messages route here.
    """
    primary_id = payload.primary_customer_id
    secondary_ids = [sid for sid in payload.secondary_customer_ids if sid != primary_id]
    if not secondary_ids:
        raise HTTPException(400, "At least one valid secondary customer must be specified to merge.")

    async with database.db_pool.acquire() as conn:
        async with conn.transaction():
            # 1. Fetch primary customer
            primary = await conn.fetchrow("""
                SELECT * FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid
            """, primary_id, tenant_id)
            if not primary:
                raise HTTPException(404, f"Primary customer {primary_id} not found.")

            # 2. Fetch secondary customers
            secondaries = await conn.fetch("""
                SELECT * FROM customers WHERE id = ANY($1::uuid[]) AND tenant_id = $2::uuid
            """, secondary_ids, tenant_id)
            if not secondaries:
                raise HTTPException(404, "No secondary customers found matching the IDs.")

            # 3. Find primary contact
            p_phone = primary["phone"]
            clean_p = re.sub(r"[^0-9]", "", p_phone or "")
            p_last10 = clean_p[-10:] if len(clean_p) >= 10 else clean_p

            primary_contact = await conn.fetchrow("""
                SELECT id, metadata FROM contacts
                WHERE tenant_id = $1::uuid
                  AND (phone = $2 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $3)
                ORDER BY created_at ASC LIMIT 1
            """, tenant_id, p_phone, p_last10)

            if not primary_contact:
                # Create contact for primary if missing
                p_contact_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO contacts (id, tenant_id, phone, name, internal_name, metadata)
                    VALUES ($1::uuid, $2::uuid, $3, $4, $5, '{}'::jsonb)
                    ON CONFLICT (tenant_id, phone) DO NOTHING
                """, p_contact_id, tenant_id, p_phone, primary["name"], primary.get("internal_name"))
                primary_contact = await conn.fetchrow("SELECT id, metadata FROM contacts WHERE id = $1::uuid AND tenant_id = $2::uuid", p_contact_id, tenant_id)
            
            p_contact_id = str(primary_contact["id"])

            # 4. Find secondary contacts
            sec_phones = [s["phone"] for s in secondaries if s["phone"]]
            sec_last10s = [re.sub(r"[^0-9]", "", ph)[-10:] for ph in sec_phones if len(re.sub(r"[^0-9]", "", ph)) >= 10]
            
            sec_contacts = await conn.fetch("""
                SELECT id, phone, metadata FROM contacts
                WHERE tenant_id = $1::uuid
                  AND (phone = ANY($2::text[]) OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = ANY($3::text[]))
                  AND id != $4::uuid
            """, tenant_id, sec_phones, sec_last10s, p_contact_id)
            
            sec_contact_ids = [str(sc["id"]) for sc in sec_contacts]

            # 5. Reassign Bookings
            if sec_contact_ids:
                await conn.execute("""
                    UPDATE bookings 
                    SET contact_id = $1::uuid, updated_at = now()
                    WHERE tenant_id = $2::uuid AND contact_id = ANY($3::uuid[])
                """, p_contact_id, tenant_id, sec_contact_ids)

            # 6. Reassign Conversations & Messages
            p_conv = await conn.fetchrow("""
                SELECT id FROM conversations WHERE tenant_id = $1::uuid AND contact_id = $2::uuid
                ORDER BY created_at ASC LIMIT 1
            """, tenant_id, p_contact_id)

            if sec_contact_ids:
                sec_convs = await conn.fetch("""
                    SELECT id FROM conversations 
                    WHERE tenant_id = $1::uuid AND contact_id = ANY($2::uuid[])
                """, tenant_id, sec_contact_ids)

                for sc in sec_convs:
                    s_conv_id = str(sc["id"])
                    if p_conv:
                        p_conv_id = str(p_conv["id"])
                        if s_conv_id != p_conv_id:
                            # Move messages to primary conversation
                            await conn.execute("""
                                UPDATE messages
                                SET conversation_id = $1::uuid
                                WHERE conversation_id = $2::uuid AND tenant_id = $3::uuid
                            """, p_conv_id, s_conv_id, tenant_id)
                            # Delete empty secondary conversation
                            await conn.execute("""
                                DELETE FROM conversations WHERE id = $1::uuid AND tenant_id = $2::uuid
                            """, s_conv_id, tenant_id)
                    else:
                        # Reassign secondary conversation to primary contact
                        await conn.execute("""
                            UPDATE conversations
                            SET contact_id = $1::uuid, updated_at = now()
                            WHERE id = $2::uuid AND tenant_id = $3::uuid
                        """, p_contact_id, s_conv_id, tenant_id)
                        p_conv = {"id": s_conv_id}

            # 7. Reassign Notes and Tasks
            await conn.execute("""
                UPDATE customer_notes
                SET customer_id = $1::uuid
                WHERE tenant_id = $2::uuid AND customer_id = ANY($3::uuid[])
            """, primary_id, tenant_id, secondary_ids)

            await conn.execute("""
                UPDATE tasks
                SET customer_id = $1::uuid
                WHERE tenant_id = $2::uuid AND customer_id = ANY($3::uuid[])
            """, primary_id, tenant_id, secondary_ids)

            # 8. Reassign Customer Reviews
            for sph in sec_phones:
                s_l10 = re.sub(r"[^0-9]", "", sph)[-10:] if len(re.sub(r"[^0-9]", "", sph)) >= 10 else sph
                await conn.execute("""
                    UPDATE customer_reviews
                    SET customer_phone = $1
                    WHERE tenant_id = $2::uuid
                      AND (customer_phone = $3 OR RIGHT(REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g'), 10) = $4)
                """, p_phone, tenant_id, sph, s_l10)

            # 9. Update Metadata with Merged Phones & History
            p_meta = primary.get("metadata") or {}
            if isinstance(p_meta, str):
                try: p_meta = json.loads(p_meta)
                except: p_meta = {}
            if not isinstance(p_meta, dict):
                p_meta = {}

            existing_merged_phones = set(p_meta.get("merged_phones", []))
            for sph in sec_phones:
                if sph and sph != p_phone:
                    clean = re.sub(r"[^0-9]", "", sph)
                    if clean:
                        existing_merged_phones.add(clean)
                        if len(clean) >= 10:
                            existing_merged_phones.add(clean[-10:])
                            existing_merged_phones.add(f"91{clean[-10:]}")
            p_meta["merged_phones"] = sorted(list(existing_merged_phones))

            # Audit merge history
            history = p_meta.get("merge_history", [])
            sec_summaries = [f"{s.get('name') or 'Customer'} ({s.get('phone')})" for s in secondaries]
            history.append({
                "merged_at": datetime.now(timezone.utc).isoformat(),
                "merged_by": caller.get("email") or caller.get("role") or "staff",
                "absorbed_records": sec_summaries
            })
            p_meta["merge_history"] = history

            # Combine concerns and services
            combined_concerns = set(primary.get("primary_concerns") or [])
            if primary.get("health_concern"): combined_concerns.add(primary["health_concern"])
            combined_services = set(primary.get("interested_services") or [])
            
            for s in secondaries:
                if s.get("primary_concerns"):
                    combined_concerns.update(s["primary_concerns"])
                if s.get("health_concern"):
                    combined_concerns.add(s["health_concern"])
                if s.get("interested_services"):
                    combined_services.update(s["interested_services"])

            new_location = primary.get("location") or next((s.get("location") for s in secondaries if s.get("location")), None)
            new_doctor = primary.get("preferred_doctor") or next((s.get("preferred_doctor") for s in secondaries if s.get("preferred_doctor")), None)
            new_age = primary.get("age") or next((s.get("age") for s in secondaries if s.get("age")), None)
            new_internal_name = payload.internal_name.strip() if payload.internal_name else (primary.get("internal_name") or next((s.get("internal_name") for s in secondaries if s.get("internal_name")), None))

            # Update Primary Customer
            await conn.execute("""
                UPDATE customers
                SET metadata = $1::jsonb,
                    internal_name = $2,
                    location = $3,
                    preferred_doctor = $4,
                    age = $5,
                    primary_concerns = $6::text[],
                    interested_services = $7::text[],
                    updated_at = now()
                WHERE id = $8::uuid AND tenant_id = $9::uuid
            """, json.dumps(p_meta), new_internal_name, new_location, new_doctor, new_age,
                list(combined_concerns), list(combined_services), primary_id, tenant_id)

            # Update Primary Contact
            c_meta = primary_contact.get("metadata") or {}
            if isinstance(c_meta, str):
                try: c_meta = json.loads(c_meta)
                except: c_meta = {}
            if not isinstance(c_meta, dict): c_meta = {}
            c_meta["merged_phones"] = p_meta["merged_phones"]
            
            await conn.execute("""
                UPDATE contacts
                SET metadata = $1::jsonb,
                    internal_name = $2,
                    updated_at = now()
                WHERE id = $3::uuid AND tenant_id = $4::uuid
            """, json.dumps(c_meta), new_internal_name, p_contact_id, tenant_id)

            # 10. Log an audit note
            absorbed_text = ", ".join(sec_summaries)
            await conn.execute("""
                INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color, created_at)
                VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'System (Merge)', $3, 'blue', now())
            """, tenant_id, primary_id, f"Merged duplicate profile(s): {absorbed_text}. All appointments, WhatsApp chats, and medical notes unified.")

            # 11. Delete absorbed secondary records
            await conn.execute("""
                DELETE FROM customers WHERE id = ANY($1::uuid[]) AND tenant_id = $2::uuid
            """, secondary_ids, tenant_id)

            if sec_contact_ids:
                await conn.execute("""
                    DELETE FROM contacts WHERE id = ANY($1::uuid[]) AND tenant_id = $2::uuid
                """, sec_contact_ids, tenant_id)

            logger.info("customers_merged", tenant_id=tenant_id, primary_id=primary_id, absorbed_count=len(secondary_ids))

            return {
                "status": "ok",
                "primary_id": primary_id,
                "message": f"Successfully merged {len(secondary_ids)} record(s) into primary profile.",
                "absorbed_records": sec_summaries
            }


@router.get("/dropdown-options")
@router.get("/api/v1/crm/dropdown-options")
@router.get("/crm/dropdown-options")
async def get_crm_dropdown_options(tenant_id: str = Depends(get_tenant_id)):
    """Return configured dropdown options for the tenant with defaults."""
    default_options = {
        "outcome_statuses": [
            "New (Fresh)",
            "Not Picked",
            "Out of Service / Busy",
            "Wrong Number",
            "Info Given & Taken",
            "Requirements Gathered",
            "Pricing Sent",
            "Booking Requested",
            "Confirmed",
            "Converted"
        ],
        "next_actions": [
            "Call Again",
            "WhatsApp Follow-up",
            "Send Info / Proposal",
            "Schedule Meeting / Booking",
            "Send Reminder",
            "Waiting on Client",
            "Final Attempt"
        ],
        "services_list": [
            "Foot Reflexology",
            "Acupuncture",
            "Cupping",
            "Ayurvedic",
            "Consultation",
            "Package"
        ],
        "concerns_list": [
            "Knee pain",
            "Neck pain",
            "Sciatica",
            "Diabetes",
            "Stress",
            "Sleep",
            "Gut issue",
            "Weight"
        ]
    }
    async with database.db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
        if row and row["settings"]:
            settings = row["settings"]
            if isinstance(settings, str):
                try: settings = json.loads(settings)
                except: settings = {}
            saved = settings.get("crm_dropdowns", {})
            if isinstance(saved, dict):
                for k in default_options:
                    if saved.get(k) and isinstance(saved[k], list) and len(saved[k]) > 0:
                        default_options[k] = saved[k]
    return default_options


@router.put("/dropdown-options")
@router.put("/api/v1/crm/dropdown-options")
@router.put("/crm/dropdown-options")
async def update_crm_dropdown_options(
    payload: CrmDropdownsUpdatePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Save custom dropdown options for the tenant."""
    async with database.db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
        settings = {}
        if row and row["settings"]:
            settings = row["settings"]
            if isinstance(settings, str):
                try: settings = json.loads(settings)
                except: settings = {}
        crm_drops = settings.get("crm_dropdowns", {})
        if not isinstance(crm_drops, dict):
            crm_drops = {}
        if payload.outcome_statuses is not None:
            crm_drops["outcome_statuses"] = [x.strip() for x in payload.outcome_statuses if x and x.strip()]
        if payload.next_actions is not None:
            crm_drops["next_actions"] = [x.strip() for x in payload.next_actions if x and x.strip()]
        if payload.services_list is not None:
            crm_drops["services_list"] = [x.strip() for x in payload.services_list if x and x.strip()]
        if payload.concerns_list is not None:
            crm_drops["concerns_list"] = [x.strip() for x in payload.concerns_list if x and x.strip()]
        settings["crm_dropdowns"] = crm_drops

        await conn.execute("UPDATE tenants SET settings = $1 WHERE id = $2::uuid", json.dumps(settings), tenant_id)
    return {"status": "ok", "crm_dropdowns": crm_drops}


@router.get("/notes")
@router.get("/api/v1/crm/notes")
async def list_all_customer_notes(
    tenant_id: str = Depends(get_tenant_id),
    color: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(100, le=200),
    offset: int = 0
):
    """List all customer notes across the tenant with customer context for the Overall Notes tab."""
    async with database.db_pool.acquire() as conn:
        conditions = ["n.tenant_id = $1::uuid"]
        params: List[Any] = [tenant_id]
        idx = 2

        if color and color != "all":
            conditions.append(f"n.color = ${idx}")
            params.append(color)
            idx += 1

        if q:
            conditions.append(f"(n.note_text ILIKE ${idx} OR n.author ILIKE ${idx} OR c.name ILIKE ${idx} OR c.phone ILIKE ${idx})")
            params.append(f"%{q}%")
            idx += 1

        where_clause = " AND ".join(conditions)
        query = f"""
            SELECT 
                n.id, n.customer_id, n.author, n.note_text, COALESCE(n.color, 'slate') AS color, n.created_at,
                c.name AS customer_name, c.phone AS customer_phone, c.preferred_doctor, c.status AS customer_status
            FROM customer_notes n
            LEFT JOIN customers c ON n.customer_id = c.id AND c.tenant_id = n.tenant_id
            WHERE {where_clause}
            ORDER BY n.created_at DESC
            LIMIT ${idx} OFFSET ${idx + 1}
        """
        params.extend([limit, offset])
        rows = await conn.fetch(query, *params)
        return [
            {
                "id": str(r["id"]),
                "customer_id": str(r["customer_id"]),
                "author": r["author"] or "Staff",
                "note_text": r["note_text"],
                "color": r["color"] or "slate",
                "customer_name": r["customer_name"] or "Customer",
                "customer_phone": r["customer_phone"],
                "preferred_doctor": r["preferred_doctor"],
                "customer_status": r["customer_status"] or "new",
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ]


@router.get("/customers/{customer_id}/notes")
@router.get("/api/v1/crm/customers/{customer_id}/notes")
async def list_customer_notes(
    customer_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """List all timestamped notes for a specific customer."""
    async with database.db_pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, customer_id, author, note_text, COALESCE(color, 'slate') AS color, created_at
               FROM customer_notes
               WHERE customer_id = $1::uuid AND tenant_id = $2::uuid
               ORDER BY created_at DESC""",
            customer_id, tenant_id
        )
    return [
        {
            "id": str(r["id"]),
            "customer_id": str(r["customer_id"]),
            "author": r["author"] or "Staff",
            "note_text": r["note_text"],
            "color": r["color"] or "slate",
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        }
        for r in rows
    ]


@router.get("/customers/{customer_id}/bookings")
@router.get("/api/v1/crm/customers/{customer_id}/bookings")
async def list_customer_bookings(
    customer_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """List all appointment records (past and upcoming) for a specific customer."""
    async with database.db_pool.acquire() as conn:
        cust = await conn.fetchrow(
            "SELECT id, phone, name FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        if not cust:
            raise HTTPException(404, "Customer not found")

        phone = cust["phone"]
        clean_phone = re.sub(r"[^0-9]", "", phone)
        last10 = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone

        rows = await conn.fetch(
            """SELECT b.id, b.service, b.start_time, b.end_time, b.status, b.notes,
                      b.staff_member, b.location, b.price, b.currency, b.created_at
               FROM bookings b
               JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
               WHERE b.tenant_id = $1::uuid
                 AND (ct.phone = $2 OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = $3)
               ORDER BY b.start_time DESC""",
            tenant_id, phone, last10
        )
        bookings_list = [
            {
                "id": str(r["id"]),
                "service": r["service"],
                "start_time": r["start_time"].isoformat() if r["start_time"] else None,
                "end_time": r["end_time"].isoformat() if r["end_time"] else None,
                "status": r["status"] or "confirmed",
                "notes": r["notes"] or "",
                "staff_member": r["staff_member"] or None,
                "location": r["location"] or None,
                "price": float(r["price"]) if r["price"] is not None else 0.0,
                "currency": r["currency"] or "INR",
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ]
        completed_b = [r for r in rows if r["status"] in ("completed", "attended")]
        total_rev = sum((float(r["price"]) for r in completed_b if r["price"] is not None), 0.0)
        return {
            "bookings": bookings_list,
            "total_revenue": total_rev,
            "total_sessions": len(rows),
            "completed_sessions": len(completed_b),
        }


@router.post("/customers/{customer_id}/notes")
@router.post("/api/v1/crm/customers/{customer_id}/notes")
async def add_customer_note(
    customer_id: str,
    payload: CustomerNotePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Add a new timestamped note for a customer with color tag."""
    if not payload.note_text.strip():
        raise HTTPException(400, "Note text cannot be empty.")

    note_id = str(uuid.uuid4())
    note_color = (payload.color or "slate").lower().strip()
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color, created_at)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, now())""",
            note_id, tenant_id, customer_id, payload.author or "Admin", payload.note_text.strip(), note_color
        )
    return {"status": "ok", "id": note_id, "customer_id": customer_id, "color": note_color}


@router.post("/notes")
@router.post("/api/v1/crm/notes")
async def create_overall_note(
    payload: CustomerNotePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a note directly from the Overall Notes tab with contact/customer selection."""
    if not payload.note_text.strip():
        raise HTTPException(400, "Note text cannot be empty.")
    if not payload.customer_id:
        raise HTTPException(400, "Please select a customer for this note.")

    note_id = str(uuid.uuid4())
    note_color = (payload.color or "slate").lower().strip()
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color, created_at)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, now())""",
            note_id, tenant_id, payload.customer_id, payload.author or "Staff", payload.note_text.strip(), note_color
        )
    return {"status": "ok", "id": note_id, "customer_id": payload.customer_id, "color": note_color}


@router.delete("/notes/{note_id}")
@router.delete("/api/v1/crm/notes/{note_id}")
@router.delete("/customers/{customer_id}/notes/{note_id}")
@router.delete("/api/v1/crm/customers/{customer_id}/notes/{note_id}")
async def delete_customer_note(
    note_id: str,
    customer_id: Optional[str] = None,
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a customer note."""
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM customer_notes WHERE id = $1::uuid AND tenant_id = $2::uuid",
            note_id, tenant_id
        )
    return {"status": "success", "id": note_id}


@router.delete("/customers/{customer_id}/latest-note")
@router.delete("/api/v1/crm/customers/{customer_id}/latest-note")
async def delete_customer_latest_note(
    customer_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete the most recent note for a customer."""
    async with database.db_pool.acquire() as conn:
        latest_id = await conn.fetchval(
            "SELECT id FROM customer_notes WHERE customer_id = $1::uuid AND tenant_id = $2::uuid ORDER BY created_at DESC LIMIT 1",
            customer_id, tenant_id
        )
        if latest_id:
            await conn.execute("DELETE FROM customer_notes WHERE id = $1::uuid AND tenant_id = $2::uuid", latest_id, tenant_id)
    return {"status": "success", "customer_id": customer_id, "deleted_note_id": str(latest_id) if latest_id else None}


@router.put("/customers/{customer_id}/notes/{note_id}")
@router.put("/api/v1/crm/customers/{customer_id}/notes/{note_id}")
@router.put("/notes/{note_id}")
@router.put("/api/v1/crm/notes/{note_id}")
async def update_customer_note(
    note_id: str,
    payload: CustomerNotePayload,
    customer_id: Optional[str] = None,
    tenant_id: str = Depends(get_tenant_id)
):
    """Update an existing customer note."""
    if not payload.note_text.strip():
        raise HTTPException(400, "Note text cannot be empty.")
    note_color = (payload.color or "slate").lower().strip()
    async with database.db_pool.acquire() as conn:
        res = await conn.execute(
            """UPDATE customer_notes
               SET note_text = $1, color = $2, author = COALESCE($3, author)
               WHERE id = $4::uuid AND tenant_id = $5::uuid""",
            payload.note_text.strip(), note_color, payload.author or "Staff", note_id, tenant_id
        )
        if customer_id:
            pass  # note belongs to customer_notes table; no denormalized column on customers
    return {"status": "ok", "id": note_id, "note_text": payload.note_text.strip(), "color": note_color}


@router.post("/customers/{customer_id}/summarize-chat")
@router.post("/api/v1/crm/customers/{customer_id}/summarize-chat")
async def summarize_customer_chat(
    customer_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Summarize what went on in WhatsApp chats into a clean, simple note for staff."""
    async with database.db_pool.acquire() as conn:
        cust = await conn.fetchrow(
            "SELECT phone, name, health_concern FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        if not cust:
            raise HTTPException(404, "Customer not found")

        phone = cust["phone"].replace("+", "").replace(" ", "").replace("-", "").strip()

        conv = await conn.fetchrow(
            """SELECT c.id
               FROM conversations c
               JOIN contacts ct ON c.contact_id = ct.id AND ct.tenant_id = c.tenant_id
               WHERE c.tenant_id = $2::uuid
                 AND (
                   ct.phone = $1 
                   OR REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g') = $1
                   OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT($1, 10)
                 )
               ORDER BY c.last_message_at DESC NULLS LAST LIMIT 1""",
            phone, tenant_id
        )

        if not conv:
            return {"status": "ok", "summary": None, "message": "No conversation found for this customer."}

        msg_rows = await conn.fetch(
            """SELECT direction, body, content_type, template_name, created_at
               FROM messages
               WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid
               ORDER BY created_at DESC LIMIT 15""",
            conv["id"], tenant_id
        )

        if not msg_rows:
            return {"status": "ok", "summary": None, "message": "No chat messages found to summarize."}

        msgs = list(reversed(msg_rows))
        dialogue = []
        customer_last_query = ""
        for m in msgs:
            role = "Customer" if m["direction"] == "inbound" else "Assistant"
            text = (m["body"] or "").strip()
            if not text:
                if m.get("template_name"): text = f"Sent template {m['template_name']}"
                elif m.get("content_type"): text = f"Shared {m['content_type']}"
            if text:
                dialogue.append(f"{role}: {text}")
                if role == "Customer":
                    customer_last_query = text

        conversation_str = "\n".join(dialogue)

        summary = None
        gkey = None
        try:
            gemini_key_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = $2 AND is_active = true",
                tenant_id, "gemini"
            )
            if gemini_key_row and gemini_key_row.get("credential_data"):
                cdata = gemini_key_row["credential_data"]
                if isinstance(cdata, str):
                    try:
                        cdata = json.loads(cdata)
                    except Exception:
                        cdata = {}
                gkey = cdata.get("api_key") or cdata.get("apiKey")
        except Exception as _k_err:
            logger.warning("fetch_gemini_key_failed", error=str(_k_err))

        if not gkey:
            gkey = os.getenv("GEMINI_API_KEY")

        if gkey and len(dialogue) >= 1:
            try:
                import httpx
                prompt = (
                    "You are a CRM assistant. In 1 concise sentence (under 15 words, plain English, no robotic tags or jargon), "
                    "summarize what the customer discussed, inquired about, or requested in this WhatsApp chat. "
                    "Example: 'Inquired about WhatsApp automation pricing and requested callback.'\n\n"
                    f"Chat Conversation:\n{conversation_str}\n\nConcise 1-sentence note:"
                )
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={gkey}",
                        json={"contents": [{"parts": [{"text": prompt}]}]}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                        if raw_text:
                            summary = raw_text.replace('"', '').replace('\n', ' ').strip()
            except Exception as e_ai:
                logger.warning("gemini_chat_summary_failed", error=str(e_ai))

        if not summary:
            concern = cust.get("health_concern")
            if customer_last_query and len(customer_last_query) < 80:
                summary = f"Customer inquired: {customer_last_query}"
            elif any(m["direction"] == "outbound" for m in msgs) and not any(m["direction"] == "inbound" for m in msgs):
                summary = "Automated outreach sent via WhatsApp. Waiting for customer response."
            elif concern and concern != "General Consultation":
                summary = f"Inquired about {concern} via WhatsApp."
            else:
                summary = "Active conversation on WhatsApp regarding services."

        # Update customer ai_summary
        await conn.execute(
            "UPDATE customers SET ai_summary = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
            summary, customer_id, tenant_id
        )

        # Record in customer_notes
        note_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color, created_at)
               VALUES ($1::uuid, $2::uuid, $3::uuid, 'AI Chat Summary', $4, 'blue', now())""",
            note_id, tenant_id, customer_id, summary
        )

        return {"status": "ok", "summary": summary, "note_id": note_id}


@router.get("/customers/{customer_id}/chat")
@router.get("/api/v1/crm/customers/{customer_id}/chat")
async def get_customer_chat_history(
    customer_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Get full WhatsApp chat history, first/last message timestamps, and unread count for a customer."""
    async with database.db_pool.acquire() as conn:
        cust = await conn.fetchrow(
            "SELECT phone, name FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        if not cust:
            raise HTTPException(404, "Customer not found")

        phone = cust["phone"].replace("+", "").replace(" ", "").replace("-", "").strip()

        # Find conversation joined with messages using resilient phone matching
        conv = await conn.fetchrow(
            """SELECT c.id, c.status, c.last_message_at, c.unread_count
               FROM conversations c
               JOIN contacts ct ON c.contact_id = ct.id AND ct.tenant_id = c.tenant_id
               WHERE c.tenant_id = $2::uuid
                 AND (
                   ct.phone = $1 
                   OR REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g') = $1
                   OR RIGHT(REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g'), 10) = RIGHT($1, 10)
                 )
               ORDER BY c.last_message_at DESC NULLS LAST LIMIT 1""",
            phone, tenant_id
        )

        messages = []
        first_msg_at = None
        last_msg_at = None
        unread_count = 0
        conv_id = None

        if conv:
            conv_id = str(conv["id"])
            unread_count = 0
            await conn.execute(
                "UPDATE conversations SET unread_count = 0 WHERE id = $1::uuid AND tenant_id = $2::uuid",
                conv["id"], tenant_id
            )
            await conn.execute(
                """UPDATE messages SET status = 'read'
                   WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid
                     AND direction = 'inbound' AND status != 'read'""",
                conv["id"], tenant_id
            )
            msg_rows = await conn.fetch(
                """SELECT id, direction, content_type, body, media_url, template_name, status, ai_model_used, ai_used_fallback, created_at
                   FROM messages
                   WHERE conversation_id = $1::uuid AND tenant_id = $2::uuid
                   ORDER BY created_at ASC""",
                conv_id, tenant_id
            )
            if msg_rows:
                first_msg_at = msg_rows[0]["created_at"].isoformat() if msg_rows[0]["created_at"] else None
                last_msg_at = msg_rows[-1]["created_at"].isoformat() if msg_rows[-1]["created_at"] else None
                messages = []
                for m in msg_rows:
                    b = m["body"]
                    if not b or not str(b).strip():
                        ct = m.get("content_type")
                        if ct == "image": b = "📷 [Photo]"
                        elif ct == "video": b = "🎥 [Video]"
                        elif ct == "document": b = "📄 [Document]"
                        elif ct == "audio": b = "🎵 [Audio]"
                        elif ct == "sticker": b = "🏷️ [Sticker]"
                        elif ct == "location": b = "📍 [Location]"
                        elif m.get("template_name"): b = f"📋 [Template: {m['template_name']}]"
                        else: b = "[Message]"
                    messages.append({
                        "id": str(m["id"]),
                        "direction": m["direction"],
                        "content_type": m.get("content_type") or "text",
                        "body": b,
                        "media_url": m.get("media_url"),
                        "template_name": m.get("template_name"),
                        "status": m["status"],
                        "ai_generated": bool(m.get("ai_model_used") or m.get("ai_used_fallback")),
                        "created_at": m["created_at"].isoformat() if m["created_at"] else None,
                    })

    return {
        "customer_id": customer_id,
        "conversation_id": conv_id,
        "phone": phone,
        "name": cust["name"],
        "first_message_at": first_msg_at,
        "last_message_at": last_msg_at,
        "unread_count": unread_count,
        "messages": messages,
    }


@router.post("/customers/{customer_id}/chat")
@router.post("/api/v1/crm/customers/{customer_id}/chat")
async def send_customer_chat_message(
    customer_id: str,
    payload: CustomerChatSendPayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Send an outbound WhatsApp message directly to the customer."""
    if not payload.message.strip():
        raise HTTPException(400, "Message cannot be empty.")

    async with database.db_pool.acquire() as conn:
        cust = await conn.fetchrow(
            "SELECT phone, name FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        if not cust:
            raise HTTPException(404, "Customer not found")

        phone = cust["phone"]
        # Look up active WhatsApp credentials for direct text dispatch
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
                except Exception: d = {}
            creds = dict(d)

        phone_id = creds.get("phone_number_id")
        token = creds.get("access_token")
        clean_phone = re.sub(r'[^0-9]', '', str(phone))
        if len(clean_phone) == 10:
            clean_phone = f"91{clean_phone}"

        sent = False
        wa_id = None
        if phone_id and token and not str(token).startswith("EAAB_test"):
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
            msg_payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": clean_phone,
                "type": "text",
                "text": {"preview_url": False, "body": payload.message.strip()}
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, headers=headers, json=msg_payload)
                    if resp.status_code in (200, 201):
                        sent = True
                        data = resp.json()
                        wa_id = data.get("messages", [{}])[0].get("id")
                    else:
                        logger.error("direct_customer_chat_dispatch_failed", status=resp.status_code, body=resp.text, phone=clean_phone)
            except Exception as e:
                logger.error("direct_customer_chat_dispatch_error", error=str(e), phone=clean_phone)

        # Record outbound message in conversation history and update customer touchpoint
        conv = await conn.fetchrow(
            """SELECT id FROM conversations WHERE tenant_id = $1::uuid
               AND contact_id IN (SELECT id FROM contacts WHERE tenant_id = $1::uuid AND (phone = $2 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = RIGHT($2, 10)))
               ORDER BY last_message_at DESC NULLS LAST LIMIT 1""",
            tenant_id, clean_phone
        )
        if conv:
            await conn.execute(
                """INSERT INTO messages (id, conversation_id, tenant_id, wa_message_id, direction, content_type, body, status, created_at)
                   VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, 'outbound', 'text', $4, $5, now())""",
                conv["id"], tenant_id, wa_id, payload.message.strip(), "sent" if sent else "failed"
            )
            await conn.execute("UPDATE conversations SET last_message_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", conv["id"], tenant_id)

        await conn.execute("UPDATE customers SET last_messaged_at = now(), updated_at = now() WHERE id = $1::uuid AND tenant_id = $2::uuid", customer_id, tenant_id)

    return {"status": "sent" if sent else "failed", "phone": phone, "message": payload.message.strip(), "wa_message_id": wa_id}



@router.get("/customers/{customer_id}/bookings")
@router.get("/api/v1/crm/customers/{customer_id}/bookings")
async def get_customer_bookings(
    customer_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all bookings for a customer (matched by phone), plus total revenue."""
    async with database.db_pool.acquire() as conn:
        cust = await conn.fetchrow(
            "SELECT phone, name FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        if not cust:
            raise HTTPException(404, "Customer not found")

        phone = cust["phone"].replace("+", "").replace(" ", "").replace("-", "").strip()

        rows = await conn.fetch(
            """SELECT b.id, b.service, b.start_time, b.end_time, b.status,
                      b.notes, b.price, b.currency, b.created_at
               FROM bookings b
               JOIN contacts ct ON b.contact_id = ct.id AND ct.tenant_id = b.tenant_id
               WHERE b.tenant_id = $1::uuid
                 AND REGEXP_REPLACE(ct.phone, '[^0-9]', '', 'g') = $2
               ORDER BY b.start_time DESC
               LIMIT 50""",
            tenant_id, phone
        )

    bookings = [
        {
            "id": str(r["id"]),
            "service": r["service"] or "",
            "start_time": r["start_time"].isoformat() if r["start_time"] else "",
            "end_time": r["end_time"].isoformat() if r["end_time"] else "",
            "status": r["status"] or "confirmed",
            "notes": r["notes"] or "",
            "price": float(r["price"]) if r["price"] is not None else 0.0,
            "currency": r["currency"] or "INR",
            "created_at": r["created_at"].isoformat() if r["created_at"] else "",
        }
        for r in rows
    ]
    total_revenue = sum(b["price"] for b in bookings if b["status"] != "cancelled")
    return {
        "bookings": bookings,
        "total_revenue": total_revenue,
        "total_sessions": len(bookings),
        "completed_sessions": sum(1 for b in bookings if b["status"] == "completed"),
    }


@router.get("/tasks")
@router.get("/api/v1/crm/tasks")
async def list_tasks(
    tenant_id: str = Depends(get_tenant_id),
    filter: Optional[str] = Query("all", pattern="^(all|today|upcoming|overdue|completed)$")
):
    """List follow-up tasks with visual overdue indicator and customer context."""
    async with database.db_pool.acquire() as conn:
        conditions = ["t.tenant_id = $1::uuid"]
        if filter == "today":
            conditions.append("t.due_date::date = CURRENT_DATE AND t.completed = false")
        elif filter == "upcoming":
            conditions.append("t.due_date::date >= CURRENT_DATE AND t.completed = false")
        elif filter == "overdue":
            conditions.append("t.due_date::date < CURRENT_DATE AND t.completed = false")
        elif filter == "completed":
            conditions.append("t.completed = true")

        where_clause = " AND ".join(conditions)
        query = f"""
            SELECT 
                t.id, t.tenant_id, t.customer_id, t.google_task_id, t.google_event_id, t.title,
                t.description, t.due_date, t.completed, t.created_at,
                c.name AS customer_name, c.phone AS customer_phone,
                c.preferred_doctor, c.health_concern, c.lead_probability,
                CASE WHEN t.due_date::date < CURRENT_DATE AND t.completed = false THEN true ELSE false END AS is_overdue
            FROM tasks t
            LEFT JOIN customers c ON t.customer_id = c.id AND c.tenant_id = t.tenant_id
            WHERE {where_clause}
            ORDER BY t.completed ASC, t.due_date ASC
        """
        rows = await conn.fetch(query, tenant_id)

    return [
        {
            "id": str(r["id"]),
            "customer_id": str(r["customer_id"]) if r["customer_id"] else None,
            "google_task_id": r["google_task_id"],
            "google_event_id": r.get("google_event_id"),
            "title": r["title"],
            "description": r["description"],
            "due_date": r["due_date"].isoformat() if r["due_date"] else None,
            "completed": bool(r["completed"]),
            "is_overdue": bool(r["is_overdue"]),
            "customer_name": r["customer_name"] or "Customer",
            "customer_phone": r["customer_phone"],
            "preferred_doctor": r["preferred_doctor"],
            "health_concern": r["health_concern"],
            "lead_probability": r["lead_probability"] or "warm",
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        }
        for r in rows
    ]


@router.post("/tasks")
@router.post("/api/v1/crm/tasks")
async def create_task(
    payload: TaskCreatePayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new follow-up task with optional Google Tasks and Google Calendar sync."""
    task_id = str(uuid.uuid4())
    due_dt = None
    due_iso = None
    if payload.due_date:
        try:
            due_dt = datetime.fromisoformat(payload.due_date.replace("Z", "+00:00"))
            if due_dt.year < 2000 or due_dt.year > 2099:
                due_dt = due_dt.replace(year=datetime.now().year)
            if due_dt.tzinfo is None:
                due_dt = due_dt.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
            due_iso = due_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        except Exception:
            due_dt = datetime.now(ZoneInfo("Asia/Kolkata")) + timedelta(days=1)
            due_iso = due_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    else:
        due_dt = datetime.now(ZoneInfo("Asia/Kolkata")) + timedelta(days=1)
        due_iso = due_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    google_task_id = None
    google_event_id = None
    tasks_permission_needed = False

    # Fetch customer details if linked
    cust_info = None
    cust_name = ""
    if payload.customer_id:
        async with database.db_pool.acquire() as conn:
            cust_info = await conn.fetchrow(
                "SELECT name, phone, preferred_doctor, health_concern FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
                payload.customer_id, tenant_id
            )
            if cust_info:
                cust_name = await get_customer_display_name(conn, tenant_id, cust_info["phone"], cust_info.get("name"))
            # Also store note in customer_notes so it shows in customer history & Overall Notes
            if payload.description and payload.description.strip():
                note_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color, created_at)
                       VALUES ($1::uuid, $2::uuid, $3::uuid, 'Staff', $4, 'blue', now())""",
                    note_id, tenant_id, payload.customer_id, payload.description.strip()
                )

    task_title_final = payload.title.strip()
    if cust_name and cust_name.lower() not in task_title_final.lower():
        task_title_final = f"{task_title_final} - {cust_name}"

    if payload.sync_google_tasks or payload.sync_google_calendar:
        async with database.db_pool.acquire() as conn:
            g_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                tenant_id
            )
        r_token, c_id, c_secret = None, None, None
        if g_row and g_row["credential_data"]:
            try:
                d = g_row["credential_data"]
                if isinstance(d, str): d = json.loads(d)
                r_token = d.get("refresh_token")
                c_id = d.get("client_id")
                c_secret = d.get("client_secret")
            except Exception:
                pass

        if r_token and c_id and c_secret:
            try:
                from google.oauth2.credentials import Credentials
                from googleapiclient.discovery import build
                # Do NOT pass scopes here so refresh token uses already consented scopes without failing
                creds = Credentials(
                    token=None, refresh_token=r_token, token_uri="https://oauth2.googleapis.com/token",
                    client_id=c_id, client_secret=c_secret
                )
                if payload.sync_google_tasks:
                    try:
                        if payload.customer_id:
                            async with database.db_pool.acquire() as conn:
                                await cleanup_and_delete_old_google_tasks(
                                    conn, tenant_id, payload.customer_id,
                                    cust_info["phone"] if cust_info else None,
                                    cust_name
                                )
                        tasks_service = await asyncio.to_thread(build, "tasks", "v1", credentials=creds)
                        task_notes = payload.description or ""
                        if cust_info:
                            c_parts = []
                            display_customer = cust_name or cust_info.get("name")
                            if display_customer: c_parts.append(f"Customer: {display_customer}")
                            if cust_info.get("phone"): c_parts.append(f"Phone: {cust_info['phone']}")
                            if c_parts:
                                task_notes = f"{task_notes}\n\n{' | '.join(c_parts)}" if task_notes else " | ".join(c_parts)
                        ins_task_req = tasks_service.tasks().insert(
                            tasklist="@default",
                            body={
                                "title": task_title_final,
                                "notes": task_notes.strip(),
                                "due": due_iso
                            }
                        )
                        gt_res = await asyncio.to_thread(lambda: ins_task_req.execute())
                        if gt_res and gt_res.get("id"):
                            google_task_id = gt_res["id"]
                    except Exception as e_gt:
                        err_str = str(e_gt)
                        if "insufficientPermissions" in err_str or "invalid_scope" in err_str:
                            tasks_permission_needed = True
                        logger.warning("create_task_google_tasks_sync_error", error=err_str)

                if payload.sync_google_calendar:
                    try:
                        cal_service = await asyncio.to_thread(build, "calendar", "v3", credentials=creds)
                        start_time = due_dt.strftime("%Y-%m-%dT%H:%M:%SZ") if not due_dt.tzinfo else due_dt.isoformat()
                        end_dt = due_dt + timedelta(minutes=30)
                        end_time = end_dt.strftime("%Y-%m-%dT%H:%M:%SZ") if not end_dt.tzinfo else end_dt.isoformat()
                        cal_desc = payload.description or ""
                        if cust_info:
                            c_parts = []
                            display_customer = cust_name or cust_info.get("name")
                            if display_customer: c_parts.append(f"Customer: {display_customer}")
                            if cust_info.get("phone"): c_parts.append(f"Phone: {cust_info['phone']}")
                            if c_parts:
                                cal_desc = f"{cal_desc}\n\n{' | '.join(c_parts)}" if cal_desc else " | ".join(c_parts)
                        ins_cal_req = cal_service.events().insert(
                            calendarId="primary",
                            body={
                                "summary": task_title_final,
                                "description": cal_desc.strip(),
                                "start": {"dateTime": start_time},
                                "end": {"dateTime": end_time}
                            }
                        )
                        event_res = await asyncio.to_thread(lambda: ins_cal_req.execute())
                        if event_res and event_res.get("id"):
                            google_event_id = event_res["id"]
                    except Exception as e_cal:
                        logger.warning("create_task_google_cal_sync_error", error=str(e_cal))
            except Exception as ex:
                logger.warning("google_sync_init_error", error=str(ex))

    async with database.db_pool.acquire() as conn:
        if payload.customer_id:
            await conn.execute(
                "DELETE FROM tasks WHERE customer_id = $1::uuid AND tenant_id = $2::uuid",
                payload.customer_id, tenant_id
            )
        await conn.execute(
            """INSERT INTO tasks (id, tenant_id, customer_id, google_task_id, google_event_id, title, description, due_date, completed, notified_due, created_at, updated_at)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, false, false, now(), now())""",
            task_id, tenant_id, payload.customer_id if payload.customer_id else None,
            google_task_id, google_event_id, task_title_final, payload.description, due_dt
        )
        if payload.customer_id:
            await conn.execute(
                "UPDATE customers SET google_task_id = $1 WHERE id = $2::uuid AND tenant_id = $3::uuid",
                google_task_id, payload.customer_id, tenant_id
            )

    return {
        "status": "ok",
        "id": task_id,
        "title": payload.title,
        "due_date": due_dt.isoformat() if due_dt else None,
        "google_task_id": google_task_id,
        "google_event_id": google_event_id,
        "google_tasks_synced": bool(google_task_id),
        "google_calendar_synced": bool(google_event_id),
        "tasks_permission_needed": tasks_permission_needed
    }


@router.delete("/tasks/{task_id}")
@router.delete("/api/v1/crm/tasks/{task_id}")
async def delete_task(
    task_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a follow-up task and remove from Google Tasks and Calendar if synced."""
    async with database.db_pool.acquire() as conn:
        task = await conn.fetchrow(
            "SELECT id, google_task_id, google_event_id FROM tasks WHERE id = $1::uuid AND tenant_id = $2::uuid",
            task_id, tenant_id
        )
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        google_task_id = task["google_task_id"]
        google_event_id = task.get("google_event_id")

        if google_task_id or google_event_id:
            g_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                tenant_id
            )
            if g_row and g_row["credential_data"]:
                try:
                    d = g_row["credential_data"]
                    if isinstance(d, str): d = json.loads(d)
                    r_token = d.get("refresh_token")
                    c_id = d.get("client_id")
                    c_secret = d.get("client_secret")
                    if r_token and c_id and c_secret:
                        from google.oauth2.credentials import Credentials
                        from googleapiclient.discovery import build
                        creds = Credentials(
                            token=None, refresh_token=r_token, token_uri="https://oauth2.googleapis.com/token",
                            client_id=c_id, client_secret=c_secret
                        )
                        if google_task_id and not google_task_id.startswith("gtask_"):
                            try:
                                t_svc = await asyncio.to_thread(build, "tasks", "v1", credentials=creds)
                                del_task_req = t_svc.tasks().delete(tasklist="@default", task=google_task_id)
                                await asyncio.to_thread(lambda: del_task_req.execute())
                            except Exception as e_gt:
                                logger.warning("delete_google_task_error", error=str(e_gt))

                        if google_event_id:
                            try:
                                c_svc = await asyncio.to_thread(build, "calendar", "v3", credentials=creds)
                                del_cal_req = c_svc.events().delete(calendarId="primary", eventId=google_event_id)
                                await asyncio.to_thread(lambda: del_cal_req.execute())
                            except Exception as e_cal:
                                logger.warning("delete_google_event_error", error=str(e_cal))
                except Exception as ex:
                    logger.warning("delete_task_google_cleanup_error", error=str(ex))

        await conn.execute(
            "DELETE FROM tasks WHERE id = $1::uuid AND tenant_id = $2::uuid",
            task_id, tenant_id
        )

    return {"status": "success", "id": task_id}


@router.patch("/tasks/{task_id}/toggle")
@router.patch("/api/v1/crm/tasks/{task_id}/toggle")
async def toggle_task_completion(
    task_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Toggle task completion status and sync status to Google Tasks API."""
    async with database.db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT completed, customer_id, google_task_id FROM tasks WHERE id = $1::uuid AND tenant_id = $2::uuid",
            task_id, tenant_id
        )
        if not row:
            raise HTTPException(404, "Task not found")

        new_status = not row["completed"]
        await conn.execute(
            "UPDATE tasks SET completed = $1, updated_at = now() WHERE id = $2::uuid AND tenant_id = $3::uuid",
            new_status, task_id, tenant_id
        )

        gt_id = row.get("google_task_id")
        if gt_id and not gt_id.startswith("gtask_") and not gt_id.startswith("local_"):
            g_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
                tenant_id
            )
            if g_row and g_row["credential_data"]:
                try:
                    d = g_row["credential_data"]
                    if isinstance(d, str): d = json.loads(d)
                    r_token = d.get("refresh_token")
                    c_id = (d.get("client_id") or "").strip() or os.getenv("GOOGLE_CLIENT_ID", "").strip()
                    c_secret = (d.get("client_secret") or "").strip() or os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
                    if r_token and c_id and c_secret:
                        from google.oauth2.credentials import Credentials
                        from googleapiclient.discovery import build
                        creds = Credentials(
                            token=None, refresh_token=r_token, token_uri="https://oauth2.googleapis.com/token",
                            client_id=c_id, client_secret=c_secret
                        )
                        t_svc = await asyncio.to_thread(build, "tasks", "v1", credentials=creds)
                        patch_body = {"status": "completed"} if new_status else {"status": "needsAction", "completed": None}
                        patch_req = t_svc.tasks().patch(tasklist="@default", task=gt_id, body=patch_body)
                        await asyncio.to_thread(lambda: patch_req.execute())
                except Exception as e_gt:
                    logger.warning("toggle_task_google_patch_error", task_id=task_id, error=str(e_gt))

    return {"status": "ok", "id": task_id, "completed": new_status}


@router.post("/tasks/sync-google-completed")
@router.post("/api/v1/crm/tasks/sync-google-completed")
@router.get("/tasks/sync-google-completed")
@router.get("/api/v1/crm/tasks/sync-google-completed")
async def endpoint_sync_google_tasks_completed(tenant_id: str = Depends(get_tenant_id)):
    """Manually trigger two-way Google Tasks completion sync."""
    async with database.db_pool.acquire() as conn:
        res = await sync_completed_google_tasks_for_tenant(conn, tenant_id)
        return res


@router.post("/customers/{customer_id}/google-tasks")
@router.post("/api/v1/crm/customers/{customer_id}/google-tasks")
async def sync_customer_to_google_tasks(
    customer_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a follow-up task in Google Tasks API pre-filled with customer details."""
    async with database.db_pool.acquire() as conn:
        cust = await conn.fetchrow(
            "SELECT * FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        if not cust:
            raise HTTPException(404, "Customer not found")

        # Check for Google credentials
        g_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true",
            tenant_id
        )
        g_data = {}
        if g_row and g_row["credential_data"]:
            d = g_row["credential_data"]
            if isinstance(d, str):
                try: d = json.loads(d)
                except: d = {}
            g_data = dict(d)

        r_token = g_data.get("refresh_token")
        c_id = g_data.get("client_id")
        c_secret = g_data.get("client_secret")

        if not r_token or not c_id or not c_secret:
            raise HTTPException(400, "Google Tasks is not connected. Please connect Google in Settings.")

        google_task_id = f"gtask_{uuid.uuid4().hex[:12]}"
        f_date = cust["followup_date"]
        if f_date and (f_date.year < 2000 or f_date.year > 2099):
            f_date = f_date.replace(year=datetime.now().year)
        due_iso = f"{f_date.isoformat()}T10:00:00.000Z" if f_date else f"{(datetime.utcnow() + timedelta(days=1)).strftime('%Y-%m-%d')}T10:00:00.000Z"
        due_dt = datetime.fromisoformat(due_iso.replace("Z", "+00:00"))
        if due_dt.tzinfo is None:
            due_dt = due_dt.replace(tzinfo=ZoneInfo("Asia/Kolkata"))

        req_label = "Requirement"
        t_row = await conn.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
        if t_row:
            try:
                if isinstance(t_row, str): t_row = json.loads(t_row)
                req_label = t_row.get("taxonomy", {}).get("requirement_label") or req_label
            except Exception: pass

        google_cal_id = cust.get("google_calendar_event_id") if "google_calendar_event_id" in cust else None

        # Resolve customer name
        cust_name = await get_customer_display_name(conn, tenant_id, cust["phone"], cust.get("name"))
        display_name = cust_name if cust_name else (cust["phone"] or "Customer")

        # Attempt live Google Tasks & Google Calendar API dispatch
        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build

            creds = Credentials(
                token=None,
                refresh_token=r_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=c_id,
                client_secret=c_secret
            )

            # 1. Google Tasks API dispatch: delete old tasks, then insert fresh task
            try:
                await cleanup_and_delete_old_google_tasks(conn, tenant_id, customer_id, cust["phone"], cust_name)
                tasks_service = await asyncio.to_thread(build, "tasks", "v1", credentials=creds)
                next_act_str = cust.get("next_action") or "Follow-up"
                task_notes = (
                    f"Customer: {display_name}\n"
                    f"Phone: {cust['phone']}\n"
                    f"Action: {next_act_str}\n"
                    f"{req_label}: {cust['health_concern'] or 'General'}\n"
                    f"Lead: {cust['lead_probability'].upper() if cust['lead_probability'] else 'WARM'}\n"
                    f"Follow-up: {cust['followup_date']} at {cust['followup_time'] or '10:00 AM'}"
                )
                task_body = {
                    "title": f"Follow-up: {display_name}",
                    "notes": task_notes,
                    "due": due_iso,
                }
                ins_req = tasks_service.tasks().insert(tasklist="@default", body=task_body)
                res = await asyncio.to_thread(lambda: ins_req.execute())
                if res and res.get("id"):
                    google_task_id = res["id"]
                    logger.info("google_task_created_successfully", task_id=google_task_id, customer_id=customer_id)
            except Exception as ex_t:
                logger.warning("google_tasks_api_dispatch_warn", error=str(ex_t))

            # 2. Google Calendar API dispatch
            try:
                cal_service = await asyncio.to_thread(build, "calendar", "v3", credentials=creds)
                f_time_str = cust["followup_time"] or "10:00 AM"
                f_date_val = cust["followup_date"] or (datetime.utcnow().date() + timedelta(days=1))
                t_obj = time(10, 0)
                try:
                    t_obj = datetime.strptime(f_time_str.strip(), "%I:%M %p").time()
                except Exception:
                    try: t_obj = datetime.strptime(f_time_str.strip(), "%H:%M").time()
                    except Exception: pass
                
                start_comb = datetime.combine(f_date_val, t_obj)
                end_comb = start_comb + timedelta(minutes=30)
                
                t_tz = "Asia/Kolkata"
                tz_row = await conn.fetchval("SELECT settings FROM tenants WHERE id = $1::uuid", tenant_id)
                if tz_row:
                    try:
                        if isinstance(tz_row, str): tz_row = json.loads(tz_row)
                        if tz_row.get("timezone"): t_tz = tz_row["timezone"]
                    except: pass

                cal_event_body = {
                    "summary": f"Follow-up: {display_name}",
                    "description": f"Customer Follow-up\nPhone: {cust['phone']}\n{req_label}: {cust['health_concern']}\nStaff: {cust['preferred_doctor']}\nLead: {cust['lead_probability'].upper() if cust['lead_probability'] else 'WARM'}",
                    "start": {
                        "dateTime": start_comb.isoformat(),
                        "timeZone": t_tz
                    },
                    "end": {
                        "dateTime": end_comb.isoformat(),
                        "timeZone": t_tz
                    },
                }
                if google_cal_id and not google_cal_id.startswith("gcal_"):
                    try:
                        cal_up_req = cal_service.events().update(calendarId="primary", eventId=google_cal_id, body=cal_event_body)
                        cal_res = await asyncio.to_thread(lambda: cal_up_req.execute())
                    except Exception:
                        cal_ins_req = cal_service.events().insert(calendarId="primary", body=cal_event_body)
                        cal_res = await asyncio.to_thread(lambda: cal_ins_req.execute())
                else:
                    cal_ins_req = cal_service.events().insert(calendarId="primary", body=cal_event_body)
                    cal_res = await asyncio.to_thread(lambda: cal_ins_req.execute())
                if cal_res and cal_res.get("id"):
                    google_cal_id = cal_res["id"]
                    logger.info("google_calendar_followup_synced", event_id=google_cal_id, customer_id=customer_id)
            except Exception as ex_c:
                logger.warning("google_calendar_followup_sync_warn", error=str(ex_c))

        except Exception as ex:
            logger.warning("google_credentials_error", error=str(ex))

        # Save google_task_id and google_calendar_event_id in customers table
        await conn.execute(
            "UPDATE customers SET google_task_id = $1, google_calendar_event_id = $2 WHERE id = $3::uuid AND tenant_id = $4::uuid",
            google_task_id, google_cal_id, customer_id, tenant_id
        )

        # Strictly enforce 1 task per customer in local tasks table
        await conn.execute(
            "DELETE FROM tasks WHERE customer_id = $1::uuid AND tenant_id = $2::uuid",
            customer_id, tenant_id
        )
        task_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO tasks (id, tenant_id, customer_id, google_task_id, google_event_id, title, description, due_date, completed, notified_due, created_at, updated_at)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, false, false, now(), now())""",
            task_id, tenant_id, customer_id, google_task_id, google_cal_id,
            f"Follow-up: {display_name}",
            f"Action: {cust.get('next_action') or 'Follow-up'} | {req_label}: {cust['health_concern'] or 'General'} | Phone: {cust['phone']}",
            due_dt
        )

    return {
        "status": "ok",
        "google_task_id": google_task_id,
        "google_calendar_event_id": google_cal_id,
        "customer_id": customer_id,
        "title": f"Follow-up: {cust['name'] or 'Customer'}",
        "due_date": due_iso
    }

@router.delete("/customers/{customer_id}")
@router.delete("/api/v1/crm/customers/{customer_id}")
async def delete_customer(
    customer_id: str,
    tenant_id: str = Depends(get_tenant_id),
    caller: dict = Depends(get_caller_context)
):
    caller_role = caller.get("role", "admin") if isinstance(caller, dict) else "admin"
    caller_perms = caller.get("permissions", {}) if isinstance(caller, dict) else {}
    can_manage = (
        caller_role in ("admin", "owner", "super_admin")
        or caller_perms.get("can_manage_customers", False)
    )
    if not can_manage:
        raise HTTPException(status_code=403, detail="Admin or customer management privileges required to delete a customer.")

    async with database.db_pool.acquire() as conn:
        async with conn.transaction():
            cust = await conn.fetchrow(
                "SELECT id, phone, name FROM customers WHERE id = $1::uuid AND tenant_id = $2::uuid",
                customer_id, tenant_id
            )
            if not cust:
                raise HTTPException(404, "Customer not found")

            phone = cust["phone"]
            customer_ids = [customer_id]
            norm_phone = None

            if phone:
                clean_digits = re.sub(r'\D', '', phone)
                norm_phone = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
                # Find all matching customer records (e.g. duplicates)
                duplicate_custs = await conn.fetch(
                    """SELECT id FROM customers 
                       WHERE tenant_id = $1::uuid 
                         AND (id = $2::uuid OR phone = $3 OR (LENGTH($4) >= 7 AND RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $4))""",
                    tenant_id, customer_id, phone, norm_phone
                )
                customer_ids = [r["id"] for r in duplicate_custs]

            # 1. Delete customer notes and tasks
            await conn.execute(
                "DELETE FROM customer_notes WHERE customer_id = ANY($1::uuid[]) AND tenant_id = $2::uuid",
                customer_ids, tenant_id
            )
            await conn.execute(
                "DELETE FROM tasks WHERE customer_id = ANY($1::uuid[]) AND tenant_id = $2::uuid",
                customer_ids, tenant_id
            )

            # 2. Find all matching contacts
            contact_ids = []
            if phone and norm_phone:
                matching_contacts = await conn.fetch(
                    """SELECT id FROM contacts 
                       WHERE tenant_id = $1::uuid 
                         AND (phone = $2 OR (LENGTH($3) >= 7 AND RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $3))""",
                    tenant_id, phone, norm_phone
                )
                contact_ids = [c["id"] for c in matching_contacts]

            # 3. Clean up bookings, scheduled jobs, messages, conversations, and contacts
            if contact_ids:
                conv_rows = await conn.fetch(
                    "SELECT id FROM conversations WHERE contact_id = ANY($1::uuid[]) AND tenant_id = $2::uuid",
                    contact_ids, tenant_id
                )
                conv_ids = [c["id"] for c in conv_rows]

                await conn.execute(
                    """DELETE FROM scheduled_jobs 
                       WHERE booking_id IN (SELECT id FROM bookings WHERE contact_id = ANY($1::uuid[]) AND tenant_id = $2::uuid)
                         AND tenant_id = $2::uuid""",
                    contact_ids, tenant_id
                )
                await conn.execute(
                    """UPDATE bookings SET rescheduled_from = NULL 
                       WHERE contact_id = ANY($1::uuid[]) AND tenant_id = $2::uuid""",
                    contact_ids, tenant_id
                )
                await conn.execute(
                    "DELETE FROM bookings WHERE contact_id = ANY($1::uuid[]) AND tenant_id = $2::uuid",
                    contact_ids, tenant_id
                )

                if conv_ids:
                    await conn.execute(
                        "DELETE FROM messages WHERE conversation_id = ANY($1::uuid[]) AND tenant_id = $2::uuid",
                        conv_ids, tenant_id
                    )
                    await conn.execute(
                        "DELETE FROM conversations WHERE id = ANY($1::uuid[]) AND tenant_id = $2::uuid",
                        conv_ids, tenant_id
                    )

                await conn.execute(
                    "DELETE FROM contacts WHERE id = ANY($1::uuid[]) AND tenant_id = $2::uuid",
                    contact_ids, tenant_id
                )

            # 4. Delete the customers
            await conn.execute(
                "DELETE FROM customers WHERE id = ANY($1::uuid[]) AND tenant_id = $2::uuid",
                customer_ids, tenant_id
            )

            # 5. Delete reviews if matching phone
            if phone and norm_phone:
                await conn.execute(
                    """DELETE FROM customer_reviews 
                       WHERE tenant_id = $1::uuid 
                         AND (customer_phone = $2 OR (LENGTH($3) >= 7 AND RIGHT(REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g'), 10) = $3))""",
                    tenant_id, phone, norm_phone
                )

    return {"status": "ok", "deleted_id": customer_id}
