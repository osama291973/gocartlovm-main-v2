-- ============================================================================
-- SQL FIX #006: ADD PRODUCT IMAGES RLS POLICIES
-- ============================================================================
-- Issue: Product images table has NO RLS policies - completely exposed
-- Solution: Add view/insert/delete policies matching product ownership
-- ============================================================================

-- Step 1: Add SELECT policy - everyone can view product images
CREATE POLICY "Everyone can view product images"
ON public.product_images
FOR SELECT
TO public
USING (true);

-- Step 2: Add INSERT policy - sellers can insert images for their products
CREATE POLICY "Sellers can insert product images for their products"
ON public.product_images
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_images.product_id
    AND s.owner_id = auth.uid()
  )
);

-- Step 3: Add INSERT policy - admins can insert any product images
CREATE POLICY "Admins can insert any product images"
ON public.product_images
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

-- Step 4: Add DELETE policy - sellers can delete their product images
CREATE POLICY "Sellers can delete their product images"
ON public.product_images
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_images.product_id
    AND s.owner_id = auth.uid()
  )
);

-- Step 5: Add DELETE policy - admins can delete any product images
CREATE POLICY "Admins can delete any product images"
ON public.product_images
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

-- Step 6: Verify all policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'product_images';

-- ============================================================================
-- Run and confirm all 5 policies appear (SELECT, INSERT x2, DELETE x2)
-- ============================================================================
