import os

import os
import re
import csv
import io
import time
import uuid
import json
import asyncio
import hashlib
import html
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Union

import asyncpg
import structlog

logger = structlog.get_logger('crm-api-db')

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform")

db_pool: asyncpg.Pool = None

async def init_db_pool():
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=20)
    return db_pool

async def get_db_pool() -> asyncpg.Pool:
    global db_pool
    if not db_pool:
        raise RuntimeError("Database pool has not been initialized.")
    return db_pool

async def run_migrations(pool: asyncpg.Pool):
    try:
        async with pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS marketing_campaigns (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    campaign_name TEXT NOT NULL,
                    target_audience TEXT NOT NULL DEFAULT 'contacts_only',
                    message_mode TEXT NOT NULL DEFAULT 'template',
                    message_text TEXT,
                    template_name TEXT,
                    template_params JSONB DEFAULT '[]'::jsonb,
                    recipient_phones JSONB DEFAULT '[]'::jsonb,
                    total_recipients INT DEFAULT 0,
                    sent_count INT DEFAULT 0,
                    delivered_count INT DEFAULT 0,
                    read_count INT DEFAULT 0,
                    replied_count INT DEFAULT 0,
                    converted_count INT DEFAULT 0,
                    status TEXT DEFAULT 'completed',
                    scheduled_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT now()
                );

                CREATE TABLE IF NOT EXISTS marketing_triggers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    name TEXT NOT NULL,
                    trigger_type TEXT NOT NULL,
                    condition_label TEXT NOT NULL,
                    condition_days INT DEFAULT 30,
                    template_name TEXT NOT NULL,
                    template_params JSONB DEFAULT '[]'::jsonb,
                    is_active BOOLEAN DEFAULT true,
                    reached_count INT DEFAULT 0,
                    last_triggered_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT now()
                );

                ALTER TABLE contacts ADD COLUMN IF NOT EXISTS opt_in BOOLEAN DEFAULT true;
                ALTER TABLE contacts ADD COLUMN IF NOT EXISTS opt_in_at TIMESTAMPTZ DEFAULT now();

                CREATE TABLE IF NOT EXISTS customers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    phone TEXT NOT NULL,
                    name TEXT,
                    preferred_doctor TEXT DEFAULT NULL,
                    status TEXT DEFAULT 'new',
                    health_concern TEXT DEFAULT 'General Consultation',
                    lead_probability TEXT DEFAULT 'warm',
                    converted BOOLEAN DEFAULT false,
                    followup_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
                    followup_time TEXT DEFAULT '10:00 AM',
                    google_task_id TEXT,
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS age INT;
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS location TEXT;
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ;
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_messaged_at TIMESTAMPTZ;
                ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
                ALTER TABLE messages ADD COLUMN IF NOT EXISTS template_name TEXT;
                ALTER TABLE messages ADD COLUMN IF NOT EXISTS template_params JSONB;

                CREATE TABLE IF NOT EXISTS customer_notes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                    author TEXT NOT NULL DEFAULT 'Admin',
                    note_text TEXT NOT NULL,
                    color TEXT DEFAULT 'slate',
                    created_at TIMESTAMPTZ DEFAULT now()
                );
                ALTER TABLE customer_notes ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'slate';
                CREATE INDEX IF NOT EXISTS idx_customer_notes_tenant_cust ON customer_notes(tenant_id, customer_id);

                CREATE TABLE IF NOT EXISTS tasks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
                    google_task_id TEXT,
                    title TEXT NOT NULL,
                    description TEXT,
                    due_date TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 day'),
                    completed BOOLEAN DEFAULT false,
                    notified_due BOOLEAN DEFAULT false,
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
                ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notified_due BOOLEAN DEFAULT false;
                CREATE INDEX IF NOT EXISTS idx_tasks_tenant_cust ON tasks(tenant_id, customer_id);

                CREATE TABLE IF NOT EXISTS push_subscriptions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    user_id UUID,
                    endpoint TEXT NOT NULL UNIQUE,
                    p256dh TEXT NOT NULL,
                    auth TEXT NOT NULL,
                    user_agent TEXT,
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );

                CREATE TABLE IF NOT EXISTS notifications (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    body TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'message',
                    data JSONB DEFAULT '{}'::jsonb,
                    is_read BOOLEAN DEFAULT false,
                    created_at TIMESTAMPTZ DEFAULT now()
                );

                
CREATE TABLE IF NOT EXISTS customer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_phone TEXT,
    service_name TEXT,
    rating INT NOT NULL,
    experience_notes TEXT,
    generated_review_text TEXT,
    destination TEXT NOT NULL DEFAULT 'crm_internal',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_tenant ON customer_reviews(tenant_id, created_at DESC);
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS google_review_id TEXT;
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS reviewer_photo_url TEXT;
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS owner_reply_text TEXT;
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS owner_replied_at TIMESTAMPTZ;
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct_collector';
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_reviews_google_uniq ON customer_reviews(tenant_id, google_review_id) WHERE google_review_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_phone_uniq ON customers(tenant_id, phone);
                CREATE INDEX IF NOT EXISTS idx_contacts_clean_phone ON contacts (tenant_id, (RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)));
                CREATE INDEX IF NOT EXISTS idx_customers_clean_phone ON customers (tenant_id, (RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)));
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS internal_name TEXT;
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
                ALTER TABLE contacts ADD COLUMN IF NOT EXISTS internal_name TEXT;
                CREATE INDEX IF NOT EXISTS idx_contacts_merged_phones ON contacts USING gin ((metadata->'merged_phones'));
                CREATE INDEX IF NOT EXISTS idx_customers_merged_phones ON customers USING gin ((metadata->'merged_phones'));

                CREATE EXTENSION IF NOT EXISTS btree_gist;
                DO $do$
                BEGIN
                    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_confirmed_bookings;
                EXCEPTION
                    WHEN others THEN NULL;
                END $do$;

                DO $do$
                BEGIN
                    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
                    ALTER TABLE users ADD CONSTRAINT users_role_check
                        CHECK (role IN ('super_admin', 'owner', 'admin', 'sales', 'doctor', 'receptionist', 'marketing', 'agent', 'viewer'));
                EXCEPTION
                    WHEN others THEN
                        RAISE NOTICE 'Could not update users_role_check constraint: %', SQLERRM;
                END $do$;

                DO $do$
                BEGIN
                    ALTER TABLE scheduled_jobs DROP CONSTRAINT IF EXISTS scheduled_jobs_job_type_check;
                    ALTER TABLE scheduled_jobs ADD CONSTRAINT scheduled_jobs_job_type_check CHECK (job_type = ANY (ARRAY['reminder'::text, 'admin_reminder'::text, 'review_request'::text, 'reschedule_nudge'::text, 'post_treatment_followup'::text]));
                    ALTER TABLE scheduled_jobs DROP CONSTRAINT IF EXISTS scheduled_jobs_status_check;
                    ALTER TABLE scheduled_jobs ADD CONSTRAINT scheduled_jobs_status_check CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'cancelled'::text, 'skipped_no_admin_phone'::text, 'skipped_duplicate'::text, 'skipped_already_sent'::text]));
                EXCEPTION
                    WHEN others THEN NULL;
                END $do$;

                -- Ensure all contacts have a corresponding record in customers table
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
    except Exception as e:
        logger.error("db_migration_error", error=str(e))
        raise
