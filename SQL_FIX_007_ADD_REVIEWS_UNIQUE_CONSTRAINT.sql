-- ============================================================================
-- SQL FIX #007: ADD UNIQUE CONSTRAINT ON REVIEWS (user_id, product_id)
-- ============================================================================
-- Issue: No constraint preventing multiple reviews per product per user
-- Solution: Add unique constraint to enforce one review per user per product
-- ============================================================================

-- Step 1: Check if constraint already exists
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'reviews' AND constraint_type = 'UNIQUE';

-- Step 2: Create unique constraint
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_user_product_unique UNIQUE (user_id, product_id);

-- Step 3: Verify constraint was created
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'reviews' AND constraint_type = 'UNIQUE';

-- ============================================================================
-- Run Step 1 first - if constraint doesn't exist, run Step 2
-- ============================================================================
