# GoCart E-Commerce Application - Complete Inspection Report

**Date**: November 15, 2025  
**Project**: GoCart - Multi-Vendor E-Commerce Platform  
**Repository**: gocartlovm-main-v2  
**Branch**: main

---

## Executive Summary

GoCart is a comprehensive multi-vendor e-commerce platform built with modern web technologies. The application features a React/TypeScript frontend with Supabase backend, supporting multiple languages (English & Arabic), product management, seller dashboards, admin controls, and comprehensive translation systems.

---

## 1. FRONTEND ARCHITECTURE

### 1.1 Project Overview
- **Build Tool**: Vite 5.4.19
- **Framework**: React 18.3.1 with TypeScript
- **Routing**: React Router v6.30.1
- **State Management**: 
  - Server State: React Query v5.83.0 (TanStack Query)
  - App State: React Context
  - Auth State: Custom AuthContext
  - Language/i18n: Custom LanguageContext
- **UI Library**: shadcn/ui with Radix UI components
- **Styling**: Tailwind CSS 3.4.17 with custom configurations
- **Form Handling**: React Hook Form v7.61.1
- **API Integration**: Supabase JS Client v2.76.1

### 1.2 Directory Structure

```
src/
├── pages/                    # Route-based page components
│   ├── Home.tsx
│   ├── Shop.tsx
│   ├── ProductDetail.tsx
│   ├── Stores.tsx
│   ├── Cart.tsx
│   ├── Account.tsx
│   ├── Auth.tsx
│   ├── CreateStore.tsx
│   ├── SellerLayout.tsx
│   ├── SellerDashboardPage.tsx
│   ├── AddProductPage.tsx              # ADD/EDIT products
│   ├── ManageProductPage.tsx           # List products for seller
│   ├── OrdersPage.tsx
│   ├── AdminDashboard.tsx
│   ├── AdminTranslations.tsx
│   ├── AdminSellerApplications.tsx
│   ├── AdminCoupons.tsx
│   ├── AdminStores.tsx
│   ├── NotFound.tsx
│   └── SupabaseDebug.tsx
├── components/               # Reusable UI components
│   ├── ui/                   # shadcn/ui base components
│   ├── layout/               # Layout components
│   ├── account/              # Account related components
│   ├── ProductCard.tsx
│   ├── CategoryCard.tsx
│   ├── StoreCard.tsx
│   ├── VariantSelector.tsx
│   ├── LanguageSwitcher.tsx
│   ├── Newsletter.tsx
│   ├── PromoBanner.tsx
│   └── [other components]
├── contexts/                 # React Context providers
│   ├── AuthContext.tsx       # Authentication & roles
│   └── LanguageContext.tsx   # i18n (en, ar)
├── hooks/                    # Custom React hooks
│   ├── useProducts.ts        # Fetch products with translations
│   ├── useCreateProduct.ts   # Create/edit products
│   ├── useTranslationMutations.ts    # Upsert translations
│   ├── useCallTranslateRpc.ts        # RPC for safe translations
│   ├── useProductVariants.ts
│   ├── useProductVariantMutations.ts
│   ├── useAutoTranslate.ts
│   ├── use-toast.ts
│   └── use-mobile.tsx
├── integrations/             # External service integrations
│   └── supabase/
│       ├── client.ts         # Supabase client initialization
│       └── types.ts          # (alternate location for types)
├── types/                    # TypeScript type definitions
│   └── supabase.ts          # Generated Supabase types
├── lib/                      # Utility functions
│   ├── siteTexts.ts         # Translation fetching
│   └── utils.ts
├── App.tsx                   # Root component with routing
├── main.tsx                  # Entry point
├── App.css
├── index.css
├── vite-env.d.ts
└── [configuration files]

supabase/
├── config.toml              # Project ID: qlhpzsucftqcakiotgpc
└── migrations/              # Database migrations (ordered by timestamp)
    ├── 20251028014713_*.sql # Initial schema
    ├── 20251031211725_*.sql # User roles & profiles
    ├── 20251031212012_*.sql # Store structure
    ├── 20251104000000_*.sql # Product variants
    ├── 20251105000000_*.sql # Seller applications
    ├── 20251106000000_*.sql # Storage buckets
    ├── 20251110000000_*.sql # Hero/newsletter translations
    ├── 20251111000000_*.sql # Store status enums
    ├── 20251113000001_*.sql # Product descriptions
    └── 20251115000000_*.sql # Username fields, storage policies

public/
├── [static assets]

package.json
```

### 1.3 Application Routes

#### Main Routes (MainLayout)
- `/` → **Home** - Landing page
- `/shop` → **Shop** - Product catalog
- `/product/:slug` → **ProductDetail** - Single product view
- `/stores` → **Stores** - Vendor listing
- `/cart` → **Cart** - Shopping cart
- `/account` → **Account** - User profile management
- `/auth` → **Auth** - Authentication page
- `/create-store` → **CreateStore** - Seller onboarding

#### Seller Routes (SellerLayout at `/seller`)
- `/seller/dashboard` → **SellerDashboardPage** - Dashboard overview
- `/seller/add-product` → **AddProductPage** - Create/Edit product
- `/seller/manage-product` → **ManageProductPage** - List & manage products
- `/seller/orders` → **OrdersPage** - Order management
- `/seller/` → (redirects to dashboard)

#### Admin Routes
- `/admin` → **AdminDashboard** - Admin overview
- `/admin/translations` → **AdminTranslations** - Manage site translations
- `/admin/seller-applications` → **AdminSellerApplications** - Seller applications
- `/admin/stores` → **AdminStores** - Store management
- `/admin/coupons` → **AdminCoupons** - Coupon management

#### Debug Routes
- `/supabase-debug` → **SupabaseDebug** - Debug utilities

### 1.4 Context Providers

#### AuthContext (`src/contexts/AuthContext.tsx`)
**Purpose**: Manages user authentication and roles

**Features**:
- User session management
- Role-based access control (user, seller, admin)
- Sign in / Sign up / Sign out
- Google OAuth support
- Automatic role fetching from `user_roles` table

**Key Methods**:
- `signIn(email, password)` - Email/password login
- `signUp(email, password, fullName)` - Registration
- `signInWithGoogle()` - OAuth login
- `signOut()` - Logout
- `hasRole(role)` - Check user role

**Exported Context Value**:
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  loading: boolean;
  signIn: (email, password) => Promise<{ error }>;
  signUp: (email, password, fullName) => Promise<{ error }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

type UserRole = 'user' | 'seller' | 'admin';
```

#### LanguageContext (`src/contexts/LanguageContext.tsx`)
**Purpose**: Manages application language and translations

**Supported Languages**:
- `en` - English
- `ar` - Arabic (RTL)

**Features**:
- Language switching with RTL support
- Translation key lookup with fallbacks
- Dynamically fetch translations from database
- Local overrides for site texts

**Key Methods**:
- `setLanguage(lang)` - Switch language
- `t(key)` - Get translation value

### 1.5 Custom Hooks

#### `useProducts(options?)`
**Location**: `src/hooks/useProducts.ts`

**Purpose**: Fetch products with translations using React Query

**Usage**:
```typescript
const { data: products, isLoading } = useProducts({ 
  limit: 8, 
  featured: true 
});
```

**Query Key**: `['products', options?.limit, options?.featured]`

**Features**:
- Automatic query caching
- Includes product translations (via nested select)
- Supports pagination with `limit`
- Filter by featured status
- Built-in error handling

#### `useCreateProduct()`
**Location**: `src/hooks/useCreateProduct.ts`

**Purpose**: Create new products with multi-language translations

**Usage**:
```typescript
const { createProduct, isLoading, error } = useCreateProduct();

const result = await createProduct(
  {
    store_id: '...',
    category_id: '...',
    slug: 'product-slug',
    price: 99.99,
    original_price: 149.99,
    stock: 10,
    image_url: 'https://...',
    gallery_urls: ['...'],
    description: 'Product description', // product-level description
  },
  [
    { language_code: 'en', name: 'Product Name', description: '...' },
    { language_code: 'ar', name: 'اسم المنتج', description: '...' },
  ]
);
```

**Process**:
1. Insert product row
2. Upsert translations via RPC (`upsert_product_translations_safe`)
3. Handle ownership validation via RPC

#### `useTranslationMutations()`
**Location**: `src/hooks/useTranslationMutations.ts`

**Purpose**: Directly upsert product translations to `product_translations` table

**Methods**:
- `upsertTranslation(translation)` - Upsert single translation
- `upsertTranslations(translations)` - Upsert multiple translations

#### `useCallTranslateRpc()`
**Location**: `src/hooks/useCallTranslateRpc.ts`

**Purpose**: Call `upsert_product_translations_safe` RPC with ownership checks

**RPC Flow**:
1. Validates user owns the store/product
2. Upserts translations with `onConflict: 'product_id,language_code'`
3. Returns `{ updated_count, error_message }`
4. Wraps response in `{ success, error, data, status }`

**Endpoint**: `{SUPABASE_URL}/rest/v1/rpc/upsert_product_translations_safe`

**Headers Required**:
- `Authorization: Bearer {access_token}`
- `apikey: {VITE_SUPABASE_PUBLISHABLE_KEY}`
- `Content-Type: application/json`

---

## 2. BACKEND SCHEMA & DATABASE ARCHITECTURE

### 2.1 Database Overview
- **Provider**: Supabase (PostgreSQL)
- **Project ID**: qlhpzsucftqcakiotgpc
- **URL**: https://qlhpzsucftqcakiotgpc.supabase.co
- **Region**: Auto-selected
- **Row Level Security (RLS)**: Enabled on all tables

### 2.2 Core Tables

#### **profiles** (User Profiles)
```
id (UUID, PK, FK auth.users.id)
email (TEXT)
full_name (TEXT)
avatar_url (TEXT, nullable)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)

RLS: ✅ Enabled
- Public read
- User can update own profile
- User can insert own profile
```

#### **user_roles** (Role Assignment)
```
id (UUID, PK)
user_id (UUID, FK auth.users.id, NOT NULL)
role (app_role ENUM: 'user' | 'seller' | 'admin', NOT NULL)
created_at (TIMESTAMPTZ)

Constraint: UNIQUE(user_id, role)

RLS: ✅ Enabled
- User can view own roles
- Admin can manage all roles
```

#### **categories** (Product Categories)
```
id (UUID, PK)
slug (TEXT, UNIQUE, NOT NULL)
icon (TEXT, nullable)
image_url (TEXT, nullable)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)

RLS: ✅ Enabled
```

#### **category_translations** (Category Localization)
```
id (UUID, PK)
category_id (UUID, FK categories.id, NOT NULL)
language_code (language_code ENUM: 'en' | 'ar', NOT NULL)
name (TEXT, NOT NULL)
description (TEXT, nullable)

Constraint: UNIQUE(category_id, language_code)
```

#### **stores** (Vendor Stores)
```
id (UUID, PK)
slug (TEXT, UNIQUE, NOT NULL)
logo_url (TEXT, nullable)
cover_url (TEXT, nullable)
owner_id (UUID, FK auth.users.id, nullable) [Added in migrations]
user_id (UUID, FK auth.users.id, nullable) [Alternate field]
status (TEXT, nullable) [seller_applications status]
rating (DECIMAL(3,2), default 0)
total_products (INTEGER, default 0)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)

RLS: ✅ Enabled
- Seller can insert own stores
- Seller can update own stores
- Seller can delete own stores
```

#### **store_translations** (Store Localization)
```
id (UUID, PK)
store_id (UUID, FK stores.id, NOT NULL)
language_code (language_code ENUM, NOT NULL)
name (TEXT, NOT NULL)
description (TEXT, nullable)

Constraint: UNIQUE(store_id, language_code)
```

#### **products** (Core Product Data)
```
id (UUID, PK)
store_id (UUID, FK stores.id, NOT NULL)
category_id (UUID, FK categories.id, nullable)
slug (TEXT, UNIQUE, NOT NULL) ⭐
price (DECIMAL(10,2), NOT NULL)
original_price (DECIMAL(10,2), nullable)
stock (INTEGER, default 0)
image_url (TEXT, nullable)
gallery_urls (TEXT[], nullable)
rating (DECIMAL(3,2), default 0)
reviews_count (INTEGER, default 0)
is_featured (BOOLEAN, default false)
has_variants (BOOLEAN, default false) [Added in v1.4]
base_price (DECIMAL(10,2), nullable) [Added for variant pricing]
description (TEXT, nullable) ⭐ [Added in 20251113000001]
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)

Relationships:
- FK: store_id → stores.id
- FK: category_id → categories.id

RLS: ✅ Enabled
- Seller can insert products for their stores
- Seller can manage products (update/delete)
- Admin can manage all products
- Public can read published products
```

#### **product_translations** (Product Localization) ⭐
```
id (UUID, PK)
product_id (UUID, FK products.id, NOT NULL)
language_code (language_code ENUM, NOT NULL)
name (TEXT, NOT NULL)
description (TEXT, nullable)
is_machine_translated (BOOLEAN, default false) [Optional]
translation_engine (TEXT, nullable) [Optional]
translated_from_language (TEXT, nullable) [Optional]

Constraint: UNIQUE(product_id, language_code)

RLS: ✅ Enabled
- Seller can manage translations for own products
- Admin can manage translations
```

#### **product_variants** (Product Variants)
```
id (UUID, PK)
product_id (UUID, FK products.id, NOT NULL)
sku (TEXT, nullable)
price (DECIMAL(10,2), NOT NULL)
original_price (DECIMAL(10,2), nullable)
stock (INTEGER, default 0)
image_url (TEXT, nullable)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### **product_variant_attributes** (Variant Attributes)
```
id (UUID, PK)
variant_id (UUID, FK product_variants.id, NOT NULL)
attribute_id (UUID, FK product_attributes.id, NOT NULL)
value (TEXT, NOT NULL)
created_at (TIMESTAMPTZ)
```

#### **product_attributes** (Attribute Definitions)
```
id (UUID, PK)
name (TEXT, NOT NULL)
type (TEXT, NOT NULL)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### **product_attribute_translations** (Attribute Localization)
```
id (UUID, PK)
attribute_id (UUID, FK product_attributes.id, NOT NULL)
language_code (language_code ENUM, NOT NULL)
name (TEXT, NOT NULL)
```

#### **reviews** (Product Reviews)
```
id (UUID, PK)
product_id (UUID, FK products.id, NOT NULL)
user_id (UUID, FK auth.users.id, nullable)
rating (INTEGER, 1-5, NOT NULL)
comment (TEXT, nullable)
created_at (TIMESTAMPTZ)
```

#### **addresses** (User Addresses)
```
id (UUID, PK)
user_id (UUID, FK auth.users.id, NOT NULL)
title (TEXT, NOT NULL)
street (TEXT, NOT NULL)
city (TEXT, NOT NULL)
state (TEXT, nullable)
postal_code (TEXT, nullable)
country (TEXT, NOT NULL)
is_default (BOOLEAN, default false)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### **cart_items** (Shopping Cart)
```
id (UUID, PK)
user_id (UUID, FK auth.users.id, NOT NULL)
product_id (UUID, FK products.id, NOT NULL)
quantity (INTEGER, default 1)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### **orders** (Orders)
```
id (UUID, PK)
user_id (UUID, FK auth.users.id, nullable)
address_id (UUID, FK addresses.id, nullable)
coupon_id (UUID, FK coupons.id, nullable)
status (TEXT: pending|confirmed|processing|shipped|delivered|cancelled, default pending)
subtotal (DECIMAL(10,2), NOT NULL)
discount (DECIMAL(10,2), default 0)
shipping (DECIMAL(10,2), default 0)
total (DECIMAL(10,2), NOT NULL)
payment_method (TEXT, nullable)
payment_status (TEXT: pending|paid|failed|refunded, default pending)
notes (TEXT, nullable)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### **order_items** (Order Line Items)
```
id (UUID, PK)
order_id (UUID, FK orders.id, NOT NULL)
product_id (UUID, FK products.id, nullable)
store_id (UUID, FK stores.id, nullable)
quantity (INTEGER, NOT NULL)
price (DECIMAL(10,2), NOT NULL)
total (DECIMAL(10,2), NOT NULL)
product_name (TEXT, NOT NULL)
product_image (TEXT, nullable)
```

#### **coupons** (Discount Coupons)
```
id (UUID, PK)
code (TEXT, UNIQUE, NOT NULL)
discount_type (TEXT: percentage|fixed, NOT NULL)
discount_value (DECIMAL(10,2), NOT NULL)
min_purchase (DECIMAL(10,2), nullable)
max_discount (DECIMAL(10,2), nullable)
expire_at (TIMESTAMPTZ, NOT NULL)
is_active (BOOLEAN, default true)
usage_limit (INTEGER, nullable)
usage_count (INTEGER, default 0)
created_at (TIMESTAMPTZ)
```

#### **seller_applications** (Seller Onboarding)
```
id (UUID, PK)
user_id (UUID, FK auth.users.id, NOT NULL)
store_name (TEXT, NOT NULL)
store_slug (TEXT, nullable)
description (TEXT, nullable)
logo_url (TEXT, nullable)
status (TEXT: pending|approved|rejected, default pending)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
contact_email (TEXT, nullable) [Added in 20251115000000]
contact_phone (TEXT, nullable) [Added in 20251115000000]
username (TEXT, nullable) [Added in 20251115000002]
```

#### **site_texts** (Translation Management)
```
id (UUID, PK)
key (TEXT, NOT NULL)
language_code (language_code ENUM, NOT NULL)
value (TEXT, NOT NULL)
namespace (TEXT, nullable)
type (TEXT, nullable)
context (TEXT, nullable)
author (TEXT, nullable)
version (INTEGER, nullable)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

### 2.3 Database Enums

```sql
-- app_role
'user' | 'seller' | 'admin'

-- language_code
'en' | 'ar'

-- order_status
'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

-- payment_status
'pending' | 'paid' | 'failed' | 'refunded'

-- coupon_discount_type
'percentage' | 'fixed'

-- seller_application_status
'pending' | 'approved' | 'rejected'
```

### 2.4 Key Constraints & Triggers

#### Unique Constraints
- `products(slug)` - Ensure slug uniqueness
- `product_translations(product_id, language_code)` - One translation per language per product
- `categories(slug)` - Category slug uniqueness
- `stores(slug)` - Store slug uniqueness
- `user_roles(user_id, role)` - User cannot have duplicate roles
- `coupons(code)` - Coupon code uniqueness

#### Foreign Key Relationships
- `products.store_id` → `stores.id` (ON DELETE CASCADE)
- `products.category_id` → `categories.id` (ON DELETE SET NULL)
- `product_translations.product_id` → `products.id` (ON DELETE CASCADE)
- `reviews.product_id` → `products.id` (ON DELETE CASCADE)
- `cart_items.product_id` → `products.id` (ON DELETE CASCADE)
- `order_items.product_id` → `products.id` (ON DELETE SET NULL)
- `user_roles.user_id` → `auth.users.id` (ON DELETE CASCADE)

#### Triggers
1. **on_auth_user_created**
   - Creates profile row when user signs up
   - Assigns default 'user' role
   - Copies `full_name` from auth metadata

---

## 3. ROW LEVEL SECURITY (RLS) POLICIES

### 3.1 Products RLS Policies

**Policy: "Sellers can insert products for their stores"**
```sql
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = (SELECT owner_id FROM stores WHERE id = new.store_id)
    OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
)
```

**Policy: "Sellers can manage their products"**
```sql
FOR ALL (SELECT/UPDATE/DELETE)
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = (SELECT owner_id FROM stores WHERE id = products.store_id)
    OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
)
```

**Policy: "Public can view products"** (if exists)
```sql
FOR SELECT
TO anon, authenticated
USING (true)
```

### 3.2 Product Translations RLS Policies
- Sellers can manage translations for their products
- Admin can manage all translations
- Public can view translations

### 3.3 Stores RLS Policies
- Seller can insert own stores
- Seller can update own stores
- Seller can delete own stores
- Public can view stores

### 3.4 User Roles RLS Policies
- User can view own roles
- Admin can manage all roles

---

## 4. DATABASE FUNCTIONS & RPCS

### 4.1 Helper Functions

#### `public.has_role(_user_id UUID, _role app_role) → BOOLEAN`
**Purpose**: Check if user has specific role (Security Definer)

**Usage**:
```sql
SELECT public.has_role(auth.uid(), 'seller');
```

#### `public.get_user_roles(_user_id UUID) → SETOF app_role`
**Purpose**: Get all roles for a user (Security Definer)

#### `public.handle_new_user() → TRIGGER`
**Purpose**: Trigger function for new user creation
- Creates profile
- Assigns 'user' role

### 4.2 RPC Functions

#### `upsert_product_translations_safe`
**Location**: Database function (likely in migrations)

**Purpose**: Safely upsert product translations with ownership validation

**Request Body**:
```json
{
  "_translations": [
    {
      "product_id": "uuid",
      "language_code": "en|ar",
      "name": "Product Name",
      "description": "...",
      "is_machine_translated": false,
      "translation_engine": null,
      "translated_from_language": null
    }
  ],
  "_caller_id": "uuid|null"
}
```

**Response**:
```json
[
  {
    "updated_count": 2,
    "error_message": null
  }
]
```

**Security**: Validates user owns the product before upserting

---

## 5. STORAGE BUCKETS

### 5.1 Storage Configuration

#### **product-images** Bucket
```
ID: product-images
Public: true
Avif Autodetection: false
File Size Limit: 52MB (52428800 bytes)
Allowed MIME Types:
  - image/jpeg
  - image/png
  - image/webp
  - image/gif
```

**Path Structure**: `{user_id}/{filename}`

**Policies**:
1. **Public read** - Anyone can view/download
   ```sql
   FOR SELECT
   USING (bucket_id = 'product-images')
   ```

2. **Authenticated can upload**
   ```sql
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'product-images')
   ```

3. **Users can update own images**
   ```sql
   FOR UPDATE
   TO authenticated
   USING (bucket_id = 'product-images' AND owner_id = auth.uid())
   WITH CHECK (bucket_id = 'product-images' AND owner_id = auth.uid())
   ```

4. **Users can delete own images**
   ```sql
   FOR DELETE
   TO authenticated
   USING (bucket_id = 'product-images' AND owner_id = auth.uid())
   ```

#### **avatars** Bucket
- User avatar storage
- Similar RLS policies

#### **store-logos** Bucket
- Store logo storage
- Public read access

---

## 6. ENVIRONMENT CONFIGURATION

### 6.1 Required Environment Variables

```properties
# Supabase Configuration (Vite prefix required)
VITE_SUPABASE_URL="https://qlhpzsucftqcakiotgpc.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_PROJECT_ID="qlhpzsucftqcakiotgpc"

# Backend Service Role (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 6.2 Supabase Client Initialization
**File**: `src/integrations/supabase/client.ts`

```typescript
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

---

## 7. KEY FEATURES & WORKFLOWS

### 7.1 Product Management Workflow

#### Creating a Product
1. **UI**: Seller navigates to `/seller/add-product`
2. **Form**: Fills in product details (name, price, stock, images, translations)
3. **API**: Call `useCreateProduct()`
4. **Process**:
   - Insert product row (with slug, price, stock, images)
   - Insert/upsert product translations (en, ar)
   - Handle image uploads to `product-images` bucket
5. **Result**: Product saved with translations

#### Editing a Product ⭐ **CURRENT ISSUE**
1. **UI**: Seller clicks Edit in ManageProductPage
2. **Route**: Navigates to `/seller/add-product?id={productId}`
3. **Fetch**: AddProductPage queries product by ID
4. **Issue**: Query might not include `description` field or translations
5. **Expected**: Form populates with current values
6. **Actual**: Form shows empty/partial data

#### Displaying Product List
1. **Query**: `useProducts()` with nested `product_translations(*)`
2. **Select**: `SELECT *, product_translations(*)`
3. **Join**: Product data with translations
4. **Display**: Show in ManageProductPage

### 7.2 Localization System

#### Translation Flow
1. **Source**: `site_texts` table or `product_translations`
2. **Fetch**: Via `fetchSiteTexts()` or RPC calls
3. **Cache**: Stored in LanguageContext
4. **Display**: Via `t(key)` function
5. **Support**: English & Arabic with RTL support

#### Product Translation Storage
- **Table**: `product_translations`
- **Fields**: product_id, language_code, name, description
- **Unique**: (product_id, language_code)
- **Access**: Via product.product_translations() nested query

### 7.3 Seller Dashboard Features
- **Dashboard**: Overview of store metrics
- **Add Product**: Create new product with translations
- **Manage Products**: List, edit, delete products
- **Orders**: View and manage orders
- **Analytics**: Sales data and trends

### 7.4 Admin Features
- **Seller Applications**: Review and approve/reject seller signups
- **Translations**: Manage global site translations
- **Stores**: View and manage all stores
- **Coupons**: Create and manage discount codes

---

## 8. DATA FLOW DIAGRAMS

### 8.1 Product Creation Flow
```
AddProductPage
    ↓
Form Input (name, price, stock, images, translations)
    ↓
useCreateProduct()
    ├─→ Upload images to `product-images` bucket
    ├─→ Insert into products table
    └─→ Upsert product_translations (via RPC)
    ↓
Supabase Backend
    ├─→ INSERT products row
    ├─→ INSERT/UPDATE product_translations
    ├─→ RLS check: Validate store ownership
    └─→ RLS check: Validate seller role
    ↓
Return: { success, product_id, error }
    ↓
AddProductPage
    └─→ Navigate to ManageProductPage
```

### 8.2 Product Edit Flow
```
ManageProductPage
    ├─→ Query: SELECT * FROM products WHERE id = ?
    └─→ Load: slug, price, stock, images, ...
    ↓
AddProductPage (with ?id=productId)
    ├─→ Fetch product details
    ├─→ Populate form fields
    ├─→ Query translations
    └─→ Load images from gallery
    ↓
Form Submit
    ├─→ useCreateProduct()
    ├─→ UPDATE products table
    ├─→ UPSERT product_translations
    └─→ Handle image uploads
    ↓
Return to ManageProductPage
```

### 8.3 Product Display Flow
```
Shop / Home Page
    ↓
useProducts()
    ├─→ Query: SELECT *, product_translations(*)
    ├─→ Join: products ← product_translations
    └─→ Filter: By language, featured, limit
    ↓
Cache in React Query
    ↓
ProductCard Component
    ├─→ Display: name, price, image
    ├─→ Show: translation.name (current language)
    └─→ Render: gallery images
```

---

## 9. MIGRATIONS HISTORY

### Schema Evolution Timeline

| Date | Migration | Purpose |
|------|-----------|---------|
| 2025-10-28 | Initial Schema | Categories, stores, products, translations |
| 2025-10-31 | User Roles | Authentication, profiles, role management |
| 2025-11-04 | Product Variants | Variant support, attributes |
| 2025-11-05 | Seller System | Seller applications, approval workflow |
| 2025-11-06 | Storage Buckets | Avatar storage, RLS policies |
| 2025-11-10 | Hero/Newsletter | Translation system enhancements |
| 2025-11-11 | Store Status | Status enums for stores |
| 2025-11-13 | Product Description | Add description column to products table |
| 2025-11-15 | Seller Fields | Username, contact info for seller applications |
| 2025-11-15 | Product Images Storage | Storage bucket creation with RLS |

---

## 10. CRITICAL ISSUE IDENTIFIED

### Issue: Product Edit Not Loading Stored Data ⭐

**Symptoms**:
- Seller clicks "Edit" on product
- Form fields remain empty or show partial data
- Product slug and description not populated

**Root Causes** (Potential):

1. **Missing Fields in Query**
   - `AddProductPage` fetches product but might not include `description`
   - `description` column was added in migration `20251113000001`
   - Old products might not have this field

2. **Missing Translations Query**
   - Edit form needs to fetch `product_translations` separately
   - Currently only fetches basic product fields
   - Translations should populate name/description for each language

3. **Incomplete Select Statement**
   ```typescript
   // CURRENT (Incomplete)
   const { data } = await supabase
     .from('products')
     .select('*')
     .eq('id', id)
     .single();

   // SHOULD BE
   const { data } = await supabase
     .from('products')
     .select('*, product_translations(*)')  // Include translations
     .eq('id', id)
     .single();
   ```

**Location**: `src/pages/AddProductPage.tsx` lines ~120-140

**Fix Required**: 
- Update fetch query to include `product_translations(*)`
- Map translation data to form fields (enName, arName, etc.)
- Populate description field from `products.description` or translations

---

## 11. DEPENDENCIES & TECH STACK

### Core Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "react-hook-form": "^7.61.1",
  "@tanstack/react-query": "^5.83.0",
  "@supabase/supabase-js": "^2.76.1",
  "zod": "^3.25.76",
  "tailwindcss": "^3.4.17",
  "lucide-react": "^0.462.0"
}
```

### UI Component Library
- **shadcn/ui** - React component library
- **Radix UI** - Primitive components
- **Tailwind CSS** - Utility-first styling

### Development Tools
```json
{
  "vite": "^5.4.19",
  "typescript": "^5.8.3",
  "eslint": "^9.32.0",
  "tsx": "^4.20.6"
}
```

---

## 12. SECURITY CONSIDERATIONS

### Authentication
- ✅ Supabase Auth with email/password
- ✅ Google OAuth integration
- ✅ Session persistence
- ✅ Token refresh on app startup

### Authorization (RLS)
- ✅ Row-level security on all data tables
- ✅ Store ownership validation
- ✅ Role-based access control
- ✅ Seller can only edit own products
- ✅ Admin can manage any product

### Data Protection
- ✅ Unique slug constraint (prevents duplicate products)
- ✅ Foreign key constraints
- ✅ Image storage with owner-based access
- ✅ Payment status tracking

### Potential Vulnerabilities
- ⚠️ RPC endpoint accessibility (check API key exposure)
- ⚠️ Storage bucket public access (verify CORS)
- ⚠️ Query parameter injection in ProductDetail slug lookup
- ⚠️ Ensure admin functions properly validate admin role

---

## 13. PERFORMANCE CONSIDERATIONS

### Query Optimization
- ✅ React Query caching for product lists
- ✅ Pagination support with `limit` parameter
- ✅ Selective field queries (avoid SELECT *)
- ⚠️ N+1 queries possible with nested translations

### Database Indexes
- ✅ Primary key indexes (auto)
- ✅ UNIQUE constraints (creates indexes)
- ⚠️ Consider indexes on:
  - `products.store_id`
  - `products.category_id`
  - `product_translations.product_id`
  - `cart_items.user_id`
  - `reviews.product_id`

### Image Optimization
- ✅ Supabase storage with public CDN
- ⚠️ No image resizing/optimization mentioned
- ⚠️ Consider: WebP conversion, lazy loading

---

## 14. TESTING RECOMMENDATIONS

### Unit Tests
- [ ] useProducts hook
- [ ] useCreateProduct hook
- [ ] useTranslationMutations hook
- [ ] AuthContext providers
- [ ] LanguageContext functionality

### Integration Tests
- [ ] Product creation flow
- [ ] Product edit flow
- [ ] Translation upsert flow
- [ ] Seller dashboard workflows
- [ ] RLS policy enforcement

### E2E Tests
- [ ] Seller signup → store creation → product creation
- [ ] Product edit → save → verify data
- [ ] Multi-language product display
- [ ] Admin approvals workflow

---

## 15. DEPLOYMENT NOTES

### Required Steps
1. ✅ Configure `.env` with Supabase keys
2. ✅ Run migrations: `npm run migrate`
3. ✅ Deploy frontend: `npm run build`
4. ✅ Verify storage buckets created
5. ✅ Test RLS policies

### Build Configuration
- **Vite Config**: `vite.config.ts`
- **Build Output**: Optimized bundle
- **Environment**: Separate dev/prod configs possible

### Monitoring
- Monitor Supabase logs for auth errors
- Track RLS policy violations
- Monitor storage usage
- Alert on failed transactions

---

## 16. CONTACT & SUPPORT ENDPOINTS

### API Base URL
```
https://qlhpzsucftqcakiotgpc.supabase.co
```

### REST Endpoints
- `POST /rest/v1/rpc/upsert_product_translations_safe`
- `POST /auth/v1/signup`
- `POST /auth/v1/token`

### Storage Endpoints
- `GET /storage/v1/object/public/product-images/{path}`
- `POST /storage/v1/object/product-images/{path}`

---

## APPENDIX: FILE LOCATIONS REFERENCE

### Frontend Key Files
| File | Purpose |
|------|---------|
| `src/pages/ManageProductPage.tsx` | Product list for seller |
| `src/pages/AddProductPage.tsx` | Create/edit product form |
| `src/hooks/useCreateProduct.ts` | Product CRUD hook |
| `src/hooks/useProducts.ts` | Fetch products hook |
| `src/integrations/supabase/client.ts` | Supabase initialization |
| `src/contexts/AuthContext.tsx` | Auth & roles |
| `src/contexts/LanguageContext.tsx` | i18n management |

### Backend Migration Files
| File | Date | Purpose |
|------|------|---------|
| `20251028014713_*.sql` | 10/28 | Initial schema |
| `20251031211725_*.sql` | 10/31 | User auth |
| `20251113000001_*.sql` | 11/13 | Product description |
| `20251115013001_*.sql` | 11/15 | Storage buckets |

---

**End of Report**

Generated: November 15, 2025  
Report Scope: Complete frontend and backend inspection  
Status: ✅ Comprehensive documentation complete
