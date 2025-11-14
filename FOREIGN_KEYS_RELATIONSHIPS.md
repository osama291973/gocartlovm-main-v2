# Foreign Keys & Relationships Documentation
**Created:** November 14, 2025  
**Status:** Complete Relationship Mapping

---

## 📋 Executive Summary

**Total Foreign Keys:** 27 relationships (including duplicates)  
**Unique Relationships:** 20 core relationships  
**Relationship Types:** One-to-Many, Many-to-Many, Hierarchical  
**Orphan Handling:** Cascade, Set Null, Restrict (to be verified)

---

## 🗂️ Relationship Hierarchy

### Top-Level Entities (No Parents)
```
├─ auth.users (Supabase managed)
├─ categories (Category root)
├─ product_attributes (Attribute definitions)
└─ coupons (Discount codes)
```

### Core Business Objects
```
├─ stores (Seller storefronts)
├─ products (Product catalog)
├─ profiles (User profiles)
├─ user_roles (Role assignments)
└─ addresses (Delivery addresses)
```

### Transaction Objects
```
├─ orders (Purchase orders)
├─ order_items (Order line items)
├─ cart_items (Shopping cart items)
└─ reviews (Product reviews)
```

### Supporting Data
```
├─ Translations (product_translations, category_translations, etc.)
├─ Images (product_images)
├─ Variants (product_variants, product_variant_attributes)
└─ Admin (seller_applications, site_texts)
```

---

## 🔗 Complete Relationship Map

### **1. CATEGORIES** (Root Entity)
```
categories (id)
├─ 1:N ──→ category_translations.category_id
│   └─ Purpose: Multi-language category names/descriptions
│   └─ Count: Typically 5-20 per category (one per language)
│
└─ 1:N ──→ products.category_id
    └─ Purpose: Categorize products
    └─ Count: 0+ products per category
    └─ Optional: category_id can be NULL
```

**Cascade Behavior:**
```
DELETE categories.id
  ├─ CASCADE: Delete all category_translations
  ├─ CASCADE: Delete all products in category (⚠️ or SET NULL?)
  └─ Cascade effect: Deletes all product_images, reviews, etc.
```

**Frontend Implication:**
```
✓ Load category list for browse/filter
✓ Load translations for selected language
✓ Show "X products in category"
✓ Cannot delete category while products exist (if Restrict)
```

---

### **2. PRODUCTS** (Core Product Entity)
```
products (id)
├─ N:1 ──→ categories.id
│   └─ products.category_id FK
│   └─ Optional: NULL allowed
│
├─ N:1 ──→ stores.id
│   └─ products.store_id FK
│   └─ Required: NOT NULL
│   └─ Identifies seller
│
├─ 1:N ──→ product_translations.product_id
│   └─ Purpose: Multi-language product details
│   └─ Count: One per language
│   └─ Contains: name, description
│
├─ 1:N ──→ product_images.product_id
│   └─ Purpose: Product gallery images
│   └─ Count: 1-20 images typical
│   └─ Fields: position, storage_path, public_url
│
├─ 1:N ──→ product_variants.product_id
│   └─ Purpose: Product SKU variants (size, color, etc.)
│   └─ Count: 0+ variants (0 if no variants)
│   └─ Each has: sku, price, stock
│
├─ 1:N ──→ reviews.product_id
│   └─ Purpose: Customer reviews
│   └─ Count: 0+ reviews
│   └─ Contains: rating (1-5), comment
│
├─ 1:N ──→ cart_items.product_id
│   └─ Purpose: Links product to user carts
│   └─ Count: One per user cart
│   └─ Fields: user_id, quantity
│
└─ 1:N ──→ order_items.product_id
    └─ Purpose: Links product to orders
    └─ Count: One per order line
    └─ Fields: order_id, quantity, price (snapshot)
```

**Cascade Behavior:**
```
DELETE products.id
  ├─ CASCADE: Delete all product_translations
  ├─ CASCADE: Delete all product_images
  ├─ CASCADE: Delete all product_variants
  │   ├─ CASCADE: Delete all product_variant_attributes
  │   └─ CASCADE: Delete all product_attribute values
  ├─ CASCADE: Delete all reviews
  ├─ CASCADE: Delete all cart_items (removes from carts)
  └─ SET NULL or RESTRICT: order_items? (⚠️ snapshot data)
```

**Frontend Implications:**
```
✓ Load product with all translations for selected language
✓ Load product images with position for gallery ordering
✓ Load variants with attributes for variant selector
✓ Load reviews with pagination
✓ Decrement store.total_products when product deleted
✓ Show "Product not found" if deleted while viewing
✓ Cannot undo deletion if not soft-deleted
```

---

### **3. STORES** (Seller Store)
```
stores (id)
├─ N:1 ──→ auth.users (owner_id)
│   └─ Identifies store owner
│   └─ Required: NOT NULL
│
├─ 1:N ──→ products.store_id
│   └─ Products in this store
│   └─ Count: 0+ products
│
├─ 1:N ──→ store_translations.store_id
│   └─ Multi-language store info
│   └─ Count: One per language
│   └─ Contains: name, description
│
└─ 1:N ──→ seller_applications.store_id
    └─ Seller application for this store
    └─ Count: Typically 0-1
    └─ Can be NULL during application
```

**Cascade Behavior:**
```
DELETE stores.id
  ├─ CASCADE: Delete all products (and cascade their deletes)
  ├─ CASCADE: Delete all store_translations
  ├─ CASCADE: Delete all seller_applications
  └─ Frontend: "Your store has been deleted"
```

**Cascade Behavior (User deletion):**
```
DELETE auth.users (owner_id)
  ├─ CASCADE: Delete stores row
  ├─ CASCADE: Delete all products (and their cascade)
  ├─ Frontend: "Account deleted, all stores/products removed"
  └─ Data loss: Customers' orders become orphaned
```

**Frontend Implications:**
```
✓ Load seller's store info
✓ Load store translations for display
✓ Link products to store
✓ Display "Sold by: Store Name"
✓ Store owner can edit profile
✓ Show store rating/reviews aggregated from products
✓ Cannot delete store if has orders (business logic)
```

---

### **4. PRODUCT ATTRIBUTES** (Attribute System)
```
product_attributes (id)
├─ 1:N ──→ product_attribute_translations.attribute_id
│   └─ Purpose: Multi-language attribute names (e.g., "Size", "اللون")
│   └─ Count: One per language
│
├─ 1:N ──→ product_attribute_values.attribute_id
│   └─ Purpose: Possible values for this attribute (S, M, L, XL)
│   └─ Count: 2-20 values typical
│   ├─ 1:N ──→ product_attribute_value_translations.value_id
│   │   └─ Multi-language value names
│   │   └─ Count: One per language per value
│   └─ Used by: product_variant_attributes
│
└─ N:N ──→ product_variant_attributes.attribute_id
    └─ Links attributes to variants
    └─ Contains: variant_id, attribute_id, value
```

**Example Attribute Structure:**
```
product_attributes (id=attr1)
├─ name: "Size"
├─ type: "select"
│
├─ product_attribute_translations
│   ├─ language_code: "en", name: "Size"
│   └─ language_code: "ar", name: "الحجم"
│
└─ product_attribute_values
    ├─ id=val1, value: "S"
    │   └─ product_attribute_value_translations
    │       ├─ language_code: "en", value: "Small"
    │       └─ language_code: "ar", value: "صغير"
    ├─ id=val2, value: "M"
    ├─ id=val3, value: "L"
    └─ id=val4, value: "XL"
```

**Frontend Implication:**
```
✓ Load attributes available for product
✓ Build variant selector (size, color dropdowns)
✓ Display attribute names/values in user language
✓ Validate variant selection before add-to-cart
✓ Show "Size: S, Color: Red" for each cart item
```

---

### **5. PRODUCT VARIANTS** (SKU Management)
```
product_variants (id)
├─ N:1 ──→ products.id
│   └─ Which product this is a variant of
│   └─ Required: NOT NULL
│
└─ 1:N ──→ product_variant_attributes.variant_id
    └─ Attribute values for this variant
    ├─ N:1 ──→ product_attributes.id
    │   └─ References the attribute definition
    └─ Fields: attribute_id, value (e.g., "Size": "L")
```

**Variant Data Structure:**
```
product_variants
├─ id: variant_id_1
├─ product_id: product_id_1 (FK)
├─ sku: "SHIRT-L-RED"
├─ price: 29.99
├─ original_price: 39.99
├─ stock: 50
└─ image_url: "variant specific image"

product_variant_attributes (for above variant)
├─ variant_id: variant_id_1
├─ attribute_id: size_attribute_id
├─ value: "L"

├─ variant_id: variant_id_1
├─ attribute_id: color_attribute_id
└─ value: "Red"
```

**Frontend Implication:**
```
✓ Load all variants for a product
✓ Build variant selector from attributes
✓ Show variant-specific price & stock
✓ Add variant (not product) to cart
✓ Display selected variant attributes in cart
✓ Check variant stock before checkout
```

---

### **6. ORDERS** (Purchase Orders)
```
orders (id)
├─ N:1 ──→ auth.users (user_id)
│   └─ Customer who placed order
│   └─ Optional: NULL if guest (?)
│
├─ N:1 ──→ addresses.id
│   └─ Delivery address
│   └─ Optional: NULL if pickup
│   └─ User can delete address later (orphan data)
│
├─ N:1 ──→ coupons.id
│   └─ Applied discount code
│   └─ Optional: NULL if no coupon
│   └─ Coupon can be deleted (historical data lost)
│
└─ 1:N ──→ order_items.order_id
    └─ Line items in this order
    └─ Count: 1+ items
    ├─ N:1 ──→ products.id
    │   └─ Reference to product (may be deleted)
    ├─ Fields: quantity, price (snapshot at order time)
    ├─ Fields: product_name, product_image (snapshot)
    └─ Soft reference: product_id may not exist anymore
```

**Cascade Behavior:**
```
DELETE orders.id
  ├─ CASCADE: Delete all order_items
  └─ Frontend: "Order permanently deleted" (rarely done)

DELETE auth.users (user_id)
  └─ SET NULL: orders.user_id (preserves order history)
  └─ Guest orders if user_id already NULL

DELETE addresses.id
  └─ SET NULL or RESTRICT: orders.address_id
  └─ May cause issues if address used for order

DELETE coupons.id
  └─ SET NULL or RESTRICT: orders.coupon_id
  └─ Discrepancy: Discount lost in historical data
```

**Snapshot Data Strategy:**
```
order_items stores snapshot:
├─ product_id: Reference (can be deleted)
├─ product_name: Snapshot (immutable copy)
├─ product_image: Snapshot (immutable copy)
├─ price: Snapshot (what customer paid)
└─ quantity: Snapshot (what customer bought)

Purpose:
✓ Product can be deleted without losing order history
✓ Show exact item name/price/image from order time
✓ Calculate refunds based on snapshot price
✗ But: Cannot track price history if order edited
```

**Frontend Implications:**
```
✓ Create order with user_id = auth.uid()
✓ Link to delivery address
✓ Apply coupon if valid
✓ Create order_items from cart
✓ Store product snapshots in order_items
✓ Allow order status tracking
✓ Show order history: "Order XYZ - $100 - Delivered"
✓ Cannot modify order items after order placed
✓ Cannot delete order (business/legal requirements)
```

---

### **7. CART ITEMS** (Shopping Cart)
```
cart_items (id)
├─ N:1 ──→ auth.users (user_id)
│   └─ Cart owner
│   └─ Required: NOT NULL
│
└─ N:1 ──→ products.id
    └─ Product (or variant?) in cart
    └─ Required: NOT NULL
    └─ Can be deleted (orphan item)
```

**Cascade Behavior:**
```
DELETE products.id
  ├─ CASCADE: Delete all cart_items with that product
  └─ Frontend: "Item removed from cart (product deleted)"

DELETE auth.users (user_id)
  └─ CASCADE: Delete all cart_items
  └─ Frontend: On account deletion, cart cleared

DELETE cart_items.id
  └─ Item removed from cart (user removes)
```

**⚠️ Issue: Missing Variant Reference**
```
Problem: cart_items.product_id doesn't reference variants
  - If product has variants, which variant is in cart?
  - cart_items table missing:
    ├─ variant_id FK (if product has variants)
    ├─ variant attributes (size, color, etc.)
    └─ variant price & stock

Impact on Frontend:
✗ Cannot show "Size: L, Color: Red" in cart
✗ Cannot verify variant stock before checkout
✗ Cannot differentiate same product different variants

Recommendation:
✓ Add cart_items.variant_id FK
✓ Add cart_items.attributes JSONB
✓ Add cart_items.price_snapshot (at add time)
✓ Update RLS policies for variant access
```

**Frontend Implications:**
```
✓ Add product/variant to cart
✓ Update quantity in cart
✓ Remove item from cart
✓ Display cart items (but missing variant info!)
✓ Calculate subtotal from snapshots
✗ Cannot show variant details (missing data)
✗ Cannot verify if variant still in stock
```

---

### **8. REVIEWS** (Product Reviews)
```
reviews (id)
├─ N:1 ──→ products.id
│   └─ Which product is being reviewed
│   └─ Required: NOT NULL
│
└─ N:1 ──→ auth.users (user_id)
    └─ Who wrote the review
    └─ Optional: NULL if anonymous
```

**Cascade Behavior:**
```
DELETE products.id
  └─ CASCADE: Delete all reviews
  └─ Reviews lost when product deleted

DELETE auth.users (user_id)
  └─ SET NULL: reviews.user_id
  └─ Review preserved, author becomes anonymous
```

**⚠️ Issue: Duplicate Reviews**
```
Problem: No UNIQUE constraint on (product_id, user_id)
  - User can review same product multiple times
  - Can inflate/deflate product rating artificially

Current RLS:
✓ Users can create reviews
✗ No duplicate prevention in RLS

Recommendation:
✓ Add UNIQUE(product_id, user_id) constraint
✓ Or: Use UPSERT to update existing review
✓ Or: Add business logic to prevent duplicates
```

**Frontend Implications:**
```
✓ Load product reviews (paginated)
✓ Display rating distribution (1-5 stars)
✓ Show customer avatars/names
✓ Filter reviews by rating
✓ Create/edit/delete own review
✗ Cannot prevent duplicate reviews (missing constraint)
```

---

### **9. ADDRESSES** (User Delivery Addresses)
```
addresses (id)
├─ N:1 ──→ auth.users (user_id)
│   └─ Address owner
│   └─ Required: NOT NULL
│
└─ 1:N ──→ orders.id
    └─ Orders shipped to this address
    └─ Can be deleted (orphan orders)
```

**Cascade Behavior:**
```
DELETE auth.users (user_id)
  └─ CASCADE: Delete all addresses
  └─ Orders.address_id becomes orphaned (SET NULL)

DELETE addresses.id
  └─ SET NULL: orders.address_id
  └─ Orders keep other data, address becomes null
```

**Frontend Implications:**
```
✓ User manages multiple delivery addresses
✓ Mark one address as default
✓ Select address during checkout
✓ Edit address details
✓ Delete unused addresses
✓ Show "Delivery to: 123 Main St"
```

---

### **10. SELLER APPLICATIONS** (Onboarding)
```
seller_applications (id)
├─ N:1 ──→ auth.users (user_id)
│   └─ User applying to be seller
│   └─ Required: NOT NULL
│
└─ N:1 ──→ stores.id
    └─ Store being applied for
    └─ Optional: NULL before approval
    └─ Set by approve_seller_application()
```

**Cascade Behavior:**
```
DELETE auth.users (user_id)
  └─ CASCADE: Delete seller_applications
  └─ Application records lost

DELETE stores.id
  └─ (Shouldn't delete - constraint may prevent)
  └─ Or: Orphan application record
```

**Frontend Implications:**
```
✓ User submits seller application
✓ Admin reviews applications
✓ Admin approves → Creates store
✓ Admin rejects → Application marked rejected
✓ User can see application status
✓ Show "Application Pending Review"
```

---

### **11. TRANSLATIONS** (Multi-Language Support)

#### Product Translations
```
product_translations
└─ N:1 ──→ products.id
    └─ Cascade: Delete all translations when product deleted
```

#### Category Translations
```
category_translations
└─ N:1 ──→ categories.id
    └─ Cascade: Delete all translations when category deleted
```

#### Store Translations
```
store_translations
└─ N:1 ──→ stores.id
    └─ Cascade: Delete all translations when store deleted
```

#### Attribute Translations
```
product_attribute_translations
└─ N:1 ──→ product_attributes.id
    └─ Cascade: Delete all translations when attribute deleted
```

#### Attribute Value Translations
```
product_attribute_value_translations
└─ N:1 ──→ product_attribute_values.id
    └─ Cascade: Delete all translations when value deleted
```

**Frontend Implication:**
```
✓ Load translations for selected language
✓ Fallback to default language if translation missing
✓ Display multi-language content
✓ Admin can manage translations per language
```

---

### **12. IMAGES** (Product Images)

```
product_images
└─ N:1 ──→ products.id
    ├─ Cascade: Delete when product deleted
    ├─ Fields: storage_path, public_url, position
    └─ Purpose: Gallery images for product
```

**Frontend Implication:**
```
✓ Load product images in order (position)
✓ Display gallery slider
✓ Upload new images
✓ Delete unused images
✓ Show main image in product list
```

---

## 📊 Relationship Cardinality Summary

| Relationship | Type | Cascade | Impact |
|--------------|------|---------|--------|
| categories → products | 1:N | ✓ | Delete category deletes all products |
| stores → products | 1:N | ✓ | Delete store deletes all products |
| products → reviews | 1:N | ✓ | Delete product deletes all reviews |
| products → cart_items | 1:N | ✓ | Delete product removes from carts |
| products → order_items | 1:N | ✓ | Delete product orphans order items |
| products → product_variants | 1:N | ✓ | Delete product deletes variants |
| product_variants → product_variant_attributes | 1:N | ✓ | Delete variant deletes attributes |
| orders → order_items | 1:N | ✓ | Delete order deletes items |
| auth.users → profiles | 1:1 | ✓ | Delete user deletes profile |
| auth.users → stores | 1:N | ✓ | Delete user deletes stores |
| auth.users → addresses | 1:N | ✓ | Delete user deletes addresses |
| auth.users → orders | 1:N | N/A | Orders orphaned (guest orders?) |
| addresses → orders | 1:N | ? | Depends on config |
| coupons → orders | 1:N | ? | Discount lost if coupon deleted |

---

## ⚠️ Data Integrity Issues Identified

### 🔴 **CRITICAL: Missing Variant in Cart**
```
Issue: cart_items table has no variant_id
├─ Cannot distinguish products from different variants
├─ Cannot show "Size: L" in cart
├─ Cannot verify variant-specific stock
└─ Blocks frontend implementation

Solution:
✓ Add cart_items.variant_id (optional FK)
✓ Add cart_items.attributes (JSONB snapshot)
✓ Migrate existing cart data
✓ Update RLS policies
```

### 🟡 **Duplicate Reviews Allowed**
```
Issue: No UNIQUE(product_id, user_id) constraint
├─ Users can review same product multiple times
├─ Artificial rating inflation/deflation possible
└─ No RLS protection

Solution:
✓ Add UNIQUE constraint
✓ Or: Implement UPSERT on review create
✓ Or: Add business logic in function
```

### 🟡 **Orphan Data When Cascading**
```
Issue: If cart/order references deleted product
├─ Product deletion cascades to cart_items
├─ Product deletion cascades to order_items (via FK)
├─ Orders become incomplete
└─ Frontend shows "product not found"

Solution Options:
✓ Don't delete products (soft delete instead)
✓ Set order_items product_id to NULL on delete
✓ Keep snapshot data (current approach)
✓ Prevent product deletion if in orders/cart

Recommendation:
✓ Use soft deletes (add is_deleted boolean)
✓ Keep product_id references intact
✓ Allow filtering out deleted products
```

### 🟡 **Guest Orders**
```
Issue: orders.user_id is optional, but unclear handling
├─ Can anonymous users place orders?
├─ How are guest carts managed?
├─ No session/cookie tracking?
└─ Frontend must clarify

Recommendation:
✓ Require auth for orders
✓ Or: Implement guest checkout with email tracking
✓ Or: Use temporary session identifiers
```

### 🟡 **Coupon & Address Deletion**
```
Issue: Deleting coupons/addresses affects order history
├─ orders.coupon_id becomes NULL
├─ orders.address_id becomes NULL
├─ Historical order data becomes incomplete
└─ Refunds/disputes become complicated

Solution:
✓ Implement soft deletes for coupons/addresses
✓ Keep coupon/address snapshot in order_items
✓ Prevent deletion if used in orders
✓ Archive instead of delete
```

---

## 🎯 Frontend Data Loading Patterns

### Pattern 1: Load Product with Full Details
```
1. SELECT products WHERE id = ?
2. SELECT product_translations WHERE product_id = ? 
   AND language_code = ? (or fallback)
3. SELECT product_images WHERE product_id = ?
   ORDER BY position
4. SELECT product_variants WHERE product_id = ?
5. SELECT product_variant_attributes WHERE variant_id IN (...)
6. SELECT product_attributes WHERE id IN (...)
   + SELECT product_attribute_translations
7. SELECT reviews WHERE product_id = ? LIMIT 10

Result: Complete product data with all details
```

### Pattern 2: Load User Cart
```
1. SELECT cart_items WHERE user_id = auth.uid()
2. SELECT products WHERE id IN (cart_items.product_id)
3. SELECT product_images, product_variants
4. Calculate: subtotal, tax, shipping
   ⚠️ Missing: variant details from cart_items

Issue: Cannot fully reconstruct cart items
Solution: Fetch variant data separately
```

### Pattern 3: Checkout Process
```
1. Load cart_items (with products, variants)
2. Load addresses WHERE user_id = auth.uid()
3. Validate coupon (SELECT coupons WHERE code = ?)
4. Create order:
   - INSERT orders (user_id, address_id, coupon_id, totals)
   - INSERT order_items (from cart_items, with snapshots)
   - DELETE cart_items (clear cart)
5. Return order_id
```

### Pattern 4: Load Orders
```
1. SELECT orders WHERE user_id = auth.uid()
2. SELECT order_items WHERE order_id IN (...)
3. SELECT products, product_images (for snapshots)
   ⚠️ Products may be deleted
4. SELECT addresses for order.address_id
   ⚠️ Address may be deleted (NULL)

Result: Order history with fallback handling for deleted data
```

---

## ✅ Recommended Foreign Key Constraints

### Current Setup (from schema)
```sql
-- Working FKs
CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id)

CONSTRAINT products_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES stores(id)

-- Recommend adding explicit CASCADE/SET NULL
```

### Recommended Explicit Cascade
```sql
-- Products cascade when category deleted
ALTER TABLE products 
ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Product variants cascade when product deleted
ALTER TABLE product_variants 
ADD CONSTRAINT product_variants_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES products(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Cart items removed when product deleted
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES products(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Order items: Keep snapshot, set product_id NULL if deleted
ALTER TABLE order_items 
ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES products(id) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Orders keep delivery/coupon history
ALTER TABLE orders 
ADD CONSTRAINT orders_address_id_fkey 
  FOREIGN KEY (address_id) 
  REFERENCES addresses(id) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

ALTER TABLE orders 
ADD CONSTRAINT orders_coupon_id_fkey 
  FOREIGN KEY (coupon_id) 
  REFERENCES coupons(id) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;
```

---

## 📋 Frontend Implementation Checklist

### Product Loading
- [ ] Load product with all translations
- [ ] Load product images in correct order
- [ ] Load variants with attributes
- [ ] Load attribute definitions & translations
- [ ] Handle missing translations (fallback)
- [ ] Handle deleted categories (NULL category_id)

### Shopping Cart
- [ ] Add product (not variant!) to cart
- [ ] ⚠️ Currently cannot add variant to cart (missing cart_items.variant_id)
- [ ] Update quantity in cart
- [ ] Remove item from cart
- [ ] Handle product deletion → item removed
- [ ] Calculate subtotal from product prices
- [ ] Show "Product no longer available" if product deleted

### Checkout
- [ ] Validate cart items still exist/in stock
- [ ] Load user addresses
- [ ] Select delivery address
- [ ] Validate & apply coupon
- [ ] Create order with snapshots
- [ ] Create order_items with current price/product data
- [ ] Clear cart after order creation
- [ ] Show order confirmation with order_id

### Order History
- [ ] Load user's orders
- [ ] Load order_items with snapshots
- [ ] Handle deleted products (show snapshot name/image)
- [ ] Handle deleted addresses (show "Address deleted")
- [ ] Track order status (pending, shipped, delivered)
- [ ] Show refund/return options

### Seller Dashboard
- [ ] Load seller's store
- [ ] Load products by store_id
- [ ] Create new products (requires store)
- [ ] Edit products
- [ ] Delete products (cascade to variants, images, cart_items)
- [ ] Manage product variants
- [ ] Manage product translations
- [ ] View product reviews

---

## 🔗 Relationship Diagram (ASCII)

```
                    auth.users
                    /    |    \
                   /     |     \
            profiles    stores   addresses
                        /         \
                       /           \
                    products        orders ──→ coupons
                   /  |  \           |
                  /   |   \          |
        category +  images +   order_items
                     variants      (snapshots)
                        |
                   product_variant
                   _attributes
                        |
                   product_
                   attributes
                   /  |  \
                  /   |   \
        translations values other data
```

---

## 🚨 Critical Issues Summary

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| Missing cart_items.variant_id | 🔴 CRITICAL | Cannot show variant details in cart | Add column & update RLS |
| No duplicate review constraint | 🟡 MEDIUM | Artificial ratings possible | Add UNIQUE constraint |
| No soft deletes | 🟡 MEDIUM | Orphan data when cascading | Implement soft delete pattern |
| Unclear guest order handling | 🟡 MEDIUM | Frontend confusion | Clarify auth requirements |
| Orphan coupon/address references | 🟡 MEDIUM | Incomplete historical data | Use soft deletes or snapshots |

---

**Status:** ✅ Foreign Keys & Relationships Documented - Ready for Complete Integration Guide
