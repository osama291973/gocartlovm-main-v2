-- Update apply_for_seller function to properly handle user roles
CREATE OR REPLACE FUNCTION public.apply_for_seller(
    store_description text,
    store_name text
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
        
        -- Create store record
        INSERT INTO public.stores (
            slug,
            owner_id,
            status
        ) VALUES (
            store_slug,
            auth.uid(),
            'pending'::store_status
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

        -- Create seller application record
        INSERT INTO public.seller_applications (
            user_id,
            store_id,
            status
        ) VALUES (
            auth.uid(),
            new_store_id,
            'pending'
        );

        -- Add seller_pending role if not exists
        INSERT INTO public.user_roles (user_id, role, status)
        VALUES (auth.uid(), 'seller_pending', 'active')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Return the new store ID
        RETURN new_store_id;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on any error
        RAISE;
    END;
END;
$$;