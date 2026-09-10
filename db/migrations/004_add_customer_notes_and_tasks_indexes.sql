-- Migration 004: Add composite indexes on customer_notes and tasks for tenant_id and customer_id
-- Prevents sequential scans when fetching notes and tasks for a specific customer under a tenant

CREATE INDEX IF NOT EXISTS idx_customer_notes_tenant_cust ON customer_notes(tenant_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_cust ON tasks(tenant_id, customer_id);
