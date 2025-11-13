-- CHECK if product keys already exist in site_texts
SELECT key, language_code, value
FROM public.site_texts
WHERE key LIKE 'product_%'
ORDER BY key, language_code;
