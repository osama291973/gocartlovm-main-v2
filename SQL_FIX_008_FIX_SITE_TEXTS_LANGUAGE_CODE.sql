-- ============================================================================
-- SQL FIX #008: FIX SITE_TEXTS LANGUAGE_CODE TYPE MISMATCH
-- ============================================================================
-- Issue: site_texts.language_code is TEXT type, should be language_code ENUM
-- Risk: Data inconsistency - other tables use enum constraint
-- Solution: Create new column with enum, migrate data, drop old column
-- ============================================================================

-- Step 1: Check current site_texts language values
SELECT DISTINCT language_code FROM public.site_texts;

-- Step 2: Add new language_code column with ENUM type
ALTER TABLE public.site_texts 
ADD COLUMN language_code_new language_code;

-- Step 3: Migrate existing data (cast text to enum)
UPDATE public.site_texts 
SET language_code_new = language_code::language_code 
WHERE language_code_new IS NULL;

-- Step 4: Drop old column and rename new one
ALTER TABLE public.site_texts 
DROP COLUMN language_code;

ALTER TABLE public.site_texts 
RENAME COLUMN language_code_new TO language_code;

-- Step 5: Ensure column is NOT NULL and has correct default
ALTER TABLE public.site_texts 
ALTER COLUMN language_code SET NOT NULL,
ALTER COLUMN language_code SET DEFAULT 'en'::language_code;

-- Step 6: Verify column type
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'site_texts' AND column_name = 'language_code';

-- ============================================================================
-- Run Step 1 first to check language values
-- If only 'en' and 'ar', proceed with Steps 2-6
-- ============================================================================
