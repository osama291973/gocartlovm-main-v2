# 🎯 HYBRID MODE - VISUAL FLOW DIAGRAMS

## Complete Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│ USER: Upload Image + Click "Autofill"                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ EDGE FUNCTION STARTS                                            │
│ hybrid mode enabled ✅                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
        ┌────────────────────────────────┐
        │ Check OPENAI_API_KEY exists?   │
        └────┬──────────────────────┬────┘
             │                      │
         YES │                      │ NO
             │                      │
             ↓                      ↓
      ┌────────────────┐   ┌──────────────────────┐
      │ Try OpenAI API │   │ Skip OpenAI directly │
      └────┬───────────┘   └─────────┬────────────┘
           │                         │
           ↓                         │
    ┌──────────────────┐             │
    │ OpenAI Response? │             │
    └────┬──────┬──────┘             │
         │      │                    │
     200 │      │ 429 (Quota)        │
    OK   │      │ or 401 (Auth)      │
         │      │ or other error     │
         │      └────────────┬───────┴─────────┐
         │                   │                 │
         ↓                   ↓                 │
  ┌────────────────┐  ┌──────────────────┐    │
  │ SUCCESS! ✅    │  │ Log: Using       │    │
  │ Use OpenAI     │  │ fallback...      │    │
  │ results        │  └─────────┬────────┘    │
  │                │            │             │
  │ provider:      │            ↓             │
  │ "openai"       │  ┌──────────────────┐    │
  └────┬───────────┘  │ Try HuggingFace  │◄───┘
       │              └─────────┬────────┘
       │                        │
       │                        ↓
       │              ┌──────────────────┐
       │              │ HF Response?     │
       │              └────┬──────┬──────┘
       │                   │      │
       │               200 │      │ Error
       │              OK   │      │
       │                   │      │
       │                   ↓      ↓
       │         ┌──────────┐  ┌─────────────┐
       │         │ SUCCESS! │  │ Error ❌    │
       │         │ Use HF   │  │ Return error│
       │         │ results  │  │ to user     │
       │         │          │  │             │
       │         │ provider:│  └─────────────┘
       │         │"hugging" │
       │         │face"     │
       │         └────┬─────┘
       │              │
       └──────┬───────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│ RETURN RESPONSE TO FRONTEND                                     │
│ {                                                               │
│   "success": true,                                             │
│   "provider": "openai" OR "huggingface",                       │
│   "generated": {                                               │
│     "en": { name, description, slug },                         │
│     "ar": { name, description }                                │
│   }                                                             │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: Fill Form with Response Data                          │
│ Show toast: "Autofill applied (via OpenAI/HuggingFace)"       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Provider Comparison Side-by-Side

```
┌──────────────────────────────────┬──────────────────────────────────┐
│        OPENAI (Premium)          │    HUGGINGFACE (Free Fallback)   │
├──────────────────────────────────┼──────────────────────────────────┤
│ Model: gpt-4o-mini              │ Model: BLIP + Helsinki-NLP        │
│                                  │                                  │
│ Quality: ⭐⭐⭐⭐⭐             │ Quality: ⭐⭐⭐⭐                │
│ Speed: ~2 seconds               │ Speed: ~3 seconds                │
│ Cost: ~$0.01/request            │ Cost: $0.00 (FREE!)             │
│ Quota: Yes (rate limited)       │ Quota: No                        │
│ API Key: Required               │ API Key: Not needed              │
│ Auth: Bearer token              │ Auth: None                       │
│ Complexity: High (vision model) │ Complexity: Medium               │
│                                  │                                  │
│ BEST FOR:                        │ BEST FOR:                       │
│ - Budget available              │ - No budget                      │
│ - Premium quality needed        │ - Unlimited requests            │
│ - Complex products              │ - Simple products               │
│ - High-end images              │ - Quick fallback                │
│                                  │                                  │
│ EXAMPLE OUTPUT:                  │ EXAMPLE OUTPUT:                  │
│ ─────────────────────────────    │ ─────────────────────────────   │
│ Name: "Premium Wireless Headset" │ Name: "headset"                │
│ Desc: "High-quality audio..      │ Desc: "a product with..."     │
│       noise cancellation..."     │                                 │
└──────────────────────────────────┴──────────────────────────────────┘
```

---

## Real-World Usage Scenarios

### Scenario A: Normal Day (OpenAI Available)

```
Day with budget available, OpenAI quota not exceeded

Request #1: Upload laptop image → OpenAI (200 OK) ✅ provider: "openai"
Request #2: Upload phone image → OpenAI (200 OK) ✅ provider: "openai"
Request #3: Upload watch image → OpenAI (200 OK) ✅ provider: "openai"

Cost: $0.03
Quality: ⭐⭐⭐⭐⭐
Provider used: 100% OpenAI

Timeline:
─────────────────────────────────────
│ 8am  ✅ OpenAI
│ 11am ✅ OpenAI
│ 2pm  ✅ OpenAI
│ 5pm  ✅ OpenAI
└─────────────────────────────────────
```

### Scenario B: High Volume Day (Quota Exceeded)

```
Day with 500+ autofill requests, OpenAI quota exceeded

Request #1-200: OpenAI (200 OK) ✅ provider: "openai"
Request #201: OpenAI (429 RATE LIMITED) ❌
              Fall back to HuggingFace (200 OK) ✅ provider: "huggingface"
Request #202-500: HuggingFace (200 OK) ✅ provider: "huggingface"

Cost: ~$2.00
Quality: ⭐⭐⭐⭐⭐ then ⭐⭐⭐⭐
Provider split: 40% OpenAI, 60% HuggingFace

Timeline:
─────────────────────────────────────
│ 8am-10am ✅ OpenAI only
│ 10am ⚠️ Quota hit!
│ 10am-8pm 🔄 HuggingFace fallback
│ 8pm     ✅ Quota reset (daily limit)
│ 8pm+    ✅ OpenAI again
└─────────────────────────────────────
```

### Scenario C: No OpenAI Key (Free Mode)

```
OpenAI key not configured yet

Request #1: Check for key ❌ Not found
           Use HuggingFace (200 OK) ✅ provider: "huggingface"
Request #2: Check for key ❌ Not found
           Use HuggingFace (200 OK) ✅ provider: "huggingface"
Request #3: Check for key ❌ Not found
           Use HuggingFace (200 OK) ✅ provider: "huggingface"

Cost: $0.00 (completely free!)
Quality: ⭐⭐⭐⭐
Provider used: 100% HuggingFace

Timeline:
─────────────────────────────────────
│ All day 🟢 HuggingFace (free)
│ ...
│ (until you add OpenAI key)
└─────────────────────────────────────
```

### Scenario D: Budget Exhausted (OpenAI Disabled)

```
You've spent budget, chose to disable OpenAI

Request #1: Check for key ❌ Disabled
           Use HuggingFace (200 OK) ✅ provider: "huggingface"
Request #2: Check for key ❌ Disabled
           Use HuggingFace (200 OK) ✅ provider: "huggingface"
...continues for rest of month...

Cost: $0.00 (no charge)
Quality: ⭐⭐⭐⭐ (good enough)
Provider used: 100% HuggingFace

SOLUTION: Remove/disable OpenAI key to stop charges
Supabase Dashboard → Settings → Secrets → Toggle OPENAI_API_KEY OFF
```

---

## Architecture Diagram - Detailed Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Your Application                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  AddProductPage.tsx                                          │   │
│  │  ┌─────────────────────────┐                               │   │
│  │  │ 1. User uploads image   │                               │   │
│  │  │ 2. User clicks autofill │                               │   │
│  │  │ 3. Shows "Generating..."│                               │   │
│  │  └────────────┬────────────┘                               │   │
│  └───────────────┼───────────────────────────────────────────┘   │
└────────────────────┼────────────────────────────────────────────────┘
                     │ HTTP POST
                     │ {imageUrl, language, storeId}
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  Supabase Edge Function                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: Validate Input                                      │   │
│  │  - Check imageUrl exists ✅                                 │   │
│  │  - Check language is en/ar ✅                               │   │
│  │  - Check storeId exists ✅                                  │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: Check Environment                                   │   │
│  │  - Read: Deno.env.get("OPENAI_API_KEY")                     │   │
│  │  - If exists: Continue to OpenAI attempt                    │   │
│  │  - If missing: Skip to HuggingFace                          │   │
│  └────────────┬───────┬─────────────────────────────────────┘   │
│               │       │                                        │
│           KEY EXISTS  NO KEY                                   │
│             YES       │                                        │
│               │       └──────────────┐                         │
│               ↓                      │                         │
│  ┌────────────────────────────┐     │                        │
│  │ STEP 3a: Try OpenAI API    │     │                        │
│  │  - POST to OpenAI endpoint │     │                        │
│  │  - Pass image URL          │     │                        │
│  │  - Send detailed prompt    │     │                        │
│  │  - Wait for response       │     │                        │
│  └────────┬────────┬──────────┘     │                        │
│           │        │                │                        │
│       SUCCESS      ERROR            │                        │
│         (200)    (429/401/etc)      │                        │
│           │        │────────────┐   │                        │
│           │                     │   │                        │
│           ↓                     ↓   ↓                        │
│  ┌──────────────────┐  ┌────────────────────────────────┐   │
│  │ Parse response   │  │ STEP 3b: Use HuggingFace       │   │
│  │ Extract JSON     │  │  - POST to HF vision API       │   │
│  │ ✅ Done!         │  │  - Get image caption           │   │
│  │ Return with      │  │  - Extract product name        │   │
│  │ provider:        │  │  - Translate to Arabic         │   │
│  │ "openai"         │  │  ✅ Done!                      │   │
│  │                  │  │ Return with provider:          │   │
│  │                  │  │ "huggingface"                  │   │
│  └────┬─────────────┘  └────────┬─────────────────────┘   │
│       │                         │                         │
└───────┼─────────────────────────┼─────────────────────────┘
        │                         │
        │  ┌──────────────────────┘
        │  │
        ↓  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Return HTTP Response (200 OK)                                      │
│  {                                                                  │
│    "success": true,                                                │
│    "provider": "openai" OR "huggingface",  ← Shows which used     │
│    "generated": {                                                  │
│      "en": {                                                       │
│        "name": "Specific Product Name",                            │
│        "description": "Features...",                               │
│        "slug": "specific-product"                                  │
│      },                                                            │
│      "ar": {                                                       │
│        "name": "اسم المنتج",                                      │
│        "description": "الوصف..."                                  │
│      }                                                             │
│    }                                                               │
│  }                                                                 │
└────────────────┬────────────────────────────────────────────────────┘
                 │ HTTP Response
                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Your App)                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 4. Receive response                                         │   │
│  │ 5. Fill form fields:                                        │   │
│  │    - Product Name: response.generated.en.name              │   │
│  │    - Description: response.generated.en.description        │   │
│  │    - Arabic Name: response.generated.ar.name               │   │
│  │    - Arabic Desc: response.generated.ar.description        │   │
│  │ 6. Show success toast                                       │   │
│  │    "Autofill applied (via OpenAI/HuggingFace)"            │   │
│  │ 7. User sees filled form ✅                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Timeline

```
Timeline for Single Autofill Request (Hybrid Mode)

Local Time    Event                              Duration
─────────────────────────────────────────────────────────
T+0ms      User clicks "Autofill"
           ↓
T+0ms      Frontend: validate form
           ├─ imageUrl loaded? ✅
           └─ Call Edge Function
           ↓
T+50ms     Network: Request travels
           ├─ Browser → Supabase server
           └─ ~50ms latency
           ↓
T+100ms    Edge Function: Start processing
           ├─ Parse request ✅
           ├─ Validate inputs ✅
           ├─ Check OPENAI_API_KEY ✅
           └─ Ready for API call
           ↓
T+150ms    DECISION: Which provider?
           ├─ If key exists → Try OpenAI
           └─ If key missing → Use HuggingFace
           ↓
T+200ms    SCENARIO A: OpenAI available
T+200ms    ├─ POST request to OpenAI API
T+2500ms   ├─ Wait for image analysis (2.3 seconds)
T+2600ms   ├─ Parse OpenAI response ✅
T+2600ms   ├─ Build response JSON
T+2650ms   └─ Send to frontend
           ↓
T+2700ms   SCENARIO B: OpenAI not available
T+200ms    ├─ POST request to HuggingFace API
T+3000ms   ├─ Wait for image caption (2.8 seconds)
T+3100ms   ├─ Translate to Arabic
T+3300ms   ├─ Parse response ✅
T+3350ms   ├─ Build response JSON
T+3400ms   └─ Send to frontend
           ↓
T+3450ms   Network: Response travels
           ├─ Supabase → Browser
           └─ ~50ms latency
           ↓
T+3500ms   Frontend: Receive response
           ├─ Check: success = true? ✅
           ├─ Check: provider field
           ├─ Fill form with response data
           ├─ Show toast notification
           └─ User sees result!
           ↓
T+3600ms   DONE ✅

Total time for OpenAI: ~2.6 seconds (lightning fast!)
Total time for HuggingFace: ~3.4 seconds (still fast!)

Most of the time is waiting for image analysis,
not network or processing.
```

---

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────┐
│ EDGE FUNCTION ERROR HANDLING                             │
└──────────────┬───────────────────────────────────────────┘
               │
               ↓
        ┌──────────────┐
        │ Error occurs │
        └──────┬───────┘
               │
               ↓
    ┌──────────────────────┐
    │ Where did it occur?  │
    └──┬───────┬─────┬─────┘
       │       │     │
  INPUT ERROR  │     └─→ PROVIDER ERROR
  ───────────  │
       │       │      Check which provider
       │       │      ─────────────────────
   400 Status  │
       │       │      • OpenAI API error?
       │       │        → Log error
       │       │        → Try HuggingFace
       │       │        
       │       │      • HuggingFace error?
       │       │        → If OpenAI not tried yet
       │       │        → Try OpenAI
       │       │        → If both fail: error
       │       │
   (Missing    └─→ VALIDATION ERROR
    imageUrl,       ──────────────────
    etc)            
                    400 Status
                    Invalid input

    ✓ Both succeed: Return with provider info
    ✗ Both fail: Return error message
    ✓ One succeeds: Return with working provider
```

---

## Cost Analysis Chart

```
MONTHLY COST PROJECTION

Monthly Requests: 1000 images
OpenAI Cost: $0.01 per request

Scenario 1: All OpenAI (100%)
├─ 1000 × $0.01 = $10.00/month
└─ Quality: ⭐⭐⭐⭐⭐

Scenario 2: 75% OpenAI, 25% HuggingFace (typical)
├─ 750 × $0.01 = $7.50/month
├─ 250 × $0.00 = $0.00
└─ Quality: ⭐⭐⭐⭐⭐ → ⭐⭐⭐⭐

Scenario 3: 50% OpenAI, 50% HuggingFace
├─ 500 × $0.01 = $5.00/month
├─ 500 × $0.00 = $0.00
└─ Quality: ⭐⭐⭐⭐⭐ → ⭐⭐⭐⭐

Scenario 4: All HuggingFace (free mode)
├─ 1000 × $0.00 = $0.00/month
└─ Quality: ⭐⭐⭐⭐

HYBRID MODE = Smart balance ✨
```

---

## Visual State Diagram

```
EDGE FUNCTION STATE MACHINE

                    ┌─────────────────┐
                    │   IDLE STATE    │
                    │ Waiting for req │
                    └────────┬────────┘
                             │
                    Request received
                             │
                             ↓
                    ┌─────────────────┐
                    │ INPUT VALIDATION│
                    │  (Check params) │
                    └─┬───┬───────────┘
                      │   │
                  ✅  │   │ ❌ Invalid
              Valid   │   │
                      │   └──────────┐
                      ↓              │
                ┌─────────────┐      │
                │ ENV CHECK   │      │
                │ OPENAI_KEY? │      │
                └─┬─┬─────────┘      │
                  │ │                │
            YES  │ │ NO             │
                  │ │                │
                  ↓ ↓                │
         ┌─────────────┐   ┌────────┤
         │TRY OPENAI   │   │USE HF  │
         └─┬────┬──────┘   │      │
           │    │          │      │
       SUCCESS  FAIL        │      │
           │    └──────┐    │      │
           │           └──┐ │      │
           │             └─┼─┴────┐
           │               │      │
           ↓               ↓      ↓
      ┌────────────┐  ┌──────────────┐
      │ PARSE JSON │  │ TRY HF API   │
      └─────┬──────┘  └──┬────┬──────┘
            │            │    │
            │        SUCCESS FAIL
            │            │    │
            │            │    └──────┐
            │            │           │
            ↓            ↓           ↓
      ┌─────────────────────────────────┐
      │  BUILD RESPONSE                 │
      │  provider: openai | huggingface │
      │  generated: {...}               │
      └─────────────┬───────────────────┘
                    │
                    ↓
      ┌─────────────────────────────────┐
      │  RETURN JSON RESPONSE            │
      │  200 OK or 500 ERROR             │
      └─────────────┬───────────────────┘
                    │
                    ↓
      ┌─────────────────────────────────┐
      │  RETURN TO IDLE STATE            │
      │  Ready for next request          │
      └─────────────────────────────────┘

Success path: Validation → OpenAI/HF → Response
Failure path: Any error → Error response
```

---

## Provider Selection Logic Pseudocode

```javascript
async function analyzeImage(imageUrl) {
  // Step 1: Get OpenAI key from environment
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  
  // Step 2: Attempt OpenAI if key exists
  if (openaiKey) {
    try {
      const result = await callOpenAI(imageUrl, openaiKey);
      return {
        success: true,
        provider: "openai",      // ← Show which provider
        generated: result
      };
    } catch (error) {
      // Check if quota exceeded
      if (error.status === 429 || error.message.includes("quota")) {
        console.warn("OpenAI quota exceeded, falling back...");
        // Continue to HuggingFace
      } else if (error.status === 401) {
        console.warn("OpenAI auth failed, falling back...");
        // Continue to HuggingFace
      } else {
        console.warn(`OpenAI error: ${error}, falling back...`);
        // Continue to HuggingFace
      }
    }
  } else {
    console.log("OpenAI key not found, using HuggingFace...");
  }
  
  // Step 3: Fallback to HuggingFace
  try {
    const result = await callHuggingFace(imageUrl);
    return {
      success: true,
      provider: "huggingface",  // ← Show which provider
      generated: result
    };
  } catch (error) {
    return {
      success: false,
      error: `All providers failed: ${error}`
    };
  }
}
```

---

**This visual guide helps you understand the complete hybrid mode flow!** 📊
