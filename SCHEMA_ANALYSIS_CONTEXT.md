# Supabase Backend Schema Analysis
**Created:** November 14, 2025  
**Purpose:** Context document for frontend design and functionality discussion

---

## 📋 Schema Overview

### Database Structure Summary
- **Total Tables:** 19 core tables
- **Type System:** Custom user-defined types (UDT) for enums
- **Authentication:** Integrated with Supabase `auth.users`
- **Localization:** Multi-language support via translation tables

---

## 🗄️ Core Tables Breakdown

### 1. **User & Authentication**
```
├── auth.users (Supabase managed)
├── profiles (User profile data)
├── user_roles (Role assignment)
└── addresses (User delivery addresses)
```

**Key Fields:**
- `profiles.id` - FK to auth.users
- `profiles.full_name`, `avatar_url`
- `user_roles.role` - Custom enum (not yet specified)
- `user_roles.status` - `'active'::user_role_status`
- `addresses.is_default` - Boolean for default address selection

---

### 2. **Product Ecosystem**
```
├── products (Base product table)
│   ├── product_translations (Multi-language support)
│   ├── product_images (Gallery images)
│   ├── product_variants (SKU variations)
│   │   ├── product_variant_attributes (Variant-specific values)
│   └── product_attributes (Attribute definitions)
│       ├── product_attribute_translations
│       └── product_attribute_values
│           └── product_attribute_value_translations
└── categories (Product categories)
    └── category_translations (Multi-language categories)
```

**Product Table Key Fields:**
- `store_id` - Links to seller's store
- `category_id` - FK to categories
- `slug` - URL-friendly identifier (UNIQUE)
- `price`, `original_price` - Current and original pricing
- `stock` - Base product stock level
- `image_url`, `gallery_urls` - Media storage
- `rating`, `reviews_count` - Review aggregates
- `is_featured` - Homepage featured flag
- `has_variants` - Indicates variant products
- `base_price` - Variant base price

**Variants Strategy:**
- Each product can have multiple variants (SKU-based)
- Variants have independent pricing and stock
- Attributes linked via `product_variant_attributes`
- Attributes are translatable

---

### 3. **Shopping Cart & Orders**
```
├── cart_items (User shopping cart)
│   ├── user_id (FK auth.users)
│   ├── product_id (FK products)
│   └── quantity
│
├── orders (Order header)
│   ├── user_id (FK auth.users)
│   ├── address_id (FK addresses)
│   ├── coupon_id (FK coupons)
│   ├── status - `'pending'::order_status_enum`
│   ├── payment_status - `'pending'::payment_status_enum`
│   └── Payment aggregates (subtotal, discount, shipping, total)
│
├── order_items (Order line items)
│   ├── order_id (FK orders)
│   ├── product_id (FK products)
│   ├── store_id (Denormalized for store reference)
│   ├── quantity, price, total
│   └── product_name, product_image (Snapshot data)
│
└── coupons (Discount codes)
    ├── discount_type - 'percentage' | 'fixed'
    ├── discount_value
    ├── usage_limit, usage_count
    └── expire_at
```

**Order Status Enums (to be confirmed):**
- `order_status_enum` - Likely: pending, processing, shipped, delivered, cancelled
- `payment_status_enum` - Likely: pending, completed, failed, refunded

---

### 4. **Store Management**
```
├── stores (Seller store profiles)
│   ├── owner_id (FK auth.users)
│   ├── slug (UNIQUE)
│   ├── status - `'inactive'::store_status`
│   ├── rating, total_products (Aggregates)
│   └── Media (logo_url, cover_url)
│
├── store_translations (Multi-language store info)
│   └── name, description per language
│
└── seller_applications (Seller onboarding)
    ├── user_id (FK auth.users)
    ├── store_id (FK stores)
    ├── status - `'pending'::seller_application_status`
    └── Registration data (email, contact, address, username)
```

**Store Status:** 'inactive' mentioned (likely has: active, inactive, suspended, deleted)

---

### 5. **Reviews & Ratings**
```
reviews
├── product_id (FK products)
├── user_id (FK auth.users)
├── rating (1-5 integer CHECK)
└── comment
```

---

### 6. **Content & Localization**
```
site_texts
├── key (Unique identifier)
├── language_code (Language)
├── value (Content)
├── namespace (Grouping - default: 'site')
├── type (default: 'text')
├── context (Additional context)
├── author (FK auth.users)
└── version (For versioning)
```

---

## 🔑 Key Relationships Map

```
auth.users
    ├─→ profiles (1:1)
    ├─→ user_roles (1:many)
    ├─→ addresses (1:many)
    ├─→ cart_items (1:many) → products
    ├─→ orders (1:many)
    ├─→ reviews (1:many)
    ├─→ stores/owner_id (1:many) [Seller]
    └─→ seller_applications (1:many)

products
    ├─→ store_id → stores
    ├─→ category_id → categories
    ├─→ product_translations (1:many)
    ├─→ product_images (1:many)
    ├─→ product_variants (1:many)
    ├─→ product_attributes (many:many via variants)
    ├─→ cart_items (1:many)
    ├─→ reviews (1:many)
    └─→ order_items (1:many)

stores
    ├─→ owner_id → auth.users
    ├─→ products (1:many)
    ├─→ store_translations (1:many)
    └─→ seller_applications (1:many)

orders
    ├─→ user_id → auth.users
    ├─→ address_id → addresses
    ├─→ coupon_id → coupons
    └─→ order_items (1:many)
```

---

## 🌐 Localization System

### Translation Tables Pattern:
1. **product_translations** - Product names/descriptions per language
2. **product_attribute_translations** - Attribute names per language
3. **product_attribute_value_translations** - Attribute values per language
4. **category_translations** - Category names/descriptions per language
5. **store_translations** - Store names/descriptions per language
6. **site_texts** - Global UI strings

**Language Code Field:** Custom UDT (USER-DEFINED type) - likely `language_code enum`

**Additional Translation Fields:**
- `is_machine_translated` (boolean) - Flags auto-translated content
- `translated_at`, `translation_engine`, `translated_from_language` (in product_translations)

---

## 📊 Data Aggregation Fields

These fields appear to be manually maintained or trigger-maintained:

| Table | Field | Purpose |
|-------|-------|---------|
| `products` | `rating`, `reviews_count` | Aggregate review data |
| `stores` | `rating`, `total_products` | Store performance metrics |
| `coupons` | `usage_count` | Track active coupon usage |

---

## ❓ Missing Documentation (To Be Provided)

- [ ] **RLS Policies** - Row-level security rules
- [ ] **Database Functions** - Custom business logic
- [ ] **Triggers** - Automatic data updates (e.g., order status changes)
- [ ] **Storage Buckets** - File upload configuration
- [ ] **Enum Definitions** - Full list of enum values:
  - `order_status_enum`
  - `payment_status_enum`
  - `store_status`
  - `seller_application_status`
  - `user_role_status`
  - `language_code`
- [ ] **Indexes** - Performance optimization details
- [ ] **Authentication** - JWT configuration, role-based access

---

## 🎯 Frontend Functionality Implications

### Critical Features Supported:

1. **Multi-Vendor Marketplace**
   - Multiple sellers via stores table
   - Store profiles and ratings
   - Seller applications/onboarding

2. **Product Management**
   - Variants with SKU support
   - Dynamic attributes and values
   - Rich media (images, gallery)
   - Search-friendly slugs

3. **Shopping Cart & Checkout**
   - Item-based cart
   - Address management
   - Coupon/discount system
   - Order history with status tracking

4. **Internationalization**
   - Multi-language content
   - Machine translation tracking
   - Fallback language support

5. **Social Features**
   - Product reviews (1-5 rating)
   - User ratings
   - User profiles

---

## 🚨 Design Questions to Address

1. **Variant Selection:** How do users select variants? (Dropdown, modal, inline?)
2. **Attribute Filtering:** On product listing, how are attributes displayed?
3. **Image Optimization:** Using `gallery_urls` ARRAY - how many images, lazy loading?
4. **Currency:** No currency field - hardcoded or config-based?
5. **Tax/Shipping:** Shipping calculated how? Tax included in price?
6. **Order Status Flow:** Complete enum list and user-visible statuses?
7. **RLS Rules:** Who can see/edit what data?
8. **Notifications:** Order/payment status change notifications?
9. **Search:** Full-text search on products implemented?
10. **Analytics:** Track conversions, cart abandonment?

---

## 📝 Next Steps

Please provide:
1. **RLS Policies** - Security and access control rules
2. **Database Functions** - Business logic (calculations, validations)
3. **Triggers** - Automatic updates (order status, inventory)
4. **Storage Configuration** - Bucket policies, file paths
5. **Complete Enum Values** - All USER-DEFINED type definitions
6. **API Layer** - Edge functions or REST endpoints

---

**Status:** ✅ Schema Context Documented - Ready for Policy & Function Review
