-- Allow admins to view all seller applications
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Create policy so admins can select any seller application
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'seller_applications'
      AND p.policyname = 'Admins can view all applications'
  ) THEN
    CREATE POLICY "Admins can view all applications"
      ON public.seller_applications
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
      );
  END IF;
END$$;

-- Grant select to authenticated (policy will restrict to admins)
GRANT SELECT ON public.seller_applications TO authenticated;
