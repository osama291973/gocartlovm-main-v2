-- ============================================================================
-- QUICK SQL REFERENCE - Run this in Supabase SQL Editor
-- ============================================================================
-- 
-- This file contains quick SQL commands to verify and manage site_texts
-- Copy-paste each section into Supabase SQL Editor as needed
--
-- Created: November 15, 2025

-- ============================================================================
-- 1. VERIFY CURRENT STATE
-- ============================================================================

-- Count existing translations by language
SELECT language_code, COUNT(*) as total_keys
FROM site_texts
GROUP BY language_code;

-- Count by type
SELECT type, COUNT(*) as count
FROM site_texts
WHERE language_code = 'en'
GROUP BY type;

-- Check if specific keys exist
SELECT * FROM site_texts 
WHERE key IN (
  'product_form.error.product_name_required',
  'checkout.title',
  'coupon.invalid_code',
  'common.loading'
)
AND language_code = 'en';

-- ============================================================================
-- 2. DEPLOY NEW TRANSLATIONS (Safe - won't conflict)
-- ============================================================================

-- Add all missing translations in one go (recommended)
-- Simply execute the migration file: supabase/migrations/20250115_add_missing_site_texts.sql
-- OR use Supabase CLI: supabase db push

-- ============================================================================
-- 3. MANUAL INSERTION (if needed)
-- ============================================================================

-- Insert single translation
INSERT INTO site_texts (key, language_code, value, type, namespace, context, created_at, updated_at)
VALUES (
  'my_test_key',
  'en',
  'Test Value',
  'ui',
  'test',
  'Test context',
  NOW(),
  NOW()
)
ON CONFLICT (key, language_code) DO NOTHING;

-- Insert multiple translations at once
INSERT INTO site_texts (key, language_code, value, type, namespace, context, created_at, updated_at)
VALUES
  ('key1', 'en', 'English Value 1', 'ui', 'test', 'Context 1', NOW(), NOW()),
  ('key1', 'ar', 'قيمة عربية 1', 'ui', 'test', 'Context 1', NOW(), NOW()),
  ('key2', 'en', 'English Value 2', 'error', 'test', 'Context 2', NOW(), NOW()),
  ('key2', 'ar', 'قيمة عربية 2', 'error', 'test', 'Context 2', NOW(), NOW())
ON CONFLICT (key, language_code) DO NOTHING;

-- ============================================================================
-- 4. UPDATE EXISTING TRANSLATIONS
-- ============================================================================

-- Update a single translation
UPDATE site_texts
SET value = 'New Value', updated_at = NOW()
WHERE key = 'my_key' AND language_code = 'en';

-- Update multiple translations for a language
UPDATE site_texts
SET updated_at = NOW()
WHERE language_code = 'ar' 
AND key LIKE 'product_form.%';

-- ============================================================================
-- 5. DELETE TRANSLATIONS
-- ============================================================================

-- Delete a specific translation
DELETE FROM site_texts
WHERE key = 'old_key' AND language_code = 'en';

-- Delete all English translations with specific pattern
DELETE FROM site_texts
WHERE key LIKE 'test.%' AND language_code = 'en';

-- ============================================================================
-- 6. SEARCH & FILTER
-- ============================================================================

-- Find all translations for a specific key (all languages)
SELECT * FROM site_texts WHERE key = 'my_key' ORDER BY language_code;

-- Find all product_form translations
SELECT key, language_code, value FROM site_texts
WHERE key LIKE 'product_form.%'
ORDER BY key, language_code;

-- Find all error messages
SELECT key, language_code, value FROM site_texts
WHERE type = 'error'
ORDER BY key;

-- Search by value (case-insensitive)
SELECT * FROM site_texts
WHERE LOWER(value) LIKE '%checkout%'
AND language_code = 'en';

-- Find translations by namespace
SELECT key, type, value FROM site_texts
WHERE namespace = 'coupon'
AND language_code = 'en';

-- ============================================================================
-- 7. DATA INTEGRITY CHECKS
-- ============================================================================

-- Check for missing Arabic translations (keys that exist in English but not Arabic)
SELECT DISTINCT st_en.key
FROM site_texts st_en
LEFT JOIN site_texts st_ar 
  ON st_en.key = st_ar.key AND st_ar.language_code = 'ar'
WHERE st_en.language_code = 'en' 
AND st_ar.key IS NULL;

-- Find duplicate keys (should be 0 results if data is clean)
SELECT key, language_code, COUNT(*) as count
FROM site_texts
GROUP BY key, language_code
HAVING COUNT(*) > 1;

-- Check for empty values
SELECT * FROM site_texts WHERE value IS NULL OR value = '';

-- ============================================================================
-- 8. EXPORT & BACKUP
-- ============================================================================

-- Export all English translations as CSV format (for backup)
SELECT key, value as en_value
FROM site_texts
WHERE language_code = 'en'
ORDER BY key;

-- Export all translations for both languages
SELECT 
  st_en.key,
  st_en.value as en_value,
  COALESCE(st_ar.value, 'MISSING') as ar_value,
  st_en.type,
  st_en.namespace
FROM site_texts st_en
LEFT JOIN site_texts st_ar 
  ON st_en.key = st_ar.key AND st_ar.language_code = 'ar'
WHERE st_en.language_code = 'en'
ORDER BY st_en.key;

-- ============================================================================
-- 9. STATISTICS
-- ============================================================================

-- Translation coverage statistics
SELECT 
  COUNT(DISTINCT CASE WHEN language_code = 'en' THEN key END) as english_keys,
  COUNT(DISTINCT CASE WHEN language_code = 'ar' THEN key END) as arabic_keys,
  COUNT(DISTINCT key) as total_unique_keys
FROM site_texts;

-- Keys by namespace
SELECT namespace, COUNT(*) as count
FROM site_texts
WHERE language_code = 'en'
GROUP BY namespace
ORDER BY count DESC;

-- Keys by type
SELECT type, COUNT(*) as count
FROM site_texts
WHERE language_code = 'en'
GROUP BY type
ORDER BY count DESC;

-- ============================================================================
-- 10. MIGRATION STATUS
-- ============================================================================

-- Check which migrations have been applied (if using Supabase migrations)
-- Note: This depends on your Supabase project configuration
-- Check in: https://app.supabase.com -> SQL Editor -> See migrations

-- Verify that 20250115_add_missing_site_texts.sql has been applied:
SELECT COUNT(*) as new_translation_keys
FROM site_texts
WHERE key LIKE 'product_form.%' 
   OR key LIKE 'checkout.%' 
   OR key LIKE 'coupon.%'
   OR key LIKE 'common.%';

-- Expected result after migration: ~60 keys (30 English + 30 Arabic)

-- ============================================================================
-- COMMON QUERIES FOR DAILY USE
-- ============================================================================

-- Get all text for frontend (by language)
SELECT key, value FROM site_texts WHERE language_code = 'en' ORDER BY key;
SELECT key, value FROM site_texts WHERE language_code = 'ar' ORDER BY key;

-- Find untranslated keys (English exists but Arabic doesn't)
SELECT st_en.key, st_en.value
FROM site_texts st_en
LEFT JOIN site_texts st_ar ON st_en.key = st_ar.key AND st_ar.language_code = 'ar'
WHERE st_en.language_code = 'en' AND st_ar.id IS NULL;

-- Update a mistranslation quickly
UPDATE site_texts 
SET value = 'Corrected Value' 
WHERE key = 'key_name' AND language_code = 'ar';

-- Add a new language (Spanish example)
INSERT INTO site_texts (key, language_code, value, type, namespace, context, created_at, updated_at)
SELECT key, 'es', value, type, namespace, context, NOW(), NOW()
FROM site_texts
WHERE language_code = 'en';

-- ============================================================================
-- END OF QUICK REFERENCE
-- ============================================================================
