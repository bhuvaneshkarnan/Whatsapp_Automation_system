-- Migration 006: Expand users role check constraint to include sales, marketing, doctor, receptionist
DO 
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('super_admin', 'owner', 'admin', 'sales', 'doctor', 'receptionist', 'marketing', 'agent', 'viewer'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not update users_role_check constraint: %', SQLERRM;
END ;
