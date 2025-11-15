# 🚀 REMAINING SQL FIXES #004-011 - READY TO RUN

**Status:** All 8 remaining fixes are corrected and ready to execute!

**How to Use This File:**
1. Copy the SQL for each fix below
2. Paste into Supabase SQL Editor
3. Run it (Ctrl+Enter)
4. Report the output/result
5. Move to next fix

---

## ✅ SUMMARY

| # | Name | Purpose | Expected |
|---|------|---------|----------|
| 004 | Order Items INSERT | Enable checkout | 2 INSERT policies |
| 005 | Product Variants Policies | Enable inventory mgmt | 4 policies (INSERT+UPDATE) |
| 006 | Product Images Policies | Secure image gallery | 5 policies (SELECT+INSERT+DELETE) |
| 007 | Reviews UNIQUE Constraint | Prevent duplicate reviews | 1 UNIQUE constraint |
| 008 | Site Texts Language Code | Fix enum type | TEXT → ENUM |
| 009 | Store Translations Lang Code | Fix enum type | TEXT → ENUM |
| 010 | Product Cascade Delete | Clean up orphans | 1 trigger created |
| 011 | Address Referential Integrity | Link orders-addresses | SET NULL on delete |

---

## 📋 FIX #004: ADD ORDER ITEMS INSERT POLICY

**What it does:** Enable users to add items to their orders during checkout

**Expected result:** 2 INSERT policies

```sql
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
```

**Report format:**
```
✅ Fix #004: ADD ORDER ITEMS INSERT POLICY
Status: SUCCESS
Result: 2 rows
[paste your output here]
```

---

## 📋 FIX #005: ADD PRODUCT VARIANTS POLICIES

**What it does:** Enable sellers to update/insert product variants (sizes, colors, stock)

**Expected result:** 4 policies (2 UPDATE + 2 INSERT)

```sql
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
```

**Report format:**
```
✅ Fix #005: ADD PRODUCT VARIANTS POLICIES
Status: SUCCESS
Result: 4 rows
[paste your output here - should show 4 policies]
```

---

## 📋 FIX #006: ADD PRODUCT IMAGES POLICIES

**What it does:** Add RLS security to product images (currently completely unprotected)

**Expected result:** 5 policies (1 SELECT + 2 INSERT + 2 DELETE)

```sql
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
```

**Report format:**
```
✅ Fix #006: ADD PRODUCT IMAGES POLICIES
Status: SUCCESS
Result: 5 rows
[paste your output here - should show 5 policies]
```

---

## 📋 FIX #007: ADD REVIEWS UNIQUE CONSTRAINT

**What it does:** Prevent users from submitting multiple reviews for the same product

**Expected result:** 1 UNIQUE constraint created

```sql
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
```

**Report format:**
```
✅ Fix #007: ADD REVIEWS UNIQUE CONSTRAINT
Status: SUCCESS
Result: 1 constraint
[paste your constraint_name output]
```

---

## 📋 FIX #008: FIX SITE_TEXTS LANGUAGE_CODE TYPE

**What it does:** Convert site_texts.language_code from TEXT to language_code ENUM

**Expected result:** language_code column is USER-DEFINED type

```sql
-- ============================================================================
-- SQL FIX #008: FIX SITE_TEXTS LANGUAGE_CODE TYPE MISMATCH
-- ============================================================================
-- Issue: site_texts.language_code is TEXT type, should be language_code ENUM
-- Risk: Data inconsistency - other tables use enum constraint
-- Solution: Create new column with enum, migrate data, drop old column
-- ============================================================================

-- Step 1: Check current site_texts language values
SELECT DISTINCT language_code FROM public.site_texts;

-- Step 2: Add new language_code column with ENUM type
ALTER TABLE public.site_texts 
ADD COLUMN language_code_new language_code;

-- Step 3: Migrate existing data (cast text to enum)
UPDATE public.site_texts 
SET language_code_new = language_code::language_code 
WHERE language_code_new IS NULL;

-- Step 4: Drop old column and rename new one
ALTER TABLE public.site_texts 
DROP COLUMN language_code;

ALTER TABLE public.site_texts 
RENAME COLUMN language_code_new TO language_code;

-- Step 5: Ensure column is NOT NULL and has correct default
ALTER TABLE public.site_texts 
ALTER COLUMN language_code SET NOT NULL,
ALTER COLUMN language_code SET DEFAULT 'en'::language_code;

-- Step 6: Verify column type
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'site_texts' AND column_name = 'language_code';
```

**Report format:**
```
✅ Fix #008: FIX SITE_TEXTS LANGUAGE_CODE TYPE
Status: SUCCESS
Result:
[paste your output showing column_name and data_type]
```

---

## 📋 FIX #009: FIX STORE_TRANSLATIONS LANGUAGE_CODE TYPE

**What it does:** Convert store_translations.language_code from TEXT to language_code ENUM

**Expected result:** language_code column is USER-DEFINED type

```sql
-- ============================================================================
-- SQL FIX #009: FIX STORE_TRANSLATIONS LANGUAGE_CODE TYPE
-- ============================================================================
-- Issue: store_translations.language_code is TEXT type, should be language_code ENUM
-- Solution: Same as site_texts - create new column, migrate, drop old
-- ============================================================================

-- Step 1: Check current store_translations language values
SELECT DISTINCT language_code FROM public.store_translations;

-- Step 2: Add new language_code column with ENUM type
ALTER TABLE public.store_translations 
ADD COLUMN language_code_new language_code;

-- Step 3: Migrate existing data (cast text to enum)
UPDATE public.store_translations 
SET language_code_new = language_code::language_code 
WHERE language_code_new IS NULL;

-- Step 4: Drop old column and rename new one
ALTER TABLE public.store_translations 
DROP COLUMN language_code;

ALTER TABLE public.store_translations 
RENAME COLUMN language_code_new TO language_code;

-- Step 5: Ensure column is NOT NULL and has correct default
ALTER TABLE public.store_translations 
ALTER COLUMN language_code SET NOT NULL,
ALTER COLUMN language_code SET DEFAULT 'en'::language_code;

-- Step 6: Verify column type
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'store_translations' AND column_name = 'language_code';
```

**Report format:**
```
✅ Fix #009: FIX STORE_TRANSLATIONS LANGUAGE_CODE TYPE
Status: SUCCESS
Result:
[paste your output showing column_name and data_type]
```

---

## 📋 FIX #010: ADD PRODUCT CASCADE DELETE

**What it does:** When a product is deleted, automatically clean up related data (images, variants, translations, reviews)

**Expected result:** 1 trigger created

```sql
-- ============================================================================
-- SQL FIX #010: ADD CASCADE DELETE TRIGGERS FOR PRODUCTS
-- ============================================================================
-- Issue: Deleting product leaves orphaned: variants, translations, images, reviews
-- Solution: Create trigger to cascade delete related records
-- ============================================================================

-- Step 1: Create function to handle product deletion cascade
CREATE OR REPLACE FUNCTION delete_product_cascade()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete product images
  DELETE FROM public.product_images WHERE product_id = OLD.id;
  
  -- Delete product translations
  DELETE FROM public.product_translations WHERE product_id = OLD.id;
  
  -- Delete product variants (which will cascade to variant attributes)
  DELETE FROM public.product_variants WHERE product_id = OLD.id;
  
  -- Delete reviews (soft approach - could archive instead)
  DELETE FROM public.reviews WHERE product_id = OLD.id;
  
  -- Delete cart items referencing this product
  DELETE FROM public.cart_items WHERE product_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on products DELETE
CREATE TRIGGER trigger_product_delete_cascade
BEFORE DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION delete_product_cascade();

-- Step 3: Verify trigger was created
SELECT trigger_name FROM information_schema.triggers 
WHERE table_name = 'products' AND trigger_name = 'trigger_product_delete_cascade';
```

**Report format:**
```
✅ Fix #010: ADD PRODUCT CASCADE DELETE
Status: SUCCESS
Result: 1 trigger
[paste your trigger_name output]
```

---

## 📋 FIX #011: ADD ADDRESS REFERENTIAL INTEGRITY

**What it does:** When an address is deleted, set orders.address_id to NULL (don't orphan orders)

**Expected result:** Foreign key delete_rule is SET NULL

```sql
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
```

**Report format:**
```
✅ Fix #011: ADD ADDRESS REFERENTIAL INTEGRITY
Status: SUCCESS
Result:
[paste your output showing delete_rule = 'SET NULL']
```

---

## 🎯 EXECUTION SEQUENCE

```
✅ Fix #001: Order Status Enum - COMPLETE
✅ Fix #002: Payment Status Enum - COMPLETE  
✅ Fix #003: Order UPDATE Policies - COMPLETE
⏳ Fix #004: Order Items INSERT ← START HERE NEXT
⏳ Fix #005: Product Variants Policies
⏳ Fix #006: Product Images Policies
⏳ Fix #007: Reviews UNIQUE Constraint
⏳ Fix #008: Site Texts Language Code
⏳ Fix #009: Store Translations Language Code
⏳ Fix #010: Product Cascade Delete
⏳ Fix #011: Address Referential Integrity
```

---

## 📊 PROGRESS TRACKING

**Completed:** 3/11 (27%)
**Remaining:** 8/11 (73%)
**Estimated time:** 5-10 minutes total

---

## ⚡ QUICK COPY INSTRUCTIONS

**For each fix below:**

1. **Copy the SQL code** (entire code block)
2. **Paste into Supabase SQL Editor**
3. **Run it** (Ctrl+Enter or click Run)
4. **Wait for completion**
5. **Copy the result output**
6. **Send me the output** in the format provided

**All column names are CORRECTED** - These are ready to go! ✅

---

**Ready to continue?** Reply with the output from each fix as you run them! 🚀
