-- VERIFICATION QUERIES - Run these to confirm all Arabic translations are in backend

-- Query 1: Total count of all translations
SELECT COUNT(*) as total_translations FROM public.site_texts;

-- Query 2: Count by language
SELECT language_code, COUNT(*) as count 
FROM public.site_texts 
GROUP BY language_code 
ORDER BY language_code;

-- Query 3: Count by namespace
SELECT namespace, COUNT(*) as count 
FROM public.site_texts 
GROUP BY namespace 
ORDER BY count DESC;

-- Query 4: Sample Arabic product form translations
SELECT key, value FROM public.site_texts 
WHERE namespace = 'product_form' AND language_code = 'ar' 
ORDER BY key 
LIMIT 10;

-- Query 5: Sample Arabic checkout translations
SELECT key, value FROM public.site_texts 
WHERE namespace = 'checkout' AND language_code = 'ar' 
ORDER BY key;

-- Query 6: Sample Arabic common UI translations
SELECT key, value FROM public.site_texts 
WHERE namespace = 'common' AND language_code = 'ar' 
ORDER BY key;

-- Query 7: Verify all namespaces have both EN and AR
SELECT namespace, language_code, COUNT(*) as count
FROM public.site_texts
GROUP BY namespace, language_code
ORDER BY namespace, language_code;

-- Query 8: Show all Arabic translation keys
SELECT key, value FROM public.site_texts 
WHERE language_code = 'ar'
ORDER BY namespace, key;

-- Query 9: Missing keys check (keys in EN but not in AR)
SELECT DISTINCT t1.key 
FROM public.site_texts t1
WHERE t1.language_code = 'en'
AND NOT EXISTS (
  SELECT 1 FROM public.site_texts t2 
  WHERE t2.language_code = 'ar' 
  AND t2.key = t1.key
)
ORDER BY t1.key;

-- Query 10: Summary statistics
SELECT 
  (SELECT COUNT(DISTINCT key) FROM public.site_texts WHERE language_code = 'en') as unique_english_keys,
  (SELECT COUNT(DISTINCT key) FROM public.site_texts WHERE language_code = 'ar') as unique_arabic_keys,
  COUNT(*) as total_rows
FROM public.site_texts;
