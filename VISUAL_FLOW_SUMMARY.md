# AddProductPage Integration - Visual Summary

## Form Structure (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│                  SELLER DASHBOARD                           │
│              Add/Edit Product Form                          │
└─────────────────────────────────────────────────────────────┘

┌─ Image Upload Section ────────────────────────────────────┐
│                                                             │
│  [Image 1]  [Image 2]  [Image 3]  [Image 4]               │
│  Upload...  Upload...  Upload...  Upload...               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ Product Information (Existing) ──────────────────────────┐
│                                                             │
│  Product Name *        [blue-headphones              ]     │
│  Description           [............                 ]     │
│  Actual Price ($) *    [79.99                    ]        │
│  Offer Price ($)       [59.99                    ]        │
│  Category *            [Select: Electronics         ]     │
│  Stock *               [100                      ]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ ENGLISH TRANSLATION (NEW) ───────────────────────────────┐
│                                                             │
│  Product Name (EN) *   [Premium Blue Headphones   ]       │
│  Description (EN)      [High-quality wireless...  ]       │
│                        [                          ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ ARABIC TRANSLATION (NEW) ────────────────────────────────┐
│                                                             │
│  Product Name (AR) *   [سماعات زرقاء فاخرة  ⬅ RTL] │
│  Description (AR)      [صوت لاسلكي عالي...   ⬅ RTL] │
│                        [                          ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ Submit ──────────────────────────────────────────────────┐
│                                                             │
│                [+ Add Product]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
Seller Form Submit
        ↓
   ┌────────────────────────────────┐
   │  Validation                    │
   │  - Store ID exists             │
   │  - English name filled         │
   │  - Arabic name filled          │
   │  - Prices valid                │
   └────────────────────────────────┘
        ↓
   IS CREATE?
   /         \
  /           \
YES            NO
  ↓             ↓
┌─────────────────────┐   ┌─────────────────────┐
│ useCreateProduct    │   │ Direct DB Update    │
│                     │   │ + upsertTrans       │
│ 1. Insert product   │   │                     │
│ 2. Insert EN trans  │   │ 1. Update product   │
│ 3. Insert AR trans  │   │ 2. Upsert EN trans  │
│ (ATOMIC)            │   │ 3. Upsert AR trans  │
└─────────────────────┘   └─────────────────────┘
  ↓                         ↓
┌─────────────────────┐   ┌─────────────────────┐
│ Backend RPC         │   │ RLS Policies        │
│ upsert_product...() │   │ Ownership checks    │
│                     │   │                     │
│ - Validates auth    │   │ - Seller can only   │
│ - Checks ownership  │   │   update own items  │
│ - Creates data      │   │                     │
│ - Returns result    │   │                     │
└─────────────────────┘   └─────────────────────┘
  ↓                         ↓
  └────────────┬────────────┘
               ↓
        Success Toast
        "Product added/updated successfully!"
               ↓
        Navigate to
        /seller/manage-product
               ↓
        Form Reset
        (all fields cleared)
```

## State Management

```
┌─ formData State ──────────────────────────────────────────┐
│                                                             │
│  ✅ slug: string              (product identifier)        │
│  ✅ price: string             (actual price)              │
│  ✅ originalPrice: string     (offer/sale price)         │
│  ✅ stock: string             (quantity)                  │
│  ✅ categoryId: string        (product category)          │
│  ✅ enName: string            (English product name)      │
│  ✅ enDescription: string     (English description)       │
│  ✅ arName: string            (Arabic product name)       │
│  ✅ arDescription: string     (Arabic description)        │
│                                                             │
│  Total Fields: 9                                            │
│  Required: 5 (slug, price, stock, categoryId,              │
│              enName, arName)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ Hook States ─────────────────────────────────────────────┐
│                                                             │
│  useCreateProduct()                                         │
│  ├── isLoading: boolean     (creation in progress)        │
│  ├── error: string | null   (error message)               │
│  └── createProduct()        (async function)              │
│                                                             │
│  useTranslationMutations()                                 │
│  └── upsertTranslations()   (async function)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### CREATE NEW PRODUCT

```
POST /rest/v1/rpc/upsert_product_translations_safe
Headers: {
  Authorization: "Bearer <JWT_TOKEN>",
  Content-Type: "application/json"
}
Body: {
  _translations: [
    {
      product_id: "uuid-1",
      language_code: "en",
      name: "Premium Blue Headphones",
      description: "High-quality wireless..."
    },
    {
      product_id: "uuid-1",
      language_code: "ar",
      name: "سماعات زرقاء فاخرة",
      description: "صوت لاسلكي عالي..."
    }
  ],
  _caller_id: "seller-uuid"
}

Response: {
  "updated_count": 2,
  "error_message": null
}
```

### EDIT EXISTING PRODUCT

```
PATCH /rest/v1/products?id=eq.<product_id>
Update product fields (price, stock, etc.)

Then:

POST /rest/v1/product_translations?on_conflict=product_id,language_code
Upsert translations (EN and AR)

Response: Updated rows
```

## Database Operations

### CREATE Flow
```
1. INSERT INTO products
   ├── store_id (seller's store)
   ├── slug (product name)
   ├── price, original_price
   ├── stock
   ├── category_id
   └── gallery_urls (images)
   
2. INSERT INTO product_translations (2 rows)
   ├── Row 1: language_code='en', name, description
   └── Row 2: language_code='ar', name, description
   
   Both rows:
   ├── product_id (same as product)
   ├── created_at (auto)
   ├── updated_at (auto)
   └── RLS: Only seller can insert (via ownership check)
```

### EDIT Flow
```
1. UPDATE products
   ├── WHERE id = ?
   ├── RLS: Only seller can update own products
   
2. UPSERT product_translations
   ├── ON CONFLICT (product_id, language_code) DO UPDATE
   ├── EN and AR translations updated/inserted
   ├── RLS: Only seller can modify
```

## Security Layers

```
Layer 1: AUTHENTICATION
├─ JWT token required
├─ User identity verified
└─ Seller must be logged in

Layer 2: AUTHORIZATION (RLS)
├─ product_translations policy
│  ├─ SELECT: Public (anyone can read)
│  ├─ INSERT: Must be product owner (owner_id check)
│  ├─ UPDATE: Must be product owner
│  └─ DELETE: Must be product owner
│
└─ products policy
   ├─ SELECT: Public
   ├─ INSERT: Must have store ownership
   ├─ UPDATE: Must be store owner
   └─ DELETE: Must be store owner

Layer 3: BACKEND VALIDATION (RPC)
├─ SECURITY DEFINER function
├─ Internal ownership verification
├─ Caller ID validation
└─ Transaction handling
```

## Error Handling

```
┌─ Frontend Validation ─────────────────────────────────┐
│                                                         │
│ IF missing_translations:                              │
│   → Show: "Please enter translations in both..."    │
│   → NO API call                                       │
│                                                         │
│ IF no_store:                                          │
│   → Show: "No store selected"                         │
│   → NO API call                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↓ (if validations pass)
┌─ Backend RPC Response ────────────────────────────────┐
│                                                         │
│ IF error_message is not null:                         │
│   → Show: error_message toast                         │
│   → Form NOT reset (retry)                            │
│                                                         │
│ ELSE (success):                                        │
│   → Show: "Product added successfully!"               │
│   → Reset form                                         │
│   → Navigate to manage-product                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## UI/UX Features

```
✅ RTL Support
   ├─ Arabic fields: dir="rtl"
   ├─ English fields: dir="ltr"
   └─ Form responds to language context

✅ Loading States
   ├─ Submit button disabled while loading
   ├─ Button text: "Adding Product..." during submit
   └─ Upload progress shown per image

✅ Validation Feedback
   ├─ Required fields marked with *
   ├─ Real-time field change tracking
   └─ Error toasts on submit failure

✅ Accessibility
   ├─ Proper label associations
   ├─ Clear field descriptions
   ├─ Error messages context-aware
   └─ Form sections clearly organized
```

## Testing Scenarios

```
SCENARIO 1: Happy Path (Create)
├─ Fill all required fields
├─ Submit
└─ EXPECT: Success toast + redirect + form reset

SCENARIO 2: Missing EN Translation
├─ Fill AR name, leave EN empty
├─ Submit
└─ EXPECT: Error toast + no creation + form retained

SCENARIO 3: Missing AR Translation  
├─ Fill EN name, leave AR empty
├─ Submit
└─ EXPECT: Error toast + no creation + form retained

SCENARIO 4: Edit Product
├─ Load with ?id=<product_id>
├─ Update EN/AR translations
├─ Submit
└─ EXPECT: Success toast + form reset + updated translations

SCENARIO 5: Network Error
├─ Disable network temporarily
├─ Submit
└─ EXPECT: Error toast + form retained for retry
```

---

## Summary: What Happens When Seller Clicks "Add Product"

```
BEFORE: Form filled with:
  Product: blue-headphones, $79.99, 100 stock
  EN: "Premium Blue Headphones" + description
  AR: "سماعات زرقاء فاخرة" + description

VALIDATION: All required fields present ✅

EXECUTION:
  1. useCreateProduct() called
  2. Backend RPC triggered
  3. Product row inserted
  4. EN translation row inserted  
  5. AR translation row inserted
  6. All in single transaction

RESULT:
  - Database: +1 product + 2 translation rows
  - UI: Success toast shown
  - Form: All fields cleared
  - Navigation: Redirected to manage products
  - Ready: Seller can add next product

VERIFICATION (In Supabase):
  products table:
    ✅ 1 new row (slug: blue-headphones)
  
  product_translations table:
    ✅ Row 1 (language_code: 'en')
    ✅ Row 2 (language_code: 'ar')
```

---

**Status**: ✅ Integration Complete - Ready for Testing
