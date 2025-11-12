# Product & Translation Implementation Guide

## Overview
This document summarizes the backend and frontend setup for product creation with multi-language translations.

## Backend Setup (SQL - COMPLETED ✅)

### 1. RLS Policies
- ✅ Sellers can INSERT their own product translations (ownership checked via stores.owner_id)
- ✅ Sellers can UPDATE/DELETE their own product translations
- ✅ Admins can manage all translations
- Location: Applied via SQL policies on `product_translations` table

### 2. Provenance Columns (Added)
```sql
ALTER TABLE public.product_translations
  ADD COLUMN IF NOT EXISTS translated_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS translation_engine text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS translated_from_language text DEFAULT NULL;
```

Columns track:
- `translated_at`: When translation was last updated
- `translation_engine`: Which engine produced it (e.g., 'edge-translate-test', 'openai-gpt', 'deepl')
- `translated_from_language`: Source language used for machine translation
- `is_machine_translated`: Boolean flag (already exists) indicating if machine-generated

### 3. Secure Upsert RPC (Created)
Function: `public.upsert_product_translations_safe(_translations jsonb, _caller_id uuid)`

**Features:**
- Performs ownership checks (ensures caller owns the product)
- Inserts or updates translations with conflict resolution
- Automatically sets `translated_at` to `now()`
- Returns `{ updated_count int, error_message text | null }`
- Security: SECURITY DEFINER + internal ownership verification

**Test Results:**
```
RPC Call: upsert_product_translations_safe(...)
Result: updated_count=1, error_message=null ✓
Verified: Arabic translation created with all provenance fields
```

---

## Frontend Implementation (TypeScript/React)

### New Hooks Created

#### 1. `useTranslationMutations` (src/hooks/useTranslationMutations.ts)
Simple upsert helper for direct translation updates.

```typescript
import { useTranslationMutations } from '@/hooks/useTranslationMutations';

const { upsertTranslation, upsertTranslations } = useTranslationMutations();

// Single translation
await upsertTranslation({
  product_id: '...',
  language_code: 'en',
  name: 'Product Name',
  description: '...',
  is_machine_translated: false,
});

// Batch translations
await upsertTranslations([
  { product_id: '...', language_code: 'en', name: '...', ... },
  { product_id: '...', language_code: 'ar', name: '...', ... },
]);
```

**Use Case:** Direct translation updates (editing existing translations)

---

#### 2. `useCallTranslateRpc` (src/hooks/useCallTranslateRpc.ts)
Calls the backend RPC `upsert_product_translations_safe`.

```typescript
import { useCallTranslateRpc } from '@/hooks/useCallTranslateRpc';

const { callTranslateRpc } = useCallTranslateRpc();

const result = await callTranslateRpc(
  [
    {
      product_id: '14881a39-...',
      language_code: 'ar',
      name: 'ساعة أبل',
      description: 'وصف المنتج',
      is_machine_translated: true,
      translation_engine: 'edge-translate-test',
      translated_from_language: 'en',
    },
  ],
  callerId // optional, falls back to auth.uid()
);

if (result.success) {
  console.log(`Updated ${result.data.updated_count} translations`);
} else {
  console.error(result.error);
}
```

**Use Case:** Safe upsert with ownership verification (used by Edge Functions and product creation)

---

#### 3. `useCreateProduct` (src/hooks/useCreateProduct.ts)
High-level hook for creating a product + translations in one flow.

```typescript
import { useCreateProduct } from '@/hooks/useCreateProduct';

const { createProduct, isLoading, error } = useCreateProduct();

const result = await createProduct(
  {
    store_id: '...',
    slug: 'my-product',
    price: 99.99,
    stock: 10,
    image_url: 'https://...',
    category_id: '...',
  },
  [
    { language_code: 'en', name: 'Product Name', description: '...' },
    { language_code: 'ar', name: 'اسم المنتج', description: '...' },
  ]
);

if (result.success) {
  console.log('Product created:', result.product_id);
} else {
  console.error('Error:', result.error);
}
```

**Flow:**
1. Insert product row into `products` table
2. Upsert translations via RPC (ownership-checked)
3. Return product_id or error

---

### Test Page

**File:** `src/pages/TestProductCreatePage.tsx`

A minimal demo form to test product creation with translations.

**To use:**
1. Add route to your router: `<Route path="/test-product-create" element={<TestProductCreatePage />} />`
2. Visit `/test-product-create`
3. Fill in a valid **store_id** (your seller UUID)
4. Enter product details and translations
5. Click "Create Product"

**Example store_id:** `a9bc0920-2cbe-4776-bbe9-38abd53443bc` (from earlier tests)

---

## Auto-Translation Flow (Future - Optional)

If you want automatic translations (e.g., seller enters English, system translates to Arabic):

### Recommended Approach: Supabase Edge Function (Async)

1. Seller creates product with English translation
2. Frontend calls Edge Function with `{ product_id, source_lang: 'en', target_langs: ['ar'] }`
3. Edge Function:
   - Loads source text from DB
   - Calls translation API (OpenAI, DeepL, etc.) using secret key
   - Calls `upsert_product_translations_safe` RPC to save translations
   - Returns status
4. Frontend shows "Translating..." badge until complete

**Security:**
- Translation API key stays on server (not exposed to client)
- RPC ensures only products owned by the seller are translated
- Service role or authenticated request pattern for access control

---

## Language Support

Current supported languages (enum in DB):
- `en` (English)
- `ar` (Arabic)

To add more languages:
1. Alter the enum type in PostgreSQL
2. Update frontend language options

---

## Testing Checklist

### Backend ✅
- [x] RLS policies allow sellers to INSERT/UPDATE translations
- [x] Provenance columns exist and are populated
- [x] RPC `upsert_product_translations_safe` creates/updates translations
- [x] RPC respects ownership (skips translations for products not owned by caller)

### Frontend
- [ ] `useTranslationMutations`: Test direct upsert of translation
- [ ] `useCallTranslateRpc`: Test RPC call with valid product_id
- [ ] `useCreateProduct`: Test full product + translations creation
- [ ] Test page (TestProductCreatePage): Manual testing in browser

---

## Next Steps

1. **Wire hooks into existing product pages:**
   - AdminDashboard: Use `useCreateProduct` for admin product creation
   - SellerDashboard: Use `useCreateProduct` for seller product creation
   - ProductDetail/Edit pages: Use `useTranslationMutations` for editing translations

2. **Implement auto-translation (optional):**
   - Create Edge Function for translation API calls
   - Wire frontend to call Edge Function on product create
   - Show translation status in UI

3. **Add UI components:**
   - Language toggle in product forms
   - Translation status badges (manual vs. machine)
   - Suggestion UI for machine-generated translations

4. **Testing & refinement:**
   - End-to-end tests for seller workflows
   - Performance testing for batch operations
   - Error handling and retry logic

---

## Troubleshooting

### "RPC call failed" or 401/403
- Ensure user is authenticated (check JWT in browser DevTools Network tab)
- Verify RLS policies are correctly configured
- Check that the product belongs to the authenticated user's store

### "invalid input value for enum language_code"
- Only `en` and `ar` are valid language codes
- Check the test page form isn't sending unsupported languages

### Product created but translations missing
- Check browser console for RPC error details
- Verify product owner matches authenticated user
- Confirm translations were provided in the call

---

## Files Modified/Created

**Backend (SQL):**
- ✅ RLS policies applied to `product_translations`
- ✅ Provenance columns added via ALTER TABLE
- ✅ RPC function `upsert_product_translations_safe` created

**Frontend (React/TypeScript):**
- ✅ `src/hooks/useTranslationMutations.ts` (created)
- ✅ `src/hooks/useCallTranslateRpc.ts` (created)
- ✅ `src/hooks/useCreateProduct.ts` (created)
- ✅ `src/pages/TestProductCreatePage.tsx` (created)

---

## Support

For questions or issues:
1. Check the test page to verify basic functionality
2. Inspect browser Network tab for RPC responses
3. Check Supabase logs for DB errors
4. Review console errors for frontend issues
