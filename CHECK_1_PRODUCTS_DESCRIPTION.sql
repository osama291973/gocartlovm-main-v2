-- STEP 1: Check if description column exists in products table
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'description'
) as products_has_description;
