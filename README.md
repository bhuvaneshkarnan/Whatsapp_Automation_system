# WhatsApp Automation Platform

Multi-tenant WhatsApp automation platform with CRM capabilities, AI-powered reply engine, booking workflows, and calendar sync.

## Services

| Service | Language | Port | Description |
|---|---|---|---|
| webhook-ingestion | TypeScript/Node.js | 3001 | Receives Meta webhooks, deduplicates, enqueues |
| message-processor | Python | 3002 | Processes inbound messages, routes to AI/booking |
| ai-router | Python | 3003 | AI provider fallback chain (Gemini→Groq→OpenRouter→Rules) |
| booking-service | Python/FastAPI | 3004 | Booking CRUD + state machine |
| calendar-sync | Python | 3005 | Google/Outlook calendar event management |
| notification-service | TypeScript/Node.js | 3006 | Sends WhatsApp templates, emails, SMS |
| crm-api | Python/FastAPI | 3007 | Conversations, contacts, CRM operations |
| auth-service | Python/FastAPI | 3008 | JWT auth, user management, tenant onboarding |
| crm-frontend | Next.js | 3000 | CRM dashboard UI |

## Quick Start

```bash
cp .env.example .env
# Fill in required values in .env
make dev
```

## Architecture

See `docs/architecture.md` and the implementation plan for full details.

## Development

```bash
make test       # Run all tests
make lint       # Lint all services
make build      # Build all Docker images
make migrate    # Run DB migrations
```
