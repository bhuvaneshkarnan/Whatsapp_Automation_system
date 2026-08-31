import json
import os
from contextlib import asynccontextmanager

import asyncpg
import structlog
from fastapi import FastAPI, HTTPException
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from pydantic import BaseModel

logger = structlog.get_logger("calendar-sync")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform")


class SyncRequest(BaseModel):
    tenant_id: str
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
async def sync_calendar(req: SyncRequest):
    """
    Syncs a booking to the tenant's Google Calendar.
    Requires `google_calendar` credentials for the tenant.
    """
    async with db_pool.acquire() as conn:
        # 1. Get tenant's Google Calendar credentials
        cred_row = await conn.fetchrow(
            """SELECT credential_data FROM tenant_credentials
               WHERE tenant_id = $1 AND provider = 'google_calendar' AND is_active = true""",
            req.tenant_id
        )
        if not cred_row:
            logger.warning("no_calendar_creds", tenant_id=req.tenant_id)
            return {"status": "skipped", "reason": "no_credentials"}

        cred_data = json.loads(cred_row["credential_data"]) if isinstance(cred_row["credential_data"], str) else cred_row["credential_data"]

        # 2. Get booking details
        booking = await conn.fetchrow(
            """SELECT b.id, b.service, b.start_time, b.end_time, b.status, b.google_event_id, b.notes,
                      c.name, c.phone
               FROM bookings b
               JOIN contacts c ON c.id = b.contact_id
               WHERE b.id = $1 AND b.tenant_id = $2""",
            req.booking_id, req.tenant_id
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
                    await conn.execute("UPDATE bookings SET google_event_id = NULL WHERE id = $1", req.booking_id)
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
                await conn.execute("UPDATE bookings SET google_event_id = $1 WHERE id = $2", event['id'], req.booking_id)
            
            logger.info("calendar_sync_success", action=action, event_id=event['id'])
            return {"status": action, "event_id": event['id']}
        except Exception as e:
            logger.error("calendar_sync_failed", error=str(e))
            raise HTTPException(500, str(e))
