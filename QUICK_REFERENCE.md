# Quick Reference - Product & Translation API

## 🚀 Quick Start

### Test It Immediately
```
Route: /test-product-create
File: src/pages/TestProductCreatePage.tsx
```

### Use In Your Code

#### Create Product with Translations
```typescript
import { useCreateProduct } from '@/hooks/useCreateProduct';

const { createProduct, isLoading, error } = useCreateProduct();

const result = await createProduct(
  {
    store_id: 'store-uuid',
    slug: 'product-slug',
    price: 99.99,
    stock: 10,
  },
  [
    { language_code: 'en', name: 'Name', description: 'Desc' },
    { language_code: 'ar', name: 'الاسم', description: 'الوصف' },
  ]
);
```

#### Direct Translation Upsert
```typescript
import { useTranslationMutations } from '@/hooks/useTranslationMutations';

const { upsertTranslations } = useTranslationMutations();

await upsertTranslations([
  { product_id: 'id', language_code: 'en', name: '...', description: '...' },
]);
```

#### Call RPC Directly
```typescript
import { useCallTranslateRpc } from '@/hooks/useCallTranslateRpc';

const { callTranslateRpc } = useCallTranslateRpc();

const result = await callTranslateRpc(
  [{ product_id: 'id', language_code: 'ar', name: '...', ... }],
  sellerId // optional
);
```

---

## 📊 Supported Languages
- `en` - English
- `ar` - Arabic

---

## 🔍 Testing Checklist

- [ ] Test page loads: `/test-product-create`
- [ ] Can enter valid store_id
- [ ] Can fill product details
- [ ] Can enter EN and AR translations
- [ ] Click "Create Product" → success message with product_id
- [ ] Check DB: SELECT * FROM product_translations WHERE product_id = '...';
- [ ] Verify provenance fields populated (translated_at, translation_engine, etc.)

---

## ❌ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| 401/403 Error | User not authenticated; check JWT token |
| "Store ID required" | Provide valid seller/store UUID |
| Translation not created | Check if seller owns the product (RLS check) |
| "unknown language code" | Use 'en' or 'ar' only |
| Type errors in IDE | Use `as any` cast for Supabase types |

---

## 📁 Files

**Hooks:**
- `src/hooks/useTranslationMutations.ts`
- `src/hooks/useCallTranslateRpc.ts`
- `src/hooks/useCreateProduct.ts`

**Test:**
- `src/pages/TestProductCreatePage.tsx`

**Docs:**
- `IMPLEMENTATION_GUIDE.md`
- `BACKEND_FRONTEND_COMPLETE.md`

---

## 🛠️ Next: Wire Into Admin/Seller Pages

Replace existing product creation logic with:
```typescript
import { useCreateProduct } from '@/hooks/useCreateProduct';

// In your component
const { createProduct, isLoading, error } = useCreateProduct();

// On form submit
const result = await createProduct(productData, translationsData);
if (result.success) navigate(`/products/${result.product_id}`);
```

---

## 🌐 Auto-Translation (Future)

For automatic translations (seller enters EN, system generates AR):

1. **Edge Function** (Supabase):
   - Receives: `{ product_id, source_lang: 'en', target_langs: ['ar'] }`
   - Calls translation API (OpenAI, DeepL, etc.)
   - Calls `upsert_product_translations_safe` RPC
   - Returns status

2. **Frontend**:
   - Call Edge Function after product creation
   - Show "Translating..." badge
   - Refresh when complete

---

## 📞 Database Schema Reference

### product_translations
```
- id: uuid (PK)
- product_id: uuid (FK → products.id)
- language_code: enum {'en', 'ar'}
- name: text
- description: text (nullable)
- is_machine_translated: boolean
- translated_at: timestamptz (NEW)
- translation_engine: text (NEW)
- translated_from_language: text (NEW)
- created_at: timestamptz
- updated_at: timestamptz
```

### Unique Constraint
```
UNIQUE(product_id, language_code)
```
Prevents duplicate translations per language.

---

## 🎯 Use Cases

### Seller Creates Product
1. Fills product form (admin/seller dashboard)
2. Enters English name + description
3. Enters Arabic name + description
4. Clicks "Save"
5. Frontend calls `useCreateProduct(...)`
6. Product + translations created in DB

### Seller Edits Translation
1. Opens existing product
2. Updates Arabic translation
3. Clicks "Save"
4. Frontend calls `useTranslationMutations.upsertTranslations(...)`
5. Translation updated in DB

### Auto-Translate (Future)
1. Seller creates product with EN translation
2. Frontend detects creation
3. Calls Edge Function: `POST /translateProduct` with product_id
4. Edge Function translates to AR
5. Calls RPC to save: `is_machine_translated=true, translation_engine='openai-gpt'`
6. Frontend shows badge: "Machine-translated (Arabic)"

---

## 💡 Tips

- Always provide `store_id` (seller's store UUID)
- Language codes are case-sensitive: `en`, `ar` (lowercase)
- Translations are optional per language (nullable fields)
- `is_machine_translated` defaults to false (manual)
- RPC silently skips unauthorized products (no error thrown)
- Use test page to debug quickly

---

**Last Updated:** Nov 12, 2025
**Status:** ✅ Complete & Ready
