-- Create type if not exists (must be first)
DO $$ BEGIN
    CREATE TYPE store_status AS ENUM ('pending', 'active', 'suspended', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create or modify stores table
DO $$ BEGIN
    CREATE TABLE IF NOT EXISTS public.stores (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text UNIQUE,
        owner_id uuid REFERENCES auth.users(id),
        logo_url text,
        cover_url text,
        rating numeric DEFAULT 0,
        total_products integer DEFAULT 0,
        status store_status DEFAULT 'pending',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );
EXCEPTION
    WHEN duplicate_object THEN
        -- Add owner_id column if it doesn't exist
        ALTER TABLE public.stores 
        ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
END $$;

-- Create store translations table if not exists
CREATE TABLE IF NOT EXISTS public.store_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    language_code text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(store_id, language_code)
);

-- Add indexes (after tables are created)
CREATE INDEX IF NOT EXISTS idx_stores_owner ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_store_translations_store ON public.store_translations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_translations_lang ON public.store_translations(language_code);

-- Update function to handle slug generation
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

    -- Create seller application record if table exists
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