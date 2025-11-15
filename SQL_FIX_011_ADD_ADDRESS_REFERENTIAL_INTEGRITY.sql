-- ============================================================================
-- SQL FIX #011: ADD REFERENTIAL INTEGRITY FOR ADDRESS DELETION
-- ============================================================================
-- Issue: Deleting address can orphan orders (no CASCADE or SET NULL)
-- Solution: Set orders.address_id to NULL when address is deleted
-- ============================================================================

-- Step 1: Check current foreign key constraint on orders.address_id
SELECT constraint_name, delete_rule FROM information_schema.referential_constraints 
WHERE table_name = 'orders' AND column_name = 'address_id';

-- Step 2: Drop existing foreign key (if exists)
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_address_id_fkey;

-- Step 3: Create new foreign key with ON DELETE SET NULL
ALTER TABLE public.orders 
ADD CONSTRAINT orders_address_id_fkey 
FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE SET NULL;

-- Step 4: Verify the constraint was created correctly
SELECT constraint_name, delete_rule FROM information_schema.referential_constraints 
WHERE table_name = 'orders' AND column_name = 'address_id';

-- ============================================================================
-- Run and confirm delete_rule shows 'SET NULL'
-- ============================================================================
