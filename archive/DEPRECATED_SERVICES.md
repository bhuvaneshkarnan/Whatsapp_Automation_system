# Deprecated Services & Architecture Status

This document records obsolete/superseded services in the repository as part of the Phase 3 modularization and systematic audit.

## 1. `services/ai-router`
- **Status**: DEPRECATED / SUPERSEDED
- **Superseded By**: `services/core-worker/providers/llm_router.py`
- **Reason**: The AI routing logic, fallback cascade, and model routing are now natively built and executed directly inside the high-throughput `core-worker` pipeline (`llm_router.py`). The standalone `ai-router` container is no longer referenced in `docker-compose.yml` and is preserved for historical reference only.

## 2. `services/message-processor`
- **Status**: DEPRECATED / EMPTY
- **Superseded By**: `services/core-worker/main.py`
- **Reason**: Message parsing, intent analysis, and Redis stream consumption (`stream:message.inbound`) are consolidated directly into `core-worker`. This directory is empty.

## 3. `services/notification-service`
- **Status**: DEPRECATED / SUPERSEDED
- **Superseded By**: `services/crm-api/tasks_service.py` and `services/crm-api/services/whatsapp_service.py`
- **Reason**: Notifications (both browser Web Push via VAPID and automated WhatsApp alerts) are directly managed and triggered from `crm-api` through `tasks_service.py` and background loops. No independent notification microservice container is required.

## 4. `services/booking-service` & `services/calendar-sync`
- **Status**: ARCHIVED / RETIRED FROM MONOLITH
- **Superseded By**: `services/crm-api/routers/bookings.py` and `services/crm-api/routers/calendar.py`
- **Reason**: All booking management and Google Calendar integration are now consolidated into the unified multi-tenant CRM API under `/api/v1/crm/bookings` and `/api/v1/crm/calendar`. The dead sub-app mounts (`/api/v1/bookings` and `/api/v1/calendar`) have been cleanly removed from `backend-monolith`.
