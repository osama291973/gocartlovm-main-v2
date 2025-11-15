# 🧪 AUTOFILL ERROR DEBUGGING - BACKEND TESTS

## Step 1: Check Edge Function Logs

This is the FIRST thing to check:

1. Go to: https://supabase.com/dashboard
2. Click: **Functions** (left sidebar)
3. Click: **generate_product_from_image**
4. Click: **Logs** tab (top right)
5. **Screenshot or copy any ERROR messages you see**

This will show you exactly what's failing!

---

## Step 2: Test the Edge Function Directly

Let's call the function directly from your browser console to bypass the frontend:

### **Option A: Via Browser Console**

1. Open your app: http://localhost:3081/seller/add-product
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Paste this code:

```javascript
const testCall = async () => {
  try {
    const response = await fetch(
      'https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate_product_from_image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_ANON_KEY'
        },
        body: JSON.stringify({
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          language: 'en',
          storeId: 'test-store-id-123'
        })
      }
    );
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    return data;
  } catch (err) {
    console.error('Error:', err);
  }
};

testCall();
```

**Replace:**
- `YOUR_PROJECT_ID` - Your Supabase project ID (from URL or settings)
- `YOUR_ANON_KEY` - Your Supabase anon key (from Settings → API Keys)

5. **Press Enter**
6. **Check the console output** - this will show you the exact error!

---

## Step 3: Get Your Supabase Credentials

To fill in the test above:

1. Go to: https://supabase.com/dashboard
2. Click: **Settings → API**
3. Copy:
   - **Project ID**: (near the top)
   - **Anon public key**: (labeled "anon key")

---

## Step 4: Check Environment Variables

Make sure the secret was deployed correctly:

1. Go to: **Functions → generate_product_from_image**
2. You should see a **"Secrets"** section showing `OPENAI_API_KEY` ✅

If not shown, the secret wasn't deployed!

---

## Step 5: Network Tab Check

When you click "Autofill":

1. Press **F12**
2. Go to **Network** tab
3. Click "Autofill from images" button
4. **Look for a request to `generate_product_from_image`**
5. Click on it
6. Check the **Response** tab for error details

---

## 📋 CHECKLIST FOR DEBUGGING

Send me the following information:

```
[ ] 1. Screenshot of Edge Function LOGS
[ ] 2. Console output from test call above
[ ] 3. Network tab response when clicking autofill
[ ] 4. Error message (full text)
[ ] 5. Confirm OPENAI_API_KEY shows in Secrets list
```

---

## Common Issues & Solutions

### **Issue 1: Function returns 404**
**Cause:** Function not deployed
**Solution:**
```
1. Go to Functions
2. Click generate_product_from_image
3. Click "Deploy" button
4. Wait for green checkmark
```

### **Issue 2: Function returns 500 with "OPENAI_API_KEY not set"**
**Cause:** Secret not deployed with function
**Solution:**
```
1. Redeploy the function after adding secret
2. Or delete the function and redeploy
```

### **Issue 3: OpenAI API Error (401, 429, 500)**
**Cause:** OpenAI API issue
**Solution:**
```
1. Check OpenAI API status: https://status.openai.com
2. Verify API key is valid at https://platform.openai.com/api/keys
3. Check OpenAI account has billing enabled
```

### **Issue 4: Function timeout (>30 seconds)**
**Cause:** OpenAI API slow or image URL not accessible
**Solution:**
```
1. Try a different image (must be publicly accessible URL)
2. Check internet connection
3. Try again in a few seconds
```

### **Issue 5: "Invalid image URL"**
**Cause:** Image upload failed or URL is invalid
**Solution:**
```
1. Make sure image uploads successfully first
2. Check the uploaded image URL is publicly accessible
3. Try uploading a different image
```

---

## 🔧 Manual Test Script

If you want to test with curl from terminal:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate_product_from_image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    "language": "en",
    "storeId": "test-123"
  }'
```

---

## 📊 Expected Success Response

If everything works, you should see:

```json
{
  "success": true,
  "generated": {
    "en": {
      "name": "Premium Wireless Headphones",
      "description": "High-quality audio headphones with noise cancellation...",
      "slug": "premium-wireless-headphones"
    },
    "ar": {
      "name": "سماعات رأس لاسلكية فاخرة",
      "description": "سماعات رأس عالية الجودة مع إلغاء الضوضاء..."
    }
  }
}
```

---

## 🎯 NEXT STEPS

1. **Check Edge Function Logs** (most important!)
2. **Run console test** from Step 2
3. **Report findings** with error message
4. **I'll help you fix** based on the error

---

**Please run these tests and share the error messages you find!** This will help us identify exactly what's wrong. 🔍
