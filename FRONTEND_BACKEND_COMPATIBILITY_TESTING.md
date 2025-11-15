# 🔗 Frontend-Backend API Compatibility Checks

## Frontend Integration Points to Test

After running the SQL fixes, test these frontend features:

---

## ✅ Test 1: Order Management

### Endpoint: Create Order
```javascript
// Frontend calls this after fixes
POST /api/orders
{
  user_id: "...",
  address_id: "...",
  coupon_id: "...",
  subtotal: 100,
  discount: 10,
  shipping: 5,
  total: 95,
  payment_method: "credit_card",
  payment_status: "pending",  // MUST be from: failed, pending, refunded, paid
  status: "pending",          // MUST be from: pending, processing, shipped, delivered, cancelled, returned
  notes: "..."
}
```

**What changed:**
- `status` enum now uses consolidated order_status_enum
- `payment_status` uses consolidated payment_status_enum

**Test:** ✅ Create test order with new status values

---

## ✅ Test 2: Order Items Insertion

### Endpoint: Add Items to Order
```javascript
POST /api/order-items
{
  order_id: "...",
  product_id: "...",
  store_id: "...",
  quantity: 2,
  price: 50,
  total: 100,
  product_name: "...",
  product_image: "..."
}
```

**What changed:**
- INSERT policy now allows this (was blocked before)

**Test:** ✅ Create order with items successfully

---

## ✅ Test 3: Update Order Status

### Endpoint: Update Order (Seller)
```javascript
PATCH /api/orders/{order_id}
{
  status: "shipped" // Seller can update to: pending, processing, shipped, delivered, cancelled, returned
}
```

**What changed:**
- UPDATE policy now allows sellers for their product orders
- Admins can update any order

**Test:** 
- ✅ Seller updates their order status
- ✅ Seller CANNOT update other seller's orders
- ✅ Admin can update any order

---

## ✅ Test 4: Product Variants Management

### Endpoint: Update Product Variant Stock
```javascript
PATCH /api/product-variants/{variant_id}
{
  stock: 50,
  price: 99.99,
  original_price: 129.99
}
```

**What changed:**
- UPDATE policy now allows sellers for their products
- INSERT policy now allows creating variants

**Test:**
- ✅ Seller can update their variant stock
- ✅ Seller CANNOT update other seller's variants
- ✅ Admin can update any variant

---

## ✅ Test 5: Product Images

### Endpoint: Upload Product Image
```javascript
POST /api/product-images
{
  product_id: "...",
  public_url: "https://...",
  storage_path: "products/...",
  position: 0
}
```

**What changed:**
- INSERT policy now allows sellers for their products
- SELECT/DELETE policies now in place

**Test:**
- ✅ Seller can upload images for their products
- ✅ Images visible to all (SELECT public)
- ✅ Seller can delete their images
- ✅ Cannot upload/delete other seller's images

---

## ✅ Test 6: Review Management

### Endpoint: Create Review
```javascript
POST /api/reviews
{
  product_id: "...",
  user_id: "...",
  rating: 5,
  comment: "Great product!"
}
```

**What changed:**
- Unique constraint (user_id, product_id) added
- Can't submit duplicate reviews

**Test:**
- ✅ User can create review (first time)
- ✅ Same user cannot create second review for same product
- ❌ Expect error: "duplicate key value violates unique constraint"

---

## ✅ Test 7: Cart Management

### Endpoint: Add to Cart
```javascript
POST /api/cart-items
{
  user_id: "...",
  product_id: "...",
  variant_id: "...",
  quantity: 1
}
```

**What changed:**
- No changes to cart items table (policies already existed)
- Can delete cart items without orphaning anything

**Test:** ✅ Cart operations still work normally

---

## ✅ Test 8: Address Management

### Endpoint: Delete Address
```javascript
DELETE /api/addresses/{address_id}
```

**What changed:**
- ON DELETE SET NULL now active on orders.address_id
- Orders won't be orphaned when address deleted

**Test:**
- ✅ Delete address
- ✅ Verify orders still exist with address_id = NULL
- ✅ No 404 errors on order retrieval

---

## ✅ Test 9: Product Deletion

### Endpoint: Delete Product
```javascript
DELETE /api/products/{product_id}
```

**What changed:**
- Cascade delete trigger now cleans up all related records
- No orphaned data in variants, images, translations, reviews

**Test:**
- ✅ Delete product
- ✅ Verify variants, images, translations, reviews deleted
- ✅ No orphaned records

```sql
-- Verify after product deletion:
SELECT COUNT(*) FROM product_variants WHERE product_id = '<deleted_id>';
-- Should return: 0
```

---

## ✅ Test 10: Language Code Constraints

### API Calls with Language Codes
```javascript
// site_texts endpoints
GET /api/site-texts?language_code=en  ✅ Works
GET /api/site-texts?language_code=ar  ✅ Works
GET /api/site-texts?language_code=fr  ❌ Should reject (not in enum)

// store_translations endpoints
GET /api/store-translations?language_code=en  ✅ Works
GET /api/store-translations?language_code=xx  ❌ Should reject
```

**What changed:**
- Database now enforces language_code ENUM
- Invalid languages rejected at DB level

**Test:**
- ✅ Valid languages work
- ❌ Invalid languages rejected

---

## 🧪 Frontend Test Plan Template

Use this template to test each feature:

```markdown
## Feature: [Name]
- [ ] Test in browser console (no errors)
- [ ] Check Supabase logs for RLS policy blocks
- [ ] Verify data saved correctly
- [ ] Test permission denial (wrong user)
- [ ] Test cascade effects (if applicable)

Result: ✅ PASS / ❌ FAIL
Notes: [Any issues]
```

---

## 🚨 Common Frontend Issues to Watch For

| Error | Cause | Fix |
|-------|-------|-----|
| `Error: new row violates row-level security policy` | RLS policy blocking action | Policy not created / wrong permissions |
| `violates unique constraint "reviews_user_product_unique"` | Duplicate review | Expected behavior - frontend should show UI error |
| `violates unique constraint "site_texts_key_lang_idx"` | Duplicate site text | Check if upsert needed instead of insert |
| `ForeignKeyViolationError` | Deleting record with references | Use cascade delete or clean up references first |

---

## 📋 Validation Checklist

After ALL SQL fixes applied:

- [ ] Fix #001: Order Status Enum consolidated
- [ ] Fix #002: Payment Status Enum consolidated
- [ ] Fix #003: Order UPDATE policies working
- [ ] Fix #004: Order Items INSERT policy working
- [ ] Fix #005: Product Variants UPDATE/INSERT working
- [ ] Fix #006: Product Images RLS policies in place
- [ ] Fix #007: Reviews unique constraint enforced
- [ ] Fix #008: site_texts language_code is ENUM
- [ ] Fix #009: store_translations language_code is ENUM
- [ ] Fix #010: Product cascade delete working
- [ ] Fix #011: Address referential integrity working

---

## 🔄 Workflow After Fixes

1. Run all 11 SQLs one-by-one ✅
2. Run verification queries for each ✅
3. Test frontend features against this list
4. Report any failures
5. I'll provide targeted fixes

**Ready to start?**

👉 Run Fix #001 and report the output!
