import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

import asyncpg
import httpx
import structlog
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel

from src.state_machine import validate_transition, InvalidTransitionError

logger = structlog.get_logger("booking-service")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform")
CALENDAR_SYNC_URL = os.getenv("CALENDAR_SYNC_URL", "http://calendar-sync:3005")

# ── Schemas ───────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    tenant_id: str
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
async def create_booking(payload: BookingCreate):
    """Creates a booking in 'pending' state."""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO bookings
               (tenant_id, contact_id, service, start_time, end_time, notes, status)
               VALUES ($1, $2, $3, $4, $5, $6, 'pending')
               RETURNING id, status, created_at""",
            payload.tenant_id, payload.contact_id, payload.service,
            payload.start_time, payload.end_time, payload.notes
        )
    return dict(row)


@app.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, payload: BookingUpdateStatus):
    """
    Updates booking status, validating transitions.
    If confirmed/rescheduled/cancelled, triggers Google Calendar sync.
    """
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            # 1. Lock row and get current status
            row = await conn.fetchrow(
                "SELECT tenant_id, status FROM bookings WHERE id = $1 FOR UPDATE",
                booking_id
            )
            if not row:
                raise HTTPException(status_code=404, detail="Booking not found")

            current_status = row["status"]
            tenant_id = row["tenant_id"]

            # 2. Validate transition
            try:
                validate_transition(current_status, payload.status)
            except InvalidTransitionError as e:
                raise HTTPException(status_code=409, detail=str(e))

            # 3. Update status
            await conn.execute(
                """UPDATE bookings
                   SET status = $1, cancellation_reason = COALESCE($2, cancellation_reason)
                   WHERE id = $3""",
                payload.status, payload.cancellation_reason, booking_id
            )

            # 4. Create scheduled jobs (reminder 24h before, review 1h after)
            if payload.status == "confirmed":
                await conn.execute(
                    """INSERT INTO scheduled_jobs (tenant_id, job_type, booking_id, scheduled_at)
                       SELECT tenant_id, 'reminder', id, start_time - INTERVAL '24 hours'
                       FROM bookings WHERE id = $1""",
                    booking_id
                )
                await conn.execute(
                    """INSERT INTO scheduled_jobs (tenant_id, job_type, booking_id, scheduled_at)
                       SELECT tenant_id, 'review_request', id, end_time + INTERVAL '1 hour'
                       FROM bookings WHERE id = $1""",
                    booking_id
                )
            elif payload.status == "cancelled":
                await conn.execute(
                    "UPDATE scheduled_jobs SET status = 'cancelled' WHERE booking_id = $1",
                    booking_id
                )

    # 5. Sync with Google Calendar (async fire-and-forget for now)
    if payload.status in ("confirmed", "rescheduled", "cancelled"):
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{CALENDAR_SYNC_URL}/sync",
                    json={"booking_id": booking_id, "tenant_id": tenant_id}
                )
            except Exception as e:
                logger.error("calendar_sync_trigger_failed", booking_id=booking_id, error=str(e))

    return {"status": "updated", "booking_id": booking_id, "new_status": payload.status}
