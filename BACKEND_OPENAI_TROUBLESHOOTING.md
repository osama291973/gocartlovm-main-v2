# 🔧 BACKEND OPENAI API - TROUBLESHOOTING GUIDE

## Quick Diagnosis Tree

```
Frontend shows error?
├─ YES → Go to: "Frontend Errors"
└─ NO → Go to: "Function Test"

Can test function?
├─ YES → Go to: "Response Issues"
└─ NO → Go to: "Function Deployment"

Function returns error?
├─ YES → Find error in table below
└─ NO → Everything works! ✅
```

---

## Error Messages & Solutions

### ❌ Error: "OPENAI_API_KEY not set"

**Where you see it:**
- Supabase Function Logs
- Browser console error

**Root Cause:**
- Secret not created in Supabase
- Secret created but not BOUND to function
- Typo in secret name

**Solutions (in order):**

1. **Check Secret Exists**
   ```
   Supabase → Settings → Secrets
   Look for: OPENAI_API_KEY
   Should show checkmark or green indicator
   ```
   
   **If not found:**
   - Create new secret
   - Name: OPENAI_API_KEY (exact case)
   - Value: Your OpenAI API key (sk-proj-...)

2. **Check Secret is Bound**
   ```
   Supabase → Functions → generate_product_from_image
   Click: Settings (gear icon)
   Under "Environment variables" or "Secrets"
   Find: OPENAI_API_KEY
   ```
   
   **If toggle is OFF:**
   - Click toggle → Turn ON
   - Should become green
   - Click: Save
   - Redeploy function

3. **Check Secret Name Exact Match**
   - Should be exactly: `OPENAI_API_KEY`
   - Not: `openai_api_key` (lowercase)
   - Not: `OPENAI_KEY` (missing _API_)
   - Not: `OpenAIKey` (wrong format)

4. **Redeploy Function**
   ```
   Functions → generate_product_from_image
   Click: Deploy
   Wait for green checkmark
   ```

**Verify Fix:**
- Check Function Logs
- Should NOT show: "OPENAI_API_KEY not set"
- Should show successful API calls

---

### ❌ Error: "401 Unauthorized"

**Where you see it:**
- Supabase Function Logs
- Response: `{"error": "OpenAI error 401: Incorrect API key provided"}`

**Root Cause:**
- API key is invalid
- API key is revoked/expired
- API key format is wrong
- Typo when copying key
- Using wrong account's key

**Solutions (in order):**

1. **Verify API Key Format**
   - Should start with: `sk-proj-`
   - Should be ~50 characters
   - Should have no spaces or special chars at ends
   
   ```
   CORRECT:  sk-proj-abc123def456...
   WRONG:    sk-proj-abc123def456 (trailing space)
   WRONG:    sk-proj- (incomplete)
   WRONG:    sk-pro... (missing characters)
   ```

2. **Check if Key is Still Valid**
   ```
   Go to: https://platform.openai.com/api/keys
   Look for your key in the list
   If it shows red X: key is revoked/deleted
   If it shows green check: key is active
   ```

3. **If Key is Revoked**
   - Old key can't be reactivated
   - Create NEW key:
     ```
     https://platform.openai.com/api/keys
     Click: Create new secret key
     Copy new key
     ```
   
   - Update Supabase secret:
     ```
     Supabase → Settings → Secrets
     Delete: Old OPENAI_API_KEY (click trash icon)
     Add new: OPENAI_API_KEY (paste new key)
     ```
   
   - Redeploy function

4. **Verify API Key Has Permissions**
   - Log in to OpenAI with same account
   - Check account type: Personal or Organization
   - Make sure account has API access enabled
   - Check if account has credits

5. **Test with cURL** (optional, for debugging)
   ```bash
   # Replace YOUR_KEY with your actual key
   curl https://api.openai.com/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_KEY" \
     -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "test"}]}'
   
   # If you get {"error": "Incorrect API key"} → key is bad
   # If you get {"choices": [...]} → key is good
   ```

**Verify Fix:**
- Check Function Logs
- Should NOT show: "401"
- Should show successful response

---

### ❌ Error: "429 Too Many Requests"

**Where you see it:**
- Supabase Function Logs
- Response: `{"error": "OpenAI error 429: Rate limit exceeded"}`

**Root Cause:**
- Hit OpenAI rate limits
- Too many requests in short time
- Concurrent requests from multiple users
- Testing repeatedly too fast

**Solutions (in order):**

1. **Wait 30 Seconds**
   - Rate limit errors are temporary
   - OpenAI blocks requests for ~30 seconds
   - After wait, requests work again

2. **Don't Retry Too Quickly**
   - Wait at least 30 seconds between retries
   - Better: wait 1 minute
   - Don't spam autofill button

3. **Check Usage**
   ```
   https://platform.openai.com/account/usage/overview
   See: How many requests today?
   See: Token usage graph
   ```

4. **Upgrade OpenAI Plan** (if chronic problem)
   - Free tier has strict rate limits
   - Paid tier has higher limits
   - Go to: https://platform.openai.com/account/billing/overview

5. **Implement Rate Limiting** (backend optimization)
   - Limit calls per user per minute
   - Queue requests instead of parallel
   - Cache results to avoid duplicate calls

**Verify Fix:**
- Wait 30 seconds
- Try again
- Should work

---

### ❌ Error: "Invalid model 'gpt-4o-mini'"

**Where you see it:**
- Supabase Function Logs
- Response: `{"error": "OpenAI error 400: Invalid model"}`

**Root Cause:**
- Model name is misspelled
- Account doesn't have access to model
- Model no longer exists
- Typo in function code

**Solutions (in order):**

1. **Verify Model Name**
   - Should be exactly: `gpt-4o-mini`
   - Not: `gpt-4o-mini` (extra space)
   - Not: `gpt4o-mini` (missing hyphen)
   - Not: `gpt-4-mini` (wrong format)
   
   Check file: `functions/generate_product_from_image/index.ts`
   ```typescript
   model: 'gpt-4o-mini'  // ✅ Correct
   ```

2. **Check Account Tier**
   - `gpt-4o-mini` requires: paid account
   - Free account can only use: `gpt-3.5-turbo`
   - Check: https://platform.openai.com/account/billing/overview

3. **If You're on Free Tier**
   - Option A: Upgrade to paid account
   - Option B: Use different model:
     ```typescript
     model: 'gpt-3.5-turbo'  // Free tier model (slower, cheaper)
     ```

4. **Check Model Availability**
   - https://platform.openai.com/docs/models/gpt-4o-mini
   - Make sure model is available in your region

**Verify Fix:**
- Check Function Logs
- Should NOT show: "Invalid model"
- Should show successful response

---

### ❌ Error: "Insufficient credits on account"

**Where you see it:**
- Supabase Function Logs
- Response: `{"error": "OpenAI error 429: Billing error"}`

**Root Cause:**
- Account has no remaining credits
- No payment method on file
- Billing is paused
- Monthly credits expired

**Solutions (in order):**

1. **Check Credit Balance**
   ```
   https://platform.openai.com/account/billing/overview
   Look for: Credit balance
   ```

2. **Add Payment Method**
   ```
   Billing → Payment methods
   Add card
   Save
   ```

3. **Add Credits**
   ```
   Billing → Add to credit balance
   Choose amount ($5, $10, $20, etc.)
   Complete payment
   Wait 1-2 minutes for credit to appear
   ```

4. **Check Billing Status**
   ```
   Billing → Overview
   Status should say: "Active"
   Not: "Paused" or "Cancelled"
   ```

5. **Test Again**
   ```
   Wait 2 minutes for credits to update
   Try function again
   Should work
   ```

**Verify Fix:**
- Check credit balance is positive
- Check Function Logs
- Should NOT show: "Billing error"
- Should show successful response

---

### ❌ Error: "OpenAI did not return parseable JSON"

**Where you see it:**
- Supabase Function Logs
- Response: `{"error": "OpenAI did not return parseable JSON"}`

**Root Cause:**
- OpenAI returned invalid JSON
- Response contains markdown code blocks
- Response is incomplete or cut off
- Model returned natural language instead of JSON

**Solutions (in order):**

1. **Check Prompt Quality**
   - Prompt should explicitly ask for JSON
   - Current code includes: "Output ONLY valid JSON"
   - This usually works

2. **Try Different Image**
   - Current image might be too unclear
   - OpenAI struggles with: blurry, dark, or abstract images
   - Try: clear, well-lit product photo

3. **Check OpenAI Response**
   - Look in Function Logs
   - See: "Raw Response" section
   - Check if it actually contains JSON or natural text

4. **Improve Prompt** (if persistent)
   - Make prompt more explicit
   - Add examples of expected format
   - Use lower temperature (more consistent)
   
   Current in code:
   ```typescript
   temperature: 0.15,  // Low = more consistent
   ```

5. **Check Max Tokens**
   - Current: `max_tokens: 500`
   - If response is cut off, increase to 800
   - Edit file: `functions/generate_product_from_image/index.ts`

**Verify Fix:**
- Check Function Logs
- Look for actual JSON response
- Should show valid structure: `{"en": {...}, "ar": {...}}`

---

### ❌ Error: "imageUrls required"

**Where you see it:**
- Supabase Function Logs
- Response: `{"error": "imageUrls required"}`

**Root Cause:**
- Frontend not sending image URLs
- Image upload failed before calling function
- Request payload is wrong

**Solutions (in order):**

1. **Check if Image Uploaded**
   - In Add Product form
   - Should see image thumbnail
   - Should see "X" button to remove
   
   **If not visible:**
   - Image upload failed
   - Try uploading again
   - Check image is < 10MB
   - Check image format: JPG, PNG, WebP, GIF

2. **Check Browser Console**
   - F12 → Console
   - Look for upload errors
   - Look for request payload

3. **Check Function is Called**
   - F12 → Network tab
   - Click autofill button
   - Look for request to `generate_product_from_image`
   - Check Request body → contains imageUrls?

4. **Check Image URL Format**
   - Should be: full URL starting with `http://` or `https://`
   - Not: relative path like `/images/...`
   - Not: file path like `C:\...`

**Verify Fix:**
- Image uploads successfully
- Image shows as thumbnail
- Autofill button works

---

## Supabase Function Logs Guide

### Where to Find Logs
```
Supabase Dashboard
→ Functions (left sidebar)
→ generate_product_from_image (click function)
→ Logs tab (top)
```

### What to Look For

**✅ Success Logs:**
```
[2024-01-15 10:30:45] Function invoked
[2024-01-15 10:30:46] Processing request...
[2024-01-15 10:30:47] Calling OpenAI API
[2024-01-15 10:30:50] Response received
[2024-01-15 10:30:51] Success! Generated metadata
Status: 200
Duration: 6.2 seconds
```

**❌ Error Logs:**
```
[2024-01-15 10:35:12] Error: OPENAI_API_KEY not set
[2024-01-15 10:35:12] Stack trace: ...
```

### How to Use Logs

1. **Stream Live Logs**
   ```bash
   supabase functions logs generate_product_from_image --tail
   ```
   - Shows logs in real-time
   - Hit Ctrl+C to stop
   - Good for debugging

2. **Export Logs**
   ```bash
   supabase functions logs generate_product_from_image > logs.txt
   ```
   - Saves to file
   - Good for analysis
   - Good for sharing with support

3. **Filter Logs**
   - Look for: ERROR, WARN, error, failed
   - These highlight problems
   - Note timestamp when problem occurred

---

## Frontend Errors Guide

### Error: "Failed to send a request to the Edge Function"

**Cause:**
- Function not deployed
- Function has error
- Network issue
- CORS issue

**Solutions:**
1. Check if function deployed: Supabase → Functions → should show function
2. Check Function Logs: see if errors
3. Check browser Network tab: F12 → Network → look for failed request
4. Try again (sometimes temporary)

### Error: "OpenAI error 401: Incorrect API key"

**Cause:** API key issues (see above section)

**Solutions:** Follow "401 Unauthorized" section above

### Error: "No generated data returned"

**Cause:**
- OpenAI returned incomplete response
- Parsing failed
- API error

**Solutions:**
1. Check Function Logs for actual error
2. Check if response contains required fields
3. Try with different product image

---

## Network Debugging

### Check Request in Browser

1. **Open Developer Tools**
   ```
   Press: F12
   Go to: Network tab
   ```

2. **Click Autofill Button**
   - Watch Network tab
   - Should see request to: `generate_product_from_image`
   - Or similar Edge Function name

3. **Check Request Details**
   - Right-click request
   - Click: "Open in new tab" or "Response"
   - Check: Is response valid JSON?
   - Check: Does it have `success: true`?

4. **Check Request Headers**
   - Authorization header should be present
   - Content-Type should be `application/json`

### Common Network Issues

- **CORS Error:** Function not allowing cross-origin. Update CORS headers.
- **Timeout:** Function took too long (> 30 seconds). Check OpenAI status.
- **404 Not Found:** Function URL wrong or function not deployed.
- **500 Error:** Function has error. Check logs.

---

## Testing Checklist

### Quick Test
- [ ] Can you access Supabase Dashboard?
- [ ] Can you see `generate_product_from_image` function?
- [ ] Does function show green checkmark?
- [ ] Is secret `OPENAI_API_KEY` configured?
- [ ] Is secret bound to function (toggle ON)?

### Detailed Test
- [ ] Function Logs show no errors?
- [ ] Test function with sample payload works?
- [ ] Response contains valid JSON?
- [ ] Response has `en` and `ar` fields?
- [ ] Response values are not empty?

### Frontend Test
- [ ] Can upload product image?
- [ ] Image shows as thumbnail?
- [ ] Can click autofill button?
- [ ] Button shows "Generating..." state?
- [ ] Form fills with specific product name?
- [ ] Form fills with detailed description?
- [ ] Arabic fields also populated?

---

## When to Contact Support

Contact OpenAI or Supabase support if:

**OpenAI Issues:**
- API key issues that can't be resolved
- Account billing problems
- Model not available in your region
- Persistent 401, 429, 500 errors from OpenAI

**Supabase Issues:**
- Function won't deploy
- Can't access Dashboard
- Secret won't save
- Database connectivity problems

**Provide Them:**
1. Error message (screenshot if possible)
2. Logs (from Supabase or browser)
3. Steps to reproduce
4. What you've already tried

---

## Summary

Most errors are caused by:
1. Secret not bound to function → Fix: Toggle secret ON in settings
2. Invalid/expired API key → Fix: Create new key and update secret
3. Rate limiting → Fix: Wait 30 seconds and retry
4. Insufficient credits → Fix: Add credits to OpenAI account

Check these first when debugging! 🔍
