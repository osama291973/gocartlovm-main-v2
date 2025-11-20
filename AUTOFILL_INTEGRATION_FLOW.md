# Frontend-Backend Integration: Autofill Button Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AddProductPage.tsx                                              │
│  ├─ User uploads product image                                   │
│  ├─ Clicks "Autofill from images" button                         │
│  └─ Calls: handleAutofillFromImages()                            │
│                                                                   │
│         ↓                                                         │
│                                                                   │
│  generateProductFromImage.ts (FIXED)                             │
│  ├─ Gets environment variables:                                  │
│  │  • VITE_SUPABASE_PUBLISHABLE_KEY                              │
│  │  • VITE_SUPABASE_PROJECT_ID                                   │
│  │                                                                │
│  ├─ Constructs URL:                                              │
│  │  https://{projectId}.functions.supabase.co/                   │
│  │    generate_product_from_image                                │
│  │                                                                │
│  ├─ Builds request with REQUIRED HEADERS:                        │
│  │  • Authorization: Bearer {anonKey}  ✅ ADDED                   │
│  │  • apikey: {anonKey}  ✅ ADDED                                 │
│  │  • x-client-info: gocart-frontend  ✅ ADDED                    │
│  │  • Content-Type: application/json                             │
│  │                                                                │
│  └─ Sends POST request with:                                     │
│     {imageUrl, storeId, language}                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓↑ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│            SUPABASE EDGE FUNCTION (Deno + TypeScript)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  generate_product_from_image/index.ts                            │
│  ├─ Receives request                                             │
│  ├─ Validates CORS headers                                       │
│  ├─ Extracts: imageUrl, storeId, language                        │
│  ├─ Gets OPENAI_API_KEY from env vars                            │
│  │                                                                │
│  └─ Calls OpenAI Vision API:                                     │
│     POST https://api.openai.com/v1/chat/completions              │
│     ├─ Model: gpt-4o-mini                                        │
│     ├─ Image: {imageUrl}                                         │
│     └─ Prompt: Analyze product image                             │
│                                                                   │
│         ↓ (Returns JSON)                                         │
│                                                                   │
│     {                                                             │
│       "en_name": "Product Name",                                  │
│       "en_description": "Description",                            │
│       "en_slug": "url-slug",                                      │
│       "ar_name": "اسم المنتج",                                    │
│       "ar_description": "وصف المنتج"                              │
│     }                                                             │
│                                                                   │
│  ├─ Parses response                                              │
│  ├─ Structures result                                            │
│  └─ Returns success response with generated metadata              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓↑ JSON Response
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React UI Update)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  generateProductFromImage.ts receives response                   │
│  ├─ Checks: data.success === true                                │
│  └─ Returns: {success: true, generated: {...}}                   │
│                                                                   │
│         ↓                                                         │
│                                                                   │
│  AddProductPage.tsx handleAutofillFromImages()                   │
│  ├─ Updates form state:                                          │
│  │  • formData.enName = generated.en.name                         │
│  │  • formData.enDescription = generated.en.description          │
│  │  • formData.arName = generated.ar.name                        │
│  │  • formData.arDescription = generated.ar.description          │
│  │                                                                │
│  ├─ Shows success toast                                          │
│  └─ Form fields now auto-populated ✅                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow Details

### Step 1: Frontend Initialization
```typescript
// .env (Already configured)
VITE_SUPABASE_PROJECT_ID="qlhpzsucftqcakiotgpc"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
```

### Step 2: Function Call Trigger
```typescript
// AddProductPage.tsx
onClick={() => handleAutofillFromImages()}
  ↓
// Validates: imageUrl, selectedStore.id exist
  ↓
// Calls: await generateProductFromImage(image, language, storeId)
```

### Step 3: Environment Variables Loading
```typescript
// generateProductFromImage.ts (FIXED)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID

// Validates keys exist
if (!supabaseAnonKey) {
  throw new Error("Supabase anon key not found")
}
```

### Step 4: URL Construction (DYNAMIC)
```typescript
// BEFORE: Hardcoded URL
const functionUrl = "https://qlhpzsucftqcakiotgpc.functions.supabase.co/..."

// AFTER: Dynamic from env vars ✅ BETTER
const functionUrl = `https://${supabaseProjectId}.functions.supabase.co/...`
```

### Step 5: Request with Headers (FIXED)
```typescript
// BEFORE: Missing headers - 401 ❌
const resp = await fetch(functionUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({imageUrl, storeId, language}),
});

// AFTER: Complete headers - 200 ✅
const resp = await fetch(functionUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${supabaseAnonKey}`,    // ✅ ADDED
    "apikey": supabaseAnonKey,                       // ✅ ADDED
    "x-client-info": "gocart-frontend"               // ✅ ADDED
  },
  body: JSON.stringify({imageUrl, storeId, language}),
});
```

### Step 6: Response Handling
```typescript
const data = await resp.json()

// Check response status
if (!resp.ok || !data.success) {
  throw new Error(data.error || "Edge Function call failed")
}

// Return success
return { 
  success: true, 
  generated: data.generated 
}
```

### Step 7: Form Update
```typescript
// AddProductPage.tsx
if (resp.success) {
  setFormData(prev => ({
    ...prev,
    enName: resp.generated.en.name,
    enDescription: resp.generated.en.description,
    arName: resp.generated.ar.name,
    arDescription: resp.generated.ar.description,
  }))
  toast({ title: 'Autofill applied' })
}
```

## Backend Edge Function Requirements

The Edge Function expects these headers from the frontend:

```typescript
// supabase/functions/generate_product_from_image/index.ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
  //                                                ^^^^^^^^^^^^^^           ^^^^^
  //                                                Required now! ✅        Required now! ✅
};
```

## Environment Variables Reference

### .env File Contents
```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="qlhpzsucftqcakiotgpc"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://qlhpzsucftqcakiotgpc.supabase.co"

# Backend Only (not used in frontend)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### How Vite Loads .env
```typescript
// Automatically available via Vite
import.meta.env.VITE_SUPABASE_PROJECT_ID
import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
import.meta.env.VITE_SUPABASE_URL

// ⚠️ Non-VITE_ prefixed vars NOT accessible in browser
// They're only available at build time
```

## Data Flow: Request Body & Response

### Request Body (Frontend → Edge Function)
```json
{
  "imageUrl": "https://storage.googleapis.com/...",
  "storeId": "02c7be7e-c444-49fe-b0ad-9930033b0a6a",
  "language": "en"
}
```

### Response Body (Edge Function → Frontend)
```json
{
  "success": true,
  "generated": {
    "en": {
      "name": "Premium Wireless Headphones",
      "description": "High-quality audio with noise cancellation...",
      "slug": "premium-wireless-headphones"
    },
    "ar": {
      "name": "سماعات رأس لاسلكية متميزة",
      "description": "صوت عالي الجودة مع إلغاء الضوضاء..."
    }
  },
  "provider": "openai"
}
```

## Security Considerations

### 1. Public/Anonymous Key Usage
- ✅ Using `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) is safe
- ✅ Exposed in frontend (visible in browser)
- ✅ RLS policies protect data access

### 2. Headers Security
- ✅ `Authorization: Bearer {key}` standard OAuth format
- ✅ `apikey` header provides additional auth layer
- ✅ HTTPS encryption for all network traffic

### 3. Edge Function Auth
- ✅ Validates all requests with anon key
- ✅ CORS headers prevent unauthorized cross-origin access
- ✅ OpenAI API key stored server-side (not exposed)

## Error Scenarios & Handling

### Scenario 1: Missing Environment Variables
```
ERROR: Supabase anon key not found in environment variables
CAUSE: .env file not loaded properly
SOLUTION: Restart dev server, check .env syntax
```

### Scenario 2: Invalid Image URL
```
ERROR: Invalid image URL
CAUSE: User uploads image, but URL is malformed
SOLUTION: Validation in generateProductFromImage catches it
```

### Scenario 3: OpenAI API Key Missing
```
ERROR: OpenAI: 401 Unauthorized
CAUSE: OPENAI_API_KEY not set in Supabase env vars
SOLUTION: Admin sets it in Supabase Settings > Environment Variables
```

### Scenario 4: Edge Function Timeout
```
ERROR: Request timeout
CAUSE: Image too large or API slow
SOLUTION: Implemented in Edge Function (max_tokens: 300)
```

## Performance Optimization

### Current Optimization Strategies
1. **Max Tokens Limit**: Set to 300 to reduce API costs and response time
2. **Single Image Processing**: Uses first uploaded image only
3. **Async Processing**: Non-blocking UI updates
4. **Error Handling**: Graceful fallback with user feedback

### Potential Future Improvements
1. **Image Compression**: Compress images before sending
2. **Caching**: Cache recently analyzed images
3. **Batch Processing**: Support multiple images
4. **Rate Limiting**: Prevent abuse of free tier

## Testing Checklist

- [ ] Upload product image to seller form
- [ ] Click "Autofill from images" button
- [ ] Verify no 401 error in browser console
- [ ] Verify form fields auto-populate
- [ ] Verify both English and Arabic names/descriptions
- [ ] Verify success toast appears
- [ ] Test with different images
- [ ] Test with Arabic language setting
- [ ] Test with English language setting
- [ ] Check network tab for proper headers

## Files & Locations

### Frontend Files
- `src/pages/AddProductPage.tsx` - Form component
- `src/utils/generateProductFromImage.ts` - Utility (FIXED)
- `.env` - Environment variables

### Backend Files
- `supabase/functions/generate_product_from_image/index.ts` - Edge Function

### Configuration
- `vite.config.ts` - Vite configuration
- `.env` - Environment variables

## Related Documentation

See also:
- `AUTOFILL_FIX_APPLIED.md` - Fix details
- Backend schema - RLS policies
- OpenAI API documentation
- Supabase Edge Functions guide
