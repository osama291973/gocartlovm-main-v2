# 🚀 Backend SQL Fixes - Execution Guide

**Total Fixes: 11 | Priority: CRITICAL**

---

## ✅ Execution Order & Testing Protocol

### **PHASE 1: Enum Consolidation** (Run First)

#### **Fix #001: Consolidate Order Status Enums**
📄 File: `SQL_FIX_001_CONSOLIDATE_ORDER_STATUS.sql`

```sql
-- First, run this verification query:
SELECT status, COUNT(*) FROM public.orders GROUP BY status;
```

**What to look for:**
- Should show only values from one of these sets:
  - Set A: pending, confirmed, processing, shipped, delivered, cancelled
  - Set B: pending, processing, shipped, delivered, cancelled, returned
  
**⚠️ DECISION POINT:** 
- If you see "confirmed" status, you'll need to keep old enum OR convert confirmed→processing
- Recommended: Convert confirmed→processing, use Set B (with "returned")

**Post-fix test:**
```sql
-- After running the consolidation, verify:
SELECT data_type FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'status';
-- Should show: USER-DEFINED (order_status_enum only)
```

---

#### **Fix #002: Consolidate Payment Status Enums**
📄 File: `SQL_FIX_002_CONSOLIDATE_PAYMENT_STATUS.sql`

```sql
-- Run verification first:
SELECT payment_status, COUNT(*) FROM public.orders GROUP BY payment_status;
```

**Expected values:** paid, pending, refunded, failed

---

### **PHASE 2: RLS Policy Additions** (Run After Enum Fixes)

#### **Fix #003: Add Order Update Policies**
📄 File: `SQL_FIX_003_ADD_ORDER_UPDATE_POLICIES.sql`

**What it does:**
- ✅ Admins can UPDATE any order status
- ✅ Sellers can UPDATE order status (only for orders containing their products)

**Test after:**
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'orders' AND cmd = 'UPDATE';
-- Should show 2 policies (column names are policyname, cmd - not policy_name, command)
```

**Frontend Impact:** Order status updates now work for sellers/admins ✅

---

#### **Fix #004: Add Order Items INSERT Policy**
📄 File: `SQL_FIX_004_ADD_ORDER_ITEMS_INSERT_POLICY.sql`

**What it does:**
- ✅ Users can INSERT order items for their orders
- ✅ Admins can INSERT any order items

**Test after:**
```sql
SELECT policy_name, command FROM pg_policies 
WHERE tablename = 'order_items' AND command = 'INSERT';
-- Should show 2 policies
```

**Frontend Impact:** Checkout/order creation now works ✅

---

#### **Fix #005: Add Product Variants UPDATE/INSERT Policies**
📄 File: `SQL_FIX_005_ADD_PRODUCT_VARIANTS_POLICIES.sql`

**What it does:**
- ✅ Sellers can UPDATE their variants (stock, price)
- ✅ Sellers can INSERT new variants
- ✅ Admins can UPDATE/INSERT any variants

**Test after:**
```sql
SELECT policy_name, command FROM pg_policies 
WHERE tablename = 'product_variants';
-- Should show 4 policies (SELECT, INSERT x2, UPDATE x2)
```

**Frontend Impact:** Inventory management now enabled ✅

---

#### **Fix #006: Add Product Images RLS Policies**
📄 File: `SQL_FIX_006_ADD_PRODUCT_IMAGES_POLICIES.sql`

**What it does:**
- ✅ Everyone can VIEW product images
- ✅ Sellers can INSERT/DELETE their product images
- ✅ Admins can INSERT/DELETE any images

**Test after:**
```sql
SELECT policy_name, command FROM pg_policies 
WHERE tablename = 'product_images';
-- Should show 5 policies (SELECT, INSERT x2, DELETE x2)
```

**Frontend Impact:** Product images now protected by RLS ✅

---

### **PHASE 3: Data Integrity** (Run After Policies)

#### **Fix #007: Add Reviews Unique Constraint**
📄 File: `SQL_FIX_007_ADD_REVIEWS_UNIQUE_CONSTRAINT.sql`

**What it does:**
- ✅ Prevents users from submitting multiple reviews for same product

**Test after:**
```sql
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'reviews' AND constraint_type = 'UNIQUE';
-- Should show: reviews_user_product_unique
```

**Frontend Impact:** API will return error on duplicate review attempts ✅

---

#### **Fix #008: Fix site_texts Language Code Type**
📄 File: `SQL_FIX_008_FIX_SITE_TEXTS_LANGUAGE_CODE.sql`

**First verify:**
```sql
SELECT DISTINCT language_code FROM public.site_texts;
```

**What it does:**
- ✅ Changes site_texts.language_code from TEXT to language_code ENUM
- ✅ Ensures type consistency across app

**Frontend Impact:** Database now enforces valid language codes ✅

---

#### **Fix #009: Fix store_translations Language Code Type**
📄 File: `SQL_FIX_009_FIX_STORE_TRANSLATIONS_LANGUAGE_CODE.sql`

**First verify:**
```sql
SELECT DISTINCT language_code FROM public.store_translations;
```

**Same as Fix #008 but for store_translations table**

---

### **PHASE 4: Cascade & Referential Integrity** (Run Last)

#### **Fix #010: Add Product Cascade Delete Trigger**
📄 File: `SQL_FIX_010_ADD_PRODUCT_CASCADE_DELETE.sql`

**What it does:**
- ✅ When product deleted, auto-delete: variants, translations, images, reviews, cart items

**Test after:**
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE table_name = 'products' AND trigger_name = 'trigger_product_delete_cascade';
```

**Frontend Impact:** Product deletions now clean up orphaned data ✅

---

#### **Fix #011: Add Address Referential Integrity**
📄 File: `SQL_FIX_011_ADD_ADDRESS_REFERENTIAL_INTEGRITY.sql`

**What it does:**
- ✅ When address deleted, set orders.address_id to NULL (prevents orphaning)

**Test after:**
```sql
SELECT constraint_name, delete_rule FROM information_schema.referential_constraints 
WHERE table_name = 'orders' AND column_name = 'address_id';
-- Should show delete_rule = 'SET NULL'
```

**Frontend Impact:** Address deletions safe, orders preserved ✅

---

## 📋 Testing Checklist

After running each SQL:

- [ ] No errors in Supabase console
- [ ] Verification queries pass
- [ ] Run frontend integration test for affected feature

---

## 🔄 Recommended Execution Schedule

```
Day 1: Run Fixes #001-002 (Enums)
Day 2: Run Fixes #003-006 (RLS Policies)
Day 3: Run Fixes #007-009 (Data Integrity)
Day 4: Run Fixes #010-011 (Cascade & Referential)
Day 5: Full integration testing
```

---

## 💬 What to Report After Each SQL

When you run each SQL, please share:

```
Fix #00X: [Name]
✅ Status: SUCCESS / ❌ Status: ERROR
Output: [Copy/paste console output]
Verification Query Result: [Copy/paste result]
Frontend Test: PASS / FAIL / NOT TESTED
```

---

## 🚨 If Any SQL Fails

**Common Issues:**

1. **"Constraint already exists"**
   → Check if policy/constraint already there
   → Skip this fix if it exists

2. **"Type does not exist"**
   → Enum not available - check spelling
   → Verify enum exists: `SELECT * FROM pg_enum WHERE enumname = 'order_status_enum';`

3. **"Cannot drop ... CASCADE in use"**
   → Other constraints depend on it
   → Check what's using it before forcing drop

**Next Steps:** Share error message, I'll provide alternative SQL

---

## 📞 Ready?

Run Fix #001 first and share the verification output:

```sql
SELECT status, COUNT(*) FROM public.orders GROUP BY status;
```

I'll confirm the next steps!
