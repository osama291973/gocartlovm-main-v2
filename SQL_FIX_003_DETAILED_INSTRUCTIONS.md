# 🔧 SQL FIX #003 - DETAILED EXECUTION INSTRUCTIONS

## What This Fix Does

Adds UPDATE policies to the `orders` table so:
- ✅ **Admins** can update ANY order status
- ✅ **Sellers** can update order status (ONLY for orders containing their products)

This enables order fulfillment workflows.

---

## 📋 Step-by-Step Instructions

### STEP 1: Copy the SQL

Copy everything below (all the code):

```sql
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
```

---

### STEP 2: Go to Supabase SQL Editor

1. Open: https://supabase.com
2. Log in to your project
3. Click: **SQL Editor** (left sidebar)
4. Click: **+ New Query**

---

### STEP 3: Paste & Run

1. Paste the SQL above into the editor
2. Click: **Run** (or Ctrl+Enter)
3. Wait for completion...

---

### STEP 4: Check Results

**You should see 2 policies:**

```
policyname                                      | cmd
────────────────────────────────────────────────┼────────
Admins can update any order                    | UPDATE
Sellers can update order status for their...   | UPDATE
```

✅ **If you see 2 rows** → Success! Go to Step 5

❌ **If you see error** → Copy the error and share it

---

### STEP 5: Report Your Results

**Reply with:**

```
✅ Fix #003: ADD ORDER UPDATE POLICIES

Status: SUCCESS (or FAILED + error message)

Result:
[paste the 2 rows you saw above]

Next: Ready for Fix #004
```

---

## 🎯 What This SQL Does (Explained)

### Policy 1: Admins Update Any Order
```sql
CREATE POLICY "Admins can update any order"
ON public.orders
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur 
       WHERE ur.user_id = auth.uid() 
       AND ur.role = 'admin'::app_role))
```

**Translation:** 
- "Allows authenticated users to UPDATE orders"
- "But ONLY if they have admin role"
- "Checks: Does current user have admin role?"

### Policy 2: Sellers Update Their Product Orders
```sql
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
```

**Translation:**
- "Allows authenticated users to UPDATE orders"
- "But ONLY if they own a store with products in that order"
- "Checks: Does current user own a store? Do any products in this order belong to that store?"

---

## ✅ Expected Outcome

After running this SQL:

| Feature | Before | After |
|---------|--------|-------|
| Admin updates orders | ❌ Blocked | ✅ Working |
| Seller updates their orders | ❌ Blocked | ✅ Working |
| Seller updates other's orders | ❌ Blocked | ✅ Still Blocked |
| User updates orders | ❌ Blocked | ✅ Still Blocked |

---

## 📊 Quick Reference

| What | Details |
|------|---------|
| SQL File | SQL_FIX_003_ADD_ORDER_UPDATE_POLICIES.sql |
| What It Fixes | Missing UPDATE policies on orders table |
| Policies Added | 2 (Admins + Sellers) |
| Impact | Order fulfillment now works |
| Time | <1 second to run |
| Verification Query | `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'orders' AND cmd = 'UPDATE';` |
| Expected Result | 2 rows |

---

## 🚨 If Something Goes Wrong

### Error: "policy already exists"
**Cause:** Policy was already created
**Solution:** Drop it first:
```sql
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status for their products" ON public.orders;
```
Then run the SQL again.

### Error: "role does not exist"
**Cause:** app_role enum doesn't exist
**Solution:** Contact me, your schema may be different

### Error: Column "policyname" doesn't exist
**Cause:** Verification query using wrong column names
**Solution:** Already fixed! Use: `SELECT policyname, cmd FROM pg_policies...`

### Any Other Error
**Solution:** Copy the error message and share it with me.

---

## 🎯 Next Steps

1. ✅ Run the SQL above
2. ✅ Report the 2-row result
3. ⏭️ I'll confirm and give you Fix #004

---

**You're on track!** 💪

**Run this SQL and let me know the results!** ✅
