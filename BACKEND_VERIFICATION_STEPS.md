# 🔍 BACKEND VERIFICATION - STEP BY STEP

## ⚡ Quick Diagnosis (Copy-Paste Each Query One at a Time)

### **QUERY 1: Check if products.description column exists**

**Location:** Supabase → SQL Editor → New Query

**Copy & Paste:**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'description'
) as products_has_description;
```

**Execute:** Click "Run"

**Possible Results:**
- ✅ `products_has_description = true` → Column EXISTS (migration was executed)
- ❌ `products_has_description = false` → Column MISSING (need to add)

**Share with me:** The result (true or false)

---

### **QUERY 2: Check if product_translations.description exists**

**Location:** Same Supabase SQL Editor → New Query

**Copy & Paste:**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'product_translations'
    AND column_name = 'description'
) as translations_has_description;
```

**Execute:** Click "Run"

**Possible Results:**
- ✅ `translations_has_description = true` → Already exists (good!)
- ❌ `translations_has_description = false` → Missing

**Share with me:** The result (true or false)

---

### **QUERY 3: Check product-images storage bucket**

**Copy & Paste:**
```sql
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'product-images';
```

**Possible Results:**
- ✅ Returns 1 row → Bucket exists
- ❌ Returns 0 rows → Bucket doesn't exist

**Share with me:** The result (returns row or no rows)

---

### **QUERY 4: Check stores table has owner_id**

**Copy & Paste:**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'stores'
    AND column_name = 'owner_id'
) as stores_has_owner_id;
```

**Possible Results:**
- ✅ `stores_has_owner_id = true` → Has owner_id
- ❌ `stores_has_owner_id = false` → Missing owner_id

**Share with me:** The result (true or false)

---

### **QUERY 5: Check RLS policies on products**

**Copy & Paste:**
```sql
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products'
ORDER BY policyname;
```

**Share with me:** All the policy names returned (or "no rows")

---

### **QUERY 6: Check user_roles table exists**

**Copy & Paste:**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'user_roles'
) as user_roles_exists;
```

**Possible Results:**
- ✅ `user_roles_exists = true` → Table exists
- ❌ `user_roles_exists = false` → Table missing

**Share with me:** The result (true or false)

---

### **QUERY 7: Check seller_applications columns**

**Copy & Paste:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'seller_applications'
ORDER BY ordinal_position;
```

**Share with me:** List of all columns

---

## 📊 Summary Template

When you run all 7 queries, please share results like this:

```
Query 1 (products_has_description): [true/false]
Query 2 (translations_has_description): [true/false]
Query 3 (product-images bucket): [exists/not found]
Query 4 (stores_has_owner_id): [true/false]
Query 5 (products RLS policies): [list policy names or "no rows"]
Query 6 (user_roles_exists): [true/false]
Query 7 (seller_applications columns): [list column names]
```

---

## 🎯 Then I Will:

Once you provide the results, I will:

1. ✅ Determine which migrations need to be executed
2. ✅ Create SQL scripts numbered 1, 2, 3... (one at a time)
3. ✅ Each script will be independent and verified
4. ✅ Update your migration files accordingly
5. ✅ Ensure frontend compatibility

---

## ⏱️ Time Required

- Running 7 queries: ~5 minutes
- Sharing results: 2 minutes
- **Total: 7 minutes to full diagnosis**

---

Let's start! Execute Query 1 first and share the result.
