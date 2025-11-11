# Frontend-Backend Compatibility & RLS Configuration Guide

**Date:** November 11, 2025  
**Project:** GoCart - Ecommerce Application  
**Status:** Backend takes priority (RLS policies enforce security)

---

## 1. Environment Variables: Current State ✓

### Approved Configuration (`.env`)

Your `.env` file now has the correct structure:

```properties
# Frontend-safe keys (VITE prefix = embedded in browser)
VITE_SUPABASE_PROJECT_ID="qlhpzsucftqcakiotgpc"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."      # Anon key - safe for public
VITE_SUPABASE_URL="https://qlhpzsucftqcakiotgpc.supabase.co"

# Server-only key (NO VITE prefix = not exposed to browser)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."          # Service role - for scripts/migrations only
```

**Why this matters:**
- `VITE_` prefix → embedded in compiled JavaScript bundle → **safe to expose**
- No `VITE_` prefix → loaded by Node.js scripts only → **never exposed to browser**
- Service role key is highly privileged (can bypass RLS) → must stay server-side

---

## 2. Frontend Configuration ✓

### Supabase Client (`src/integrations/supabase/client.ts`)

**Current state: CORRECT**

The frontend client correctly uses:
- `VITE_SUPABASE_URL` (public)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key - public)
- **Never uses** the service role key

```typescript
// ✓ This is correct - anon key for browser
const supabase = createClient<Database>(
  SUPABASE_URL,                     // public URL
  SUPABASE_PUBLISHABLE_KEY,         // anon key
  { auth: { storage: localStorage, persistSession: true } }
);
```

**No changes needed here.**

---

## 3. Backend Scripts: UPDATED ✓

### Fixed Files

All scripts that use the service role key have been updated to read from the non-VITE env var:

| Script | Status | Change |
|--------|--------|--------|
| `scripts/migrate.ts` | ✓ Already correct | Uses `process.env.SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/inspect_supabase.js` | ✓ Already correct | Uses `process.env.SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/check-migration.ts` | ✓ **FIXED** | Was: `VITE_SUPABASE_SERVICE_ROLE_KEY` → Now: `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/add_status_column.ts` | ✓ **FIXED** | Was: `VITE_SUPABASE_SERVICE_ROLE_KEY` → Now: `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/check_supabase.js` | ✓ **FIXED** | Was: `VITE_SUPABASE_SERVICE_ROLE_KEY` → Now: `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/check_supabase.mjs` | ✓ **FIXED** | Was: `VITE_SUPABASE_SERVICE_ROLE_KEY` → Now: `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/create-avatars-bucket.mjs` | ✓ Fallback chain | Tries service role first, falls back to other keys |
| `scripts/inspect_schema.ts` | ℹ️ Note | Uses publishable key (read-only) - safe for this purpose |

---

## 4. Database Schema & RLS Policies ✓

### Profiles Table

**Location:** `supabase/migrations/20251031211725_587722a5-2fb9-49c0-8471-56c016881f29.sql`

**Current RLS Policies:**

| Policy | Type | Condition | Status |
|--------|------|-----------|--------|
| "Users can view all profiles" | SELECT | `true` | ✓ Active |
| "Users can update own profile" | UPDATE | `auth.uid() = id` | ✓ Active |
| "Users can insert own profile" | INSERT | `auth.uid() = id` | ✓ Active |

**What this means:**
- ✓ Authenticated users CAN create their own profile row
- ✓ Authenticated users CAN update their own profile
- ✓ Anyone can view all profiles

**Frontend code that relies on this:**
```typescript
// In src/components/account/AccountDialog.tsx
await supabase.from('profiles').upsert({
  id: user.id,
  full_name: fullName,
  avatar_url: avatarUrl
});
```

✓ **This will succeed** because the upsert includes `id = user.id`, satisfying the RLS check `auth.uid() = id`.

---

### Storage: Avatars Bucket

**Location:** `supabase/migrations/20251110000005_setup_avatar_storage.sql`

**Bucket Configuration:**
- Name: `avatars`
- Access: Public (anyone can READ public URLs)
- RLS: Enabled

**Current RLS Policies:**

| Policy | Type | Condition | Status |
|--------|------|-----------|--------|
| "Public Access" | SELECT | `bucket_id = 'avatars'` | ✓ Active |
| "Users Can Upload Avatar" | INSERT | `bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()` | ✓ Active |
| "Users Can Update Own Avatar" | UPDATE | Same as INSERT | ✓ Active |
| "Users Can Delete Own Avatar" | DELETE | Same as INSERT | ✓ Active |

**What this means:**
- ✓ Authenticated users CAN upload files to `<their-uid>/*`
- ✓ Authenticated users CAN delete their own files
- ✓ Anyone can READ (view) avatars
- ✗ Users CANNOT upload to other user's folders

**Frontend code that relies on this:**
```typescript
// In src/components/account/AccountDialog.tsx
const filePath = `${user.id}/${Date.now()}.${fileExt}`;
const { error: uploadError } = await storage.from('avatars').upload(filePath, file);
```

✓ **This will succeed** because:
1. User is authenticated
2. File path starts with `auth.uid()` (the user's own ID)
3. Policy allows INSERT under that path

---

## 5. Architecture: Frontend → Backend Flow

### Happy Path (Avatar Upload + Profile Save)

```
1. Frontend (browser)
   ↓
   User clicks "Upload Avatar" in AccountDialog
   ↓
2. File Validation (client-side)
   - Check file type (must be image/*)
   - Check file size (< 2MB)
   - Check extension (png, jpg, jpeg, gif, webp)
   ↓
3. Upload to Storage
   POST /storage/v1/object/avatars/{user.id}/{timestamp}.{ext}
   ↓ (uses VITE_SUPABASE_PUBLISHABLE_KEY)
   ↓
4. Supabase Storage RLS Check (BACKEND)
   - Is auth.uid() == (foldername(path))[1]?
   - ✓ YES → Allow INSERT
   - ✗ NO → "new row violates row-level security policy"
   ↓
5. Get Public URL
   POST /storage/v1/object/avatars/{user.id}/{timestamp}.{ext}/sign
   → Returns: https://....supabase.co/storage/v1/object/public/avatars/{user.id}/{timestamp}.{ext}
   ↓
6. Update Auth User Metadata
   POST /auth/v1/user
   - Updates auth.users.user_metadata.avatar_url
   ↓ (uses VITE_SUPABASE_PUBLISHABLE_KEY)
   ↓
7. Upsert Profile Row
   POST /rest/v1/profiles?upsert=true
   Body: { id: user.id, avatar_url: "https://...", full_name: "..." }
   ↓ (uses VITE_SUPABASE_PUBLISHABLE_KEY)
   ↓
8. Supabase RLS Check (BACKEND)
   - Is auth.uid() == profiles.id?
   - ✓ YES → Allow UPSERT
   - ✗ NO → "new row violates row-level security policy"
   ↓
9. Success! Profile saved with avatar
```

### Error: "new row violates row-level security policy"

If you see this error when uploading an avatar:

**Likely causes (in order of probability):**

1. **Storage policy not applied yet**
   - Solution: Run migrations manually in Supabase → SQL editor
   - Migration: `supabase/migrations/20251110000005_setup_avatar_storage.sql`

2. **Profiles table RLS not properly configured**
   - Solution: Verify RLS policies exist in Supabase dashboard
   - Path: Database → Tables → profiles → RLS Policies
   - Should see: "Users can insert own profile", "Users can update own profile"

3. **User not authenticated**
   - Solution: Ensure user is logged in before uploading
   - Check: Open browser DevTools → Application → LocalStorage
   - Look for: `sb-<project-id>-auth-token` entry

4. **Bucket doesn't exist**
   - Solution: Manually create "avatars" bucket in Supabase Storage
   - Mark as public if using public URLs

---

## 6. How Backend Takes Priority (RLS Enforcement)

The backend (Supabase RLS policies) always has the final say:

```
Frontend attempts operation
           ↓
Frontend validation passes ✓
           ↓
Frontend sends request with VITE_SUPABASE_PUBLISHABLE_KEY
           ↓
Supabase checks: Is user authenticated? → Is RLS policy satisfied?
           ↓
RLS policy says NO ✗
           ↓
Request blocked (403 Forbidden)
Frontend receives error: "new row violates row-level security policy"
```

**Example:**
- Frontend allows uploading an avatar (client-side validation passes)
- But the storage RLS policy says: "only upload under your own uid folder"
- User tries to upload to `/other-user-id/avatar.jpg`
- Backend blocks it ✓ (RLS policy takes precedence)

---

## 7. Deployment & Production Readiness

### Environment Variables on Deployment

**Local Development (.env):**
```properties
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...        # Server-side only
```

**Deployment (CI/CD):**

Set in your hosting platform (Vercel, Netlify, Railway, etc.):

| Variable | Visibility | Purpose |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | Public (embedded in JS) | Frontend connections |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (embedded in JS) | Frontend auth/data access |
| `VITE_SUPABASE_PROJECT_ID` | Public (embedded in JS) | Frontend config |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** (env only, not in built JS) | Backend scripts/migrations |

**Never set:**
- ~~`VITE_SUPABASE_SERVICE_ROLE_KEY`~~ ← This would expose the service key in the browser!

---

## 8. Testing Checklist ✓

After making these changes, test the following locally:

### 1. Dev Server Startup
```bash
npm install
npm run dev
```
- ✓ Server starts without errors
- ✓ No "Cannot find VITE_SUPABASE_SERVICE_ROLE_KEY" errors

### 2. Frontend Auth
- ✓ Can sign up / log in
- ✓ Auth token stored in localStorage

### 3. Avatar Upload (Critical)
1. Log in to the app
2. Open Account dialog (click your avatar/name)
3. Click "Upload" and select an image
4. **Expected result:** Avatar uploads, profile saves, no RLS error
5. **If error:** See section 5 "Error: new row violates..."

### 4. Profile Update
1. Change full name in Account dialog
2. Click "Update profile"
3. **Expected result:** Profile saves successfully

### 5. Database Access (if you run scripts)
```bash
npm run migrate              # Should work with SUPABASE_SERVICE_ROLE_KEY
node scripts/check_supabase.js  # Should work with SUPABASE_SERVICE_ROLE_KEY
```

### 6. Browser DevTools Check
- Open DevTools → Application → LocalStorage
- Look for `sb-<project-id>-auth-token`
- Should see a valid JWT token with `"aud":"authenticated"`
- Should NOT see the service role key anywhere

---

## 9. Summary of Changes Made

| Component | What Changed | Why | Status |
|-----------|-------------|-----|--------|
| `.env` | Moved service key from `VITE_SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_SERVICE_ROLE_KEY` | Prevents exposure to browser | ✓ Done |
| Frontend client | No changes | Already using publishable key correctly | ✓ Verified |
| `scripts/check-migration.ts` | Updated env var reference | Read from correct non-VITE var | ✓ Fixed |
| `scripts/add_status_column.ts` | Updated env var reference | Read from correct non-VITE var | ✓ Fixed |
| `scripts/check_supabase.js` | Updated env var reference | Read from correct non-VITE var | ✓ Fixed |
| `scripts/check_supabase.mjs` | Updated env var reference | Read from correct non-VITE var | ✓ Fixed |
| RLS Policies | No changes needed | Already properly configured in migrations | ✓ Verified |

---

## 10. Next Steps

### Immediate (Do This Now)
1. ✓ Restart dev server: `npm run dev`
2. ✓ Test avatar upload in the Account dialog
3. ✓ Verify no "VITE_SUPABASE_SERVICE_ROLE_KEY" errors in terminal

### Before Going to Production
1. ✓ Set env vars on your deployment platform (Vercel, Netlify, etc.)
2. ✓ **IMPORTANT:** Use `SUPABASE_SERVICE_ROLE_KEY` (no VITE prefix) in secrets
3. ✓ **IMPORTANT:** Never check `.env` into git (add to `.gitignore`)
4. ✓ Run full test suite and manual QA

### Optional: Monitoring
- Set up Supabase usage dashboard to monitor RLS policy violations
- Create alerts if error rate spikes (may indicate policy issues)

---

## 11. Reference: Supabase Security Best Practices

**Frontend (Client) Authentication:**
- ✓ Use **Publishable Key** (Anon Key) - this is intentionally public
- ✓ RLS policies enforce security, not the key secrecy
- ✓ All operations are subject to RLS checks

**Backend (Server) Operations:**
- ✓ Use **Service Role Key** - keep this SECRET
- ✓ Never embed in frontend code
- ✓ Service role can bypass RLS (use carefully!)
- ✓ Only use on server-side scripts, backend APIs, migrations

**RLS Policies:**
- ✓ Always check `auth.uid()` to identify current user
- ✓ Use `WITH CHECK` for INSERT/UPDATE to prevent unauthorized writes
- ✓ Test policies with different user contexts

---

## Questions or Issues?

If you encounter an error:

1. **Check the error message** - it usually tells you exactly what failed
2. **Verify RLS policy** exists in Supabase dashboard
3. **Check auth token** in localStorage is valid
4. **Look at migration files** in `supabase/migrations/` to understand the schema

For detailed Supabase docs, see: https://supabase.com/docs/guides/auth/row-level-security

---

**Document Version:** 1.0  
**Last Updated:** November 11, 2025
