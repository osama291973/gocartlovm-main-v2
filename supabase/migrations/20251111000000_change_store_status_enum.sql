-- Migration: change store_status enum values to 'activated' & 'deactivated'
-- This migration is idempotent and attempts to preserve data by mapping existing values:
--  - 'active' => 'activated'
--  - everything else => 'deactivated'

BEGIN;

-- Create the new enum type if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_status_new') THEN
    CREATE TYPE store_status_new AS ENUM ('activated','deactivated');
  END IF;
END
$$;

-- Drop the existing default on the column so Postgres can cast values safely
ALTER TABLE public.stores ALTER COLUMN status DROP DEFAULT;

-- Alter the column type using a safe mapping. Map 'active' -> 'activated', everything else -> 'deactivated'.
-- Be explicit about other known legacy values to avoid surprises.
ALTER TABLE public.stores
  ALTER COLUMN status TYPE store_status_new
  USING (
    CASE status::text
      WHEN 'active' THEN 'activated'::store_status_new
      WHEN 'pending' THEN 'deactivated'::store_status_new
      WHEN 'suspended' THEN 'deactivated'::store_status_new
      WHEN 'closed' THEN 'deactivated'::store_status_new
      ELSE 'deactivated'::store_status_new
    END
  );

-- If an old type named store_status exists, rename it to keep history (safe no-op if not present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_status') THEN
    ALTER TYPE store_status RENAME TO store_status_old;
  END IF;
END
$$;

-- Rename the new type into the canonical name
ALTER TYPE store_status_new RENAME TO store_status;

-- Restore a safe default on the column
ALTER TABLE public.stores ALTER COLUMN status SET DEFAULT 'deactivated'::store_status;

COMMIT;

-- NOTES:
-- 1) The original error "default for column \"status\" cannot be cast automatically" happens
--    because the column had a DEFAULT value typed as the old enum; dropping the default first
--    allows the ALTER TYPE operation to succeed.
-- 2) After running this migration, review and update any functions/migrations that contain
--    hardcoded literals or casts like 'pending'::store_status or 'active'::store_status. Those
--    should be updated to the new labels or use a mapping.
-- 3) Run this migration as a Supabase project owner (DB owner) and test in staging before
--    applying to production. Expect a brief lock on the table while the ALTER runs.
-- 4) If you use generated TypeScript types from Supabase, regenerate them after the migration.
