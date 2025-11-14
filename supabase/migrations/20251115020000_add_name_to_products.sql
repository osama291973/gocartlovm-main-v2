-- Migration: Add name column to products table
-- Purpose: Add a product-level name column so product rows can store a default name

BEGIN;

-- Add name column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'name'
  ) THEN
    ALTER TABLE public.products ADD COLUMN name TEXT;
  END IF;
END
$$;

COMMIT;
