# Autofill Button - Quick Reference & Troubleshooting

## ✅ What Was Fixed

The "Autofill from Images" button on the Product Add page was returning **401 Unauthorized** errors.

### Root Cause
Missing authentication headers when calling the Supabase Edge Function.

### Solution
Added required headers to the fetch request in `src/utils/generateProductFromImage.ts`:
- `Authorization: Bearer {supabaseAnonKey}`
- `apikey: {supabaseAnonKey}`
- `x-client-info: gocart-frontend`

## 🚀 How to Test

### Prerequisites
1. Seller must be logged in
2. Seller must have a store selected
3. At least one product image must be uploaded

### Test Steps
```
1. Navigate to: Seller Dashboard → Add Product
2. Upload a product image (click upload box or drag-drop)
3. Click green "Autofill from images" button
4. Wait 5-10 seconds for AI processing
5. Form fields should auto-populate with:
   - Product name (English & Arabic)
   - Product description (English & Arabic)
```

### Expected Results
- ✅ No errors in browser console
- ✅ Green success toast notification
- ✅ Form fields show generated content
- ✅ Both English and Arabic names visible

## 🔍 Troubleshooting

### Issue 1: Still Getting 401 Error

**Check List:**
```
□ Browser DevTools → Console: Look for error messages
□ Browser DevTools → Network → find "generate_product_from_image" request
□ Check request headers:
  - Authorization: Bearer eyJ... ✅ Must be present
  - apikey: eyJ... ✅ Must be present
  - x-client-info: gocart-frontend ✅ Must be present
□ Response status: Should be 200, not 401
```

**If Headers Missing:**
```
1. Hard refresh page: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Close and reopen browser
3. Check if .env file is in project root
4. Restart dev server:
   - Stop: Ctrl+C
   - Start: npm run dev
```

### Issue 2: "Supabase anon key not found" Error

**Causes:**
- `.env` file missing
- `.env` not in project root
- `VITE_SUPABASE_PUBLISHABLE_KEY` not defined
- Dev server not restarted after adding .env

**Fix:**
```
1. Verify .env exists: c:\Users\Administrator\Desktop\gocartlovm-main - v1\.env
2. Check it contains:
   VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
3. Restart dev server:
   Ctrl+C to stop
   npm run dev to start
4. Refresh browser: Ctrl+Shift+R
```

### Issue 3: Image Upload Fails

**Causes:**
- File too large (>10MB)
- Not authenticated
- Storage bucket permissions

**Fix:**
```
1. Try smaller image (<5MB)
2. Verify you're logged in (check top-right profile)
3. Check browser console for specific error
4. Try different image format (JPG, PNG, WebP)
```

### Issue 4: Form Fields Don't Update After Success

**Causes:**
- Stale browser cache
- Form state issue
- Response parsing error

**Debug:**
```
1. Check browser console for errors
2. Look at Network tab response:
   - Should show JSON with "success": true
   - Should contain "generated" field
3. Check if response has structure:
   {
     "success": true,
     "generated": {
       "en": { "name": "...", "description": "..." },
       "ar": { "name": "...", "description": "..." }
     }
   }
```

### Issue 5: OpenAI API Error

**Error Message:** `OpenAI: 401 Unauthorized`

**Causes:**
- OPENAI_API_KEY not set in Supabase
- API key expired
- API key has insufficient permissions

**Fix (Admin):**
```
1. Go to Supabase Dashboard
2. Project Settings → Environment Variables
3. Check OPENAI_API_KEY value
4. If missing/invalid:
   - Get key from OpenAI dashboard: https://platform.openai.com/api-keys
   - Create new key if needed
   - Paste in Supabase env vars
5. Redeploy Edge Function or wait for env var update
```

### Issue 6: Timeout - Request Takes Too Long

**Causes:**
- Large image file
- Slow internet connection
- OpenAI API overloaded

**Fix:**
```
1. Use smaller image file
2. Check internet connection
3. Wait a moment and retry
4. Try different image
```

## 📊 Network Request Details

### Request Format
```
POST https://qlhpzsucftqcakiotgpc.functions.supabase.co/generate_product_from_image

Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  x-client-info: gocart-frontend

Body:
{
  "imageUrl": "https://qlhpzsucftqcakiotgpc.supabase.co/storage/v1/object/...",
  "storeId": "02c7be7e-c444-49fe-b0ad-9930033b0a6a",
  "language": "en"
}
```

### Response Format (Success)
```json
{
  "success": true,
  "generated": {
    "en": {
      "name": "Premium Wireless Headphones",
      "description": "High-quality audio with...",
      "slug": "premium-wireless-headphones"
    },
    "ar": {
      "name": "سماعات رأس لاسلكية متميزة",
      "description": "صوت عالي الجودة مع..."
    }
  },
  "provider": "openai"
}
```

### Response Format (Error)
```json
{
  "success": false,
  "error": "Missing OpenAI API key in environment variables."
}
```

## 🛠️ Dev Tools - How to Inspect

### Chrome DevTools

**Network Tab:**
```
1. Open DevTools: F12
2. Go to Network tab
3. Click Autofill button
4. Find request named "generate_product_from_image"
5. Click it to see:
   - Request Headers (check Authorization, apikey)
   - Request Body (imageUrl, storeId, language)
   - Response (generated data or error)
   - Status (200 success, 401 auth error, 500 server error)
```

**Console Tab:**
```
1. Open DevTools: F12
2. Go to Console tab
3. Any errors will show here
4. Look for:
   - Supabase anon key errors
   - Network fetch errors
   - JSON parse errors
5. Can manually test:
   generateProductFromImage(imageUrl, 'en', storeId)
```

## 📝 Code References

### File Changed
```
src/utils/generateProductFromImage.ts
```

### Key Code Sections

**Environment Variables Loading:**
```typescript
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
```

**Headers Construction:**
```typescript
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${supabaseAnonKey}`,
  "apikey": supabaseAnonKey,
  "x-client-info": "gocart-frontend"
}
```

**Error Handling:**
```typescript
if (!supabaseAnonKey) {
  throw new Error("Supabase anon key not found in environment variables");
}
```

## 🔐 Security Notes

### What's Safe to Expose
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` (anonymous key)
- ✅ `VITE_SUPABASE_PROJECT_ID` (project ID)
- ✅ `VITE_SUPABASE_URL` (public URL)

### What Should NOT Expose
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (backend only!)
- ❌ `OPENAI_API_KEY` (backend only!)
- ❌ Any production passwords/secrets

### Why Using Anon Key is Safe
1. Limited permissions via RLS policies
2. HTTPS encryption
3. Server-side validation on every request
4. Cannot modify data without auth

## 📋 Verification Checklist

Before considering the fix complete:

- [ ] Code updated: `src/utils/generateProductFromImage.ts`
- [ ] Environment variables present in `.env`
- [ ] Dev server restarted after code changes
- [ ] Browser cache cleared (or hard refresh)
- [ ] Test image uploads work
- [ ] Autofill button exists and clickable
- [ ] No 401 errors in console
- [ ] Form fields populate with AI text
- [ ] Success toast appears
- [ ] Works in English language
- [ ] Works in Arabic language

## 🆘 Still Having Issues?

### Before Asking for Help, Collect:

1. **Error Message** (exact text)
2. **Screenshot** of error or console
3. **Network Tab Details:**
   - Request URL
   - Request headers
   - Response status
   - Response body (or first 100 chars)
4. **Browser/OS info:**
   - Browser: Chrome, Firefox, Safari, Edge?
   - OS: Windows, Mac, Linux?
   - Browser version?
5. **Steps to reproduce:**
   - Exact steps you took
   - When did it start?
   - Did it ever work?

### Debug Information to Share

```
Browser: Chrome 131.0.6778.204
OS: Windows 10
URL: localhost:8080/seller/add-product

Error from Console:
[Error text here]

Network Request:
URL: https://qlhpzsucftqcakiotgpc.functions.supabase.co/...
Status: 401
Headers sent:
  - Authorization: Bearer eyJ... (present/missing)
  - apikey: eyJ... (present/missing)
```

## 📚 Related Documentation

- `AUTOFILL_FIX_APPLIED.md` - Technical fix details
- `AUTOFILL_INTEGRATION_FLOW.md` - System architecture
- Backend schema - RLS policies and Edge Functions
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [OpenAI Vision API Docs](https://platform.openai.com/docs/guides/vision)

## ✨ Feature Usage Tips

### Best Practices
1. **Use Clear Images**: Better image = more accurate text
2. **Check Generated Text**: Edit if needed before saving
3. **Both Languages**: Always review Arabic translation
4. **Set Manually**: If autofill fails, type manually

### Image Tips
- Use well-lit product photos
- Avoid cluttered backgrounds
- Show product clearly and centered
- Supported formats: JPG, PNG, WebP
- Max size: 10MB per image

### Performance Tips
- Wait for generation to complete
- Don't click button multiple times
- Clear console to reduce memory usage
- Close unused browser tabs

## 🎯 Next Steps

1. **Immediate**: Hard refresh browser (Ctrl+Shift+R)
2. **Test**: Try uploading image and clicking autofill
3. **Verify**: Check console for errors
4. **Report**: If still failing, share debug info above

---

**Fix Applied:** November 20, 2025  
**Status:** ✅ Complete and Ready for Testing  
**Files Modified:** 1 (`src/utils/generateProductFromImage.ts`)  
**Breaking Changes:** None  
**Rollback Required:** No
