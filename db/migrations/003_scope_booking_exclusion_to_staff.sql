-- Migration 003: Scope booking exclusion constraint to staff_member
-- Allows multiple concurrent bookings across different staff members while preventing double-booking the same staff member.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_confirmed_bookings;

ALTER TABLE bookings ADD CONSTRAINT no_overlapping_confirmed_bookings
  EXCLUDE USING gist (
    tenant_id WITH =,
    (COALESCE(staff_member, 'general')) WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status = 'confirmed');
