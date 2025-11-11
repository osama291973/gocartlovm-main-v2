# ✅ BACKEND & FRONTEND COMPATIBILITY - VERIFICATION SQL

## Run These SQL Queries in Supabase SQL Editor (One at a Time)

---

## SQL 1️⃣: Check if seller_applications Table Has All Required Columns

**Purpose:** Verify username, email, contact_number, address columns exist

**Copy & Paste This:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'seller_applications'
ORDER BY ordinal_position;
```

**Expected Result:**
You should see these columns (in order):
- id (uuid, NO)
- user_id (uuid, YES)
- store_id (uuid, YES)
- status (text, YES)
- created_at (timestamp with time zone, NO)
- updated_at (timestamp with time zone, YES)
- logo_url (text, YES) ✅ NEW
- email (text, YES) ✅ NEW
- contact_number (text, YES) ✅ NEW
- address (text, YES) ✅ NEW
- username (text, YES) ✅ NEW

**If You See All These:** ✅ **PASS** → Go to SQL 2

**If Missing Any Column:** ❌ **FAIL** → Run the migrations first (EXECUTE_NOW.md)

---

## SQL 2️⃣: Check apply_for_seller() RPC Function Parameters

**Purpose:** Verify the RPC has 7 parameters (store_name, store_description, store_logo, username, email, contact_number, address)

**Copy & Paste This:**

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

**Expected Result:**
You should see function definition that includes:
- `store_name text`
- `store_description text`
- `store_logo text DEFAULT NULL`
- `username text DEFAULT NULL`
- `email text DEFAULT NULL`
- `contact_number text DEFAULT NULL`
- `address text DEFAULT NULL`

**If All 7 Parameters Present:** ✅ **PASS** → Go to SQL 3

**If Only 3 Parameters (old version):** ❌ **FAIL** → Run the migrations

---

## SQL 3️⃣: Check RLS Policies on seller_applications Table

**Purpose:** Verify all 3 RLS policies exist

**Copy & Paste This:**

```sql
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'seller_applications'
ORDER BY policyname;
```

**Expected Result:**
You should see 3 policies:
1. **"Admins can update applications"** (UPDATE policy)
2. **"Admins can view all applications"** (SELECT policy)
3. **"Users can create applications"** (INSERT policy)
4. **"Users can view own applications"** (SELECT policy)

**If You See 3-4 Policies:** ✅ **PASS** → Go to SQL 4

**If No Policies:** ❌ **FAIL** → Policies missing

---

## SQL 4️⃣: Check store-logos Storage Bucket Exists

**Purpose:** Verify the storage bucket is created and public

**Copy & Paste This:**

```sql
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'store-logos';
```

**Expected Result:**
```
id              | name        | public | created_at
store-logos     | store-logos | true   | 2025-11-...
```

**If You See 1 Row:** ✅ **PASS** → Go to SQL 5

**If No Rows:** ❌ **FAIL** → Bucket not created

---

## SQL 5️⃣: Check Storage Policies for store-logos Bucket

**Purpose:** Verify all 5 storage RLS policies exist

**Copy & Paste This:**

```sql
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND using::text ILIKE '%store-logos%' OR with_check::text ILIKE '%store-logos%'
ORDER BY policyname;
```

**Expected Result:**
You should see 5 policies:
1. "Public read store logos"
2. "Authenticated users can upload store logos"
3. "Users can update own store logos"
4. "Users can delete own store logos"
5. "Admins can delete store logos"

**If You See 5 Policies:** ✅ **PASS** → Go to SQL 6

**If Fewer Policies:** ❌ **FAIL** → Storage policies incomplete

---

## SQL 6️⃣: Check has_role() Function Exists

**Purpose:** Verify the role-checking helper function exists

**Copy & Paste This:**

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

**Expected Result:**
```
function_name | parameters          | security_definer
has_role      | _user_id uuid, ... | true
```

**If Function Exists:** ✅ **PASS** → Go to SQL 7

**If No Rows:** ❌ **FAIL** → Function missing

---

## SQL 7️⃣: Check approve_seller_application() and reject_seller_application() Functions

**Purpose:** Verify approval/rejection RPCs exist

**Copy & Paste This:**

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

**Expected Result:**
```
function_name                    | parameters
approve_seller_application       | application_id uuid
reject_seller_application        | application_id uuid
```

**If Both Functions Exist:** ✅ **PASS** → Go to SQL 8

**If Missing:** ❌ **FAIL** → Functions not created

---

## SQL 8️⃣: Test apply_for_seller() RPC (Admin Only - Optional)

**Purpose:** Verify the RPC actually works and accepts all 7 parameters

**⚠️ WARNING: This will CREATE a test store. Only run if you want a test record.**

**Copy & Paste This (modify values as needed):**

```sql
SELECT apply_for_seller(
  store_name := 'Test Store for Verification',
  store_description := 'This is a test store',
  store_logo := '/gocart-logo.svg',
  username := 'test_username_verify',
  email := 'test@example.com',
  contact_number := '+1234567890',
  address := '123 Test Street, Test City'
);
```

**Expected Result:**
```
apply_for_seller
<uuid of new store>
```

**If You Get a UUID:** ✅ **PASS** → RPC works!

**If Error:** ❌ **FAIL** → RPC has issues

---

## SQL 9️⃣: Verify New Application Record (Optional - After SQL 8)

**Purpose:** If SQL 8 succeeded, check the created application has all fields

**Copy & Paste This:**

```sql
SELECT 
  id,
  user_id,
  store_id,
  username,
  email,
  contact_number,
  address,
  status,
  created_at
FROM public.seller_applications
WHERE username = 'test_username_verify'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
id         | <uuid>
user_id    | <your user id>
store_id   | <uuid>
username   | test_username_verify
email      | test@example.com
contact_number | +1234567890
address    | 123 Test Street, Test City
status     | pending
created_at | 2025-11-...
```

**If All Fields Match:** ✅ **PASS** - Everything works!

---

## SQL 🔟: Check user_roles Table (Frontend Auth Support)

**Purpose:** Verify user_roles table exists for role management

**Copy & Paste This:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;
```

**Expected Result:**
```
id          | uuid     | NO
user_id     | uuid     | NO
role        | text     | NO
status      | text     | YES
created_at  | timestamp | NO
updated_at  | timestamp | YES
```

**If Columns Present:** ✅ **PASS** → Auth system ready

---

## Summary Checklist

After running all 10 SQLs above, you should have:

- ✅ SQL 1: All 10 columns on seller_applications (including username, email, contact_number, address)
- ✅ SQL 2: apply_for_seller() has 7 parameters
- ✅ SQL 3: 3-4 RLS policies on seller_applications
- ✅ SQL 4: store-logos bucket exists and is public
- ✅ SQL 5: 5 storage policies
- ✅ SQL 6: has_role() function exists
- ✅ SQL 7: approve/reject RPC functions exist
- ✅ SQL 8: Test RPC call succeeds (optional)
- ✅ SQL 9: Test record has all fields (optional, after SQL 8)
- ✅ SQL 10: user_roles table exists

---

## If Everything Passes (All ✅)

**Frontend & Backend are 100% Compatible!**

**Next Steps:**
1. ✅ Frontend already has the form fields (CreateStore.tsx)
2. ✅ RPC calls match (applies all 7 parameters)
3. ✅ Admin dashboard displays new fields (AdminStores.tsx)
4. ✅ Storage works (50MB validation + policies)
5. ✅ Auth system ready (user_roles + has_role function)

**Just test in your app:**
- Go to `/create-store`
- Fill form including username, email, contact, address
- Submit
- Go to `/admin/stores`
- See username displayed ✅

---

## If Any Query Fails (❌)

Copy the error message and:
1. Tell me which SQL (1-10) failed
2. Copy the exact error
3. I'll provide a fix SQL or migration to run

---

**Ready? Go run SQL 1 in Supabase SQL Editor now!**
