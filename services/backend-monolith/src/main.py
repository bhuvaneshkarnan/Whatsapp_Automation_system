import os
import sys
import subprocess
import asyncio

# Auto-install missing dependencies because building Docker image is too slow on Oracle Free Tier
try:
    import structlog
    import asyncpg
    import pywebpush
except ImportError:
    print("Missing dependencies, installing now...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "structlog", "asyncpg", "httpx", "passlib", "python-jose", "google-api-python-client", "pywebpush"])


sys.path.append("/app")
sys.path.append("/app/crm_api")
sys.path.append("/app/auth_service")
sys.path.append("/app/booking_service")
sys.path.append("/app/calendar_sync")
sys.path.append("/app/core_worker")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import structlog
import asyncpg

logger = structlog.get_logger("backend-monolith")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:newSecurePass2026@postgres:5432/whatsapp_platform")

db_pool: asyncpg.Pool = None

try:
    import crm_api.main as crm_mod
    import auth_service.main as auth_mod
    import booking_service.main as booking_mod
    import calendar_sync.main as calendar_mod
    from core_worker.main import worker as core_worker, app as worker_app

    crm_app = crm_mod.app
    auth_app = auth_mod.app
    booking_app = booking_mod.app
    calendar_app = calendar_mod.app

    for sub in (crm_app, auth_app, booking_app, calendar_app):
        sub.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
except ImportError as e:
    logger.error("failed_to_import_sub_apps", error=str(e))
    raise

app = FastAPI(title="Backend Monolith API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/api/v1/crm", crm_app)
app.mount("/api/v1/marketing", crm_app)
app.mount("/api/v1/auth", auth_app)
app.mount("/api/v1/bookings", booking_app)
app.mount("/api/v1/calendar", calendar_app)
app.mount("/api/v1/worker", worker_app)

@app.on_event("startup")
async def startup():
    global db_pool
    logger.info("monolith_startup", message="Initializing shared database connection pool")
    for attempt in range(1, 10):
        try:
            db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
            if db_pool:
                break
        except Exception as e:
            logger.warning("db_connect_retry", attempt=attempt, error=str(e))
            await asyncio.sleep(2)
    
    # Propagate pool to all sub-apps
    crm_mod.db_pool = db_pool
    auth_mod.db_pool = db_pool
    booking_mod.db_pool = db_pool
    calendar_mod.db_pool = db_pool

    # Ensure database migrations and customer sync
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_phone_uniq ON customers(tenant_id, phone);
                INSERT INTO customers (id, tenant_id, phone, name, status, lead_probability, created_at, updated_at)
                SELECT gen_random_uuid(), c.tenant_id, REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g'), COALESCE(c.name, c.wa_profile_name, 'Customer'), 'new', 'warm', c.created_at, now()
                FROM contacts c
                WHERE NOT EXISTS (
                    SELECT 1 FROM customers cust 
                    WHERE cust.tenant_id = c.tenant_id 
                      AND (
                        cust.phone = REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g')
                        OR RIGHT(REGEXP_REPLACE(cust.phone, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g'), 10)
                      )
                )
                ON CONFLICT (tenant_id, phone) DO NOTHING;
            """)
            logger.info("monolith_startup", message="Customer contact auto-sync executed")
    except Exception as e:
        logger.warning("monolith_schema_sync_failed", error=str(e))

    logger.info("monolith_startup", message="Starting core worker background tasks")
    try:
        await core_worker.start()
    except Exception as e:
        logger.warning("core_worker_startup_failed", error=str(e))

@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        await db_pool.close()

@app.get("/health")
def health():
    return {"status": "ok", "service": "backend-monolith"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

