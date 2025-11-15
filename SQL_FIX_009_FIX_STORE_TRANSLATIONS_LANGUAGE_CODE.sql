-- ============================================================================
-- SQL FIX #009: FIX STORE_TRANSLATIONS LANGUAGE_CODE TYPE
-- ============================================================================
-- Issue: store_translations.language_code is TEXT type, should be language_code ENUM
-- Solution: Same as site_texts - create new column, migrate, drop old
-- ============================================================================

-- Step 1: Check current store_translations language values
SELECT DISTINCT language_code FROM public.store_translations;

-- Step 2: Add new language_code column with ENUM type
ALTER TABLE public.store_translations 
ADD COLUMN language_code_new language_code;

-- Step 3: Migrate existing data (cast text to enum)
UPDATE public.store_translations 
SET language_code_new = language_code::language_code 
WHERE language_code_new IS NULL;

-- Step 4: Drop old column and rename new one
ALTER TABLE public.store_translations 
DROP COLUMN language_code;

ALTER TABLE public.store_translations 
RENAME COLUMN language_code_new TO language_code;

-- Step 5: Ensure column is NOT NULL and has correct default
ALTER TABLE public.store_translations 
ALTER COLUMN language_code SET NOT NULL,
ALTER COLUMN language_code SET DEFAULT 'en'::language_code;

-- Step 6: Verify column type
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'store_translations' AND column_name = 'language_code';

-- ============================================================================
-- Run Step 1 first to check language values
-- If only 'en' and 'ar', proceed with Steps 2-6
-- ============================================================================
