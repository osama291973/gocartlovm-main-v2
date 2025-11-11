-- Migration: Add email, contact_number, and address fields to seller_applications
-- These fields are OPTIONAL (nullable) so existing rows are not affected

BEGIN;

-- Add email column (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'seller_applications'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE public.seller_applications ADD COLUMN email text;
  END IF;
END
$$;

-- Add contact_number column (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'seller_applications'
      AND column_name = 'contact_number'
  ) THEN
    ALTER TABLE public.seller_applications ADD COLUMN contact_number text;
  END IF;
END
$$;

-- Add address column (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'seller_applications'
      AND column_name = 'address'
  ) THEN
    ALTER TABLE public.seller_applications ADD COLUMN address text;
  END IF;
END
$$;

COMMIT;

-- NOTES:
-- 1. All new columns are NULL by default (backward compatible)
-- 2. Existing seller applications are not affected
-- 3. No RLS policies need to be changed (they operate at row level)
-- 4. Can safely be re-run without errors (idempotent)
