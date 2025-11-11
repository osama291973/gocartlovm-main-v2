-- Migration: Add logo_url column to seller_applications and update apply_for_seller RPC
-- This migration adds logo_url to seller_applications and updates the apply_for_seller function
-- to accept and store the logo URL passed by the frontend.

BEGIN;

-- 1) Add logo_url column to seller_applications (idempotent check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'seller_applications'
      AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.seller_applications ADD COLUMN logo_url text;
  END IF;
END
$$;

-- 2) Drop all existing apply_for_seller functions (handles multiple signatures from earlier migrations)
DROP FUNCTION IF EXISTS public.apply_for_seller(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.apply_for_seller(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.apply_for_seller() CASCADE;

-- 3) Create new apply_for_seller function with logo_url parameter
-- The function now:
--   - Accepts store_logo parameter (optional, can be NULL for default logo)
--   - Stores logo_url in the stores table when creating the store
--   - Stores logo_url in seller_applications for reference
CREATE FUNCTION public.apply_for_seller(
    store_name text,
    store_description text,
    store_logo text DEFAULT NULL
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
            'deactivated'::store_status
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

        -- Create seller application record with logo_url
        INSERT INTO public.seller_applications (
            user_id,
            store_id,
            logo_url,
            status
        ) VALUES (
            auth.uid(),
            new_store_id,
            COALESCE(store_logo, '/gocart-logo.svg'),
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

-- 4) Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.apply_for_seller TO authenticated;

COMMIT;

-- NOTES:
-- 1) All old apply_for_seller functions are dropped with CASCADE to handle dependencies.
-- 2) The default status for new stores is now 'deactivated' instead of 'pending' 
--    (matching the new enum values: 'activated' and 'deactivated').
-- 3) If store_logo is NULL or not provided, defaults to '/gocart-logo.svg'.
-- 4) The function stores logo_url in both stores and seller_applications tables.
-- 5) The user_roles insert now uses 'seller' (not 'seller_pending') with status 'active'.
-- 6) This migration safely replaces all old function signatures by dropping them first.
