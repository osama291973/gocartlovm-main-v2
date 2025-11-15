-- ============================================================================
-- SQL FIX #002: CONSOLIDATE PAYMENT STATUS ENUMS
-- ============================================================================
-- Issue: Two payment status enums exist with same values but different order
-- Solution: Standardize on payment_status_enum
-- ============================================================================

-- Step 1: Check current payment statuses in use
SELECT payment_status, COUNT(*) FROM public.orders GROUP BY payment_status;

-- Step 2: Drop old payment_status enum (after confirming no usage)
DROP TYPE IF EXISTS public.payment_status CASCADE;

-- Step 3: Verify orders table now uses only payment_status_enum
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_status';

-- ============================================================================
-- Run Step 1 query first and share output
-- ============================================================================
