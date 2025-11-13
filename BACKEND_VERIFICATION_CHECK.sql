-- ============================================================================
-- COMPREHENSIVE BACKEND VERIFICATION QUERY
-- Execute this in Supabase SQL Editor and share the output
-- ============================================================================

-- 1. CHECK PRODUCTS TABLE STRUCTURE
SELECT 
  'PRODUCTS TABLE COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

-- 2. CHECK PRODUCT_TRANSLATIONS TABLE STRUCTURE
SELECT 
  'PRODUCT_TRANSLATIONS COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'product_translations'
ORDER BY ordinal_position;

-- 3. CHECK STORES TABLE STRUCTURE
SELECT 
  'STORES TABLE COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'stores'
ORDER BY ordinal_position;

-- 4. CHECK RLS POLICIES ON PRODUCTS
SELECT 
  'PRODUCTS RLS POLICIES' as check_type,
  policyname,
  permissive,
  cmd as operation,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products';

-- 5. CHECK RLS POLICIES ON PRODUCT_TRANSLATIONS
SELECT 
  'PRODUCT_TRANSLATIONS RLS POLICIES' as check_type,
  policyname,
  permissive,
  cmd as operation,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'product_translations';

-- 6. CHECK STORAGE BUCKETS
SELECT 
  'STORAGE BUCKETS' as check_type,
  id as bucket_name,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id IN ('product-images', 'avatars', 'store-logos');

-- 7. CHECK STORAGE RLS POLICIES
SELECT 
  'STORAGE RLS POLICIES' as check_type,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 8. CHECK USER_ROLES TABLE EXISTS
SELECT 
  'USER_ROLES TABLE EXISTS' as check_type,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) as table_exists;

-- 9. CHECK FUNCTIONS
SELECT 
  'FUNCTIONS' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'apply_for_seller',
    'upsert_product_translations_safe',
    'approve_seller',
    'reject_seller',
    'has_role'
  );

-- 10. CHECK SELLER_APPLICATIONS TABLE
SELECT 
  'SELLER_APPLICATIONS COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'seller_applications'
ORDER BY ordinal_position;

-- 11. CHECK CART_ITEMS TABLE
SELECT 
  'CART_ITEMS COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cart_items'
ORDER BY ordinal_position;

-- 12. CHECK SAMPLE PRODUCT DATA
SELECT 
  'SAMPLE PRODUCTS' as check_type,
  COUNT(*) as total_products,
  COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as with_description,
  COUNT(CASE WHEN description IS NULL THEN 1 END) as without_description
FROM public.products;

-- 13. CHECK SAMPLE PRODUCT TRANSLATIONS
SELECT 
  'SAMPLE TRANSLATIONS' as check_type,
  language_code,
  COUNT(*) as count
FROM public.product_translations
GROUP BY language_code;
