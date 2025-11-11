# Step-by-Step Guide: Add Username Field to CreateStore Form
## ⚠️ Safe, Non-Breaking Modification

### Current Situation:
- **Form fields**: Store Name (en/ar), Description (en/ar), Email, Contact Number, Address
- **Database**: seller_applications table has: id, user_id, store_id, status, logo_url, email, contact_number, address
- **Reference page shows**: Username field (store owner/seller username) = different from Store Name

### Goal:
Add a separate "Username" field that captures the **seller's username** (display name) without affecting backend/RLS policies.

---

## STEP 1: Add Username Column to Database (Idempotent)
**File to create**: `supabase/migrations/20251115000002_add_username_to_seller_applications.sql`

```sql
-- Migration: Add username field to seller_applications table
-- This field stores the seller's display username (distinct from store name)

BEGIN;

-- Add username column (optional, nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'seller_applications'
      AND column_name = 'username'
  ) THEN
    ALTER TABLE public.seller_applications ADD COLUMN username text;
  END IF;
END
$$;

COMMIT;

-- NOTES:
-- 1. Column is nullable (backward compatible)
-- 2. Can be re-run safely (idempotent)
-- 3. No RLS changes needed
-- 4. No impact on existing applications
```

---

## STEP 2: Update apply_for_seller RPC to Accept Username
**File to update**: `supabase/migrations/20251115000001_update_apply_for_seller_rpc.sql`

**Change the RPC function signature from:**
```sql
CREATE FUNCTION public.apply_for_seller(
    store_name text,
    store_description text,
    store_logo text DEFAULT NULL,
    email text DEFAULT NULL,
    contact_number text DEFAULT NULL,
    address text DEFAULT NULL
)
```

**To:**
```sql
CREATE FUNCTION public.apply_for_seller(
    store_name text,
    store_description text,
    store_logo text DEFAULT NULL,
    username text DEFAULT NULL,        -- NEW
    email text DEFAULT NULL,
    contact_number text DEFAULT NULL,
    address text DEFAULT NULL
)
```

**And in the INSERT statement, add:**
```sql
INSERT INTO public.seller_applications (
    user_id,
    store_id,
    logo_url,
    username,                          -- NEW
    email,
    contact_number,
    address,
    status
) VALUES (
    auth.uid(),
    new_store_id,
    COALESCE(store_logo, '/gocart-logo.svg'),
    username,                          -- NEW
    email,
    contact_number,
    address,
    'pending'
);
```

---

## STEP 3: Update CreateStore.tsx Form Interface
**File**: `src/pages/CreateStore.tsx`

**In FormData interface, add:**
```typescript
interface FormData {
  username: string;                    // NEW - Add this line
  name_en: string;
  description_en: string;
  name_ar: string;
  description_ar: string;
  email: string;
  contact_number: string;
  address: string;
  logo: File | null;
}
```

---

## STEP 4: Initialize Username in State
**File**: `src/pages/CreateStore.tsx`

**In useState initialization, add:**
```typescript
const [formData, setFormData] = useState<FormData>({
  username: '',                        // NEW - Add this line
  name_en: '',
  description_en: '',
  name_ar: '',
  description_ar: '',
  email: '',
  contact_number: '',
  address: '',
  logo: null,
});
```

---

## STEP 5: Add Username Form Field (After Logo, Before Store Name)
**File**: `src/pages/CreateStore.tsx`

Add this **BEFORE** the Store Name (English) field in the form:

```tsx
<div className="space-y-2">
  <Label htmlFor="username">
    {language === 'ar' ? 'اسم المستخدم' : 'Username'}
  </Label>
  <Input
    id="username"
    type="text"
    placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter your username'}
    value={formData.username}
    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
  />
  <p className="text-xs text-muted-foreground">
    {language === 'ar' ? 'اسم المستخدم الفريد الخاص بك' : 'Your unique seller username'}
  </p>
</div>
```

---

## STEP 6: Update RPC Call to Pass Username
**File**: `src/pages/CreateStore.tsx`

In the `handleSubmit` function, update the RPC call:

**Change from:**
```typescript
const { error: applicationError } = await (supabase as any).rpc('apply_for_seller', {
  store_name: formData.name_en || formData.name_ar,
  store_description: formData.description_en || formData.description_ar,
  store_logo: logoUrl || null,
  email: formData.email || null,
  contact_number: formData.contact_number || null,
  address: formData.address || null
});
```

**Change to:**
```typescript
const { error: applicationError } = await (supabase as any).rpc('apply_for_seller', {
  store_name: formData.name_en || formData.name_ar,
  store_description: formData.description_en || formData.description_ar,
  store_logo: logoUrl || null,
  username: formData.username || null,      // NEW
  email: formData.email || null,
  contact_number: formData.contact_number || null,
  address: formData.address || null
});
```

---

## STEP 7: Update AdminStores to Display Username (Optional)
**File**: `src/pages/AdminStores.tsx`

**Update the query to include username:**
```typescript
.select(`..., application:seller_applications(status, username, email, contact_number, address)`)
```

**Update the card to display username (add after store name):**
```tsx
{/* Store Owner Username */}
<div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
  <span className="text-gray-500 min-w-max">👤</span>
  <span>{store.application?.[0]?.username || 'No username provided'}</span>
</div>
```

---

## ✅ Form Field Order (Final)

```
Create Store / Apply as Seller
[Help text]

Username                    ← NEW (seller's display name)
[Input field...]

Store Logo (optional)
[File input...]

Store Name (English) *      ← Store's business name
[Input field...]

Store Description (English)
[Textarea...]

Store Name (Arabic) *
[Input field...]

Store Description (Arabic)
[Textarea...]

Email Address
[Email input...]

Contact Number
[Tel input...]

Address
[Textarea...]

[Submit Button]
```

---

## 🚀 Execution Order (Zero Risk)

1. ✅ Create migration `20251115000002_add_username_to_seller_applications.sql` → Run in Supabase
2. ✅ Update migration `20251115000001_update_apply_for_seller_rpc.sql` → Re-run in Supabase
3. ✅ Update `src/pages/CreateStore.tsx` → All 6 code changes
4. ✅ Update `src/pages/AdminStores.tsx` → Query + Display (optional but recommended)

---

## 🔍 Why This Is Safe

✅ **Username column is nullable** = existing applications unaffected
✅ **RPC parameters have DEFAULT NULL** = old calls still work
✅ **No policy changes** = RLS unchanged
✅ **Additive only** = no deletes or renames
✅ **Backward compatible** = all existing data preserved
✅ **No cascading effects** = isolated to this feature

---

## 📝 Notes

- **Username** = Seller's display name (person running the store)
- **Store Name** = Business name (what customers see)
- They can be the same or different
- Example: Username="john_doe", Store Name="John's Electronics"

---

## Testing Checklist

- [ ] Run both SQL migrations (no errors)
- [ ] Navigate to /create-store
- [ ] See username field displayed
- [ ] Fill form including username
- [ ] Submit successfully
- [ ] Admin page shows username
- [ ] Existing applications still work (username field is NULL)

---

**Ready to execute? Answer YES and I'll guide you through each step!**
