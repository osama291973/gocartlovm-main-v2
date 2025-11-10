-- Function to handle seller applications
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
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Create store record
    INSERT INTO public.stores (
        name,
        description,
        owner_id,
        status
    ) VALUES (
        store_name,
        store_description,
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

    RETURN new_store_id;
END;
$$;