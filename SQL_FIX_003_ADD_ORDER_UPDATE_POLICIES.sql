-- ============================================================================
-- SQL FIX #003: ADD ORDER UPDATE POLICIES (Admins + Sellers for their products)
-- ============================================================================
-- Issue: Orders table missing UPDATE policy - status updates blocked
-- Solution: Allow admins and sellers to update order status for their items
-- ============================================================================

-- Step 1: Add policy for ADMINS to update any order status
CREATE POLICY "Admins can update any order"
ON public.orders
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

-- Step 2: Add policy for SELLERS to update order status (only for their orders - orders containing their products)
CREATE POLICY "Sellers can update order status for their products"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN stores s ON s.id = p.store_id
    WHERE oi.order_id = orders.id
    AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN stores s ON s.id = p.store_id
    WHERE oi.order_id = orders.id
    AND s.owner_id = auth.uid()
  )
);

-- Step 3: Verify policies were created
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'orders' AND cmd = 'UPDATE';

-- Expected Result: 2 rows (both policies)
-- policyname                                    | cmd
-- Admins can update any order                  | UPDATE
-- Sellers can update order status for their... | UPDATE

-- ============================================================================
-- IMPORTANT: Column names are "policyname" (not policy_name) and "cmd" (not command)
-- Run and confirm both UPDATE policies appear
-- ============================================================================
