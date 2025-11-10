-- Create function to approve seller applications
CREATE OR REPLACE FUNCTION public.approve_seller_application(
    application_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Get application details
    WITH app AS (
        SELECT 
            sa.id,
            sa.user_id,
            sa.store_id
        FROM public.seller_applications sa
        WHERE sa.id = application_id
        AND sa.status = 'pending'
        FOR UPDATE
    )
    -- Update application status and related records in a transaction
    UPDATE public.seller_applications
    SET 
        status = 'approved',
        updated_at = NOW()
    FROM app
    WHERE seller_applications.id = app.id;

    -- Update store status
    UPDATE public.stores
    SET 
        status = 'active',
        updated_at = NOW()
    FROM app
    WHERE stores.id = app.store_id;

    -- Remove seller_pending role if exists
    DELETE FROM public.user_roles
    WHERE user_id = (
        SELECT user_id FROM app
    )
    AND role = 'seller_pending';

    -- Add seller role
    INSERT INTO public.user_roles (user_id, role, status)
    SELECT 
        app.user_id,
        'seller'::app_role,
        'active'
    FROM app
    ON CONFLICT (user_id, role) 
    DO UPDATE SET 
        status = 'active',
        updated_at = NOW();

END;
$$;

-- Create function to reject seller applications
CREATE OR REPLACE FUNCTION public.reject_seller_application(
    application_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Get application details
    WITH app AS (
        SELECT 
            sa.id,
            sa.user_id,
            sa.store_id
        FROM public.seller_applications sa
        WHERE sa.id = application_id
        AND sa.status = 'pending'
        FOR UPDATE
    )
    -- Update application status
    UPDATE public.seller_applications
    SET 
        status = 'rejected',
        updated_at = NOW()
    FROM app
    WHERE seller_applications.id = app.id;

    -- Update store status
    UPDATE public.stores
    SET 
        status = 'rejected',
        updated_at = NOW()
    FROM app
    WHERE stores.id = app.store_id;

    -- Remove seller_pending role
    DELETE FROM public.user_roles
    WHERE user_id = (
        SELECT user_id FROM app
    )
    AND role = 'seller_pending';
END;
$$;

-- Grant execute permissions to authenticated users (admins are checked within functions)
GRANT EXECUTE ON FUNCTION public.approve_seller_application TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_seller_application TO authenticated;