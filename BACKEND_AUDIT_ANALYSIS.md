# Backend Schema Audit & Recommendations Report
**Generated: November 15, 2025**

## Executive Summary
Your Supabase schema is well-structured with 23 tables, 11 functions, and comprehensive RLS policies. However, I've identified **15 critical areas** requiring attention for frontend-backend compatibility.

---

## 🔴 CRITICAL ISSUES (Must Fix)

### 1. **Duplicate Order Status Enums**
**Issue**: Two enum types exist: `order_status` and `order_status_enum`
- `order_status`: pending, confirmed, processing, shipped, delivered, cancelled
- `order_status_enum`: pending, processing, shipped, delivered, cancelled, returned

**Impact**: Frontend confusion, inconsistent order tracking
**Frontend Requirement**: Which statuses does your frontend use?

---

### 2. **Duplicate Payment Status Enums**
**Issue**: Two enum types: `payment_status` and `payment_status_enum`
- `payment_status`: paid, pending, refunded, failed
- `payment_status_enum`: failed, pending, refunded, paid (different order)

**Impact**: Payment processing inconsistencies
**Frontend Requirement**: Which enum is your frontend expecting?

---

### 3. **Missing Foreign Key: Orders → Stores**
**Issue**: `orders` table has no direct relationship to `stores`
- Order items reference stores, but orders don't
- Creates orphaned orders if store is deleted

**Recommendation**: Add `store_id` to orders table or ensure referential integrity

---

### 4. **Missing Foreign Key: User Roles → User Deletion**
**Issue**: `user_roles` table has no foreign key constraint to auth.users
**Impact**: Orphaned roles if user is deleted

---

### 5. **Weak RLS Policies on Cart Items**
**Issue**: `cart_items` policies allow deletion without checking product availability
**Frontend Requirement**: Should you validate product stock during cart operations?

---

### 6. **Coupons: No Validation Logic**
**Issue**: 
- No check for `usage_count > usage_limit`
- No automatic expiration handling
- No relationship to stores (multi-seller scenario)

**Backend Logic Needed**: Validate coupon eligibility before applying

---

### 7. **Reviews: No Duplicate Prevention**
**Issue**: 
- No constraint preventing multiple reviews per product per user
- No validation that user purchased the product

**Recommendation**: Add unique constraint on `(user_id, product_id)`

---

### 8. **Site Texts: Language Code Type Mismatch**
**Issue**: 
- `site_texts.language_code` is `text` type
- Other tables use `language_code` ENUM
- Missing `language_code` enum constraint

**Risk**: Data inconsistency across application

---

### 9. **Missing Product Deletion Cascade Logic**
**Issue**: No triggers for cascade deletes
- Deleting product should clean up: variants, translations, images, reviews

**Current State**: Orphaned records possible

---

### 10. **Store Translations: Missing Language Code Constraint**
**Issue**: `store_translations.language_code` is text, should reference language_code enum

---

## 🟡 MEDIUM PRIORITY ISSUES

### 11. **Order Update Permissions Missing**
**Issue**: No policy allowing order status updates (admins, sellers)
- Only SELECT and INSERT policies exist
- Status updates blocked for order fulfillment

**Frontend Requirement**: Who should update order status?

---

### 12. **Product Images: No RLS Policies**
**Issue**: `product_images` table has empty policies array
- Public read access by default
- No seller restrictions

**Recommendation**: Add policies matching product visibility

---

### 13. **Order Items: No INSERT Policy**
**Issue**: Only SELECT policy exists
- Prevents order creation flow
- Missing permission check

**Frontend Requirement**: How are order items inserted?

---

### 14. **Address Deletion Risk**
**Issue**: Deleting address can orphan orders
- No CASCADE or SET NULL on orders.address_id

**Recommendation**: Add referential integrity

---

### 15. **Product Variants: Missing Stock Update Permissions**
**Issue**: No UPDATE policy for product_variants
- Stock updates blocked for admins/sellers
- Inventory management impossible

---

## 📊 POLICY SUMMARY

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| orders | ✅ | ✅ | ❌ | ❌ |
| coupons | ✅ | ❌ | ❌ | ❌ |
| products | ✅ | ✅ | ✅ | ✅ |
| product_variants | ✅ | ❌ | ❌ | ❌ |
| product_images | ❌ | ❌ | ❌ | ❌ |
| order_items | ✅ | ❌ | ❌ | ❌ |
| reviews | ✅ | ✅ | ✅ | ✅ |
| cart_items | ✅ | ✅ | ✅ | ✅ |

---

## 🔧 RECOMMENDED SQL FIXES (One by One)

I'll provide SQLs in separate sections below for you to run and test.

---

## 📋 NEXT STEPS

1. **Clarify Frontend Requirements**:
   - Which order statuses are you using?
   - Which payment statuses?
   - Who should manage order updates?

2. **Testing Plan**:
   - Run each SQL individually
   - Test frontend after each change
   - Report output

3. **Frontend Compatibility Check**:
   - Share frontend API calls
   - I'll verify against schema

---

**Would you like me to proceed with specific SQL fixes? Reply with:**
1. Which enums to standardize (order_status + payment_status)
2. Which permissions are missing for your workflow
3. Any frontend API endpoints to check
