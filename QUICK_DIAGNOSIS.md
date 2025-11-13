# 🚀 QUICK DIAGNOSIS QUERIES

Copy each query below, paste in Supabase SQL Editor, click Run, and share the result.

---

## Query 1️⃣
```sql
SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'description') as Q1_products_description;
```
**Expected:** true or false
**Share:** ___________

---

## Query 2️⃣
```sql
SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_translations' AND column_name = 'description') as Q2_translations_description;
```
**Expected:** true or false
**Share:** ___________

---

## Query 3️⃣
```sql
SELECT COUNT(*) as Q3_product_images_bucket FROM storage.buckets WHERE id = 'product-images';
```
**Expected:** 0 or 1
**Share:** ___________

---

## Query 4️⃣
```sql
SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'owner_id') as Q4_stores_owner_id;
```
**Expected:** true or false
**Share:** ___________

---

## Query 5️⃣
```sql
SELECT COUNT(*) as Q5_products_rls_policies FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products';
```
**Expected:** number (0 or more)
**Share:** ___________

---

## Query 6️⃣
```sql
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') as Q6_user_roles;
```
**Expected:** true or false
**Share:** ___________

---

## Query 7️⃣
```sql
SELECT COUNT(*) as Q7_seller_app_columns FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'seller_applications';
```
**Expected:** number
**Share:** ___________

---

## 📋 RESULTS TEMPLATE

Copy and fill this:

```
Q1 (products.description exists): ___________
Q2 (product_translations.description exists): ___________
Q3 (product-images bucket): ___________
Q4 (stores.owner_id exists): ___________
Q5 (products RLS policies count): ___________
Q6 (user_roles table exists): ___________
Q7 (seller_applications columns count): ___________
```

Share this with me and I'll give you the exact SQL to run, numbered 1, 2, 3...
