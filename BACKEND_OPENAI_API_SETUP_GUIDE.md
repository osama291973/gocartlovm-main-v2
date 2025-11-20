# 🔧 BACKEND SETUP GUIDE - OPENAI API INTEGRATION

## Overview

Your backend uses **Supabase Edge Functions** (Deno runtime) to call the OpenAI API. This guide walks you through the entire setup process.

---

## Current Architecture

```
Frontend (React/TypeScript)
    ↓
Supabase Edge Function (Deno)
    ↓
OpenAI API (gpt-4o-mini model)
    ↓
Response parsed and returned to Frontend
```

**File Location:** `functions/generate_product_from_image/index.ts`

---

## ✅ CHECKLIST - Backend Requirements

### 1. OpenAI Account & API Key

- [ ] Have OpenAI account (https://platform.openai.com)
- [ ] Created API key with proper permissions
- [ ] Key format: `sk-proj-...` (correct format)
- [ ] Key has active credits
- [ ] Key is NOT in git/version control (only in Supabase secrets)

### 2. Supabase Project Configuration

- [ ] Supabase project created
- [ ] Project URL: `https://qlhpzsucftqcakiotgpc.supabase.co` ✅
- [ ] OPENAI_API_KEY secret configured in Supabase
- [ ] Secret is ENABLED (toggle is ON)
- [ ] Edge Functions deployment working

### 3. Environment Variables

- [ ] `.env` has VITE_SUPABASE_URL ✅
- [ ] `.env` has VITE_SUPABASE_PUBLISHABLE_KEY ✅
- [ ] OPENAI_API_KEY NOT in `.env` (security best practice)
- [ ] OPENAI_API_KEY in Supabase Secrets instead

### 4. Edge Function Code

- [ ] File exists: `functions/generate_product_from_image/index.ts` ✅
- [ ] Code imports Deno std library ✅
- [ ] Code reads OPENAI_API_KEY from environment ✅
- [ ] Proper error handling for missing key ✅
- [ ] Correct OpenAI API endpoint: `https://api.openai.com/v1/chat/completions` ✅
- [ ] Model: `gpt-4o-mini` ✅
- [ ] Authorization header format correct ✅

### 5. CORS Configuration

- [ ] Response headers include `Content-Type: application/json`
- [ ] CORS headers configured if needed
- [ ] Frontend can call the Edge Function

### 6. Testing

- [ ] Deployed function to Supabase
- [ ] Function is accessible from frontend
- [ ] OpenAI API returns valid responses
- [ ] Error handling works correctly

---

## 🔑 Step 1: Get OpenAI API Key

### Where to Get It
1. Go to: https://platform.openai.com/api/keys
2. Click: **"Create new secret key"**
3. Choose: **"Personal account"** (or organization if you prefer)
4. **Copy the full key** (starts with `sk-proj-`)
5. **Save it somewhere secure temporarily** (we'll put it in Supabase)

### Important Security Notes
- ⚠️ **NEVER commit API key to git** (check `.gitignore`)
- ⚠️ **NEVER put it in `.env` file** (it gets committed)
- ✅ **ONLY store in Supabase Secrets** (encrypted at rest)
- ✅ **Use environment variables in code** (from Supabase)

### Check Your .env File
```bash
# Your .env file (c:\Users\Administrator\Desktop\gocartlovm-main - v1\.env)
# Should NOT have: OPENAI_API_KEY=...
# This is correct! ✅
```

---

## 🛠️ Step 2: Configure Supabase Secrets

### Option A: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your project: `qlhpzsucftqcakiotgpc`

2. **Navigate to Settings**
   - Left sidebar → **Settings** (⚙️ icon)
   - Tab: **Secrets**

3. **Add Secret**
   - Click: **"Add new secret"**
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-...` (paste your API key)
   - Click: **"Create secret"**

4. **Verify Secret is Enabled**
   - You should see the secret in the list
   - It should have a **green checkmark** or **ON toggle**

5. **Bind Secret to Function** (Important!)
   - Go to: **Functions** (left sidebar)
   - Click: **generate_product_from_image**
   - Click: **Settings** (gear icon)
   - Under **Secrets:** Toggle **OPENAI_API_KEY** → ON
   - **Save changes**

### Option B: Via CLI

```bash
# Navigate to your project root
cd "c:\Users\Administrator\Desktop\gocartlovm-main - v1"

# Add secret (you'll be prompted for the value)
supabase secrets set OPENAI_API_KEY

# Verify secret was added
supabase secrets list

# Should output:
# OPENAI_API_KEY (masked) ✅
```

### Verification ✅

After adding the secret, verify it worked:

1. Go to: https://supabase.com/dashboard → Your Project → Settings → Secrets
2. Look for: **OPENAI_API_KEY**
3. Should show: **OPENAI_API_KEY** with a green indicator
4. Should NOT show the actual key value (it's hidden for security)

---

## 🚀 Step 3: Deploy Edge Function

### Via Supabase Dashboard

1. **Navigate to Functions**
   - Dashboard → **Functions** (left sidebar)

2. **Find Function**
   - Look for: **generate_product_from_image**
   - Click on it

3. **Deploy Function**
   - Click: **Deploy** button (usually top right)
   - Wait for: Green checkmark ✅
   - Status message: "Deployment successful"

4. **Check Deployment**
   - You should see function details
   - Status: **Active** or **Deployed** ✅
   - Last deployed: Recent timestamp

### Via CLI

```bash
cd "c:\Users\Administrator\Desktop\gocartlovm-main - v1"

# Deploy the function
supabase functions deploy generate_product_from_image

# Expected output:
# ✓ Deployed function generate_product_from_image

# View function logs
supabase functions logs generate_product_from_image
```

### Verify Deployment ✅

1. Function shows **green checkmark** in dashboard
2. **No error messages** in logs
3. Function is **callable from frontend**

---

## 📋 Step 4: Verify Code Configuration

### Check Edge Function Code

**File:** `functions/generate_product_from_image/index.ts`

**Verify these critical sections:**

#### 1. Environment Variable Reading
```typescript
// ✅ CORRECT
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

if (!OPENAI_KEY) {
  console.error('OPENAI_API_KEY not set');
}
```

This correctly reads the secret you configured in Supabase.

#### 2. OpenAI API Call
```typescript
// ✅ CORRECT
const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_KEY}`,  // Uses the key from environment
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',  // Correct model
    max_tokens: 500,
    temperature: 0.15,
    messages: [
      { role: 'system', content: 'You are an assistant that outputs strictly valid JSON.' },
      { role: 'user', content: prompt },
    ],
  }),
});
```

**Checklist:**
- ✅ Correct endpoint: `https://api.openai.com/v1/chat/completions`
- ✅ Correct model: `gpt-4o-mini` (low cost, fast)
- ✅ Correct headers: `Authorization: Bearer ${OPENAI_KEY}`
- ✅ Valid JSON in body

#### 3. Error Handling
```typescript
// ✅ CORRECT
if (!res.ok) {
  const txt = await res.text();
  throw new Error(`OpenAI error ${res.status}: ${txt}`);
}

// Also in catch block:
catch (err: any) {
  console.error('generate_product_from_image error', err);
  return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), 
    { status: 500, headers: { 'Content-Type': 'application/json' } });
}
```

**This correctly:**
- ✅ Logs errors for debugging
- ✅ Returns error response to frontend
- ✅ Includes error message for troubleshooting

#### 4. Response Parsing
```typescript
// ✅ CORRECT
const assistantText = (openAiResp.choices?.[0]?.message?.content) ?? 
                      (openAiResp.choices?.[0]?.text ?? '');

let parsed;
try {
  parsed = JSON.parse(assistantText);
} catch (err) {
  // Fallback: try to extract JSON if response has markdown
  const match = assistantText.match(/{[\s\S]*}/);
  if (match) {
    parsed = JSON.parse(match[0]);
  } else {
    throw new Error('OpenAI did not return parseable JSON');
  }
}
```

**This correctly:**
- ✅ Extracts content from OpenAI response
- ✅ Parses JSON safely
- ✅ Handles markdown-wrapped JSON
- ✅ Provides helpful error messages

---

## 🧪 Step 5: Test the Backend

### Test 1: Verify Secret is Accessible

**Via Supabase Dashboard:**
1. Functions → generate_product_from_image
2. Go to **Logs** tab
3. Should NOT show: `OPENAI_API_KEY not set`
4. If you see this error, the secret wasn't bound correctly

**Via CLI:**
```bash
supabase functions logs generate_product_from_image --tail
```

### Test 2: Direct Function Test

**Via Supabase Dashboard:**
1. Functions → generate_product_from_image
2. Click: **Test function**
3. Paste this test payload:
```json
{
  "imageUrls": ["https://via.placeholder.com/300"],
  "language": "en",
  "storeId": "test-store"
}
```
4. Click: **Send**

**Expected Response (Success):**
```json
{
  "success": true,
  "generated": {
    "en": {
      "name": "Product Name",
      "description": "Product description",
      "slug": "product-slug"
    },
    "ar": {
      "name": "اسم المنتج",
      "description": "وصف المنتج"
    }
  }
}
```

**If Error - Check These:**
1. ❌ `OPENAI_API_KEY not set` → Secret not bound to function
2. ❌ `401 Unauthorized` → Wrong API key or expired
3. ❌ `429 Too Many Requests` → Hit rate limit (wait 30 seconds)
4. ❌ `Invalid model` → Model name wrong (should be `gpt-4o-mini`)
5. ❌ `Insufficient credits` → Add credits to OpenAI account

### Test 3: From Frontend

1. Go to: **Add Product** page
2. Upload a product image
3. Click: **Autofill from images**
4. Check:
   - ✅ Shows "Generating..." 
   - ✅ Returns specific product name
   - ✅ Returns detailed description
   - ✅ Shows success toast

### Test 4: Check Function Logs

**In Supabase Dashboard:**
1. Functions → generate_product_from_image
2. Click: **Logs** tab
3. Look for recent execution logs

**Expected logs:**
```
[Success] Generated metadata for product
Status: 200
Response time: 2-5 seconds
```

**If errors:**
```
OPENAI_API_KEY not set  ← Fix: Bind secret to function
OpenAI error 401        ← Fix: Check API key validity
OpenAI error 429        ← Fix: Wait and retry
```

---

## ⚠️ Troubleshooting

### Problem 1: "OPENAI_API_KEY not set"

**Cause:** Secret not bound to Edge Function

**Solution:**
1. Go to: Supabase → Functions → generate_product_from_image
2. Click: **Settings** (gear icon)
3. Under **Environment variables/Secrets**
4. Find: **OPENAI_API_KEY**
5. Toggle: **ON** (should be green)
6. Click: **Save**
7. Redeploy function

### Problem 2: "401 Unauthorized"

**Cause:** Invalid or expired API key

**Solution:**
1. Check your API key at: https://platform.openai.com/api/keys
2. If key is revoked or expired, create new one:
   - Go to: https://platform.openai.com/api/keys
   - Click: **Create new secret key**
   - Copy new key
3. Update Supabase secret:
   - Supabase → Settings → Secrets
   - Delete old: OPENAI_API_KEY
   - Add new: OPENAI_API_KEY with new key
4. Redeploy function

### Problem 3: "429 Too Many Requests"

**Cause:** Hit OpenAI rate limit

**Solution:**
- Wait 30 seconds
- Retry the request
- Check your OpenAI usage: https://platform.openai.com/account/usage/overview
- Upgrade plan if needed

### Problem 4: "Invalid model 'gpt-4o-mini'"

**Cause:** Model not available or typo

**Solution:**
- Check model name: Should be `gpt-4o-mini` (exact)
- Verify OpenAI account has access to GPT-4 (usually requires paid account)
- Alternative models if `gpt-4o-mini` unavailable:
  - `gpt-3.5-turbo` (cheaper, slower)
  - `gpt-4` (more expensive, more capable)

### Problem 5: "Insufficient credits on account"

**Cause:** OpenAI account has no remaining credits

**Solution:**
1. Go to: https://platform.openai.com/account/billing/overview
2. Add payment method if not already added
3. Click: **Add to credit balance** (or set up auto-reload)
4. Add credits
5. Wait a few minutes for update
6. Retry function call

### Problem 6: Image processing fails

**Cause:** Image quality issues

**Solution:**
- Use clear, well-lit product images
- Check image URLs are publicly accessible
- Try with simpler product images first
- Verify image format: JPG, PNG, WebP, GIF supported

---

## 🔐 Security Best Practices

### 1. API Key Protection
- ✅ Store in Supabase Secrets (encrypted)
- ✅ Never commit to git
- ✅ Never log the full key
- ✅ Use different keys for different environments

### 2. Environment Separation
```
Development:
- Use: dev OpenAI account with lower spend limit
- Deploy to: Staging/test Supabase project

Production:
- Use: prod OpenAI account with monitoring
- Deploy to: Production Supabase project
- Enable: Cost alerts in OpenAI dashboard
```

### 3. Monitoring & Alerts
- Monitor OpenAI usage: https://platform.openai.com/account/usage/overview
- Set spending limits in OpenAI dashboard
- Check Supabase function logs regularly
- Alert on rate limit hits or errors

### 4. Rate Limiting
Consider adding rate limiting in your Edge Function:
```typescript
// Example: limit to 10 calls per user per minute
const rateLimitKey = `${request.headers.get('x-user-id')}-${Date.now() / 60000 | 0}`;
// Check cache/database for count
// Reject if exceeded limit
```

---

## 📊 OpenAI API Costs

### Pricing Model
- **Input tokens:** Cost per 1M tokens
- **Output tokens:** Cost per 1M tokens
- **gpt-4o-mini:** Very affordable (~$0.15 per 1M input, $0.60 per 1M output)

### Example Costs
- Single image analysis: ~$0.003 - $0.01
- 100 product autofills: ~$0.30 - $1.00
- 1000 product autofills: ~$3.00 - $10.00

### Cost Control
1. Set spending limit in OpenAI dashboard
2. Monitor usage daily
3. Optimize prompts (shorter = cheaper)
4. Use lower-cost models for simple tasks

---

## 🎯 Complete Setup Checklist

### Phase 1: Preparation
- [ ] Created OpenAI account
- [ ] Generated API key (sk-proj-...)
- [ ] Have Supabase project ready

### Phase 2: Configuration
- [ ] Added OPENAI_API_KEY to Supabase Secrets
- [ ] Bound secret to generate_product_from_image function
- [ ] Verified secret shows in Supabase

### Phase 3: Deployment
- [ ] Deployed function via Supabase Dashboard
- [ ] Function shows green checkmark
- [ ] No deployment errors in logs

### Phase 4: Testing
- [ ] Tested function with test payload
- [ ] Got valid JSON response
- [ ] Checked function logs
- [ ] Tested from frontend (Add Product page)
- [ ] Autofill button works correctly

### Phase 5: Monitoring
- [ ] Set up cost alerts in OpenAI
- [ ] Checking function logs regularly
- [ ] Monitoring for errors

---

## 📞 If Something Goes Wrong

### Immediate Steps
1. Check **Supabase Function Logs**
   - Supabase → Functions → generate_product_from_image → Logs
2. Check **OpenAI API Status**
   - https://status.openai.com
3. Check **Browser Console**
   - F12 → Console tab
4. Try a **simple test image**
   - Use placeholder image first

### Get Logs for Debugging
```bash
# Stream logs in real-time
supabase functions logs generate_product_from_image --tail

# Save logs to file for analysis
supabase functions logs generate_product_from_image > logs.txt
```

### When Asking for Help
Provide:
1. Screenshot of Supabase Function Logs
2. Browser console error (F12 → Console)
3. Test payload you used
4. Error message received
5. OpenAI API status page

---

## ✅ Summary

Your backend is configured correctly when:

✅ OPENAI_API_KEY is in Supabase Secrets  
✅ Secret is bound to Edge Function  
✅ Function is deployed with green checkmark  
✅ Function logs show successful executions  
✅ Frontend can call the function without errors  
✅ Autofill button works from Add Product page  
✅ Product names and descriptions are specific  

**You're all set to use OpenAI API for product autofill!** 🚀
