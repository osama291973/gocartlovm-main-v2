# Supabase RLS Policies Documentation
**Created:** November 14, 2025  
**Status:** Complete RLS Configuration Review

---

## 📋 Executive Summary

**Total Policies:** 48 policies across 18 tables  
**Policy Types:** SELECT (read), INSERT, UPDATE, DELETE, ALL  
**Role Levels:** public, authenticated, admin  
**Security Model:** Row-Level Security (RLS) enabled

---

## 🔐 Role-Based Access Control

### Defined Roles:
- **public** - Unauthenticated users
- **authenticated** - Logged-in users
- **admin** (app_role enum) - Administrative users with `user_roles.role = 'admin'`

### Role Hierarchy:
```
public (anonymous)
  └─ Can view: Products, Categories, Coupons, Reviews, Site Texts, etc.

authenticated (logged-in)
  ├─ Can: Create/manage own data (cart, addresses, orders, reviews)
  └─ Can: Manage seller content if owns store

admin
  └─ Can: Full access to content management (site_texts, seller applications)
```

---

## 📊 Policy Matrix by Table

### 1️⃣ **PUBLIC READ ACCESS** (View Only)

#### Coupons
```
Policy: "Coupons are viewable by everyone"
├─ Role: public
├─ Command: SELECT
├─ Condition: true (no restrictions)
└─ Use Case: All users see active coupons during checkout
```

#### Categories
```
Policy: "Categories are viewable by everyone"
├─ Role: public
├─ Command: SELECT
├─ Condition: true
└─ Use Case: Browse category navigation
```

#### Products
```
Policy: "Products are viewable by everyone"
├─ Role: public
├─ Command: SELECT
├─ Condition: true
└─ Use Case: Browse marketplace, search, filter
```

#### Reviews
```
Policy: "Reviews are viewable by everyone"
├─ Role: public
├─ Command: SELECT
├─ Condition: true
└─ Use Case: Display product reviews on detail page
```

#### Site Texts (Content Management)
```
Policy: "Allow select site_texts"
├─ Role: public
├─ Command: SELECT
├─ Condition: true
└─ Use Case: Load UI strings, translations
```

#### Profiles
```
Policy: "Users can view all profiles"
├─ Role: public
├─ Command: SELECT
├─ Condition: true
└─ Use Case: View seller/user profiles publicly
```

#### Stores
```
Policy: "Anyone can view stores"
├─ Role: public
├─ Command: SELECT
├─ Condition: true
└─ Use Case: Browse seller stores
```

#### Variant & Attribute Data
```
Policies:
├─ "Product variants are viewable by everyone" (SELECT, true)
├─ "Product attributes are viewable by everyone" (SELECT, true)
├─ "Product attribute values are viewable by everyone" (SELECT, true)
├─ "Product attribute translations are viewable by everyone" (SELECT, true)
├─ "Product attribute value translations are viewable by everyone" (SELECT, true)
└─ "Store translations" (SELECT, true)
```

---

### 2️⃣ **USER-OWNED DATA** (Full CRUD)

#### Addresses
```
Policies:
├─ SELECT: "Users can view their own addresses"
│  └─ Condition: auth.uid() = user_id
├─ INSERT: "Users can insert their own addresses"
│  └─ Condition (with_check): auth.uid() = user_id
├─ UPDATE: "Users can update their own addresses"
│  └─ Condition: auth.uid() = user_id
└─ DELETE: "Users can delete their own addresses"
   └─ Condition: auth.uid() = user_id

Frontend Implications:
✓ Users can manage multiple addresses
✓ Can set default address
✓ Full address CRUD operations
```

#### Cart Items
```
Policies:
├─ SELECT: "Users can view their own cart"
│  └─ Condition: auth.uid() = user_id
├─ INSERT: "Users can insert to their own cart"
│  └─ Condition (with_check): auth.uid() = user_id
├─ UPDATE: "Users can update their own cart"
│  └─ Condition: auth.uid() = user_id
└─ DELETE: "Users can delete from their own cart"
   └─ Condition: auth.uid() = user_id

Frontend Implications:
✓ Personal shopping cart management
✓ Update quantities in real-time
✓ Remove items from cart
✓ No cross-user cart access
```

#### Profiles
```
Policies:
├─ INSERT: "Users can insert own profile"
│  └─ Condition (with_check): auth.uid() = id
├─ UPDATE: "Users can update own profile"
│  └─ Condition: auth.uid() = id
└─ SELECT: "Users can view all profiles" (public read)

Frontend Implications:
✓ Create profile on signup
✓ Edit personal profile (name, avatar)
✓ All profiles visible for social features
```

#### User Roles
```
Policy: "Users can view their own roles"
├─ Command: SELECT
├─ Condition: auth.uid() = user_id
└─ Frontend Implications:
   ✓ Check if user is admin/seller
   ✓ Determine dashboard access level
```

---

### 3️⃣ **ORDER MANAGEMENT**

#### Orders
```
Policies:
├─ SELECT: "Users can view their own orders"
│  └─ Condition: auth.uid() = user_id
└─ INSERT: "Users can insert their own orders"
   └─ Condition (with_check): auth.uid() = user_id

Frontend Implications:
✓ Users see only their order history
✓ Create new orders during checkout
✓ No cross-user order visibility
```

#### Order Items
```
Policy: "Users can view their order items"
├─ Command: SELECT
├─ Condition: EXISTS (
│    SELECT FROM orders 
│    WHERE orders.id = order_items.order_id 
│    AND orders.user_id = auth.uid()
│  )
└─ Frontend Implications:
   ✓ View items in own orders
   ✓ No access to other users' order items
   ✓ Display order details page
```

---

### 4️⃣ **SELLER/VENDOR MANAGEMENT**

#### Stores
```
Policies:
├─ SELECT: "Anyone can view stores"
│  └─ Condition: true
├─ INSERT: "Authenticated users can create stores"
│  └─ Condition (with_check): auth.uid() IS NOT NULL
├─ UPDATE: "Store owners can update their stores"
│  └─ Condition: auth.uid() = owner_id
└─ ALL: "Admins can manage stores"
   ├─ Condition: owner_id = auth.uid() OR admin
   └─ with_check: owner_id = auth.uid() OR admin

Frontend Implications:
✓ Browse all stores
✓ Create store (authenticated users)
✓ Store owners can edit own store
✓ Admins can manage any store
```

#### Products (Seller Products)
```
Policies:
├─ SELECT: "Products are viewable by everyone"
│  └─ Condition: true
├─ INSERT: "Sellers can insert products for their stores"
│  └─ Condition (with_check):
│     auth.uid() IS NOT NULL AND (
│       store.owner_id = auth.uid() OR admin
│     )
│  └─ Role: authenticated
└─ ALL: "Sellers can manage their products"
   ├─ Condition: store.owner_id = auth.uid() OR admin
   └─ Role: authenticated

Frontend Implications:
✓ All users browse products
✓ Only authenticated sellers can create products
✓ Sellers edit only own products
✓ Admins override any product
✓ Must own store to add products
```

#### Product Translations (Seller Content)
```
Policies:
├─ SELECT: "Product translations are viewable by everyone"
│  └─ Condition: true
├─ INSERT: "Sellers can insert product translations"
│  └─ Condition (with_check):
│     auth.uid() IS NOT NULL AND (
│       product.store.owner_id = auth.uid() OR admin
│     )
└─ ALL: "Sellers can manage their product translations"
   ├─ Condition: product.store.owner_id = auth.uid() OR admin
   └─ with_check: product.store.owner_id = auth.uid() OR admin

Frontend Implications:
✓ View translated products (all users)
✓ Add translations for own products
✓ Edit/delete own product translations
✓ Admin can manage any translation
```

#### Store Translations
```
Policies:
├─ SELECT: "Anyone can view store translations"
│  └─ Condition: true
└─ ALL: "Store owners can manage translations"
   └─ Condition: stores.owner_id = auth.uid()

Frontend Implications:
✓ View store names/descriptions in all languages
✓ Store owners edit store translations
```

---

### 5️⃣ **USER REVIEWS** (User-Generated Content)

#### Reviews
```
Policies:
├─ SELECT: "Reviews are viewable by everyone"
│  └─ Condition: true
├─ INSERT: "Users can create reviews"
│  └─ Condition (with_check): auth.uid() = user_id
├─ UPDATE: "Users can update their own reviews"
│  └─ Condition: auth.uid() = user_id
└─ DELETE: "Users can delete their own reviews"
   └─ Condition: auth.uid() = user_id

Frontend Implications:
✓ All users read all reviews
✓ Only reviewers can edit/delete own reviews
✓ Cannot edit others' reviews
✓ Review moderation needed (not in RLS)
```

---

### 6️⃣ **ADMIN-ONLY OPERATIONS**

#### Site Texts (Content Management)
```
Policies:
├─ SELECT: "Allow select site_texts"
│  └─ Role: public | Condition: true
├─ INSERT: "Admins insert site_texts"
│  └─ Role: authenticated | Condition: user has admin role
├─ UPDATE: "Admins update site_texts"
│  └─ Role: authenticated | Condition: user has admin role
└─ DELETE: "Admins delete site_texts"
   └─ Role: authenticated | Condition: user has admin role

Frontend Implications:
✓ Load UI strings from database (all users)
✓ Admin panel to manage site content
✓ Multi-language content management
```

#### Seller Applications
```
Policies:
├─ SELECT: "Admins can view all applications"
│  └─ Condition: user has admin role
└─ ALL: "Admins can manage seller_applications"
   ├─ Condition: user_id = auth.uid() OR admin
   └─ with_check: user_id = auth.uid() OR admin

Frontend Implications:
✓ Admins review seller applications
✓ Users see own application status
✓ Approve/reject seller requests
```

---

## 🎯 Frontend Feature Mapping

### 🛍️ **Shopping Features**
| Feature | Table | RLS Rule | User Access |
|---------|-------|----------|-------------|
| Browse Products | products | SELECT true | All users |
| Add to Cart | cart_items | INSERT user_id = auth.uid() | Authenticated |
| View My Cart | cart_items | SELECT user_id = auth.uid() | Owner only |
| Update Cart | cart_items | UPDATE user_id = auth.uid() | Owner only |
| View Coupons | coupons | SELECT true | All users |
| Checkout | orders | INSERT user_id = auth.uid() | Authenticated |
| View My Orders | orders | SELECT user_id = auth.uid() | Owner only |
| View Order Details | order_items | SELECT (via order owner) | Owner only |

### 👤 **User Profile Features**
| Feature | Table | RLS Rule | User Access |
|---------|-------|----------|-------------|
| View All Profiles | profiles | SELECT true | All users |
| Edit My Profile | profiles | UPDATE id = auth.uid() | Owner only |
| Manage Addresses | addresses | INSERT/UPDATE/DELETE user_id = auth.uid() | Owner only |
| View My Addresses | addresses | SELECT user_id = auth.uid() | Owner only |
| View My Roles | user_roles | SELECT user_id = auth.uid() | Owner only |

### ⭐ **Review Features**
| Feature | Table | RLS Rule | User Access |
|---------|-------|----------|-------------|
| View All Reviews | reviews | SELECT true | All users |
| Create Review | reviews | INSERT user_id = auth.uid() | Authenticated |
| Edit Own Review | reviews | UPDATE user_id = auth.uid() | Owner only |
| Delete Own Review | reviews | DELETE user_id = auth.uid() | Owner only |

### 🏪 **Seller Features**
| Feature | Table | RLS Rule | User Access |
|---------|-------|----------|-------------|
| View All Stores | stores | SELECT true | All users |
| Create Store | stores | INSERT authenticated | Authenticated |
| Edit Own Store | stores | UPDATE owner_id = auth.uid() | Owner only |
| Add Products | products | INSERT store.owner_id = auth.uid() | Store owner |
| Edit Products | products | ALL store.owner_id = auth.uid() | Store owner |
| Add Translations | product_translations | INSERT store owner | Store owner |
| Edit Translations | product_translations | ALL store owner | Store owner |
| Manage Store Translations | store_translations | ALL owner_id = auth.uid() | Store owner |

### 🛡️ **Admin Features**
| Feature | Table | RLS Rule | User Access |
|---------|-------|----------|-------------|
| Manage Site Texts | site_texts | INSERT/UPDATE/DELETE admin | Admin only |
| View Seller Apps | seller_applications | SELECT admin | Admin only |
| Manage Seller Apps | seller_applications | ALL admin | Admin only |
| Override Any Store | stores | ALL admin | Admin only |
| Override Any Product | products | ALL admin | Admin only |

---

## ⚠️ Security Considerations

### ✅ Well-Implemented:
1. **User Data Isolation** - Cart, orders, addresses properly scoped
2. **Seller Ownership** - Products linked via store ownership checks
3. **Public Read Access** - Products/categories visible to all
4. **Admin Override** - Admins can manage critical data
5. **Authenticated Only** - Store/product creation requires login

### ⚠️ Potential Issues:

#### 1. **Missing: Cart-to-Product Stock Check**
```
Risk: User adds product to cart, seller deletes product later
Fix: Need trigger to validate product_id still exists on purchase
```

#### 2. **Missing: Review Spam Prevention**
```
Risk: Users can review same product multiple times
Fix: Add UNIQUE constraint or trigger: 
     UNIQUE(product_id, user_id)
```

#### 3. **Missing: Order Modification Protection**
```
Risk: No UPDATE/DELETE policies on orders (good!)
But: No SELECT for sellers to view their own orders
Fix: Add policy: Sellers can view orders for their products
```

#### 4. **Missing: Product Variant/Attribute Management**
```
Risk: No INSERT/UPDATE/DELETE policies for variants
Fix: Need seller policies for:
     - product_variants
     - product_variant_attributes
```

#### 5. **Missing: Product Images Management**
```
Risk: product_images has no policies shown
Fix: Need SELECT for all (existing)
     Need INSERT/UPDATE/DELETE for sellers
```

---

## 🔧 Recommended RLS Additions

### For Sellers to Manage Product Variants:
```sql
CREATE POLICY "Sellers can manage product variants"
  ON product_variants
  USING ((auth.uid() IS NOT NULL) AND (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = product_variants.product_id
      AND s.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
    )
  ))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = product_variants.product_id
      AND s.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
    )
  ));
```

### For Product Images Management:
```sql
CREATE POLICY "Sellers can manage product images"
  ON product_images
  USING ((auth.uid() IS NOT NULL) AND (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = product_images.product_id
      AND s.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
    )
  ))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = product_images.product_id
      AND s.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
    )
  ));
```

### Prevent Duplicate Reviews:
```sql
ALTER TABLE reviews ADD CONSTRAINT unique_product_user_review
  UNIQUE(product_id, user_id);
```

---

## 📋 Frontend Development Checklist

### Authentication & Authorization
- [ ] Check `auth.uid()` before sensitive operations
- [ ] Verify user role via `user_roles` table
- [ ] Handle "permission denied" errors gracefully
- [ ] Show admin-only UI elements conditionally

### Cart Operations
- [ ] Load user's cart: `SELECT * FROM cart_items WHERE user_id = auth.uid()`
- [ ] Add to cart: `INSERT INTO cart_items (user_id, product_id, quantity)`
- [ ] Update quantity: `UPDATE cart_items WHERE id = ? AND user_id = auth.uid()`
- [ ] Remove item: `DELETE FROM cart_items WHERE id = ? AND user_id = auth.uid()`

### Order Management
- [ ] Create order: `INSERT INTO orders (user_id, address_id, coupon_id, ...)`
- [ ] View orders: `SELECT * FROM orders WHERE user_id = auth.uid()`
- [ ] Get order items: `SELECT * FROM order_items WHERE order_id = ?`
- [ ] Track status changes via order.status enum

### Seller Dashboard
- [ ] Load seller's store: `SELECT * FROM stores WHERE owner_id = auth.uid()`
- [ ] Manage products: `SELECT/INSERT/UPDATE/DELETE FROM products WHERE store_id = ...`
- [ ] Upload product images: `INSERT INTO product_images WHERE product_id = ...`
- [ ] Create variants: `INSERT INTO product_variants WHERE product_id = ...`
- [ ] Manage translations: `INSERT/UPDATE product_translations`

### User Profiles
- [ ] Create profile on signup: `INSERT INTO profiles (id, full_name)`
- [ ] Load profile: `SELECT * FROM profiles WHERE id = auth.uid()`
- [ ] Update profile: `UPDATE profiles SET full_name = ? WHERE id = auth.uid()`

### Admin Features
- [ ] Load site texts: `SELECT * FROM site_texts WHERE language_code = ?`
- [ ] Manage seller apps: `SELECT/UPDATE FROM seller_applications` (admin only)
- [ ] Override data: Full access to sensitive tables

---

## 🔄 Data Flow Diagram

```
Anonymous User (public)
  ├─ View Products, Categories, Reviews, Stores
  ├─ View Coupons, Translations, Site Texts
  └─ Cannot: Cart, Orders, Reviews (need auth)

Authenticated User
  ├─ All public access PLUS:
  ├─ Manage own Cart ✓
  ├─ Create/View Orders ✓
  ├─ Create Reviews ✓
  ├─ Manage Addresses ✓
  ├─ Update Profile ✓
  ├─ Create Store ✓
  └─ Cannot: Manage other users' data

Store Owner (has store)
  ├─ All user access PLUS:
  ├─ Create Products (in own store)
  ├─ Manage Products (own store)
  ├─ Manage Translations (own store)
  ├─ Update Store Profile ✓
  └─ Cannot: Edit other stores

Admin User (role='admin')
  ├─ All user access PLUS:
  ├─ Override any store/product
  ├─ Manage site_texts ✓
  ├─ Approve seller applications
  └─ Full data access (with RLS still applied)
```

---

## ✅ RLS Policy Status Summary

| Table | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|--------|--------|--------|--------|--------|
| products | ✅ | ✅ seller | ✅ seller | ❌ | Complete |
| product_variants | ✅ | ❌ | ❌ | ❌ | **Missing seller CRUD** |
| product_images | ✅ | ❌ | ❌ | ❌ | **Missing seller CRUD** |
| cart_items | ✅ user | ✅ user | ✅ user | ✅ user | Complete |
| orders | ✅ user | ✅ user | ❌ | ❌ | Complete |
| addresses | ✅ user | ✅ user | ✅ user | ✅ user | Complete |
| profiles | ✅ | ✅ user | ✅ user | ❌ | Complete |
| reviews | ✅ | ✅ user | ✅ user | ✅ user | Complete |
| stores | ✅ | ✅ auth | ✅ owner | ❌ | Complete |
| seller_applications | ✅ admin | ✅ auth | ✅ admin | ✅ admin | Complete |
| site_texts | ✅ | ✅ admin | ✅ admin | ✅ admin | Complete |

---

**Status:** 🟢 RLS Policies Documented - Ready for Frontend Implementation Guide
