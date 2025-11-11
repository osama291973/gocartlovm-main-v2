# Architecture Diagram: Frontend-Backend Supabase Integration

---

## 1. Environment Variables Distribution

```
┌─────────────────────────────────────────────────────────────────────┐
│                      .env File (Local / Secrets)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  VITE_SUPABASE_URL                  ← Safe (public)                │
│  VITE_SUPABASE_PUBLISHABLE_KEY      ← Safe (anon key, public)     │
│  VITE_SUPABASE_PROJECT_ID           ← Safe (public)                │
│                                                                     │
│  SUPABASE_SERVICE_ROLE_KEY          ← SECRET (server-only)         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌─────────────────────┐         ┌────────────────────────┐
        │  Vite Build Process │         │  Node.js Scripts       │
        ├─────────────────────┤         ├────────────────────────┤
        │ Embeds VITE_* vars  │         │ Reads all env vars     │
        │ into compiled JS    │         │ (has access to server) │
        └────────┬────────────┘         └────────┬───────────────┘
                 │                                 │
                 ▼                                 ▼
        ┌─────────────────────┐         ┌────────────────────────┐
        │  Browser Bundle     │         │  Build Time            │
        │  (main.js, etc.)    │         │  Migrations, Setup     │
        ├─────────────────────┤         ├────────────────────────┤
        │ Contains:           │         │ Runs with service role │
        │  - VITE_URL         │         │ Can read all secrets   │
        │  - VITE_PUBKEY ✓    │         │ ✓ Secure location      │
        │  - VITE_PROJECT_ID  │         │                        │
        │                     │         └────────────────────────┘
        │ Does NOT contain:   │
        │  - VITE_SERVICE_KEY │
        │  - SUPABASE_SERVICE │
        │    _ROLE_KEY ✓      │
        └─────────────────────┘
```

---

## 2. Frontend Client: Browser Request Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                     BROWSER / FRONTEND                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: Initialize Supabase Client                                 │
│  ─────────────────────────────────────                              │
│  src/integrations/supabase/client.ts                                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ const SUPABASE_URL =                                           │ │
│  │   import.meta.env.VITE_SUPABASE_URL                           │ │
│  │                                                                │ │
│  │ const SUPABASE_PUBLISHABLE_KEY =                              │ │
│  │   import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY              │ │
│  │                                                                │ │
│  │ export const supabase = createClient(                         │ │
│  │   SUPABASE_URL,                                              │ │
│  │   SUPABASE_PUBLISHABLE_KEY,  ← ANON KEY ONLY                │ │
│  │   { auth: { persistSession: true, ... } }                   │ │
│  │ )                                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Step 2: User Action (e.g., Upload Avatar)                          │
│  ────────────────────────────────────                               │
│  src/components/account/AccountDialog.tsx                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ const filePath = `${user.id}/${timestamp}.${ext}`             │ │
│  │                                                                │ │
│  │ const { error } = await supabase.storage                     │ │
│  │   .from('avatars')                                           │ │
│  │   .upload(filePath, file)                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Step 3: Include Auth Token in Request                              │
│  ──────────────────────────────────────                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Request Headers:                                               │ │
│  │ {                                                              │ │
│  │   "Authorization": "Bearer {JWT_ANON_KEY}",                   │ │
│  │   "apikey": "{VITE_SUPABASE_PUBLISHABLE_KEY}",              │ │
│  │   "Content-Type": "multipart/form-data",                     │ │
│  │   ...                                                          │ │
│  │ }                                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Step 4: Try Operation                                              │
│  ──────────────────                                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ POST /storage/v1/object/avatars/{user_id}/{file}              │ │
│  │ Bearer: eyJ0eXAiOiJKV1QiLCJyb2xlIjoiYW5vbiIsImF1ZCI6I... │ │
│  │ With file content                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS Request
                                    ▼
```

---

## 3. Backend: Supabase RLS Policy Enforcement

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND (PostgreSQL)                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Receives Request from Browser with JWT                             │
│  ─────────────────────────────────────────                          │
│  POST /storage/v1/object/avatars/{user_id}/{file}                  │
│  Authorization: Bearer eyJ0eXAi...                                 │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Step 1: Decode & Verify JWT                                │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ JWT Payload:                                                │   │
│  │ {                                                            │   │
│  │   "iss": "supabase",                                         │   │
│  │   "aud": "authenticated",       ← User is authenticated      │   │
│  │   "sub": "{uuid}",              ← User ID (auth.uid())      │   │
│  │   "role": "authenticated"                                    │   │
│  │ }                                                            │   │
│  │                                                              │   │
│  │ JWT is valid? ✓ YES                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Step 2: Extract Request Context                             │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ auth.uid()     = "550e8400-e29b-41d4-a716-446655440000"    │   │
│  │ auth.role()    = "authenticated"                            │   │
│  │ bucket_id      = "avatars"                                  │   │
│  │ object_path    = "550e8400-e29b-41d4-a716-446655440000/1731..." │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Step 3: Check RLS Policy                                    │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │ Policy Name: "Users Can Upload Avatar"                      │   │
│  │ Policy Type: INSERT                                         │   │
│  │ Policy CHECK:                                               │   │
│  │   bucket_id = 'avatars'                                     │   │
│  │   AND auth.role() = 'authenticated'                         │   │
│  │   AND (storage.foldername(name))[1] = auth.uid()           │   │
│  │                                                              │   │
│  │ Evaluate:                                                    │   │
│  │   ✓ bucket_id = 'avatars' ← Request is for avatars         │   │
│  │   ✓ auth.role() = 'authenticated' ← User is logged in      │   │
│  │   ✓ (storage.foldername(name))[1] = auth.uid()            │   │
│  │     First folder in path = user's ID                        │   │
│  │     "550e8400.../.../1731..." → "550e8400..." = auth.uid() │   │
│  │                                                              │   │
│  │ Result: ✓✓✓ ALL CONDITIONS MET → ALLOW                    │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Step 4: Execute Operation                                   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ INSERT INTO storage.objects (                               │   │
│  │   bucket_id = 'avatars',                                    │   │
│  │   name = '550e8400.../timestamp.jpg',                       │   │
│  │   owner = auth.uid(),                                       │   │
│  │   ...                                                        │   │
│  │ )                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Step 5: Return Success                                      │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ HTTP 200 OK                                                 │   │
│  │ {                                                            │   │
│  │   "path": "550e8400.../timestamp.jpg",                      │   │
│  │   "fullPath": "avatars/550e8400.../timestamp.jpg",          │   │
│  │   "id": "..."                                               │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS Response
                                    ▼
```

---

## 4. Failure Scenario: Unauthorized Upload Attempt

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ATTACKER / UNAUTHORIZED USER                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Attempts to upload to OTHER USER's folder:                         │
│  ───────────────────────────────────────────                        │
│  POST /storage/v1/object/avatars/other-user-id/photo.jpg           │
│  Authorization: Bearer eyJ0eXAi...{attacker-token}...              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND (PostgreSQL)                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1-2: JWT Decoded                                              │
│  ─────────────────────                                              │
│  auth.uid() = "attacker-uuid"  (not "other-user-id")              │
│                                                                      │
│  Step 3: Check RLS Policy                                           │
│  ─────────────────────────                                          │
│  Policy CHECK:                                                       │
│    bucket_id = 'avatars'              ✓ YES                         │
│    AND auth.role() = 'authenticated'  ✓ YES                         │
│    AND (storage.foldername(name))[1] = auth.uid()                  │
│       (storage.foldername(name))[1] = "other-user-id"              │
│       auth.uid() = "attacker-uuid"                                  │
│       "other-user-id" != "attacker-uuid"  ✗✗✗ MISMATCH!           │
│                                                                      │
│  Result: ✗ POLICY VIOLATION → REQUEST DENIED                       │
│                                                                      │
│  Return HTTP 403 Forbidden:                                          │
│  ─────────────────────────────                                      │
│  {                                                                   │
│    "error": "new row violates row-level security policy",          │
│    "code": "PGRST"                                                  │
│  }                                                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BROWSER / FRONTEND                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Receives Error Response                                            │
│  ────────────────────────                                           │
│  toast({ title: 'Upload failed',                                    │
│          description: 'new row violates row-level security policy', │
│          variant: 'destructive' })                                  │
│                                                                      │
│  ✓ Attack prevented! Backend enforced permissions.                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow: Profile Update with Avatar

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser: User Saves Profile (Upload Avatar + Save Metadata)    │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┬─────────────┐
                │                       │             │
                ▼                       ▼             ▼
        ┌──────────────┐        ┌──────────────┐  ┌──────────┐
        │ 1. Upload    │        │ 2. Update    │  │ 3.Update │
        │   Avatar     │        │   Auth User  │  │  Profile │
        │   File       │        │   Metadata   │  │   Row    │
        └──────────────┘        └──────────────┘  └──────────┘
                │                       │             │
                │ POST                  │ POST        │ POST
                │ /storage/..           │ /auth/..    │ /rest/
                │                       │             │
                ▼ RLS Check             ▼ RLS Check   ▼ RLS Check
        ┌──────────────────────────────────────────────────────┐
        │ SUPABASE RLS POLICIES ENFORCE AT EACH STEP           │
        ├──────────────────────────────────────────────────────┤
        │                                                      │
        │ Upload:   (storage.foldername(name))[1] = auth.uid()│
        │           ✓ Path starts with user's ID              │
        │           → File saved to storage                    │
        │                                                      │
        │ Metadata: (Usually no table RLS needed)             │
        │           ✓ Part of auth.users (system table)       │
        │           → Metadata updated                        │
        │                                                      │
        │ Profile:  auth.uid() = profiles.id                  │
        │           ✓ User updating their own row             │
        │           → Row upserted                            │
        │                                                      │
        │ Result: ✓✓✓ All operations succeeded                │
        │                                                      │
        └──────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌─────────────────────┐
                │ Browser: Show       │
                │ Success Toast &     │
                │ Reload Avatar       │
                └─────────────────────┘
```

---

## 6. Environment Variables: Which Key Where

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUPABASE_PUBLISHABLE_KEY (Anon Key)                                │
├─────────────────────────────────────────────────────────────────────┤
│  Can be embedded in frontend                      [VITE_ prefix]   │
│                                                                     │
│  Purpose: Browser client auth & requests with user permissions    │
│  Security: Limited by RLS policies (cannot bypass)                │
│  Exposure: OK if exposed (designed for public use)                │
│                                                                     │
│  Usage:                                                            │
│    ✓ Frontend: createClient(url, publishableKey)                 │
│    ✗ Backend: Should not need to use this for admin operations   │
│                                                                     │
│  Where:                                                            │
│    ✓ .env: VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."               │
│    ✓ Frontend: src/integrations/supabase/client.ts               │
│    ✓ Browser: Embedded in main.js, visible in source             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SUPABASE_SERVICE_ROLE_KEY                                          │
├─────────────────────────────────────────────────────────────────────┤
│  Must NOT be embedded in frontend               [No VITE_ prefix]  │
│                                                                     │
│  Purpose: Server-side operations (bypass RLS, admin tasks)        │
│  Security: Can bypass all RLS policies (admin access)             │
│  Exposure: CATASTROPHIC if exposed to browser! (anyone is admin) │
│                                                                     │
│  Usage:                                                            │
│    ✓ Backend: Migrations, setup scripts                          │
│    ✓ Backend: Custom API endpoints (if you have them)            │
│    ✗ Frontend: NEVER!                                            │
│    ✗ DevTools console: NEVER!                                    │
│                                                                     │
│  Where:                                                            │
│    ✓ .env: SUPABASE_SERVICE_ROLE_KEY="eyJ..."  (no VITE)        │
│    ✓ .gitignore: (never checked into repo)                       │
│    ✓ CI/CD Secrets: Only set in GitHub Actions, etc (not build)  │
│    ✓ Deployment Env: Set as SECRET (not public build var)        │
│    ✗ NOT in: Frontend code, browser, public vars                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Layers: Defense in Depth

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ATTACK SURFACE & DEFENSES                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Layer 1: Key Management                                            │
│  ──────────────────────                                             │
│   Frontend:  Uses publishable key only ✓                           │
│   Backend:   Uses service role key only ✓                          │
│   Exposure:  Service key not in browser ✓                          │
│                                                                     │
│  Layer 2: Database RLS Policies                                     │
│  ────────────────────────────────                                   │
│   Profiles table: auth.uid() = id ✓                                │
│   Storage objects: auth.uid() = first_folder ✓                    │
│   User roles: auth.uid() = user_id (for own) ✓                    │
│                                                                     │
│  Layer 3: Network Security                                          │
│  ─────────────────────────                                          │
│   HTTPS only: All connections encrypted ✓                         │
│   JWT tokens: Signed and verified ✓                               │
│   Tokens expire: Session expires, refresh token rotates ✓         │
│                                                                     │
│  Layer 4: Behavioral Restrictions                                   │
│  ─────────────────────────────────                                  │
│   Client-side validation: File type, size, etc. ✓                 │
│   (But this is NOT a security layer - it's UX)                    │
│   Server-side enforces policy regardless ✓                        │
│                                                                     │
│  Result:                                                            │
│  ────────                                                           │
│  Even if frontend validation is bypassed,                          │
│  or if someone tries to forge requests,                            │
│  Supabase RLS policies prevent unauthorized access ✓               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Summary: Trust the Backend

```
                        FRONTEND REQUEST
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Is JWT valid?      │
                   │  Signed by Supabase?│
                   └────────┬────────────┘
                            │
                       YES  │  NO
                            │  →→ 401 Unauthorized
                            ▼
                   ┌─────────────────────┐
                   │  Extract auth.uid() │
                   │  Extract auth.role()│
                   └────────┬────────────┘
                            │
                            ▼
                   ┌─────────────────────┐
                   │  Check RLS Policy   │
                   │  Does it apply?     │
                   │  Conditions met?    │
                   └────────┬────────────┘
                            │
                       YES  │  NO
                            │  →→ 403 Forbidden
                            ▼
                   ┌─────────────────────┐
                   │  Execute Operation  │
                   │  Query DB/Storage   │
                   └────────┬────────────┘
                            │
                            ▼
                   ┌─────────────────────┐
                   │  Return Data/Result │
                   │  Respond to Client  │
                   └─────────────────────┘


KEY PRINCIPLE:
──────────────
The backend (Supabase) is the trusted authority.
The frontend cannot bypass backend security.
RLS policies are enforced on EVERY request.
Never trust frontend validation alone.

Frontend Security = UX Enhancement + First-line validation
Backend Security = Actual enforcement + Final authority
```

---

**Created:** November 11, 2025  
**Applies to:** GoCart eCommerce Application  
**Status:** ✓ Complete & Verified
