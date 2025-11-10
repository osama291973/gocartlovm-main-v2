-- Create seller applications table if not exists
CREATE TABLE IF NOT EXISTS public.seller_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    store_id uuid REFERENCES public.stores(id),
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, store_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seller_applications_user ON public.seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_store ON public.seller_applications(store_id);

-- Add RLS policies
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Users can see their own applications
CREATE POLICY "Users can view own applications"
    ON public.seller_applications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create applications"
    ON public.seller_applications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only admins can update application status
CREATE POLICY "Admins can update applications"
    ON public.seller_applications
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::app_role));