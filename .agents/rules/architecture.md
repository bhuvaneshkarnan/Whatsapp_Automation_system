---
name: whatsapp-crm-architecture
description: Understanding the architecture, environment variables, and modularization goals of the WhatsApp CRM Platform.
trigger: always_on
---

# WhatsApp CRM Platform Architecture

## Current State (Pre-Refactoring)
- **Monolith:** The backend is currently a massive monolith in `services/crm-api/main.py` (approx 14,000 lines).
- **Tech Stack:** Python 3, FastAPI, asyncpg (PostgreSQL), Redis (for webhook ingestion queue/rate limits).
- **Multi-Tenancy:** Strictly multi-tenant. Every single query **MUST** include `tenant_id` for isolation.
- **SQL Execution:** We use `asyncpg` directly (`await conn.fetch()`, `await conn.execute()`). **NEVER** use `f-strings` for variable interpolation in SQL queries. Always use positional arguments (`$1`, `$2`).
- **Payment Engine:** Razorpay. The platform uses a central Razorpay account (keys stored in `.env`). It handles tenant and partner payments centrally.
- **Background Tasks:** Used extensively via FastAPI's `BackgroundTasks` for WhatsApp messaging and calendar syncing.

## Ongoing Goal: Modularization (Phase 3)
When asked to "optimize" or "refactor" the codebase, follow these rules:
1. **Iterative Extraction:** Do not rewrite the entire file at once. Extract features ONE BY ONE (e.g., move only `razorpay_client` integration, or only Pydantic models first).
2. **File Structure Target:**
   - `models.py`: Pydantic definitions and dataclasses.
   - `database.py`: `asyncpg` connection pool, lifespan context.
   - `routers/`: FastAPI endpoints broken down by domain (`billing.py`, `customers.py`, `webhooks.py`).
   - `services/`: Business logic.
3. **Safety First:** Ensure imports are correctly patched in `main.py` when a chunk is extracted, so the live API never breaks during the transition.

## Known Variables
- Main Domain: `crm.goboldlabs.com` (Primary production domain)
- Secondary / Demo Domain: `ai.bizpipe.in`
- Server IP: `168.138.172.197`
- Deployment: Docker Compose (`backend-monolith`, `postgres`, `redis`, `nginx`).
- Connection Pool: `max_size=20`, matches `docker-compose.yml` DB limit of 50.
