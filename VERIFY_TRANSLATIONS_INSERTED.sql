-- Verification Queries
-- Run these queries one at a time in Supabase SQL Editor to verify the data was inserted

-- Query 1: Count total site_texts rows
SELECT COUNT(*) as total_rows FROM public.site_texts;

-- Query 2: Count by language
SELECT language_code, COUNT(*) as count FROM public.site_texts GROUP BY language_code;

-- Query 3: Show newly added translations (product_form namespace)
SELECT key, language_code, value FROM public.site_texts 
WHERE namespace = 'product_form' 
ORDER BY key, language_code;

-- Query 4: Show coupon translations
SELECT key, language_code, value FROM public.site_texts 
WHERE namespace = 'coupon' 
ORDER BY key, language_code;

-- Query 5: Count by namespace to see distribution
SELECT namespace, COUNT(*) as count FROM public.site_texts GROUP BY namespace ORDER BY count DESC;

-- Query 6: Show all new translation keys added
SELECT DISTINCT key FROM public.site_texts 
WHERE key LIKE 'product_form.%' OR key LIKE 'checkout.%' OR key LIKE 'coupon.%' 
OR key LIKE 'admin.%' OR key LIKE 'account.%' OR key LIKE 'common.%'
ORDER BY key;
