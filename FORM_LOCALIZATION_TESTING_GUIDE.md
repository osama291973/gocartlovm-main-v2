# 🧪 FORM LOCALIZATION TESTING GUIDE

**Status:** Database ✅ Ready | Frontend Code ✅ Ready | Testing ⏳ In Progress

---

## 🚀 Quick Start Testing

### Step 1: Restart Dev Server (1 min)

```bash
# In your terminal, stop the current dev server
# Press Ctrl+C

# Restart it
npm run dev
```

### Step 2: Clear Browser Cache (1 min)

**Chrome/Edge:**
- Press `Ctrl + Shift + Delete`
- Select "All time"
- Check: Cookies, Cache, Site data
- Click "Clear data"

**Firefox:**
- Press `Ctrl + Shift + Delete`
- Select "Everything"
- Click "Clear Now"

### Step 3: Open Form (1 min)

1. Go to your app: `http://localhost:5173`
2. Navigate to Seller Dashboard
3. Click "Add Product"
4. Observe the form labels

---

## 🧪 Test Suite

### Test 1: English Mode ✅

**Objective:** Verify all form labels display in English

**Steps:**
1. Ensure language toggle is set to **English** 🇬🇧
2. Open Add Product page
3. Observe the following labels:

| Expected Label | Should See |
|---|---|
| Section Title | "Product Information" |
| Product Name | "Product Name *" |
| Description | "Description" |
| Price | "Actual Price ($) *" |
| Offer Price | "Offer Price ($)" |
| Category | "Select a category" |
| Stock | "Stock *" |
| Image Section | "Product Image" |
| Button | "Add Product" |

**Pass Criteria:** ✅ All labels display in English

**Result:** ☐ PASS | ☐ FAIL

---

### Test 2: Arabic Mode ✅

**Objective:** Verify all form labels display in Arabic

**Steps:**
1. Click language toggle to **Arabic** 🇸🇦
2. Refresh page or navigate away and back to Add Product
3. Observe the following labels:

| Expected Label | Should See |
|---|---|
| Section Title | "معلومات المنتج" |
| Product Name | "اسم المنتج *" |
| Description | "وصف المنتج" |
| Price | "السعر الفعلي ($) *" |
| Offer Price | "سعر العرض ($)" |
| Category | "اختر فئة" |
| Stock | "المخزون *" |
| Image Section | "صورة المنتج" |
| Button | "إضافة منتج" |

**Pass Criteria:** ✅ All labels display in Arabic, form layout is RTL

**Result:** ☐ PASS | ☐ FAIL

---

### Test 3: Placeholder Text (English) ✅

**Objective:** Verify input placeholders are localized

**Steps:**
1. Set language to **English**
2. Open Add Product form
3. Click on input fields and observe placeholders:

| Field | Expected Placeholder |
|---|---|
| Product Name | "Enter product name" |
| Description | "Enter product description" |
| Price | "0.00" |
| Offer Price | "0.00" |
| Stock | "0" |

**Pass Criteria:** ✅ All placeholders in English

**Result:** ☐ PASS | ☐ FAIL

---

### Test 4: Placeholder Text (Arabic) ✅

**Objective:** Verify input placeholders are localized to Arabic

**Steps:**
1. Set language to **Arabic**
2. Open Add Product form
3. Click on input fields and observe placeholders:

| Field | Expected Placeholder |
|---|---|
| Product Name | "أدخل اسم المنتج" |
| Description | "أدخل وصف المنتج" |
| Price | "0.00" |
| Offer Price | "0.00" |
| Stock | "0" |

**Pass Criteria:** ✅ All placeholders in Arabic

**Result:** ☐ PASS | ☐ FAIL

---

### Test 5: Form Submission (English) ✅

**Objective:** Verify form submission and success message in English

**Steps:**
1. Set language to **English**
2. Open Add Product form
3. Fill in the form:
   - Product Name: "Test Product English"
   - Description: "This is a test product"
   - Price: "99.99"
   - Stock: "10"
   - Category: Select any category
   - Upload 1-4 images (optional)
4. Click "Add Product" button
5. Observe the success toast notification

**Expected Result:** Toast shows "Product added successfully!"

**Pass Criteria:** ✅ Form submits and shows English success message

**Result:** ☐ PASS | ☐ FAIL

---

### Test 6: Form Submission (Arabic) ✅

**Objective:** Verify form submission and success message in Arabic

**Steps:**
1. Set language to **Arabic**
2. Open Add Product form
3. Fill in the form:
   - Product Name: "منتج اختبار عربي"
   - Description: "هذا منتج اختباري"
   - Price: "99.99"
   - Stock: "10"
   - Category: Select any category
   - Upload 1-4 images (optional)
4. Click "إضافة منتج" button
5. Observe the success toast notification

**Expected Result:** Toast shows "تم إضافة المنتج بنجاح!"

**Pass Criteria:** ✅ Form submits and shows Arabic success message

**Result:** ☐ PASS | ☐ FAIL

---

### Test 7: Validation Error (English) ✅

**Objective:** Verify validation errors display in English

**Steps:**
1. Set language to **English**
2. Open Add Product form
3. Leave Product Name empty
4. Click "Add Product" button
5. Observe the error toast

**Expected Result:** Error toast shows "Please enter the product name"

**Pass Criteria:** ✅ Error message displays in English

**Result:** ☐ PASS | ☐ FAIL

---

### Test 8: Validation Error (Arabic) ✅

**Objective:** Verify validation errors display in Arabic

**Steps:**
1. Set language to **Arabic**
2. Open Add Product form
3. Leave Product Name empty
4. Click "إضافة منتج" button
5. Observe the error toast

**Expected Result:** Error toast shows "يرجى إدخال اسم المنتج"

**Pass Criteria:** ✅ Error message displays in Arabic

**Result:** ☐ PASS | ☐ FAIL

---

### Test 9: Language Switching ✅

**Objective:** Verify form labels update when switching languages

**Steps:**
1. Open Add Product form in **English**
2. Observe all labels in English (e.g., "Product Information")
3. Switch language toggle to **Arabic**
4. **Do NOT refresh the page**
5. Observe all labels update to Arabic (e.g., "معلومات المنتج")
6. Switch back to **English**
7. Observe labels update back to English

**Pass Criteria:** ✅ Labels update instantly without page refresh

**Result:** ☐ PASS | ☐ FAIL

---

### Test 10: Database Verification ✅

**Objective:** Verify that created products have translations in database

**Steps:**
1. Create a test product in English: "Test Product 1"
2. Create a test product in Arabic: "منتج اختبار 2"
3. Open Supabase Dashboard
4. Go to SQL Editor
5. Run this query:

```sql
SELECT 
  p.id,
  p.slug,
  p.description,
  pt.language_code,
  pt.name,
  pt.description
FROM products p
LEFT JOIN product_translations pt ON pt.product_id = p.id
WHERE p.created_at > NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC, pt.language_code;
```

**Expected Result:** Each product should have 2 rows (EN and AR translations)

**Pass Criteria:** ✅ Both English and Arabic entries present for each product

**Result:** ☐ PASS | ☐ FAIL

---

## 📊 Test Summary

| Test # | Test Name | Status | Notes |
|---|---|---|---|
| 1 | English Mode Labels | ☐ | |
| 2 | Arabic Mode Labels | ☐ | |
| 3 | English Placeholders | ☐ | |
| 4 | Arabic Placeholders | ☐ | |
| 5 | Form Submission EN | ☐ | |
| 6 | Form Submission AR | ☐ | |
| 7 | Validation Error EN | ☐ | |
| 8 | Validation Error AR | ☐ | |
| 9 | Language Switching | ☐ | |
| 10 | Database Verification | ☐ | |
| **TOTAL** | **10 Tests** | **☐/10** | |

---

## 🐛 Troubleshooting

### Issue: Form still shows English labels in Arabic mode

**Solution:**
1. Check that you restarted the dev server
2. Clear browser cache completely
3. Hard refresh the page: `Ctrl + Shift + R` (not just `Ctrl + R`)
4. Check browser console for any errors: `F12` → Console tab

### Issue: Labels show [key_name] instead of translated text

**Example:** Form shows `[product_info.title]` instead of "Product Information"

**Solution:**
1. Verify the SQL was executed in Supabase
2. Run this query to check if keys exist:
```sql
SELECT COUNT(*) FROM site_texts WHERE key LIKE 'product_%';
```
3. Should return `54`
4. If not, re-run the SQL file

### Issue: Some labels are English but others are Arabic (mixed)

**Solution:**
1. Check that all 54 keys are in the database (query above)
2. Restart dev server
3. Clear all browser cache and cookies
4. Hard refresh the page

### Issue: Form is not RTL in Arabic mode

**Solution:**
1. This should be automatic if form HTML has `dir="rtl"` attribute
2. Check browser DevTools (F12) → Elements
3. Look for form container with `dir="rtl"`
4. If missing, this is a separate styling issue (not translation-related)

---

## 🎯 Expected Outcome

After passing all 10 tests:

✅ Form displays 100% in English when language is English  
✅ Form displays 100% in Arabic when language is Arabic  
✅ Form accepts submissions in both languages  
✅ Success messages appear in correct language  
✅ Error messages appear in correct language  
✅ Database stores product translations correctly  
✅ Language can be switched without page refresh  

---

## 📝 Report Results

Once you complete testing, please provide:

1. **Test Results:** Which tests passed/failed
2. **Any Issues:** If any tests failed, describe what happened
3. **Browser:** Which browser you tested on (Chrome, Firefox, Safari, Edge)
4. **Language:** Screenshots or descriptions of what you see

---

## ✅ Sign-Off

Testing Complete: ☐ YES  
All Tests Passed: ☐ YES  
Ready for Production: ☐ YES  

---

**Next Step:** Complete all 10 tests and report results!
