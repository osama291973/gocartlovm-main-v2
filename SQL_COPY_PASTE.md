# 📋 COPY-PASTE SQL QUERIES - Just Copy These!

---

## **QUERY 1️⃣: Check seller_applications Columns**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'seller_applications'
ORDER BY ordinal_position;
```

---

## **QUERY 2️⃣: Check apply_for_seller() Parameters**

```sql
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS parameters,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'apply_for_seller' 
AND n.nspname = 'public';
```

---

## **QUERY 3️⃣: Check RLS Policies**

```sql
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'seller_applications'
ORDER BY policyname;
```

---

## **QUERY 4️⃣: Check store-logos Bucket**

```sql
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'store-logos';
```

---

## **QUERY 5️⃣: Check Storage Policies**

```sql
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND (using::text ILIKE '%store-logos%' OR with_check::text ILIKE '%store-logos%')
ORDER BY policyname;
```

---

## **QUERY 6️⃣: Check has_role() Function**

```sql
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS parameters,
  p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'has_role'
AND n.nspname = 'public';
```

---

## **QUERY 7️⃣: Check Approval Functions**

```sql
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('approve_seller_application', 'reject_seller_application')
AND n.nspname = 'public'
ORDER BY p.proname;
```

---

## **QUERY 8️⃣: Test apply_for_seller() RPC**

```sql
SELECT apply_for_seller(
  store_name := 'Test Store',
  store_description := 'Test Description',
  store_logo := '/gocart-logo.svg',
  username := 'test_user',
  email := 'test@example.com',
  contact_number := '+1234567890',
  address := '123 Test St'
);
```

---

## **QUERY 9️⃣: Verify Test Record**

```sql
SELECT 
  id, user_id, store_id, username, email, 
  contact_number, address, status, created_at
FROM public.seller_applications
WHERE username = 'test_user'
ORDER BY created_at DESC
LIMIT 1;
```

---

## **QUERY 🔟: Check user_roles Table**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;
```

---

## ✅ HOW TO USE

1. Open Supabase → SQL Editor
2. Click "New Query"
3. Copy **QUERY 1** above
4. Paste in editor
5. Click "Run"
6. Check result ✅
7. Repeat for QUERY 2, 3, 4... etc.

---

**All 10 queries ready to copy! 🚀**
