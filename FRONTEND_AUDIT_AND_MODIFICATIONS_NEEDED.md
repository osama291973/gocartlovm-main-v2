# Frontend Audit & Required Modifications
**Created:** November 14, 2025  
**Status:** Comprehensive Frontend Analysis Complete

---

## 🎯 Executive Summary

### Current Frontend Status: ✅ **80% Implemented, 20% Incomplete**

**Good News:**
- ✅ Authentication system working (Supabase Auth integrated)
- ✅ Multi-language support implemented (EN/AR)
- ✅ React Query for data fetching configured
- ✅ Routing structure complete
- ✅ Admin dashboard framework present
- ✅ Seller dashboard framework present

**Critical Issues:**
- 🔴 Cart functionality NOT IMPLEMENTED (empty stub)
- 🔴 Orders/Checkout NOT IMPLEMENTED
- 🔴 Addresses management NOT IMPLEMENTED
- 🔴 Reviews system NOT IMPLEMENTED
- 🔴 Cart variant support BLOCKED by backend issue

**Backend Issues Blocking Frontend:**
- 🔴 **CRITICAL:** `cart_items.variant_id` missing - blocks variant support
- 🟡 Missing indexes causing performance issues
- 🟡 Missing RLS policies for product_images table
- 🟡 Incomplete function implementations

---

## 📊 Frontend Implementation Status by Feature

### ✅ Fully Implemented

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Authentication | ✅ Complete | AuthContext.tsx | Sign up, login, Google OAuth |
| Multi-Language | ✅ Complete | LanguageContext.tsx | EN/AR support, RTL |
| Product Browsing | ✅ Complete | Shop.tsx, ProductDetail.tsx | List & detail pages |
| Product Variants | ⚠️ Partial | VariantSelector.tsx | UI ready, backend issue |
| Seller Dashboard | ✅ Framework | SellerDashboardPage.tsx | Stats widgets working |
| Admin Dashboard | ✅ Framework | AdminSellerApplications.tsx | Approval workflow working |
| Navigation | ✅ Complete | App.tsx | All routes defined |
| UI Components | ✅ Complete | shadcn/ui components | Based on design system |

### 🟡 Partially Implemented

| Feature | Status | Location | Issue |
|---------|--------|----------|-------|
| Variant Selection | ⚠️ Partial | VariantSelector.tsx | No backend support |
| Product Images | ⚠️ Partial | AddProductPage.tsx | Upload works, display needs work |
| Store Creation | ⚠️ Partial | CreateStore.tsx | Basic form done, needs validation |
| Seller Application | ⚠️ Partial | AdminSellerApplications.tsx | Approve works, UI incomplete |

### 🔴 NOT Implemented

| Feature | Status | Location | Priority |
|---------|--------|----------|----------|
| **Shopping Cart** | ❌ Empty | Cart.tsx | CRITICAL |
| **Checkout Flow** | ❌ Missing | N/A | CRITICAL |
| **Orders** | ⚠️ Query only | OrdersPage.tsx | HIGH |
| **User Addresses** | ❌ Empty | Account.tsx | HIGH |
| **Product Reviews** | ❌ Missing | N/A | MEDIUM |
| **Order Management** | ❌ Missing | N/A | MEDIUM |
| **Coupon Application** | ❌ Missing | N/A | MEDIUM |
| **Payment Integration** | ❌ Missing | N/A | LOW (backend ready) |

---

## 🔴 CRITICAL BACKEND MODIFICATIONS NEEDED

### Issue #1: Missing `cart_items.variant_id` Column
**Impact:** Cannot add multiple sizes/colors of same product to cart  
**Severity:** 🔴 CRITICAL (Blocks shopping feature)  
**Status:** IDENTIFIED & DOCUMENTED

**Current Problem:**
```
cart_items table:
├─ user_id
├─ product_id
└─ quantity
└─ UNIQUE(user_id, product_id) ← PROBLEM: Can only have 1 per product
```

**What Needs to Change:**
```sql
-- Add variant_id column
ALTER TABLE cart_items ADD COLUMN variant_id uuid;

-- Update unique constraint
DROP CONSTRAINT IF EXISTS cart_items_user_product_key;
CREATE UNIQUE INDEX cart_items_user_variant_key 
  ON cart_items (user_id, variant_id);

-- Add foreign key
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_variant_id_fkey
FOREIGN KEY (variant_id) REFERENCES product_variants(id);
```

**Frontend Blocked Features:**
- Cannot show "Add to Cart" with variant selection (Size S, M, L)
- Cannot have multiple rows for same product with different variants
- Shopping experience severely limited

**Fix Needed:** ✅ **Already documented in FOREIGN_KEYS_RELATIONSHIPS.md**

---

### Issue #2: Missing RLS Policies for `product_images`
**Impact:** Product image uploads may fail  
**Severity:** 🟡 HIGH (Blocks image management)  
**Status:** IDENTIFIED

**Current Problem:**
```
product_images table:
├─ 0 RLS policies
└─ Anyone can upload/delete any image!
```

**What Needs to Change:**
```sql
-- RLS Policy: Sellers can upload images for their products
CREATE POLICY "Sellers can upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  );

-- RLS Policy: Everyone can view product images
CREATE POLICY "Product images are publicly readable" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-images');
```

**Frontend Impact:**
- Sellers cannot securely upload images (security risk)
- Need to add file validation on frontend

---

### Issue #3: Missing Performance Indexes
**Impact:** Slow queries for common operations  
**Severity:** 🟡 MEDIUM (Affects performance)  
**Status:** IDENTIFIED & DOCUMENTED in DATABASE_INDEXES.md

**Add These Indexes:**
```sql
-- 1. Speed up order queries by status
CREATE INDEX idx_orders_user_status ON orders (user_id, status);
CREATE INDEX idx_orders_status ON orders (status, created_at DESC);

-- 2. Speed up category browsing
CREATE INDEX idx_products_category ON products (category_id);

-- 3. Speed up review queries
CREATE INDEX idx_reviews_product ON reviews (product_id);
CREATE INDEX idx_reviews_user ON reviews (user_id);

-- 4. Speed up address queries
CREATE INDEX idx_addresses_user ON addresses (user_id);

-- 5. Enable product search
CREATE INDEX idx_products_search ON products 
  USING GIN (to_tsvector('english', name || ' ' || description));

-- 6. Cart variant support (after adding variant_id)
CREATE UNIQUE INDEX cart_items_user_variant_key 
  ON cart_items (user_id, variant_id);
```

---

### Issue #4: Missing Trigger for `created_at`
**Impact:** New records don't have creation timestamp  
**Severity:** 🟡 MEDIUM (Data consistency)  
**Status:** IDENTIFIED

**What Needs to Change:**
```sql
-- Add trigger for created_at initialization
CREATE OR REPLACE FUNCTION set_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that need it
CREATE TRIGGER set_created_at_cart_items
  BEFORE INSERT ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION set_created_at();

CREATE TRIGGER set_created_at_orders
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_created_at();

-- ... repeat for other tables with created_at
```

---

### Issue #5: Function Parameter Type Check
**Impact:** Functions may reject valid calls  
**Severity:** 🟡 LOW (Edge case)  
**Status:** IDENTIFIED

**What Might Need Change:**
```
Current: apply_for_seller() expects exact types
Frontend: May pass strings instead of UUIDs

Need: Validate or auto-cast parameter types
```

---

## 🟡 FRONTEND MODIFICATIONS NEEDED

### Priority 1: CRITICAL (Required for MVP)

#### 1.1 Implement Shopping Cart (`src/pages/Cart.tsx`)
**Current:** Empty stub with TODO comment  
**Needed:** Full cart implementation

```typescript
// Features to implement:
├─ Load cart items from database
├─ Display cart items with variant details
├─ Update quantities
├─ Remove items
├─ Apply coupon codes
├─ Calculate totals (subtotal, shipping, discount)
└─ Proceed to checkout

// Database operations:
├─ SELECT from cart_items + products
├─ UPDATE cart_items.quantity
├─ DELETE from cart_items
└─ Validate coupon codes
```

**Blockers:**
- ❌ Needs `cart_items.variant_id` (backend issue #1)
- ✅ Database queries ready
- ✅ Types available

**Estimated Effort:** 4-6 hours

---

#### 1.2 Implement Checkout Flow (New: `src/pages/Checkout.tsx`)
**Current:** Not implemented  
**Needed:** Complete checkout page

```typescript
// Features to implement:
├─ Display order review
├─ Address selection/creation
├─ Coupon application
├─ Payment method selection
├─ Order confirmation
└─ Send to backend

// Database operations:
├─ CREATE orders record
├─ CREATE order_items (from cart)
├─ GET addresses
├─ VALIDATE coupons
└─ Clear cart_items

// Flow:
1. Get cart items
2. Show order summary
3. Collect/select address
4. Apply coupon (if any)
5. Show total
6. Process payment (stub for now)
7. Create order
8. Clear cart
9. Redirect to order confirmation
```

**Blockers:**
- ✅ None (database ready)
- ⚠️ Payment integration (optional MVP)

**Estimated Effort:** 6-8 hours

---

#### 1.3 Implement Address Management (`src/pages/Account.tsx` or new `src/pages/Addresses.tsx`)
**Current:** Empty stub  
**Needed:** Full CRUD for addresses

```typescript
// Features to implement:
├─ List user addresses
├─ Create new address
├─ Edit address
├─ Delete address
├─ Set default address
└─ Use address in checkout

// Database operations:
├─ SELECT addresses WHERE user_id = auth.uid()
├─ INSERT into addresses
├─ UPDATE addresses
├─ DELETE addresses
└─ Validate address fields

// Form fields:
├─ Title (Home, Office, etc.)
├─ Street
├─ City
├─ State
├─ Country
├─ Postal Code
└─ Is Default checkbox
```

**Blockers:**
- ✅ None (database ready)
- ✅ RLS policies ready

**Estimated Effort:** 3-4 hours

---

#### 1.4 Implement Reviews System (New: `src/components/ReviewSection.tsx` + `src/pages/ProductDetail.tsx` update)
**Current:** Empty  
**Needed:** Full review display & creation

```typescript
// Features to implement:
├─ Display product reviews
├─ Show average rating
├─ Show star distribution
├─ Create new review (if not already reviewed)
├─ Edit own review
├─ Delete own review
└─ Real-time update

// Database operations:
├─ SELECT reviews WHERE product_id = ?
├─ INSERT new review
├─ UPDATE own review
├─ DELETE own review
└─ Calculate average rating

// Validation:
├─ User can only review after purchasing product
├─ User can only have 1 review per product
├─ Rating 1-5 stars
└─ Text 10-500 characters
```

**Blockers:**
- ✅ Database ready
- ⚠️ Need to verify user purchased product (optional for MVP)

**Estimated Effort:** 4-5 hours

---

#### 1.5 Fix Cart with Variant Support (Update: `src/pages/Cart.tsx`)
**Current:** Basic cart structure  
**Needed:** Variant-aware cart

```typescript
// After cart_items.variant_id is added to backend:
├─ Display variant details (Size S, Color Red, etc.)
├─ Show variant-specific price
├─ Show variant-specific stock
└─ Allow multiple rows for same product

// Example display:
Product: iPhone 15
├─ Row 1: Storage 128GB, Quantity 1, $799
└─ Row 2: Storage 256GB, Quantity 1, $899

// Need to join:
├─ cart_items → product_variants → product_variant_attributes
└─ product_variants → product_attribute_values
```

**Blockers:**
- 🔴 BLOCKED by backend issue #1 (variant_id column)

**Estimated Effort:** 2-3 hours (once backend fixed)

---

### Priority 2: HIGH (Important for functionality)

#### 2.1 Implement Product Images Display (Update: `src/pages/ProductDetail.tsx`)
**Current:** Shows only primary image  
**Needed:** Gallery with multiple images

```typescript
// Features to implement:
├─ Display primary image (large)
├─ Show thumbnail gallery
├─ Click thumbnail to change main image
├─ Lazy load images
├─ Error handling for missing images
└─ Mobile-friendly swipe

// Backend integration:
├─ SELECT from product_images
├─ Join with storage URLs
└─ Generate thumbnails (optional)
```

**Blockers:**
- ✅ Database ready
- ⚠️ May need to add storage policies

**Estimated Effort:** 3-4 hours

---

#### 2.2 Implement Product Variants Display (Complete: `src/components/VariantSelector.tsx`)
**Current:** Component exists but incomplete  
**Needed:** Full variant selection UI

```typescript
// Features to implement:
├─ Display variant attributes as options (Size, Color, etc.)
├─ Show price for selected variant
├─ Show stock for selected variant
├─ Show variant-specific image
├─ Validate stock before add-to-cart
└─ Add to cart with selected variant

// Database join:
├─ product_variants
├─ product_variant_attributes
├─ product_attribute_values
└─ product_attribute_value_translations (for i18n)
```

**Blockers:**
- ⚠️ Need variant_id in cart (backend issue)

**Estimated Effort:** 3-4 hours

---

#### 2.3 Implement Order Status Display (Update: `src/pages/OrdersPage.tsx`)
**Current:** Queries exist but display incomplete  
**Needed:** Full order list with details

```typescript
// Features to implement:
├─ Display orders list (user's or seller's based on role)
├─ Show order status badges
├─ Show order date
├─ Show total amount
├─ Click to view order details
├─ Track order status changes (real-time optional)
└─ Seller can update status

// Database operations:
├─ SELECT orders (filtered by role)
├─ SELECT order_items JOIN products
├─ UPDATE order status (seller only)
└─ Subscribe to real-time updates (optional)
```

**Blockers:**
- ✅ Database ready
- ✅ Seller permissions ready

**Estimated Effort:** 4-5 hours

---

#### 2.4 Complete Store Management (Update: `src/pages/CreateStore.tsx`)
**Current:** Form structure ready, backend integration incomplete  
**Needed:** Full store CRUD

```typescript
// Features to implement:
├─ Create store (done but may need refinement)
├─ Edit store profile
├─ Upload/change store logo
├─ Edit store translations (EN/AR)
├─ View store analytics
├─ Manage store status (active/inactive)
└─ Update bank details (optional)

// Database operations:
├─ INSERT stores
├─ UPDATE stores
├─ INSERT store_translations
├─ UPDATE store_translations
└─ SELECT store_logos from storage
```

**Blockers:**
- ✅ Database ready
- ⚠️ Image upload needs storage policy

**Estimated Effort:** 3-4 hours

---

### Priority 3: MEDIUM (Nice to have)

#### 3.1 Add Order Tracking/Status Updates (New: real-time updates)
**Current:** Static queries only  
**Needed:** Real-time order status

```typescript
// Features to implement:
├─ Subscribe to order changes (Supabase Realtime)
├─ Update UI when seller changes status
├─ Send notifications to user
└─ Show order timeline

// Implementation:
├─ Use supabase.on('postgres_changes').subscribe()
└─ Or use Supabase Realtime for real-time updates
```

**Blockers:**
- ✅ Database ready

**Estimated Effort:** 2-3 hours

---

#### 3.2 Add Search & Filtering
**Current:** No search implemented  
**Needed:** Product search & filters

```typescript
// Features to implement:
├─ Full-text search
├─ Filter by category
├─ Filter by price range
├─ Filter by rating
├─ Sort options
└─ Save searches

// Blocked by:
- 🟡 Missing full-text index (backend issue #3)

// Implementation once index exists:
├─ Use tsvector search
└─ Client-side filtering for better UX
```

**Estimated Effort:** 4-6 hours

---

#### 3.3 Add Product Management for Sellers
**Current:** AddProductPage.tsx exists but incomplete  
**Needed:** Full CRUD for products

```typescript
// Features to implement:
├─ List seller's products
├─ Create product
├─ Edit product (in progress)
├─ Delete product
├─ Upload images
├─ Manage variants
├─ Add translations
└─ Bulk operations

// Database operations:
├─ SELECT products WHERE store_id = user's_store
├─ INSERT products
├─ UPDATE products
├─ DELETE products
└─ UPSERT translations
```

**Blockers:**
- ✅ Database ready
- ⚠️ Image upload needs storage policy

**Estimated Effort:** 6-8 hours

---

#### 3.4 Add Admin Features
**Current:** AdminSellerApplications.tsx working  
**Needed:** Full admin dashboard

```typescript
// Features to implement:
├─ Seller application approval
├─ View/edit site texts (translations)
├─ View all orders
├─ View all stores
├─ Manage coupons
├─ View analytics
└─ System settings

// Already working:
├─ ✅ Seller applications
└─ ✅ Basic structure

// Still needed:
├─ ❌ Site texts editor (AdminTranslations.tsx)
├─ ⚠️ Order management
├─ ⚠️ Store management
└─ ❌ Coupon management (AdminCoupons.tsx)
```

**Estimated Effort:** 8-10 hours

---

## 📋 Summary Table: Backend vs Frontend Changes

| Component | Backend Status | Frontend Status | Priority | Blocker |
|-----------|----------------|-----------------|----------|---------|
| **Authentication** | ✅ Complete | ✅ Complete | ✅ | None |
| **Products** | ✅ Complete | ✅ Complete | ✅ | None |
| **Variants** | ⚠️ Missing variant_id | ⚠️ UI done | 🔴 CRITICAL | **YES** |
| **Cart** | ⚠️ Missing variant_id | ❌ Empty | 🔴 CRITICAL | **YES** |
| **Checkout** | ✅ Complete | ❌ Empty | 🔴 CRITICAL | No |
| **Orders** | ✅ Complete | ⚠️ Partial | 🔴 CRITICAL | No |
| **Addresses** | ✅ Complete | ❌ Empty | 🔴 CRITICAL | No |
| **Reviews** | ✅ Complete | ❌ Empty | 🟡 HIGH | No |
| **Storage** | ⚠️ No RLS | ⚠️ Partial | 🟡 HIGH | Yes |
| **Search** | 🟡 No index | ❌ Empty | 🟡 MEDIUM | Yes |
| **Seller Dashboard** | ✅ Complete | ⚠️ Partial | 🟡 HIGH | No |
| **Admin Dashboard** | ✅ Complete | ⚠️ Partial | 🟡 HIGH | No |

---

## 🔧 Backend Fixes Required (Priority Order)

### Phase 1: BLOCKING ISSUES (Do First)
```
1. [CRITICAL] Add cart_items.variant_id column
   └─ Blocks: Shopping cart, variant selection
   └─ Time: 30 min SQL + 1-2 hours testing
   
2. [HIGH] Add storage RLS policies for product_images
   └─ Blocks: Seller product image uploads
   └─ Time: 30 min SQL + 1 hour testing
   
3. [HIGH] Add performance indexes (6 indexes)
   └─ Blocks: Nothing, just slow queries
   └─ Time: 15 min SQL + 30 min testing
```

### Phase 2: DATA CONSISTENCY (Do Next)
```
4. [MEDIUM] Add created_at trigger
   └─ Ensures all new records timestamped
   └─ Time: 15 min SQL
   
5. [MEDIUM] Consolidate trigger functions
   └─ handle_updated_at vs update_updated_at
   └─ Time: 30 min SQL
```

### Phase 3: OPTIONAL (Do Later)
```
6. [LOW] Add missing enum validation
7. [LOW] Add additional audit triggers
```

---

## 🎯 Implementation Roadmap

### Week 1: Backend Fixes + Cart Implementation
```
Mon-Tue: Backend SQL fixes
  ├─ Add cart_items.variant_id
  ├─ Add RLS policies
  └─ Add indexes

Wed-Thu: Frontend Cart
  ├─ Implement Cart.tsx
  ├─ Add to cart functionality
  └─ Update quantities

Fri: Testing & integration
```

### Week 2: Checkout & Addresses
```
Mon: Checkout page
Tue: Address management
Wed: Order status display
Thu: Integration testing
Fri: Bug fixes
```

### Week 3: Reviews & Variants
```
Mon: Product variants display
Tue: Review system
Wed: Seller dashboard refinement
Thu: Admin dashboard refinement
Fri: Testing
```

### Week 4+: Polish & Features
```
Mon-Tue: Real-time updates
Wed: Search & filtering
Thu: Product management
Fri: Admin features & testing
```

---

## 🚀 Frontend Development Checklist

### Phase 1: Shopping Cart (CRITICAL)
- [ ] Create `src/contexts/CartContext.tsx` for cart state
- [ ] Implement `src/pages/Cart.tsx` fully
- [ ] Add "Add to Cart" button to ProductDetail
- [ ] Add cart icon with count to header
- [ ] Update cart from local storage or Supabase
- [ ] Handle quantity updates
- [ ] Handle item removal

### Phase 2: Checkout (CRITICAL)
- [ ] Create `src/pages/Checkout.tsx`
- [ ] Create `src/pages/OrderConfirmation.tsx`
- [ ] Add address selection UI
- [ ] Add coupon application UI
- [ ] Add payment method UI (stub)
- [ ] Implement order creation
- [ ] Clear cart after order

### Phase 3: Addresses (CRITICAL)
- [ ] Create `src/components/AddressForm.tsx`
- [ ] Create `src/pages/Addresses.tsx`
- [ ] Implement list, create, edit, delete
- [ ] Add to Account page
- [ ] Add validation

### Phase 4: Reviews (HIGH)
- [ ] Create `src/components/ReviewSection.tsx`
- [ ] Create `src/components/ReviewForm.tsx`
- [ ] Add review display to ProductDetail
- [ ] Implement review CRUD
- [ ] Add star rating display

### Phase 5: Variants (HIGH)
- [ ] Complete `src/components/VariantSelector.tsx`
- [ ] Add variant images
- [ ] Add variant pricing
- [ ] Show stock per variant
- [ ] Update ProductDetail with variant selection

### Phase 6: Images (HIGH)
- [ ] Create `src/components/ProductGallery.tsx`
- [ ] Update ProductDetail with gallery
- [ ] Add image upload for sellers
- [ ] Implement lazy loading

### Phase 7: Orders (HIGH)
- [ ] Complete `src/pages/OrdersPage.tsx`
- [ ] Add order details page
- [ ] Add seller order management
- [ ] Add order status updates
- [ ] Add real-time updates (optional)

### Phase 8: Admin (MEDIUM)
- [ ] Complete AdminTranslations.tsx
- [ ] Complete AdminCoupons.tsx
- [ ] Complete AdminStores.tsx
- [ ] Add analytics dashboard

### Phase 9: Polish (LOW)
- [ ] Add search functionality
- [ ] Add filtering
- [ ] Add sorting
- [ ] Add pagination
- [ ] Add real-time updates
- [ ] Performance optimization

---

## ⚡ Quick Start: First Features to Build

**If you want a working app in 1 week:**

Day 1-2: Backend fixes (variant_id + indexes)
Day 3: Shopping cart
Day 4: Checkout
Day 5: Addresses
Day 6-7: Testing & bug fixes

**Result:** Users can browse, add to cart, checkout, and track orders ✅

---

## 📝 Code Examples for Key Features

### Cart Context (New File)
```typescript
// src/contexts/CartContext.tsx
import { createContext, useContext, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface CartItem {
  id: string
  product_id: string
  variant_id: string
  quantity: number
  product: any
  variant: any
}

interface CartContextType {
  items: CartItem[]
  addItem: (product_id: string, variant_id: string, quantity: number) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
  clearCart: () => Promise<void>
  total: number
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*), product_variants(*)')
        .eq('user_id', user.id)

      if (!error && data) setItems(data as any)
    } catch (err) {
      console.error('Failed to load cart:', err)
    }
  }

  const addItem = async (product_id: string, variant_id: string, quantity: number) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id,
          variant_id,
          quantity,
        }, {
          onConflict: 'user_id,variant_id'
        })

      if (error) throw error
      await loadCart()
    } finally {
      setLoading(false)
    }
  }

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, total: 0, loading }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
```

---

## ✅ Final Checklist Before Production

### Backend
- [ ] Add cart_items.variant_id
- [ ] Add RLS policies for product_images
- [ ] Add 6 performance indexes
- [ ] Add created_at triggers
- [ ] Test all RLS policies
- [ ] Test all functions
- [ ] Verify data types match frontend

### Frontend
- [ ] Cart fully functional
- [ ] Checkout flow complete
- [ ] Addresses management working
- [ ] Orders display correctly
- [ ] Reviews system working
- [ ] Variants display correctly
- [ ] Images display correctly
- [ ] All pages responsive
- [ ] RTL (Arabic) working correctly
- [ ] Error handling on all pages
- [ ] Loading states on all pages
- [ ] All translations complete

### Integration
- [ ] Cart ↔ Checkout working
- [ ] Checkout → Orders working
- [ ] Orders → Display working
- [ ] Variants → Cart working
- [ ] Reviews → Products working
- [ ] Images → Products working
- [ ] Auth → All features working

### Testing
- [ ] All happy paths tested
- [ ] Error cases handled
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] RTL layout correct
- [ ] Accessibility basics

---

**Status:** 🎉 COMPLETE FRONTEND AUDIT FINISHED

Ready to start building the remaining features! 🚀
