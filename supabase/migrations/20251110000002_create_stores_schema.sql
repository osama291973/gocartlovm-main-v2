-- Drop existing tables and types to start fresh
DROP TABLE IF EXISTS public.seller_applications CASCADE;
DROP TABLE IF EXISTS public.store_translations CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TYPE IF EXISTS store_status;

-- Create type for store status
CREATE TYPE store_status AS ENUM ('pending', 'active', 'suspended', 'closed');

-- Create stores table
CREATE TABLE public.stores (
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

-- Create store translations table
CREATE TABLE public.store_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    language_code text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(store_id, language_code)
);

-- Create seller applications table
CREATE TABLE public.seller_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, store_id)
);

-- Add indexes
CREATE INDEX idx_stores_owner ON public.stores(owner_id);
CREATE INDEX idx_store_translations_store ON public.store_translations(store_id);
CREATE INDEX idx_store_translations_lang ON public.store_translations(language_code);
CREATE INDEX idx_seller_applications_user ON public.seller_applications(user_id);
CREATE INDEX idx_seller_applications_store ON public.seller_applications(store_id);

-- Add RLS policies
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
CREATE POLICY "Anyone can view stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Store owners can update their stores" ON public.stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for store translations
CREATE POLICY "Anyone can view store translations" ON public.store_translations FOR SELECT USING (true);
CREATE POLICY "Store owners can manage translations" ON public.store_translations 
    USING (EXISTS (
        SELECT 1 FROM public.stores s 
        WHERE s.id = store_translations.store_id 
        AND s.owner_id = auth.uid()
    ));

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