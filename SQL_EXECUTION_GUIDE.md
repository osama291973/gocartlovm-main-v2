# Backend SQL Statements - Execute One by One
**Status:** Ready for execution  
**Date:** November 14, 2025  
**Total Statements:** 8 groups (20+ individual SQL statements)

---

## 📋 EXECUTION PLAN

Execute these in order. After each one, provide the output/error message.

---

## ✅ SQL #1: Add variant_id Column to cart_items (CRITICAL)

**Step 1.1: Add the column**
```sql
ALTER TABLE cart_items ADD COLUMN variant_id uuid;
```

**Expected Output:** 
```
ALTER TABLE
```

**If you get error "column already exists":**
- The column is already added ✅ Skip to next step

**What to send back:**
- Copy the exact output message from Supabase

---

## ✅ SQL #2: Make variant_id NOT NULL

**Step 1.2:**
```sql
ALTER TABLE cart_items ALTER COLUMN variant_id SET NOT NULL;
```

**Expected Output:**
```
ALTER TABLE
```

**What to send back:**
- Copy the exact output or error

---

## ✅ SQL #3: Drop Old Constraints

**Step 1.3:**
```sql
ALTER TABLE cart_items 
DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
```

**Expected Output:**
```
ALTER TABLE
```

**Then run this one too:**
```sql
ALTER TABLE cart_items 
DROP CONSTRAINT IF EXISTS cart_items_user_product_key;
```

**What to send back:**
- Outputs from both statements

---

## ✅ SQL #4: Add New Unique Constraint

**Step 1.4:**
```sql
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_user_variant_unique 
UNIQUE (user_id, variant_id);
```

**Expected Output:**
```
ALTER TABLE
```

**If you get "unique constraint already exists":**
- Already done ✅ Continue

**What to send back:**
- Copy exact output

---

## ✅ SQL #5: Add Foreign Key

**Step 1.5:**
```sql
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_variant_id_fkey
FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
```

**Expected Output:**
```
ALTER TABLE
```

**If you get "foreign key already exists":**
- Already done ✅ Continue

**What to send back:**
- Copy exact output

---

## ✅ SQL #6: Migrate Existing Cart Data

**Step 1.6:**
```sql
UPDATE cart_items ci
SET variant_id = (
  SELECT id FROM product_variants pv
  WHERE pv.product_id = ci.product_id
  LIMIT 1
)
WHERE variant_id IS NULL;
```

**Expected Output:**
```
UPDATE X
```
(Where X is number of rows updated)

**If no rows updated:**
- That's fine, means no existing data to migrate ✅

**What to send back:**
- Copy the exact output (e.g., "UPDATE 0" or "UPDATE 5")

---

## ✅ SQL #7: Verify Cart Changes

**Verification Query:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cart_items' 
ORDER BY ordinal_position;
```

**Expected Output:**
```
Should show columns: id, user_id, product_id, quantity, created_at, updated_at, variant_id
```

**What to send back:**
- Copy the full output showing all columns and their types

---

## ✅ SQL #8: Check Constraints

**Constraint Verification:**
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name='cart_items'
ORDER BY constraint_name;
```

**Expected Output:**
```
Should include: cart_items_user_variant_unique (UNIQUE constraint)
Should include: cart_items_variant_id_fkey (FOREIGN KEY constraint)
```

**What to send back:**
- Copy the full output

---

## ✅ SQL #9: Add Performance Indexes (Set 1 of 2)

**Index Group 1 - Order queries:**

```sql
CREATE INDEX idx_orders_user_status 
ON orders (user_id, status, created_at DESC);
```

**Expected Output:**
```
CREATE INDEX
```

**What to send back:**
- Copy exact output or error

---

## ✅ SQL #10: Add Performance Indexes (Set 2)

```sql
CREATE INDEX idx_orders_status 
ON orders (status, created_at DESC);
```

**Expected Output:**
```
CREATE INDEX
```

**What to send back:**
- Copy exact output

---

## ✅ SQL #11: Add Performance Indexes (Set 3)

**Product category index:**

```sql
CREATE INDEX idx_products_category 
ON products (category_id, is_featured, created_at DESC);
```

**Expected Output:**
```
CREATE INDEX
```

**What to send back:**
- Copy exact output

---

## ✅ SQL #12: Add Performance Indexes (Set 4)

**Review indexes:**

```sql
CREATE INDEX idx_reviews_product 
ON reviews (product_id, rating DESC);
```

**Expected Output:**
```
CREATE INDEX
```

**Then:**
```sql
CREATE INDEX idx_reviews_user 
ON reviews (user_id, created_at DESC);
```

**What to send back:**
- Copy both outputs

---

## ✅ SQL #13: Add Performance Indexes (Set 5)

**Address index:**

```sql
CREATE INDEX idx_addresses_user 
ON addresses (user_id, is_default);
```

**Expected Output:**
```
CREATE INDEX
```

**What to send back:**
- Copy exact output

---

## ✅ SQL #14: Add Full-Text Search Index

**Important: This one might take longer (30 seconds - 1 minute)**

```sql
CREATE INDEX idx_products_search 
ON products USING GIN (to_tsvector('english', 
  COALESCE(slug, '') || ' ' || 
  COALESCE(name, '')
));
```

**Expected Output:**
```
CREATE INDEX
```

**What to send back:**
- Copy exact output

---

## ✅ SQL #15: Add Seller Product Lookup Index

```sql
CREATE INDEX idx_products_store_active
ON products (store_id, is_featured) 
WHERE stock > 0;
```

**Expected Output:**
```
CREATE INDEX
```

**What to send back:**
- Copy exact output

---

## ✅ SQL #16: Create set_created_at Function (OPTIONAL)

```sql
CREATE OR REPLACE FUNCTION set_created_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Expected Output:**
```
CREATE FUNCTION
```

**What to send back:**
- Copy exact output

---

## ✅ SQL #17: Add Trigger for cart_items (OPTIONAL)

```sql
CREATE TRIGGER set_created_at_cart_items
BEFORE INSERT ON cart_items
FOR EACH ROW
EXECUTE FUNCTION set_created_at();
```

**Expected Output:**
```
CREATE TRIGGER
```

**If you get "trigger already exists":**
- That's fine ✅ Continue

**What to send back:**
- Copy exact output

---

## ✅ SQL #18: Add Trigger for orders (OPTIONAL)

```sql
CREATE TRIGGER set_created_at_orders
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_created_at();
```

**Expected Output:**
```
CREATE TRIGGER
```

**What to send back:**
- Copy exact output

---

## ✅ SQL #19: Add Trigger for addresses (OPTIONAL)

```sql
CREATE TRIGGER set_created_at_addresses
BEFORE INSERT ON addresses
FOR EACH ROW
EXECUTE FUNCTION set_created_at();
```

**Expected Output:**
```
CREATE TRIGGER
```

**What to send back:**
- Copy exact output

---

## ✅ SQL #20: Add Trigger for reviews (OPTIONAL)

```sql
CREATE TRIGGER set_created_at_reviews
BEFORE INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION set_created_at();
```

**Expected Output:**
```
CREATE TRIGGER
```

**What to send back:**
- Copy exact output

---

## ✅ SQL #21: Verify All Indexes (FINAL CHECK)

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename NOT LIKE 'pg_%'
ORDER BY tablename, indexname;
```

**Expected Output:**
```
Should show 48+ indexes total (was 42, now +6 new indexes)
Should include all the new indexes we created:
- idx_orders_user_status
- idx_orders_status
- idx_products_category
- idx_reviews_product
- idx_reviews_user
- idx_addresses_user
- idx_products_search
- idx_products_store_active
```

**What to send back:**
- Copy the FULL output showing all indexes

---

## ✅ SQL #22: Test Cart Variant Support (FINAL TEST)

```sql
SELECT * FROM cart_items LIMIT 1;
```

**Expected Output:**
```
Should show columns including: variant_id
```

**What to send back:**
- Copy the exact output

---

## 📋 EXECUTION WORKFLOW

### For Each SQL Statement:

1. **Copy the SQL** from the box above
2. **Open Supabase** → SQL Editor
3. **Paste** the SQL
4. **Click Run**
5. **Copy the output** (green success box or red error box)
6. **Send back to me** with the output

### I'll then:
- Verify it worked
- Move to next SQL
- Adjust if error
- Continue until all done

---

## 🔴 ERRORS YOU MIGHT SEE

### "column already exists"
✅ Means it was already added. Skip to next.

### "constraint already exists"  
✅ Means it was already created. Skip to next.

### "relation does not exist"
❌ Table name might be wrong. Let me know, we'll fix it.

### "permission denied"
❌ Your Supabase role might not have rights. Let me know.

### "syntax error"
❌ Usually a typo. Copy exactly as shown.

---

## ✅ SUCCESS INDICATORS

After all SQL is done, you should see:
- ✅ cart_items table has variant_id column
- ✅ 8 new indexes created (48+ total)
- ✅ New triggers working
- ✅ No errors in the system

---

## 🚀 READY TO START?

**Send me:**
1. The output from **SQL #1** (Add variant_id column)
2. Any errors you see

**I'll then** guide you to SQL #2, then #3, etc.

Let's go! 💪
