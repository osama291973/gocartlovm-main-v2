# 🎯 QUICK REFERENCE - Copy & Paste SQL (2 Scripts)

---

## SCRIPT 1️⃣ - Add Username Column
**Run this FIRST in Supabase SQL Editor**

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

**Expected**: ✅ Success. No rows returned.

---

## SCRIPT 2️⃣ - Update RPC Function
**Run this SECOND in Supabase SQL Editor**

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

**Expected**: ✅ Success. No rows returned.

---

## 📋 Execution Steps

1. Open: https://app.supabase.com → Your Project
2. Left sidebar → **SQL Editor**
3. Click **"New Query"**
4. Copy **SCRIPT 1** above
5. Paste & Click **Run**
6. Wait for ✅
7. Click **"New Query"** again
8. Copy **SCRIPT 2** above
9. Paste & Click **Run**
10. Wait for ✅

**Done!** ✨

---

## 🧪 Optional: Verify Changes

```sql
-- Check if columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'seller_applications'
ORDER BY ordinal_position;
```

**Should show**: username, email, contact_number, address columns

---

## ❌ If Error Occurs

- "Column already exists" → ✅ OK, script is idempotent
- "Function does not exist" → ✅ OK, it will be created
- Other error → Take screenshot and share

---

**Questions?** See: `SUPABASE_SQL_EXECUTION_GUIDE.md` for detailed troubleshooting
