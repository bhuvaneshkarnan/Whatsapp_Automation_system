-- ============================================================
-- WhatsApp Automation Platform — PostgreSQL Schema
-- Per-tenant credential isolation. WhatsApp + Google Calendar only.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for full-text search on messages

-- ── Tenants (your clients) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,           -- e.g. "salon-abc" (used in webhook URL)
  name          TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  is_active     BOOLEAN DEFAULT true,
  settings      JSONB DEFAULT '{}',             -- feature flags, business hours, etc.
  -- Razorpay Subscriptions
  razorpay_customer_id      TEXT,
  razorpay_subscription_id  TEXT,
  razorpay_short_url        TEXT,
  org_lifecycle_stage       TEXT NOT NULL DEFAULT 'setup' CHECK (org_lifecycle_stage IN ('setup', 'ready_to_activate', 'billing_active')),
  subscription_status       TEXT NOT NULL DEFAULT 'not_started' CHECK (subscription_status IN ('not_started', 'active', 'payment_failed', 'paused', 'cancelled')),
  next_charge_at            TIMESTAMPTZ,
  last_payment_status       TEXT,
  last_charge_at            TIMESTAMPTZ,
  last_reminder_sent_at     TIMESTAMPTZ,
  reminder_stage            TEXT,
  token_invalidated_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Invoices (Razorpay Subscription payments) ─────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  razorpay_invoice_id       TEXT UNIQUE,
  razorpay_payment_id       TEXT,
  razorpay_subscription_id  TEXT,
  amount                    NUMERIC(10, 2) NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'INR',
  status                    TEXT NOT NULL,
  invoice_pdf_url           TEXT,
  created_at                TIMESTAMPTZ DEFAULT now(),
  paid_at                   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sub_id ON invoices(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tenants_sub_id ON tenants(razorpay_subscription_id);


-- ── Per-tenant encrypted credentials ──────────────────────
-- Each row = one provider credential for one tenant.
-- In production, credential_value should be encrypted (pgcrypto/Vault).
-- Providers: whatsapp | gemini | google_calendar
CREATE TABLE IF NOT EXISTS tenant_credentials (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('whatsapp', 'gemini', 'google_calendar')),
  -- WhatsApp fields (stored as JSONB for flexibility)
  -- { phone_number_id, access_token, waba_id, verify_token, phone_number }
  -- Gemini fields: { api_key, model }
  -- Google Calendar: { token, refresh_token, token_uri, client_id, client_secret, scopes[] }
  credential_data  JSONB NOT NULL DEFAULT '{}',  -- encrypted in production
  is_active        BOOLEAN DEFAULT true,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, provider)
);

-- ── Users (staff/agents per tenant) ───────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'agent'
    CHECK (role IN ('super_admin', 'owner', 'admin', 'agent', 'viewer')),
  password_hash TEXT,
  is_active     BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- ── Contacts (end customers of each tenant) ───────────────
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone           TEXT NOT NULL,               -- WhatsApp phone in E.164 format
  name            TEXT,
  wa_profile_name TEXT,                        -- name from WhatsApp profile
  tags            TEXT[] DEFAULT '{}',
  notes           TEXT,
  opt_in          BOOLEAN DEFAULT false,       -- WhatsApp opt-in consent
  opt_in_at       TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, phone)
);

-- ── Conversations ──────────────────────────────────────────
-- One conversation per contact (WhatsApp session).
-- status: bot = AI is responding | human = agent took over | resolved | archived
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id),
  status          TEXT NOT NULL DEFAULT 'bot'
    CHECK (status IN ('bot', 'human', 'resolved', 'archived')),
  assigned_to     UUID REFERENCES users(id),
  last_message_at TIMESTAMPTZ,
  unread_count    INT DEFAULT 0,
  wa_context      JSONB DEFAULT '{}',          -- last inbound wa message context
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  wa_message_id   TEXT UNIQUE,                 -- Meta's wamid — used for deduplication
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content_type    TEXT NOT NULL DEFAULT 'text'
    CHECK (content_type IN ('text', 'image', 'audio', 'video', 'document', 'template', 'interactive', 'sticker', 'location')),
  body            TEXT,
  media_url       TEXT,
  template_name   TEXT,
  template_params JSONB,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_code      TEXT,
  sent_by         UUID REFERENCES users(id),   -- NULL = sent by bot
  ai_model_used   TEXT,                        -- e.g. "gemini-1.5-flash"
  ai_used_fallback BOOLEAN DEFAULT false,      -- true if rule engine was used
  processing_ms   INT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Bookings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id            UUID NOT NULL REFERENCES contacts(id),
  conversation_id       UUID REFERENCES conversations(id),
  service               TEXT NOT NULL,
  start_time            TIMESTAMPTZ NOT NULL,
  end_time              TIMESTAMPTZ NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'reminded', 'rescheduled', 'completed', 'cancelled', 'no_show', 'review_sent')),
  notes                 TEXT,
  staff_member          TEXT,
  location              TEXT,
  price                 DECIMAL(10, 2),
  currency              TEXT DEFAULT 'INR',
  google_event_id       TEXT,                  -- Google Calendar event ID
  google_calendar_id    TEXT DEFAULT 'primary',
  calendar_invite_sent  BOOLEAN DEFAULT false,
  reminder_sent_at      TIMESTAMPTZ,           -- 24h before appointment
  review_sent_at        TIMESTAMPTZ,           -- 1h after appointment
  cancellation_reason   TEXT,
  rescheduled_from      UUID REFERENCES bookings(id),
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── AI / Rule Config per tenant ────────────────────────────
CREATE TABLE IF NOT EXISTS ai_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  model           TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  temperature     FLOAT NOT NULL DEFAULT 0.3,
  max_tokens      INT NOT NULL DEFAULT 500,
  timeout_ms      INT NOT NULL DEFAULT 8000,
  system_prompt   TEXT,                        -- Customizable per tenant
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Reply Rules (static rule engine fallback) ─────────────
CREATE TABLE IF NOT EXISTS reply_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  priority        INT NOT NULL DEFAULT 0,      -- Higher = checked first
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'regex', 'fallback')),
  trigger_value   TEXT,                        -- regex/keyword pattern
  response_text   TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Scheduled Jobs tracker (reminders, review requests) ───
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  job_type        TEXT NOT NULL CHECK (job_type IN ('reminder', 'review_request')),
  booking_id      UUID NOT NULL REFERENCES bookings(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Audit Logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,                   -- e.g. "booking.confirmed"
  resource    TEXT,
  resource_id UUID,
  payload     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Refresh Tokens ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_conversation     ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_wa_id            ON messages(wa_message_id) WHERE wa_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_tenant_created   ON messages(tenant_id, created_at DESC);
-- Full-text search on message body (replaces Elasticsearch)
CREATE INDEX IF NOT EXISTS idx_messages_body_fts         ON messages USING gin(to_tsvector('english', coalesce(body, '')));
CREATE INDEX IF NOT EXISTS idx_conversations_tenant      ON conversations(tenant_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_contact     ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_phone     ON contacts(tenant_id, phone);
-- Trigram index for ILIKE search on contacts
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm        ON contacts USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_trgm       ON contacts USING gin(phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_time      ON bookings(tenant_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status           ON bookings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_pending    ON scheduled_jobs(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_audit_tenant_time         ON audit_logs(tenant_id, created_at DESC);

-- ── Auto-update updated_at ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_tenants_upd          BEFORE UPDATE ON tenants             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER trg_tenant_creds_upd     BEFORE UPDATE ON tenant_credentials  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER trg_users_upd            BEFORE UPDATE ON users               FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER trg_contacts_upd         BEFORE UPDATE ON contacts            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER trg_conversations_upd    BEFORE UPDATE ON conversations       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER trg_messages_upd         BEFORE UPDATE ON messages            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER trg_bookings_upd         BEFORE UPDATE ON bookings            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Default platform admin tenant ─────────────────────────
INSERT INTO tenants (id, slug, name, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'platform-admin', 'Platform Admin', 'enterprise')
ON CONFLICT (slug) DO NOTHING;
