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

-- ============================================================================
-- Run and confirm trigger appears
-- ============================================================================
