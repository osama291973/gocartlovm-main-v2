-- ============================================================================
-- SQL FIX #005: ADD PRODUCT VARIANTS UPDATE POLICY
-- ============================================================================
-- Issue: Product variants table missing UPDATE policy - inventory management blocked
-- Solution: Allow sellers/admins to update variant stock and pricing
-- ============================================================================

-- Step 1: Add policy for SELLERS to update their product variants
CREATE POLICY "Sellers can update their product variants"
ON public.product_variants
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_variants.product_id
    AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_variants.product_id
    AND s.owner_id = auth.uid()
  )
);

-- Step 2: Add policy for ADMINS to update any variant
CREATE POLICY "Admins can update any product variants"
ON public.product_variants
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

-- Step 3: Add INSERT policy for SELLERS to create variants
CREATE POLICY "Sellers can insert their product variants"
ON public.product_variants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_variants.product_id
    AND s.owner_id = auth.uid()
  )
);

-- Step 4: Add INSERT policy for ADMINS
CREATE POLICY "Admins can insert any product variants"
ON public.product_variants
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

-- Step 5: Verify all policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'product_variants';

-- ============================================================================
-- Run and confirm INSERT + UPDATE policies appear
-- ============================================================================
