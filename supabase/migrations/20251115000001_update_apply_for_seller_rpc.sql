-- Migration: Update apply_for_seller RPC to accept email, contact_number, and address

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

-- NOTES:
-- 1. New parameters (username, email, contact_number, address) are optional (DEFAULT NULL)
-- 2. RPC is backward compatible - old calls without new fields will still work
-- 3. Old function signature is replaced, but the new signature has optional defaults
-- 4. Username stores the seller's display name (distinct from store_name)
