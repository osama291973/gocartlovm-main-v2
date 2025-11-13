# 📋 COPY-PASTE READY QUERIES

## QUERY 1️⃣ - Products Description Column

**Copy everything below (between the dashes):**

```
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'description'
) as "Q1_products_description_exists";
```

**Expected Result:** 
- `t` (true) = Column exists ✅
- `f` (false) = Column missing ❌

**Note Result:** ___________

---

## QUERY 2️⃣ - Product Translations Description

**Copy everything below:**

```
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'product_translations'
    AND column_name = 'description'
) as "Q2_translations_description_exists";
```

**Expected Result:** 
- `t` (true) = Exists ✅
- `f` (false) = Missing ❌

**Note Result:** ___________

---

## QUERY 3️⃣ - Product Images Storage Bucket

**Copy everything below:**

```
SELECT id, name, public
FROM storage.buckets
WHERE id = 'product-images';
```

**Expected Result:** 
- Returns 1 row = Bucket exists ✅
- Returns 0 rows = Bucket missing ❌

**Note Result:** ___________

---

## QUERY 4️⃣ - Stores Owner ID Column

**Copy everything below:**

```
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'stores'
    AND column_name = 'owner_id'
) as "Q4_stores_owner_id_exists";
```

**Expected Result:** 
- `t` (true) = Exists ✅
- `f` (false) = Missing ❌

**Note Result:** ___________

---

## QUERY 5️⃣ - Products RLS Policies

**Copy everything below:**

```
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products'
ORDER BY policyname;
```

**Expected Result:** 
- Multiple rows (2+) = Good ✅
- 0 rows = Missing ❌

**Note Result Count:** ___________

---

## QUERY 6️⃣ - User Roles Table

**Copy everything below:**

```
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'user_roles'
) as "Q6_user_roles_table_exists";
```

**Expected Result:** 
- `t` (true) = Table exists ✅
- `f` (false) = Table missing ❌

**Note Result:** ___________

---

## QUERY 7️⃣ - Seller Applications Columns

**Copy everything below:**

```
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'seller_applications'
ORDER BY ordinal_position;
```

**Expected Result:** 
- Returns 10+ columns = Good ✅
- Returns few columns = Missing ❌

**Note Column Count:** ___________

---

## 📝 RESULTS SHEET

Fill this out as you run each query:

```
Q1 (products.description exists): t___________
Q2 (product_translations.description exists):t ___________
Q3 (product-images bucket exists): t___________
Q4 (stores.owner_id exists): t___________
Q5 (products RLS policies): Good___________
Q6 (user_roles table exists): t___________
Q7 (seller_applications columns): Good ___________
```

---

## 🚀 HOW TO EXECUTE

### For Each Query:

1. **Copy** the query text above
2. **Open** https://supabase.co → Your Project → SQL Editor
3. **Click** "New Query"
4. **Paste** the query (Ctrl+V)
5. **Click** "Run" button
6. **Look** at the result
7. **Write** the result in "Note Result:" above
8. **Repeat** for next query

---

## ⏱️ Time per Query: ~30 seconds

**Total time: ~5 minutes for all 7**

---

## ✅ WHEN DONE:

Share all 7 results with me. I'll send you the SQL to execute (numbered 1, 2, 3...).

---

**START WITH QUERY 1️⃣ NOW!**
