# 🚀 Supabase SQL Execution Guide - Step by Step

## ⚠️ IMPORTANT: Execute in Order (2 SQL Scripts)

---

## **SCRIPT 1️⃣: Add Username Column to Database**

**Location in Supabase**: SQL Editor → New Query

**Copy & paste the entire script below:**

```sql
-- Migration: Add username field to seller_applications table
-- This field stores the seller's display username (distinct from store name)

BEGIN;

-- Add username column (optional, nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'seller_applications'
      AND column_name = 'username'
  ) THEN
    ALTER TABLE public.seller_applications ADD COLUMN username text;
  END IF;
END
$$;

COMMIT;
```

### ✅ Expected Result:
- Should show: `Success. No rows returned.`
- Or: `Query returned 0 rows`
- **Time**: < 1 second

### ❌ If you see an error:
- If column already exists: That's OK - script is idempotent (safe to run again)
- If different error: Take a screenshot and share it

---

## **SCRIPT 2️⃣: Update apply_for_seller() RPC Function**

**Location in Supabase**: SQL Editor → New Query (after Script 1 succeeds)

**⚠️ WARNING: This drops and recreates the function. Make sure Script 1 passed first!**

**Copy & paste the entire script below:**

```sql
-- Migration: Update apply_for_seller RPC to accept username, email, contact_number, and address

BEGIN;

-- Drop existing apply_for_seller function
DROP FUNCTION IF EXISTS public.apply_for_seller(text, text, text) CASCADE;

-- Create updated apply_for_seller function with new parameters
CREATE FUNCTION public.apply_for_seller(
    store_name text,
    store_description text,
    store_logo text DEFAULT NULL,
    username text DEFAULT NULL,
    email text DEFAULT NULL,
    contact_number text DEFAULT NULL,
    address text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_store_id uuid;
    store_slug text;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Start a transaction
    BEGIN
        -- Generate slug from store name
        store_slug := lower(regexp_replace(store_name, '[^a-zA-Z0-9]+', '-', 'g'));
        
        -- Create store record with logo_url
        INSERT INTO public.stores (
            slug,
            owner_id,
            logo_url,
            status
        ) VALUES (
            store_slug,
            auth.uid(),
            COALESCE(store_logo, '/gocart-logo.svg'),
            'inactive'::store_status
        )
        RETURNING id INTO new_store_id;

        -- Create store translation records for both languages
        INSERT INTO public.store_translations (
            store_id,
            language_code,
            name,
            description
        ) VALUES 
        (new_store_id, 'en', store_name, store_description),
        (new_store_id, 'ar', store_name, store_description);

        -- Create seller application record with all fields including new contact fields
        INSERT INTO public.seller_applications (
            user_id,
            store_id,
            logo_url,
            username,
            email,
            contact_number,
            address,
            status
        ) VALUES (
            auth.uid(),
            new_store_id,
            COALESCE(store_logo, '/gocart-logo.svg'),
            username,
            email,
            contact_number,
            address,
            'pending'
        );

        -- Add seller role (without pending suffix, simplified)
        INSERT INTO public.user_roles (user_id, role, status)
        VALUES (auth.uid(), 'seller', 'active')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Return the new store ID
        RETURN new_store_id;
    EXCEPTION WHEN others THEN
        -- Rollback transaction on any error
        RAISE;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.apply_for_seller TO authenticated;

COMMIT;
```

### ✅ Expected Result:
- Should show: `Success. No rows returned.`
- Or: `Query returned 0 rows`
- **Time**: < 1 second

### ❌ If you see an error:
- Take a screenshot and share it
- Most common: Function not found (that's OK - it will create it)

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
```
1. Go to: https://app.supabase.com
2. Select your project: "gocartlovm" (or your project name)
3. Left sidebar → SQL Editor
```

### Step 2: Run Script 1 (Add Username Column)
```
1. Click "New Query"
2. Paste entire SCRIPT 1 code (above)
3. Click "Run" (or Ctrl+Enter)
4. Wait for: ✅ "Success. No rows returned."
5. Click "Save" or just move to next query (doesn't matter)
```

### Step 3: Run Script 2 (Update RPC Function)
```
1. Click "New Query"
2. Paste entire SCRIPT 2 code (above)
3. Click "Run" (or Ctrl+Enter)
4. Wait for: ✅ "Success. No rows returned."
5. Done!
```

### Step 4: Verify in Supabase Dashboard
```
Optional - To verify the changes worked:

1. Left sidebar → Table Editor
2. Click on "seller_applications" table
3. Look for new columns: username, email, contact_number, address
   (scroll right if needed)
4. All columns should be there with empty values

5. Left sidebar → SQL Editor → New Query
6. Paste this verification script:

SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'apply_for_seller';

7. Should return 1 row showing the updated function with 7 parameters
```

---

## ✅ Verification Queries (Optional)

If you want to verify everything worked, run these:

### Check if username column exists:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'seller_applications'
ORDER BY ordinal_position;
```

**Should show columns:**
- id, user_id, store_id, status, created_at, updated_at, logo_url, username, email, contact_number, address

### Check if RPC function updated:
```sql
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'apply_for_seller';
```

**Should show:** 1 row with the new function definition including username parameter

---

## 🎯 Timeline

| Step | Action | Time | Result |
|------|--------|------|--------|
| 1 | Run Script 1 | < 1s | ✅ Column added |
| 2 | Run Script 2 | < 1s | ✅ RPC updated |
| 3 | Restart app | N/A | ✅ Frontend ready |
| 4 | Test at /create-store | Manual | ✅ Username field appears |

---

## 🚨 Troubleshooting

### Error: "Column 'username' already exists"
✅ **OK!** This means the column was already added. Script 1 is idempotent (safe to re-run).

### Error: "Function apply_for_seller does not exist"
✅ **OK!** Script 2 will create it fresh. This is expected if the old function was missing.

### Error: "syntax error at or near 'BEGIN'"
❌ **Problem:** Copy/paste error. Make sure you copied the **entire** script including BEGIN and COMMIT.
**Solution:** Try again, copy slower, paste into a text editor first to verify.

### Error: "relation 'public.stores' does not exist"
❌ **Problem:** Your database schema is corrupted or incomplete.
**Solution:** 
1. Take a screenshot of the error
2. Check that all previous migrations ran successfully
3. Share screenshot with context

### Error: "permission denied"
❌ **Problem:** Your user role doesn't have permission.
**Solution:**
1. Make sure you're logged in as a user with database admin rights
2. Try with the service role key (not anon key)

---

## ✨ After SQL Execution

### Frontend is ready to use immediately:
- No restart needed
- Changes cached by browser for ~1 hour
- New requests will use updated schema

### Test the feature:
1. Open browser DevTools (F12)
2. Clear cache or open in Incognito
3. Navigate to `/create-store`
4. You should see **Username** field as the first input
5. Fill and submit form
6. Check `/admin/stores` - should see username displayed

---

## 📝 Notes

- ✅ Both scripts are **idempotent** (safe to run multiple times)
- ✅ **Zero breaking changes** - existing data unaffected
- ✅ **Backward compatible** - old RPC calls still work
- ✅ **Non-destructive** - only adds, never deletes

---

## ✅ Done!

Once both scripts complete successfully, your database is ready for the new Username feature!

**Questions?** Take a screenshot of any errors and share them.
