# Quick Start: Verification Checklist

**Purpose:** Verify backend-frontend compatibility after env var changes  
**Time Required:** ~5 minutes  
**Priority:** HIGH - Do this immediately

---

## ✅ Step 1: Verify Environment File

```bash
# Check your .env file has:
VITE_SUPABASE_PROJECT_ID="..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."    # ← NO VITE prefix!
```

**Expected:** 4 variables, service role key without VITE prefix  
**Status:** ☐ Verified

---

## ✅ Step 2: Restart Development Server

```bash
# Stop current server (Ctrl+C if running)

# Clear cache and reinstall
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Watch For:**
- ❌ DO NOT see: `"Cannot find VITE_SUPABASE_SERVICE_ROLE_KEY"`
- ❌ DO NOT see: `"SUPABASE_SERVICE_ROLE_KEY undefined"`
- ✅ Should see normal startup

**Status:** ☐ Verified

---

## ✅ Step 3: Check Browser Console (No Errors)

1. Open app at `http://localhost:5173`
2. Open **DevTools** (F12 or Right-click → Inspect)
3. Go to **Console** tab
4. Look for any red errors

**Expected:** No Supabase-related errors  
**Status:** ☐ Verified

---

## ✅ Step 4: Check LocalStorage (Auth Token Present)

In **DevTools → Application → LocalStorage**:

Look for keys containing `supabase` or `sb-`:
- Should see: `sb-{project-id}-auth-token` or similar
- Should contain valid JWT with `"aud":"authenticated"` OR empty if not logged in

**Do NOT see:**
- ❌ Any keys containing "SERVICE_ROLE"
- ❌ Any keys with service role JWT

**Status:** ☐ Verified

---

## ✅ Step 5: Test Authentication Flow

1. **Sign Up / Log In** to the app
   - Navigate to Auth page
   - Create test account or log in
   - Should succeed without errors

2. **Check auth persists** after refresh
   - Refresh browser (F5)
   - Should still be logged in
   - User info displays

**Expected:** Auth works, no RLS errors  
**Status:** ☐ Verified

---

## ✅ Step 6: Test Avatar Upload (Critical Path)

1. **Click your avatar** in top-right or open Account dialog
2. **Upload an image**
   - Click "Upload" button
   - Select any image file (< 2MB, jpg/png/gif/webp)
   - Wait for upload to complete

3. **Check result:**
   - ✅ Success: Avatar displays, toast shows "Uploaded"
   - ❌ Error: Toast shows "Upload failed" → See Troubleshooting below

4. **Save profile**
   - Change full name to something different
   - Click "Update profile"
   - Should save without RLS error

**Expected:** No "violates row-level security policy" errors  
**Status:** ☐ Verified

---

## ✅ Step 7: Run a Script (Optional)

If you want to verify script env var access:

```bash
# Example: Check Supabase connection
node scripts/check_supabase.js

# Or
npm run check-migration
```

**Expected Output:** Should connect successfully without env var errors  
**Status:** ☐ Verified (Optional)

---

## 🚨 Troubleshooting

### Issue: "Cannot find VITE_SUPABASE_SERVICE_ROLE_KEY"

**Cause:** Vite is still trying to load the old env var  
**Fix:**
1. Stop dev server
2. Delete `node_modules` and `.vite` cache:
   ```bash
   rm -r node_modules .vite
   npm install
   npm run dev
   ```
3. Restart

### Issue: "Upload failed: new row violates row-level security policy"

**Cause:** RLS policies not properly set up on backend  
**Fix:**
1. Go to **Supabase Dashboard → SQL Editor**
2. Copy-paste the entire SQL from:
   ```
   supabase/migrations/20251110000005_setup_avatar_storage.sql
   ```
3. Click **Run** to apply policies
4. Try upload again

### Issue: Auth token not appearing in localStorage

**Cause:** Supabase client not initialized properly  
**Fix:**
1. Check browser console for errors
2. Verify `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Try logging in again
4. Check that auth redirect URLs are configured in Supabase dashboard

### Issue: Profile upsert fails but storage upload succeeds

**Cause:** Profiles table RLS policy not applied  
**Fix:**
1. Go to **Supabase Dashboard → SQL Editor**
2. Run:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
3. Should see at least:
   - "Users can insert own profile"
   - "Users can update own profile"
4. If missing, re-run migration:
   ```
   supabase/migrations/20251031211725_587722a5-2fb9-49c0-8471-56c016881f29.sql
   ```

---

## ✅ All Steps Verified?

If all checkboxes are marked, your frontend-backend compatibility is **GOOD TO GO** ✨

**Next steps:**
- Continue development
- Test other features
- Deploy to staging when ready

---

## 📋 Summary of Changes

**Files Updated:**
- ✅ `.env` - Renamed `VITE_SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `scripts/check-migration.ts` - Updated env var reference
- ✅ `scripts/add_status_column.ts` - Updated env var reference
- ✅ `scripts/check_supabase.js` - Updated env var reference
- ✅ `scripts/check_supabase.mjs` - Updated env var reference

**What Stays the Same:**
- ✅ Frontend client (`src/integrations/supabase/client.ts`) - No changes needed
- ✅ Database RLS policies - Already correctly configured
- ✅ Storage bucket policies - Already correctly configured

---

**More detailed info:** See `COMPATIBILITY_AND_RLS_GUIDE.md`

**Last Updated:** November 11, 2025
