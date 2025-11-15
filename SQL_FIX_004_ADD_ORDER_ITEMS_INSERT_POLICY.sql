-- ============================================================================
-- SQL FIX #004: ADD ORDER ITEMS INSERT POLICY
-- ============================================================================
-- Issue: Order items table only has SELECT policy - INSERT blocked
-- Solution: Allow users/admins to insert order items during checkout
-- ============================================================================

-- Step 1: Add policy allowing authenticated users to insert order items
CREATE POLICY "Users can insert their own order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Step 2: Add policy allowing ADMINS to insert any order items
CREATE POLICY "Admins can insert any order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)
);

-- Step 3: Verify policies were created
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'order_items' AND cmd = 'INSERT';

-- ============================================================================
-- Run and confirm INSERT policies appear
-- ============================================================================
