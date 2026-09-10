-- Migration 005: Add unique partial index on scheduled_jobs(booking_id, job_type) where status = 'pending'
-- Prevents duplicate reminder/followup jobs for the same booking when a booking is repeatedly edited or confirmed

CREATE UNIQUE INDEX IF NOT EXISTS uq_scheduled_jobs_booking_job_type_pending
ON scheduled_jobs (booking_id, job_type)
WHERE status = 'pending';
