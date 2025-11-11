-- Migration: Add username field to seller_applications table
-- This field stores the seller's display username (distinct from store name)

BEGIN;

-- Add username column (optional, nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'seller_applications'
      AND column_name = 'username'
  ) THEN
    ALTER TABLE public.seller_applications ADD COLUMN username text;
  END IF;
END
$$;

COMMIT;

-- NOTES:
-- 1. Column is nullable (backward compatible)
-- 2. Can be re-run safely (idempotent)
-- 3. No RLS changes needed
-- 4. No impact on existing applications
