-- Migration 002: Expand scheduled_jobs job_type CHECK constraint
-- Permits 'reschedule_nudge' and 'post_treatment_followup' in addition to 'reminder' and 'review_request'

ALTER TABLE scheduled_jobs DROP CONSTRAINT IF EXISTS scheduled_jobs_job_type_check;

ALTER TABLE scheduled_jobs ADD CONSTRAINT scheduled_jobs_job_type_check 
  CHECK (job_type IN ('reminder', 'review_request', 'reschedule_nudge', 'post_treatment_followup'));
