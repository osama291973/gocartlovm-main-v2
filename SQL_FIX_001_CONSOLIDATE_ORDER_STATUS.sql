-- ============================================================================
-- SQL FIX #001: CONSOLIDATE ORDER STATUS ENUMS
-- ============================================================================
-- Issue: Two order status enums exist - consolidate to single enum
-- Current: order_status (6 values) vs order_status_enum (6 values, slightly different)
-- Solution: Drop old enum, rename new one to canonical name
-- Timeline: Run in sequence, test after each step
-- ============================================================================

-- Step 1: Add the new canonical order_status_enum value if needed
-- Check current order_status_enum values (should be: pending, processing, shipped, delivered, cancelled, returned)
-- If 'confirmed' is needed, add it. For now we keep: pending, processing, shipped, delivered, cancelled, returned

-- Step 2: Create a safe migration - update orders table to use order_status_enum
-- First, verify no orders exist with 'confirmed' status (from old order_status enum)
SELECT status, COUNT(*) FROM public.orders GROUP BY status;

-- Step 3: If 'confirmed' orders exist, convert them
-- ALTER TABLE public.orders 
-- SET status = 'processing' 
-- WHERE status::text = 'confirmed';

-- Step 4: Drop the old order_status enum (after confirming no usage)
DROP TYPE IF EXISTS public.order_status CASCADE;

-- Step 5: Verify orders table now uses only order_status_enum
-- The orders.status column should show type: USER-DEFINED (order_status_enum)
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'status';

-- ============================================================================
-- IMPORTANT: Run above query first to check current order statuses
-- Reply with output before proceeding to next SQL
-- ============================================================================
