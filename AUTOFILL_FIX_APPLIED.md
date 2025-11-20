# Autofill Button Fix - Frontend Headers Update

## Problem Identified
The "Autofill from Images" button was returning **401 Unauthorized** error when calling the Supabase Edge Function `generate_product_from_image`.

**Root Cause:** Missing authentication headers in the frontend request.

## Solution Applied

### File Updated
`src/utils/generateProductFromImage.ts`

### Changes Made

#### Before:
```typescript
const resp = await fetch(functionUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageUrl, storeId, language }),
});
```

#### After:
```typescript
// Get Supabase credentials from environment variables
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

if (!supabaseAnonKey) {
  throw new Error("Supabase anon key not found in environment variables");
}

// Always use the deployed function URL
const functionUrl = `https://${supabaseProjectId}.functions.supabase.co/generate_product_from_image`;

const resp = await fetch(functionUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${supabaseAnonKey}`,
    "apikey": supabaseAnonKey,
    "x-client-info": "gocart-frontend"
  },
  body: JSON.stringify({ imageUrl, storeId, language }),
});
```

### Headers Added

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Type` | `application/json` | Specifies JSON request body |
| `Authorization` | `Bearer {anonKey}` | OAuth 2.0 Bearer token authentication |
| `apikey` | `{anonKey}` | Supabase API key for additional authentication |
| `x-client-info` | `gocart-frontend` | Client identifier for debugging/logging |

### Environment Variables Used
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anonymous key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID

Both are already configured in `.env` file:
```env
VITE_SUPABASE_PROJECT_ID="qlhpzsucftqcakiotgpc"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Backend Edge Function

The Supabase Edge Function (`supabase/functions/generate_product_from_image/index.ts`) expects these headers:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
};
```

Now the frontend sends all required headers, so the Edge Function can properly authenticate the request.

## Testing the Fix

### Steps to Test:
1. Go to Seller Dashboard > Add Product page
2. Upload a product image
3. Click the green "Autofill from images" button
4. The AI should now generate product name and description in both English and Arabic
5. No more "401 Unauthorized" errors

### Expected Result:
- ✅ Form fields auto-populate with AI-generated content
- ✅ Both English and Arabic translations are generated
- ✅ Success toast notification appears

## Additional Improvements

### Error Handling Enhanced
- Added validation for missing Supabase credentials
- Improved error messages for debugging
- Graceful fallback with user-friendly error toasts in the UI

### URL Construction
- Changed from hardcoded URL to dynamic URL construction using environment variables
- More maintainable if project ID changes

## Compatibility

- ✅ Works with existing Supabase Edge Function
- ✅ Compatible with RLS policies (using anon key)
- ✅ Works with both English and Arabic language settings
- ✅ No breaking changes to API or frontend components

## Files Modified
- `src/utils/generateProductFromImage.ts`

## Files NOT Modified
- `AddProductPage.tsx` - No changes needed (already calls the updated utility)
- `supabase/functions/generate_product_from_image/index.ts` - No changes needed
- `.env` - Already has correct configuration

## References

### Backend Components:
1. **Supabase Edge Function**: `supabase/functions/generate_product_from_image/index.ts`
2. **RLS Policies**: All tables have "public" SELECT policies that allow anon access
3. **CORS Headers**: Properly configured for cross-origin requests

### Frontend Components:
1. **Utility Function**: `src/utils/generateProductFromImage.ts`
2. **Form Component**: `src/pages/AddProductPage.tsx`
3. **Environment Config**: `.env`

## Deployment

No deployment changes needed. The fix is purely frontend-side and will work with the existing backend.

Simply refresh the browser and the updated code will be served.

## Troubleshooting

If you still see "401 Unauthorized" errors:

1. **Verify environment variables are loaded:**
   - Check browser console for any errors about missing env vars
   - Ensure `.env` file is in the project root

2. **Check Supabase dashboard:**
   - Verify API keys are correct
   - Confirm Edge Function is deployed and active
   - Check Edge Function logs for error details

3. **Browser console debugging:**
   - Open DevTools > Console tab
   - Look for fetch request details
   - Check response headers and status

4. **Network tab debugging:**
   - Open DevTools > Network tab
   - Trigger autofill button
   - Inspect the request headers being sent
   - Verify all headers are present
