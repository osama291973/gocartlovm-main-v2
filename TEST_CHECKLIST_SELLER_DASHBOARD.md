# Seller Dashboard Product Creation - Quick Test Checklist ✅

## Pre-Test Setup
- [ ] Seller account is logged in
- [ ] Test seller has a store assigned (`store_id` should be set in context)
- [ ] Dev server is running (`npm run dev`)
- [ ] Supabase connection is active

## Test 1: Create New Product with Translations

### Navigate to Form
```
http://localhost:8080/seller/add-product
```
- [ ] Page loads without errors
- [ ] All form sections visible (Product Information, English Translation, Arabic Translation)
- [ ] Submit button shows "Add Product" in normal state

### Fill Product Information
- [ ] Product Name field accepts text
- [ ] Actual Price field accepts numbers
- [ ] Offer Price field accepts numbers
- [ ] Category dropdown shows options
- [ ] Stock field accepts numbers

### Fill English Translation
- [ ] "Product Name (EN)" field is visible and labeled
- [ ] "Description (EN)" textarea is visible
- [ ] Both fields accept English text

### Fill Arabic Translation
- [ ] "Product Name (AR)" field is visible with RTL direction
- [ ] "Description (AR)" textarea is visible with RTL direction
- [ ] Arabic placeholder text displays correctly
- [ ] Both fields accept Arabic text

### Sample Test Data
```
Product Name (slug): blue-headphones-premium
Actual Price: 79.99
Offer Price: 59.99
Category: Electronics
Stock: 100
English Name: Premium Blue Wireless Headphones
English Desc: High-quality audio with noise cancellation
Arabic Name: سماعات لاسلكية زرقاء فاخرة
Arabic Desc: صوت عالي الجودة مع إلغاء الضوضاء
```

### Submit Product
- [ ] Click "Add Product" button
- [ ] Button shows "Adding Product..." while processing
- [ ] Success toast appears: "Product added successfully with translations!"
- [ ] Page redirects to `/seller/manage-product`

### Verify in Database
Navigate to Supabase Dashboard:

**Check `products` table:**
- [ ] New row exists with your store_id
- [ ] `slug` matches "blue-headphones-premium"
- [ ] `price` is 79.99
- [ ] `original_price` is 59.99
- [ ] `stock` is 100

**Check `product_translations` table:**
- [ ] Two new rows exist for the created product
- [ ] Row 1: `language_code: 'en'`, `name: 'Premium Blue Wireless Headphones'`
- [ ] Row 2: `language_code: 'ar'`, `name: 'سماعات لاسلكية زرقاء فاخرة'`
- [ ] Both rows have the same `product_id`
- [ ] Descriptions are correctly stored
- [ ] Timestamps are recent

## Test 2: Edit Existing Product

### Edit Created Product
- [ ] Navigate back to `/seller/add-product?id=<product_id>`
- [ ] Form pre-fills with existing product data
- [ ] English and Arabic names are pre-filled
- [ ] Original translations display correctly

### Update Translations
- [ ] Change English name to: "Updated Premium Headphones"
- [ ] Change Arabic name to: "سماعات محدثة فاخرة"
- [ ] Click "Add Product"
- [ ] Success toast appears: "Product updated successfully!"

### Verify Updates
- [ ] Navigate back to product
- [ ] New translations are displayed
- [ ] Supabase shows updated `product_translations` rows

## Test 3: Validation Tests

### Missing English Translation
- [ ] Leave "Product Name (EN)" empty
- [ ] Fill "Product Name (AR)"
- [ ] Click "Add Product"
- [ ] Error toast: "Please enter translations in both English and Arabic"
- [ ] Product not created

### Missing Arabic Translation
- [ ] Fill "Product Name (EN)"
- [ ] Leave "Product Name (AR)" empty
- [ ] Click "Add Product"
- [ ] Error toast: "Please enter translations in both English and Arabic"
- [ ] Product not created

### No Store Selected
- [ ] If store context is missing
- [ ] Click "Add Product"
- [ ] Error toast: "No store selected"
- [ ] Product not created

## Test 4: Image Upload Integration

### Upload Images
- [ ] Click on any of 4 image slots
- [ ] Select a valid image file (JPEG, PNG, WebP)
- [ ] Image uploads to Supabase Storage (product-images bucket)
- [ ] Uploaded image displays in the preview slot
- [ ] Upload indicator shows progress

### Create with Images
- [ ] Fill product info + translations
- [ ] Add 1-4 images
- [ ] Click "Add Product"
- [ ] Product created with gallery_urls populated
- [ ] Images accessible via public URL

## Test 5: Form State Reset

### After Successful Create
- [ ] Form fields all cleared after redirect back to form
- [ ] "slug" field empty
- [ ] "price" field empty
- [ ] "enName" field empty
- [ ] "arName" field empty
- [ ] Image slots cleared

### Ready for Next Entry
- [ ] Can immediately create another product without page reload
- [ ] No residual data from previous product

## Test 6: Error Scenarios

### Network Error Simulation
- [ ] Disable network temporarily
- [ ] Try to create product
- [ ] Error toast appears with appropriate message
- [ ] Form remains filled (not cleared on error)

### RPC Timeout
- [ ] Submit product with very large translations (>10KB text)
- [ ] If RPC times out, error toast shown
- [ ] Application remains stable

## Expected Results

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Create new product with translations | Product and 2 translation rows created | | ✅/❌ |
| Form pre-fills on edit | Existing data loads correctly | | ✅/❌ |
| Update translations | Existing translations upserted | | ✅/❌ |
| Validation prevents incomplete submission | Error toast + no creation | | ✅/❌ |
| Form resets after successful submission | All fields cleared | | ✅/❌ |
| Images upload to storage | Files accessible at public URLs | | ✅/❌ |
| Arabic text displays with RTL | Proper text direction | | ✅/❌ |

## Debugging Tips

### If form doesn't load:
```javascript
// Check in DevTools console
console.log('Hooks initialized?', typeof createProduct);
console.log('Selected store:', selectedStore);
```

### If submission fails:
```javascript
// Check network tab for RPC call to upsert_product_translations_safe
// Status should be 200
// Response should include updated_count > 0
```

### If translations don't appear:
```sql
-- Run in Supabase SQL editor
SELECT * FROM product_translations 
WHERE product_id = '<your_product_id>'
ORDER BY created_at DESC;
```

### If TypeScript errors appear:
```bash
npm run lint
# Should show no errors
```

## Success Criteria

✅ **PASS** if:
- Product created successfully with CLI confirmation
- Two translation rows exist in database (en + ar)
- Form resets after creation
- Editing updates translations correctly
- Error messages display for missing translations
- Seller can create multiple products sequentially

❌ **FAIL** if:
- Product created but translations missing
- Only one translation language saved
- Form doesn't reset after creation
- Error messages don't appear
- Page requires manual refresh to continue

## Report Template

Use this when reporting results:

```
## Test Run Report

**Date**: [DATE]
**Tester**: [YOUR_NAME]
**Environment**: localhost:8080
**Test Seller ID**: [SELLER_ID]
**Store ID**: [STORE_ID]

### Test Results
- [ ] Create Product: PASS / FAIL
- [ ] Edit Product: PASS / FAIL
- [ ] Validation: PASS / FAIL
- [ ] Images: PASS / FAIL
- [ ] Form Reset: PASS / FAIL

### Issues Found
[List any bugs or unexpected behavior]

### Database Verification
[Screenshots or SQL results confirming data]

### Ready for Production
- [ ] Yes - All tests passed
- [ ] No - Issues found (see above)
```

---

**Status**: Ready for Integration Testing ✅
