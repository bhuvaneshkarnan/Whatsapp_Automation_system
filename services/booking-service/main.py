import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

import asyncpg
import httpx
import structlog
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from jose import jwt, JWTError
from pydantic import BaseModel

from src.state_machine import validate_transition, InvalidTransitionError

logger = structlog.get_logger("booking-service")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform")
CALENDAR_SYNC_URL = os.getenv("CALENDAR_SYNC_URL", "http://calendar-sync:3005")
JWT_SECRET = os.getenv("JWT_SECRET", "18d73e947ecf30719ab9a2c4e919fc892f36e5c74207429b4a9e82f5ad0e5e7f")
ALGORITHM = "HS256"

# ── Tenant Authentication Dependency ──────────────────────────────────────────

async def get_tenant_id(
    authorization: Optional[str] = Header(None),
    x_tenant_id: Optional[str] = Header(None),
    x_tenant_slug: Optional[str] = Header(None)
) -> str:
    """Authenticates caller and returns scoped tenant_id."""
    clean_requested_id = x_tenant_id.split(",")[0].strip() if x_tenant_id else None
    clean_requested_slug = x_tenant_slug.split(",")[0].strip().lower() if x_tenant_slug else None

    slug_resolved_id = None
    if clean_requested_slug and db_pool:
        try:
            row = await db_pool.fetchrow(
                "SELECT id FROM tenants WHERE LOWER(slug) = $1", clean_requested_slug
            )
            if row:
                slug_resolved_id = str(row["id"])
        except Exception as e:
            logger.warning("slug_resolution_in_auth_failed", slug=clean_requested_slug, error=str(e))

    if not clean_requested_id and slug_resolved_id:
        clean_requested_id = slug_resolved_id

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        except Exception as e:
            logger.warning("jwt_verification_failed", error=str(e))
            raise HTTPException(status_code=401, detail="Invalid or expired session token. Please log in again.")

        role = payload.get("role", "agent")
        token_tenant = payload.get("tenant_id")

        if role == "super_admin":
            if clean_requested_id:
                return clean_requested_id
            if token_tenant:
                return str(token_tenant)
            raise HTTPException(status_code=400, detail="X-Tenant-ID or X-Tenant-Slug header required for super_admin")

        if not token_tenant:
            raise HTTPException(status_code=403, detail="No tenant workspace assigned to this account.")

        token_tenant_str = str(token_tenant)

        if clean_requested_id and clean_requested_id.lower() != token_tenant_str.lower():
            raise HTTPException(status_code=403, detail="Access denied: Cross-tenant data access is prohibited.")

        if slug_resolved_id and slug_resolved_id.lower() != token_tenant_str.lower():
            raise HTTPException(status_code=403, detail="Access denied: Cross-tenant data access is prohibited.")

        return token_tenant_str

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    raise HTTPException(status_code=401, detail="Invalid authentication format.")

# ── Schemas ───────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    tenant_id: Optional[str] = None
    contact_id: str
    service: str
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None

class BookingUpdateStatus(BaseModel):
    status: str
    cancellation_reason: Optional[str] = None


# ── DB Pool Setup ─────────────────────────────────────────────────────────────
db_pool: asyncpg.Pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=4)
    yield
    await db_pool.close()

app = FastAPI(lifespan=lifespan, title="Booking Service")

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/bookings")
async def create_booking(
    payload: BookingCreate,
    tenant_id: str = Depends(get_tenant_id)
):
    """Creates a booking in 'pending' state scoped to authenticated tenant."""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO bookings
               (tenant_id, contact_id, service, start_time, end_time, notes, status)
               VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, 'pending')
               RETURNING id, status, created_at""",
            tenant_id, payload.contact_id, payload.service,
            payload.start_time, payload.end_time, payload.notes
        )
    return dict(row)


@app.patch("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    payload: BookingUpdateStatus,
    tenant_id: str = Depends(get_tenant_id),
    authorization: Optional[str] = Header(None)
):
    """
    Updates booking status, validating transitions.
    If confirmed/rescheduled/cancelled, triggers Google Calendar sync.
    Strictly scoped to authenticated tenant.
    """
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            # 1. Lock row and get current status scoped to tenant
            row = await conn.fetchrow(
                "SELECT tenant_id, status FROM bookings WHERE id = $1::uuid AND tenant_id = $2::uuid FOR UPDATE",
                booking_id, tenant_id
            )
            if not row:
                raise HTTPException(status_code=404, detail="Booking not found")

            current_status = row["status"]

            # 2. Validate transition
            try:
                validate_transition(current_status, payload.status)
            except InvalidTransitionError as e:
                raise HTTPException(status_code=409, detail=str(e))

            # 3. Update status scoped to tenant
            await conn.execute(
                """UPDATE bookings
                   SET status = $1, cancellation_reason = COALESCE($2, cancellation_reason)
                   WHERE id = $3::uuid AND tenant_id = $4::uuid""",
                payload.status, payload.cancellation_reason, booking_id, tenant_id
            )

            # 4. Create scheduled jobs (reminder 24h before)
            if payload.status == "confirmed":
                await conn.execute(
                    """INSERT INTO scheduled_jobs (tenant_id, job_type, booking_id, scheduled_at)
                       SELECT tenant_id, 'reminder', id, start_time - INTERVAL '24 hours'
                       FROM bookings WHERE id = $1::uuid AND tenant_id = $2::uuid
                       ON CONFLICT (booking_id, job_type) WHERE status = 'pending' DO NOTHING""",
                    booking_id, tenant_id
                )
            elif payload.status == "cancelled":
                await conn.execute(
                    "UPDATE scheduled_jobs SET status = 'cancelled' WHERE booking_id = $1::uuid AND tenant_id = $2::uuid",
                    booking_id, tenant_id
                )

    # 5. Sync with Google Calendar (async fire-and-forget for now)
    if payload.status in ("confirmed", "rescheduled", "cancelled"):
        async with httpx.AsyncClient() as client:
            try:
                headers = {"Authorization": authorization} if authorization else {}
                await client.post(
                    f"{CALENDAR_SYNC_URL}/sync",
                    headers=headers,
                    json={"booking_id": booking_id, "tenant_id": tenant_id}
                )
            except Exception as e:
                logger.error("calendar_sync_trigger_failed", booking_id=booking_id, error=str(e))

    return {"status": "updated", "booking_id": booking_id, "new_status": payload.status}
