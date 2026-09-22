import os
import asyncio
from contextlib import asynccontextmanager
import structlog
from fastapi import FastAPI
import database
from tasks_service import set_tasks_db_pool, due_tasks_worker_loop
from services.alert_service import GlobalErrorAlertMiddleware, init_global_error_traps

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

from routers import (
    billing,
    customers,
    marketing,
    calendar,
    auth,
    webhooks,
    bookings,
    conversations,
    settings,
    reviews,
    whatsapp_embedded,
)

logger = structlog.get_logger("crm-api")
db_pool = None


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
app.include_router(whatsapp_embedded.router)

# --- Auth dependencies ---



@app.get("/health")
def health():
    return {"status": "ok"}





