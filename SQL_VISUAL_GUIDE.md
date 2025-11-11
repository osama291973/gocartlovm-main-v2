# 📸 Visual Step-by-Step Guide for Supabase SQL Execution

---

## STEP 1: Open Supabase Project

**Go to:** https://app.supabase.com

**You should see:**
```
┌─────────────────────────────────────┐
│  Supabase Dashboard                 │
│  [Your Projects]                    │
│                                     │
│  gocartlovm (or your project name)  │
│  ├─ Authentication                  │
│  ├─ Databases (click here)          │
│  │  └─ SQL Editor  ← CLICK THIS     │
│  ├─ Storage                         │
│  └─ ...                             │
└─────────────────────────────────────┘
```

**Action:** Click on **SQL Editor** in left sidebar

---

## STEP 2: Create First Query

**In SQL Editor, click:** `+ New Query` (top right or center)

**You should see:**
```
┌─────────────────────────────────────────────┐
│  SQL Editor                                 │
│  [+ New Query]  [Templates]                 │
├─────────────────────────────────────────────┤
│  # Create a new query                       │
│                                             │
│  [New Query]  [From Template]  [From File]  │
└─────────────────────────────────────────────┘
```

**Action:** Click `New Query`

---

## STEP 3: Paste Script 1 (Add Username Column)

**In the empty SQL editor area, you'll see:**
```
┌─────────────────────────────────────────────┐
│  untitled query • ⚙️ Settings               │
├─────────────────────────────────────────────┤
│  [SQL CODE HERE]                            │
│                                             │
│  [Run] [Format] [Explain] [Share]           │
└─────────────────────────────────────────────┘
```

**Action:**
1. Click in the editor area (below line numbers)
2. Press `Ctrl+A` to select all (if there's placeholder text)
3. Delete any existing text
4. Paste this entire code:

```sql
BEGIN;

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

**Verify:**
- ✅ All code is pasted
- ✅ No red error lines (underlines)
- ✅ BEGIN and COMMIT are visible

---

## STEP 4: Execute Script 1

**Click the blue [Run] button** (top right of editor)

Or press: `Ctrl + Enter`

**You should see:**

```
┌─────────────────────────────────────────────┐
│  Results                                    │
├─────────────────────────────────────────────┤
│  ✅ Success. No rows returned.              │
│                                             │
│  Execution time: 0.245ms                    │
└─────────────────────────────────────────────┘
```

**If you see this, you're good!** ✅ Move to STEP 5

**If you see an error:**
- "Column 'username' already exists" → ✅ OK, move to STEP 5
- Other error → Screenshot and share

---

## STEP 5: Create Second Query

**Click:** `+ New Query` (top area)

A new blank SQL editor tab will open

---

## STEP 6: Paste Script 2 (Update RPC Function)

**In the new empty editor, paste this ENTIRE code:**

```sql
BEGIN;

DROP FUNCTION IF EXISTS public.apply_for_seller(text, text, text) CASCADE;

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
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    BEGIN
        store_slug := lower(regexp_replace(store_name, '[^a-zA-Z0-9]+', '-', 'g'));
        
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

        INSERT INTO public.store_translations (
            store_id,
            language_code,
            name,
            description
        ) VALUES 
        (new_store_id, 'en', store_name, store_description),
        (new_store_id, 'ar', store_name, store_description);

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

        INSERT INTO public.user_roles (user_id, role, status)
        VALUES (auth.uid(), 'seller', 'active')
        ON CONFLICT (user_id, role) DO NOTHING;

        RETURN new_store_id;
    EXCEPTION WHEN others THEN
        RAISE;
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_for_seller TO authenticated;

COMMIT;
```

**Verify:**
- ✅ All code pasted
- ✅ See "DROP FUNCTION" at top
- ✅ See "CREATE FUNCTION" with 7 parameters
- ✅ See "GRANT EXECUTE" at end
- ✅ BEGIN and COMMIT visible

---

## STEP 7: Execute Script 2

**Click the blue [Run] button** (same as Step 4)

**You should see:**

```
┌─────────────────────────────────────────────┐
│  Results                                    │
├─────────────────────────────────────────────┤
│  ✅ Success. No rows returned.              │
│                                             │
│  Execution time: 0.523ms                    │
└─────────────────────────────────────────────┘
```

**Perfect!** ✨ Both scripts are done!

---

## STEP 8: Verify in Table Editor (Optional)

**To see the new columns:**

1. Left sidebar → Click **Table Editor**
2. Click on table: **seller_applications**
3. Scroll right to see new columns:
   - username
   - email
   - contact_number
   - address

**You should see them all listed** ✅

---

## STEP 9: Test in Your App

**In your browser:**

1. Go to: `http://localhost:5173/create-store` (or your dev URL)
2. You should see: **Username** field as the FIRST input
3. Fill the form including username
4. Click Submit
5. If no errors, go to: `http://localhost:5173/admin/stores`
6. You should see the seller with username displayed ✅

---

## ✅ You're Done!

Both SQL scripts have been executed successfully!

---

## 🆘 If Something Goes Wrong

### Scenario 1: "Column 'username' already exists"
```
Error: column "username" of relation "seller_applications" 
already exists
```
✅ **This is FINE** - it means the column was already added
- The script is idempotent (safe to run again)
- Just continue to STEP 5

### Scenario 2: "Syntax error"
```
Error: syntax error at or near "BEGIN"
```
❌ **Copy/paste error**
- Make sure you copied the ENTIRE script
- Try copying to Notepad first to verify
- Then paste from Notepad to Supabase

### Scenario 3: "Function does not exist"
```
Error: function public.apply_for_seller(text, text, text) 
does not exist
```
✅ **This is OK** - the function will be created by the script
- Continue to STEP 5

### Scenario 4: "Permission denied"
```
Error: permission denied for schema public
```
❌ **You don't have admin rights**
- Make sure you're logged in with correct account
- Use the service role key instead of anon key

---

## 📞 Need Help?

1. Screenshot the error
2. Copy the exact error message
3. Share both with context
4. Include: project name, which script (1 or 2), exact error text

---

**Questions?** See detailed guide: `SUPABASE_SQL_EXECUTION_GUIDE.md`
