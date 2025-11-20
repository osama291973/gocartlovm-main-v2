# ⚡ HYBRID MODE - QUICK START (5 MINUTES)

## What You Get

✅ **Primary**: OpenAI (premium quality, costs money)  
✅ **Fallback**: HuggingFace (free, unlimited)  
✅ **Smart switching**: Automatically uses HuggingFace when OpenAI quota exceeded  
✅ **Shows which provider**: Response includes `provider` field  

---

## Installation Steps

### Step 1: Copy Hybrid Function (1 minute)

**Option A: Command Line**
```cmd
cd "c:\Users\Administrator\Desktop\gocartlovm-main - v1"
cd supabase\functions\generate_product_from_image
copy index_hybrid.ts index.ts
```

**Option B: Manual**
1. Open `supabase/functions/generate_product_from_image/`
2. Find `index_hybrid.ts`
3. Rename to `index.ts` (replace existing)
4. Or copy content and paste into `index.ts`

### Step 2: Deploy Function (2 minutes)

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Functions** (left sidebar)
4. Click `generate_product_from_image`
5. Click **Deploy**
6. Wait for green checkmark ✅

**Via Terminal:**
```cmd
supabase functions deploy generate_product_from_image
```

### Step 3: Test Function (1 minute)

**In Supabase Dashboard:**
1. Functions → `generate_product_from_image`
2. Click **Test function**
3. Paste test payload:
```json
{
  "imageUrl": "https://via.placeholder.com/300",
  "language": "en",
  "storeId": "test-store"
}
```
4. Click **Send**
5. Check response has `provider` field

### Step 4: Test from Frontend (1 minute)

1. Go to your app's Add Product page
2. Upload a product image
3. Click "Autofill from images"
4. Form should fill with product details
5. Check browser console (F12) for logs

---

## Expected Results

### If Using OpenAI
```json
{
  "success": true,
  "provider": "openai",
  "generated": {
    "en": {
      "name": "Specific Product Name",
      "description": "Detailed description with features...",
      "slug": "specific-product-name"
    },
    "ar": {
      "name": "اسم المنتج المحدد",
      "description": "وصف مفصل..."
    }
  }
}
```

### If Using HuggingFace (Fallback)
```json
{
  "success": true,
  "provider": "huggingface",
  "generated": {
    "en": {
      "name": "Product",
      "description": "a product with certain features",
      "slug": "product"
    },
    "ar": {
      "name": "منتج",
      "description": "منتج مع ميزات معينة"
    }
  }
}
```

---

## How It Works

```
Request comes in
    ↓
Has OPENAI_API_KEY?
    ├─ YES → Try OpenAI
    │   ├─ Success (200) → Return OpenAI results
    │   └─ Fail (429/401/error) → Try HuggingFace
    └─ NO → Try HuggingFace
        ├─ Success (200) → Return HF results
        └─ Fail → Return error

Response always includes:
- provider: which service was used
- generated: the product data
```

---

## Monitoring

### Check Which Provider is Being Used

**In Supabase Function Logs:**
1. Go to Functions → `generate_product_from_image`
2. Click **Logs**
3. Look for messages:
   - `✅ [OpenAI Success]` = Using OpenAI
   - `✅ [HuggingFace Success]` = Using HuggingFace
   - `⚠️ [OpenAI] Quota exceeded` = Switched to HF

### Check Response Provider Field

**In your frontend:**
```javascript
const response = await supabase.functions.invoke(...);
console.log(response.provider); // "openai" or "huggingface"
```

---

## Common Issues & Fixes

### Issue: Function shows error after deploy

**Solution:**
1. Wait 30 seconds for deployment to complete
2. Refresh Supabase Dashboard
3. Try test again
4. Check logs for error message

### Issue: Always using HuggingFace

**Cause:** OpenAI key not configured  
**Solution:**
1. Get API key from https://platform.openai.com/api/keys
2. Add to Supabase Secrets:
   - Go to Settings → Secrets
   - Add new secret: `OPENAI_API_KEY`
   - Paste your key
3. Bind to function:
   - Functions → generate_product_from_image → Settings
   - Toggle `OPENAI_API_KEY` ON
4. Deploy function again

### Issue: Form not filling after autofill

**Check:**
1. Is function deployed? (green checkmark)
2. Is function returning success response? (check logs)
3. Is provider field present? (check response)
4. Browser console (F12) showing errors? (check DevTools)

---

## Cost Breakdown

| Provider | Cost | Quality | Notes |
|----------|------|---------|-------|
| OpenAI | ~$0.01/image | ⭐⭐⭐⭐⭐ | Premium, best quality |
| HuggingFace | FREE | ⭐⭐⭐⭐ | Free fallback, good quality |
| **Hybrid** | **Variable** | **⭐⭐⭐⭐⭐** | **Best of both** |

**Monthly estimate (1000 images):**
- All OpenAI: ~$10
- 50% OpenAI: ~$5
- All HuggingFace: FREE

---

## File Locations

```
Your Project Root:
c:\Users\Administrator\Desktop\gocartlovm-main - v1

Main File (Deploy this):
├─ supabase/functions/generate_product_from_image/
│  └─ index.ts ← REPLACE with index_hybrid.ts content

Backup Files:
├─ supabase/functions/generate_product_from_image/
│  ├─ index_openai.ts (original OpenAI version)
│  ├─ index_hybrid.ts (the new hybrid version)
│  └─ index_huggingface.ts (HuggingFace only)

Frontend Integration:
├─ src/utils/generateProductFromImage.ts
├─ src/pages/AddProductPage.tsx
└─ .env (Supabase configuration)
```

---

## Checklist

- [ ] Copy `index_hybrid.ts` to `index.ts`
- [ ] Deploy function to Supabase
- [ ] Test function with sample image
- [ ] Test from frontend (add product page)
- [ ] Check logs for provider info
- [ ] Monitor costs on OpenAI dashboard
- [ ] (Optional) Configure OpenAI key for better quality

---

## Next Steps

1. **Immediate (now):**
   - Deploy the function following steps above
   - Test it works

2. **Optional - Configure OpenAI (if you haven't):**
   - Get API key: https://platform.openai.com/api/keys
   - Add to Supabase Secrets
   - This improves quality but costs money
   - See `BACKEND_OPENAI_QUICK_CHECKLIST.md` for details

3. **Monitor:**
   - Check Supabase logs periodically
   - Watch for errors
   - Monitor OpenAI costs if using it

4. **Optimize:**
   - If mostly using HuggingFace, consider removing OpenAI key
   - If mostly using OpenAI, no changes needed
   - Adjust based on your needs

---

## Support Resources

- **Hybrid Mode Guide**: `HYBRID_MODE_IMPLEMENTATION_GUIDE.md`
- **Hybrid Mode Diagrams**: `HYBRID_MODE_VISUAL_DIAGRAMS.md`
- **OpenAI Setup**: `BACKEND_OPENAI_QUICK_CHECKLIST.md`
- **Troubleshooting**: `BACKEND_OPENAI_TROUBLESHOOTING.md`

---

**Ready to deploy? Start with "Installation Steps" above!** 🚀
