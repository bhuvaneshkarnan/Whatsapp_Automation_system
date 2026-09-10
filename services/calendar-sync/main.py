import json
import os
from contextlib import asynccontextmanager

from typing import Optional

import asyncpg
import structlog
from fastapi import FastAPI, HTTPException, Depends, Header
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from jose import jwt, JWTError
from pydantic import BaseModel

logger = structlog.get_logger("calendar-sync")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform")
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

class SyncRequest(BaseModel):
    tenant_id: Optional[str] = None
    booking_id: str


db_pool: asyncpg.Pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=2)
    yield
    await db_pool.close()

app = FastAPI(lifespan=lifespan, title="Calendar Sync Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/sync")
async def sync_calendar(
    req: SyncRequest,
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Syncs a booking to the tenant's Google Calendar.
    Requires `google_calendar` credentials for the tenant.
    Strictly scoped to authenticated tenant.
    """
    if req.tenant_id and str(req.tenant_id).lower() != str(tenant_id).lower():
        raise HTTPException(status_code=403, detail="Access denied: Cross-tenant calendar sync is prohibited.")
    effective_tenant_id = str(tenant_id)

    async with db_pool.acquire() as conn:
        # 1. Get tenant's Google Calendar credentials
        cred_row = await conn.fetchrow(
            """SELECT credential_data FROM tenant_credentials
               WHERE tenant_id = $1::uuid AND provider = 'google_calendar' AND is_active = true""",
            effective_tenant_id
        )
        if not cred_row:
            logger.warning("no_calendar_creds", tenant_id=effective_tenant_id)
            return {"status": "skipped", "reason": "no_credentials"}

        cred_data = json.loads(cred_row["credential_data"]) if isinstance(cred_row["credential_data"], str) else cred_row["credential_data"]

        # 2. Get booking details
        booking = await conn.fetchrow(
            """SELECT b.id, b.service, b.start_time, b.end_time, b.status, b.google_event_id, b.notes,
                      c.name, c.phone
               FROM bookings b
               JOIN contacts c ON c.id = b.contact_id
               WHERE b.id = $1::uuid AND b.tenant_id = $2::uuid""",
            req.booking_id, effective_tenant_id
        )
        if not booking:
            raise HTTPException(404, "Booking not found")

        # 3. Setup Google API client
        creds = Credentials(
            token=cred_data.get("token"),
            refresh_token=cred_data.get("refresh_token"),
            token_uri=cred_data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=cred_data.get("client_id"),
            client_secret=cred_data.get("client_secret"),
        )
        service = build('calendar', 'v3', credentials=creds)

        calendar_id = 'primary'
        event_id = booking["google_event_id"]
        status = booking["status"]

        # 4. Delete if cancelled
        if status == "cancelled":
            if event_id:
                try:
                    service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
                    await conn.execute("UPDATE bookings SET google_event_id = NULL WHERE id = $1::uuid AND tenant_id = $2::uuid", req.booking_id, effective_tenant_id)
                except Exception as e:
                    logger.error("calendar_delete_failed", error=str(e))
            return {"status": "deleted"}

        # 5. Insert or Update event
        event_body = {
            'summary': f"{booking['service']} - {booking['name'] or booking['phone']}",
            'description': f"Contact: {booking['phone']}\nNotes: {booking['notes'] or ''}",
            'start': {'dateTime': booking['start_time'].isoformat()},
            'end': {'dateTime': booking['end_time'].isoformat()},
        }

        try:
            if event_id:
                event = service.events().update(calendarId=calendar_id, eventId=event_id, body=event_body).execute()
                action = "updated"
            else:
                event = service.events().insert(calendarId=calendar_id, body=event_body).execute()
                action = "created"
                await conn.execute("UPDATE bookings SET google_event_id = $1 WHERE id = $2::uuid AND tenant_id = $3::uuid", event['id'], req.booking_id, effective_tenant_id)
            
            logger.info("calendar_sync_success", action=action, event_id=event['id'])
            return {"status": action, "event_id": event['id']}
        except Exception as e:
            logger.error("calendar_sync_failed", error=str(e))
            raise HTTPException(500, str(e))
