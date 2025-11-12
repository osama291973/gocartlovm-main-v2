-- Recreate secure RLS policies for products
-- Safe to run multiple times (uses DROP POLICY IF EXISTS)

-- Ensure row level security is enabled
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated sellers (owners of the store) and admins to insert products for their stores
DROP POLICY IF EXISTS "Sellers can insert products for their stores" ON public.products;
CREATE POLICY "Sellers can insert products for their stores"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      auth.uid() = (SELECT owner_id FROM public.stores WHERE id = new.store_id)
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
  );

-- Allow owners/admins to SELECT/UPDATE/DELETE their products
DROP POLICY IF EXISTS "Sellers can manage their products" ON public.products;
CREATE POLICY "Sellers can manage their products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = (SELECT owner_id FROM public.stores WHERE id = public.products.store_id)
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      auth.uid() = (SELECT owner_id FROM public.stores WHERE id = new.store_id)
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
  );

-- Optional: grant usage to authenticated role is handled by Supabase; just ensure policies exist

-- Verification select (commented out) - you can run these manually in SQL editor:
-- SELECT policyname, permissive, roles, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='products';
-- SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE oid = 'public.products'::regclass;
