# ✅ BACKEND OPENAI API - QUICK SETUP CHECKLIST

## ⚡ 5-Minute Quick Setup

### Step 1: Get API Key (2 minutes)
```bash
1. Go to: https://platform.openai.com/api/keys
2. Click: "Create new secret key"
3. Copy the key (sk-proj-...)
4. Keep it somewhere safe temporarily
```

### Step 2: Add to Supabase (2 minutes)
```bash
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings → Secrets
4. Click: "Add new secret"
5. Name: OPENAI_API_KEY
6. Value: Paste your key
7. Click: Create secret
```

### Step 3: Bind Secret to Function (1 minute)
```bash
1. Go to: Functions (left sidebar)
2. Click: generate_product_from_image
3. Click: Settings (gear icon)
4. Find: OPENAI_API_KEY in Secrets
5. Toggle: ON (should be green)
6. Save
```

---

## 🚀 Deploy Function (30 seconds)

**In Supabase Dashboard:**
1. Functions → generate_product_from_image
2. Click: **Deploy** button
3. Wait for green checkmark ✅

---

## 🧪 Quick Test

### Test Payload
```json
{
  "imageUrls": ["https://via.placeholder.com/300"],
  "language": "en",
  "storeId": "test-store"
}
```

### Expected Response
```json
{
  "success": true,
  "generated": {
    "en": {
      "name": "Product Name",
      "description": "Description here",
      "slug": "product-slug"
    },
    "ar": {
      "name": "اسم المنتج",
      "description": "وصف المنتج"
    }
  }
}
```

---

## ❌ Common Issues & Fixes

### Issue: "OPENAI_API_KEY not set"
**Fix:** Bind secret to function
1. Functions → generate_product_from_image → Settings
2. Toggle OPENAI_API_KEY → ON
3. Redeploy function

### Issue: "401 Unauthorized"
**Fix:** Check API key
1. Go to: https://platform.openai.com/api/keys
2. Verify key is not revoked
3. If revoked, create new key and update Supabase secret

### Issue: "429 Too Many Requests"
**Fix:** Wait 30 seconds and retry

### Issue: "Insufficient credits"
**Fix:** Add credits to OpenAI account
1. Go to: https://platform.openai.com/account/billing/overview
2. Add payment method
3. Add credits

### Issue: Autofill doesn't work from frontend
**Fix:** Check these in order
1. Is function deployed? (check green checkmark)
2. Check Supabase function logs: Functions → Logs
3. Check browser console: F12 → Console
4. Try with different product image

---

## 🔍 How to Check If Everything Works

### Check 1: Function Deployed ✅
- Go to: Supabase → Functions
- Look for: generate_product_from_image
- Should show: Green checkmark
- Status: Active or Deployed

### Check 2: Secret Configured ✅
- Go to: Supabase → Settings → Secrets
- Look for: OPENAI_API_KEY
- Should show: Checkmark or indicator

### Check 3: Secret Bound to Function ✅
- Go to: Functions → generate_product_from_image → Settings
- Look for: OPENAI_API_KEY in Secrets list
- Should show: Toggle ON (green)

### Check 4: Function Works ✅
- Go to: Functions → generate_product_from_image
- Click: Test function
- Paste test payload (see above)
- Click: Send
- Should get: Success response with generated data

### Check 5: Frontend Works ✅
- Go to: Add Product page
- Upload product image
- Click: Autofill from images
- Should show: Specific product name (not "Product")
- Should show: Detailed description (not "Quality product")

---

## 🛠️ Tools for Debugging

### 1. Supabase Function Logs
```bash
# View live logs
supabase functions logs generate_product_from_image --tail

# Or in Dashboard:
# Functions → generate_product_from_image → Logs tab
```

### 2. Browser Console
```bash
# Press F12
# Go to Console tab
# Look for red errors
# These give clues about what went wrong
```

### 3. Check OpenAI Account
```bash
# Usage: https://platform.openai.com/account/usage/overview
# API Keys: https://platform.openai.com/api/keys
# Billing: https://platform.openai.com/account/billing/overview
```

---

## 💡 Key Files to Know

| File | Location | Purpose |
|------|----------|---------|
| Edge Function | `functions/generate_product_from_image/index.ts` | Calls OpenAI API |
| Frontend Hook | `src/utils/generateProductFromImage.ts` | Calls Edge Function |
| Add Product Page | `src/pages/AddProductPage.tsx` | UI for autofill button |
| .env | `.env` | Supabase config (NOT OpenAI key!) |

---

## 🔐 Security Reminders

- ✅ API key only in Supabase Secrets
- ❌ Never in .env file
- ❌ Never commit to git
- ❌ Never log full key
- ✅ Use environment variables in code

---

## 📊 Costs & Monitoring

### Expected Costs
- Single autofill: $0.003 - $0.01
- 100 autofills: $0.30 - $1.00
- 1000 autofills: $3.00 - $10.00

### Monitor These
1. OpenAI API Usage: https://platform.openai.com/account/usage/overview
2. Supabase Function Logs: Check for errors
3. Browser Console: Check for client-side errors

---

## ✅ Success Criteria

Everything works when:
- ✅ Function is deployed (green checkmark)
- ✅ Secret is configured (in Secrets list)
- ✅ Secret is bound (toggle ON in function settings)
- ✅ Test function returns success response
- ✅ Autofill button works from Add Product page
- ✅ Product names are specific (not generic "Product")
- ✅ Descriptions mention actual features

---

## 📝 Quick Reference

### Commands
```bash
# Deploy function
supabase functions deploy generate_product_from_image

# View logs
supabase functions logs generate_product_from_image --tail

# Add secret
supabase secrets set OPENAI_API_KEY

# List secrets
supabase secrets list
```

### URLs
- Dashboard: https://supabase.com/dashboard
- OpenAI API Keys: https://platform.openai.com/api/keys
- OpenAI Usage: https://platform.openai.com/account/usage/overview
- Billing: https://platform.openai.com/account/billing/overview

### Key Settings
- Model: `gpt-4o-mini` (correct)
- Endpoint: `https://api.openai.com/v1/chat/completions` (correct)
- Auth Header: `Authorization: Bearer {OPENAI_API_KEY}` (correct)
- Content-Type: `application/json` (correct)

---

## 🚀 Done!

If you've completed all steps above and everything in the success criteria is true, your backend is fully set up for OpenAI API integration!

**Next:** Test the autofill feature from the Add Product page. 🎉
