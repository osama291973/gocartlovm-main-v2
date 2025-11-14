# Supabase Functions & Stored Procedures Documentation
**Created:** November 14, 2025  
**Status:** Complete Function Reference

---

## 📋 Executive Summary

**Total Functions:** 9 functions & triggers  
**Categories:** User Management, Data Validation, Seller Onboarding, Admin Operations  
**Return Types:** void, uuid, boolean, trigger, jsonb, TABLE  

---

## 🔧 Functions Inventory

### Function Categories:

```
🧑‍💼 Seller Management (3 functions)
├─ apply_for_seller()        - User applies to become seller
├─ approve_seller_application()  - Admin approves seller
└─ reject_seller_application()   - Admin rejects seller

👤 User Management (2 trigger functions)
├─ handle_new_user()         - Creates profile on signup
└─ handle_updated_at()       - Updates timestamp on record change

🔒 Authorization (1 function)
├─ has_role()                - Check if user has specific role

📊 Data Operations (2 functions)
├─ upsert_product_translations_safe()  - Bulk update translations
└─ query_schema()            - Admin: Inspect database schema

⏰ Helpers (1 trigger)
└─ update_updated_at()       - Updates updated_at timestamp
```

---

## 📝 Detailed Function Specifications

### 1️⃣ **apply_for_seller()**

#### Purpose
Allows authenticated user to apply for seller status and create a seller application record.

#### Function Signature
```sql
apply_for_seller(
  store_name text,
  store_description text,
  store_logo text DEFAULT NULL::text,
  username text DEFAULT NULL::text,
  email text DEFAULT NULL::text,
  contact_number text DEFAULT NULL::text,
  address text DEFAULT NULL::text
) RETURNS uuid
```

#### Parameters
| Parameter | Type | Required | Purpose |
|-----------|------|----------|---------|
| `store_name` | text | ✅ | Name of store to create |
| `store_description` | text | ✅ | Store description/bio |
| `store_logo` | text | ❌ | URL to store logo image |
| `username` | text | ❌ | Seller username (if different) |
| `email` | text | ❌ | Contact email |
| `contact_number` | text | ❌ | Phone number |
| `address` | text | ❌ | Business address |

#### Return Value
`uuid` - The newly created seller application ID

#### Expected Behavior
```
1. Require authenticated user (auth.uid() NOT NULL)
2. Create seller_applications record:
   ├─ user_id = auth.uid()
   ├─ status = 'pending'::seller_application_status
   ├─ store information stored
   └─ created_at = now()
3. Return application_id for reference
4. Admin notified (via webhook/email)
```

#### Frontend Integration Points
```typescript
// After user clicks "Apply as Seller"
const { data: applicationId, error } = await supabase
  .rpc('apply_for_seller', {
    store_name: formData.storeName,
    store_description: formData.description,
    store_logo: logoUrl,
    username: formData.username,
    email: formData.email,
    contact_number: formData.phone,
    address: formData.address
  });

if (error) {
  // Show error: "Failed to submit application"
} else {
  // Show success: "Application submitted. Pending admin review."
  // Redirect to dashboard with pending status
}
```

#### Error Handling
```
Possible Errors:
- User not authenticated → Require login
- Duplicate store name → Show "Store name already exists"
- Invalid input → Validate on frontend first
- Database error → Generic "Something went wrong"
```

#### Database Changes
```
seller_applications table:
├─ INSERT new row
├─ Set status = 'pending'
└─ Create notification (if implemented)

Related:
- No store created yet (created after approval)
- Application awaits admin review
```

---

### 2️⃣ **approve_seller_application()**

#### Purpose
Admin function to approve a seller application and activate seller account.

#### Function Signature
```sql
approve_seller_application(
  application_id uuid
) RETURNS void
```

#### Parameters
| Parameter | Type | Purpose |
|-----------|------|---------|
| `application_id` | uuid | ID of seller_applications row to approve |

#### Expected Behavior
```
1. Verify caller is admin (via RLS/auth check)
2. Fetch application details
3. Create store record:
   ├─ owner_id = application.user_id
   ├─ name, description from application
   ├─ logo_url from application
   ├─ status = 'active'::store_status
   └─ created_at = now()
4. Update seller_applications.status = 'approved'
5. Assign seller role to user:
   ├─ INSERT into user_roles
   ├─ user_id = application.user_id
   ├─ role = 'seller'::app_role
   └─ status = 'active'::user_role_status
6. Send notification to user
7. Return void (success)
```

#### Frontend Integration Points
```typescript
// Admin Dashboard - Seller Applications Panel
const handleApprove = async (applicationId: string) => {
  const { error } = await supabase
    .rpc('approve_seller_application', {
      application_id: applicationId
    });

  if (error) {
    showErrorToast("Failed to approve application");
  } else {
    showSuccessToast("Seller approved!");
    // Refresh applications list
    refetchApplications();
  }
};
```

#### Side Effects
```
✓ Creates new store (stores table)
✓ Assigns seller role (user_roles table)
✓ Updates application status (seller_applications table)
✓ Sends notification (external if implemented)
✓ User can now create products
```

#### Related Tables Modified
```
seller_applications:
  UPDATE status = 'approved'

stores:
  INSERT new row with application details

user_roles:
  INSERT new row with role = 'seller'
```

---

### 3️⃣ **reject_seller_application()**

#### Purpose
Admin function to reject a seller application.

#### Function Signature
```sql
reject_seller_application(
  application_id uuid
) RETURNS void
```

#### Parameters
| Parameter | Type | Purpose |
|-----------|------|---------|
| `application_id` | uuid | ID of seller_applications row to reject |

#### Expected Behavior
```
1. Verify caller is admin
2. Update seller_applications.status = 'rejected'
3. Send notification to user (with optional reason)
4. Return void (success)
```

#### Frontend Integration Points
```typescript
// Admin Dashboard - Reject with reason
const handleReject = async (applicationId: string, reason: string) => {
  // Note: reason not in function params, may need separate update
  const { error } = await supabase
    .rpc('reject_seller_application', {
      application_id: applicationId
    });

  if (error) {
    showErrorToast("Failed to reject application");
  } else {
    showSuccessToast("Application rejected");
    refetchApplications();
  }
};
```

#### Side Effects
```
✓ Updates application status (seller_applications table)
✓ User notified (external)
✗ Does NOT delete anything
✗ User can apply again later
```

---

### 4️⃣ **handle_new_user()** [TRIGGER FUNCTION]

#### Purpose
Automatically creates a profile record when a new user signs up via Supabase Auth.

#### Function Signature
```sql
handle_new_user() RETURNS trigger
```

#### Trigger Details
```
Trigger ON: auth.users (INSERT event)
Executes: AFTER INSERT
For Each: ROW
```

#### Expected Behavior
```
1. When new user created in auth.users:
   ├─ Extract: new.id, new.email
   └─ Execute on INSERT
2. Create profiles row:
   ├─ id = new.id (FK to auth.users)
   ├─ full_name = NULL (user fills later)
   ├─ avatar_url = NULL (user uploads later)
   ├─ created_at = now()
   └─ updated_at = now()
3. Return NEW (success)
```

#### Automatic Execution
```
Triggers on:
- User signs up via email/password
- User signs up via OAuth (Google, etc.)
- User invited via admin functions

Does NOT trigger on:
- Manual user creation in auth.users table
- (May need separate handling)
```

#### Frontend Implication
```
✓ Profile auto-created on signup
✓ Frontend can immediately access profile
✓ No need for "complete profile" step before using app
✓ User can update profile details later
```

#### Error Handling
```
If trigger fails:
- Signup rolls back
- User never created
- Frontend shows generic error

Solution: Implement retry logic in signup flow
```

---

### 5️⃣ **handle_updated_at()** [TRIGGER FUNCTION]

#### Purpose
Automatically updates the `updated_at` timestamp on any record modification.

#### Function Signature
```sql
handle_updated_at() RETURNS trigger
```

#### Trigger Details
```
Trigger ON: Multiple tables (UPDATE events)
Executes: BEFORE UPDATE
For Each: ROW
```

#### Expected Behavior
```
1. When row updated in any table:
2. Set: NEW.updated_at = now()
3. Return NEW (with updated timestamp)

Applied to tables:
├─ products
├─ profiles
├─ addresses
├─ orders
├─ stores
├─ seller_applications
├─ product_translations
├─ cart_items
└─ [other tables with updated_at]
```

#### Example Usage
```sql
-- Table definition
CREATE TABLE products (
  id uuid PRIMARY KEY,
  name text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

#### Frontend Implication
```
✓ No need to manually set updated_at
✓ Always accurate modification timestamps
✓ Track when products last changed
✓ Sort by "Recently Updated"
✓ Enable last-modified-based optimistic updates
```

---

### 6️⃣ **update_updated_at()** [TRIGGER FUNCTION - Alternative]

#### Purpose
Similar to `handle_updated_at()` - may be duplicate or alternative implementation.

#### Function Signature
```sql
update_updated_at() RETURNS trigger
```

#### Status
```
⚠️ Possible Duplicate:
- May be same as handle_updated_at()
- Recommendation: Use one standardized function
- Keep most recent, delete duplicate
```

---

### 7️⃣ **has_role()**

#### Purpose
Helper function to check if a user has a specific role (used in RLS policies).

#### Function Signature
```sql
has_role(
  _user_id uuid,
  _role app_role
) RETURNS boolean
```

#### Parameters
| Parameter | Type | Purpose |
|-----------|------|---------|
| `_user_id` | uuid | User ID to check |
| `_role` | app_role | Role to verify (admin, seller, etc.) |

#### Return Value
`boolean` - `true` if user has role, `false` otherwise

#### Expected Behavior
```
1. Query user_roles table
2. Check if row exists:
   WHERE user_id = _user_id
   AND role = _role
   AND status = 'active'::user_role_status
3. Return true/false
```

#### Example Implementation
```sql
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role = _role
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Used In
```
RLS Policies:
├─ "Sellers can insert products"
│  └─ WHERE (... OR has_role(auth.uid(), 'seller'::app_role))
├─ "Admins can manage stores"
│  └─ WHERE (... OR has_role(auth.uid(), 'admin'::app_role))
└─ Site texts management (admin only)
```

#### Frontend Usage
```typescript
// Check admin status before showing admin UI
const isAdmin = await supabase.rpc('has_role', {
  _user_id: userId,
  _role: 'admin'
});

// Check seller status
const isSeller = await supabase.rpc('has_role', {
  _user_id: userId,
  _role: 'seller'
});
```

---

### 8️⃣ **upsert_product_translations_safe()**

#### Purpose
Safely bulk insert or update product translations with error handling and permission checks.

#### Function Signature
```sql
upsert_product_translations_safe(
  _translations jsonb,
  _caller_id uuid DEFAULT NULL::uuid
) RETURNS TABLE(
  updated_count integer,
  error_message text
)
```

#### Parameters
| Parameter | Type | Purpose |
|-----------|------|---------|
| `_translations` | jsonb | Array of translation objects |
| `_caller_id` | uuid | User ID performing operation (for permission check) |

#### Return Value (Table)
| Column | Type | Purpose |
|--------|------|---------|
| `updated_count` | integer | Number of translations successfully updated |
| `error_message` | text | Error message if operation failed |

#### Expected Input Format
```jsonb
[
  {
    "product_id": "uuid",
    "language_code": "en",
    "name": "Product Name",
    "description": "Product description",
    "is_machine_translated": false
  },
  {
    "product_id": "uuid",
    "language_code": "ar",
    "name": "اسم المنتج",
    "description": "وصف المنتج",
    "is_machine_translated": true
  }
]
```

#### Expected Behavior
```
1. Validate caller has permission:
   ├─ Check ownership of products OR
   └─ Check if caller is admin
2. For each translation object:
   ├─ Check product_id ownership
   ├─ Insert or update translation
   └─ Track count and errors
3. Return summary:
   ├─ updated_count = successful operations
   ├─ error_message = aggregated errors (if any)
   └─ Partial success possible
4. Transaction: All-or-nothing OR partial success?
   (Needs clarification)
```

#### Frontend Integration Points
```typescript
// Seller bulk-updating product translations
const handleUpdateTranslations = async (translations) => {
  const { data, error } = await supabase
    .rpc('upsert_product_translations_safe', {
      _translations: translations,
      _caller_id: userId
    });

  if (error) {
    showErrorToast(`Operation failed: ${error.message}`);
  } else {
    const { updated_count, error_message } = data[0];
    if (error_message) {
      showWarningToast(
        `${updated_count} updated, but some failed: ${error_message}`
      );
    } else {
      showSuccessToast(`${updated_count} translations updated`);
    }
  }
};
```

#### Use Cases
```
✓ Bulk update translations for multiple products
✓ Add translations in new language
✓ Update existing translations (e.g., via AI translation)
✓ Import translations from CSV/JSON
✓ Seller managing multi-language product catalog
```

#### Error Handling
```
Possible errors:
1. Unauthorized: Caller doesn't own product
   └─ error_message = "Access denied for product X"
2. Invalid product_id: Product doesn't exist
   └─ error_message = "Product not found"
3. Invalid language_code: Unsupported language
   └─ error_message = "Unknown language code"
4. Database constraint: Violates unique index
   └─ error_message = "Duplicate translation"
```

---

### 9️⃣ **query_schema()**

#### Purpose
Admin utility function to inspect database schema (for development/debugging).

#### Function Signature
```sql
query_schema(
  sql_string text
) RETURNS jsonb
```

#### Parameters
| Parameter | Type | Purpose |
|-----------|------|---------|
| `sql_string` | text | SQL query to execute |

#### Return Value
`jsonb` - Query result as JSON object

#### Expected Behavior
```
1. Verify caller is admin (security!)
2. Execute SQL query: sql_string
3. Convert result set to JSONB
4. Return JSON result
```

#### Example Usage (Admin Only)
```typescript
// Inspect table structure
const result = await supabase.rpc('query_schema', {
  sql_string: `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'products'
  `
});

// Get record counts
const counts = await supabase.rpc('query_schema', {
  sql_string: `
    SELECT 
      'products' as table_name, COUNT(*) as count FROM products
    UNION ALL
    SELECT 'stores', COUNT(*) FROM stores
  `
});
```

#### ⚠️ Security Considerations
```
🚨 CRITICAL: This function is VERY POWERFUL and DANGEROUS

Risks:
├─ Could allow data exfiltration
├─ Could allow SQL injection if not validated
├─ Could allow data modification/deletion
└─ Could expose sensitive schema info

Safeguards Required:
├─ ✅ Only accessible to admins
├─ ✅ Validate/sanitize sql_string input
├─ ✅ Whitelist allowed queries
├─ ✅ Log all executions
├─ ✅ Consider restricting to read-only operations
└─ ✅ Use WITH CHECK constraints

Recommendation:
- Use only in development/staging
- Disable or restrict in production
- Implement audit logging
- Consider hardcoding specific schemas instead
```

#### Frontend Access
```typescript
// Only accessible in admin panel, behind authentication
const fetchTableStats = async () => {
  // Only available to admin users
  if (!userIsAdmin) {
    return null;
  }

  const result = await supabase.rpc('query_schema', {
    sql_string: 'SELECT COUNT(*) FROM products'
  });
};
```

---

## 🎯 Function Call Patterns

### Pattern 1: Seller Application Flow
```
User Signup
  ↓
handle_new_user() [TRIGGER]
  ├─ Create profiles row
  └─ Return NEW
  ↓
User applies for seller
  ↓
apply_for_seller()
  ├─ Create seller_applications row (status=pending)
  ├─ Return application_id
  └─ Notify admin
  ↓
Admin reviews & approves
  ↓
approve_seller_application()
  ├─ Create stores row
  ├─ Assign seller role
  ├─ Update application status
  └─ Notify user
  ↓
Seller can now create products
```

### Pattern 2: Product Management with Timestamps
```
Seller creates product
  ↓
INSERT INTO products (...)
  ↓
handle_updated_at() [TRIGGER on INSERT/UPDATE]
  ├─ Set created_at = now()
  └─ Set updated_at = now()
  ↓
Later: Seller edits product
  ↓
UPDATE products SET name = '...', description = '...'
  ↓
handle_updated_at() [TRIGGER]
  └─ Automatically set updated_at = now()
  ↓
Frontend shows "Last updated: 2 hours ago"
```

### Pattern 3: Bulk Translation Update
```
Seller selects products
  ↓
Seller chooses "Add translations"
  ↓
Frontend builds JSON array:
  [
    { product_id: X, language_code: 'ar', name: '...' },
    { product_id: Y, language_code: 'ar', name: '...' }
  ]
  ↓
upsert_product_translations_safe(json)
  ├─ Validate permissions
  ├─ Update all translations
  └─ Return count + errors
  ↓
Frontend shows: "Updated 2 translations"
```

### Pattern 4: Authorization Check (RLS)
```
Seller tries to edit products
  ↓
RLS Policy checks:
  has_role(auth.uid(), 'seller')
  ↓
has_role() queries user_roles table
  ├─ WHERE user_id = auth.uid()
  ├─ AND role = 'seller'
  └─ Returns true/false
  ↓
If true → Allow update
If false → Deny with "Permission denied"
```

---

## 📊 Function Dependencies Map

```
apply_for_seller()
  ├─ Writes to: seller_applications
  └─ Calls: (none - direct insert)

approve_seller_application()
  ├─ Reads from: seller_applications
  ├─ Writes to: seller_applications, stores, user_roles
  └─ Calls: has_role() [for permission check]

reject_seller_application()
  ├─ Writes to: seller_applications
  └─ Calls: has_role() [for permission check]

handle_new_user() [TRIGGER]
  ├─ Trigger on: auth.users INSERT
  ├─ Writes to: profiles
  └─ Calls: (none)

handle_updated_at() [TRIGGER]
  ├─ Trigger on: UPDATE on multiple tables
  └─ Sets: updated_at = now()

update_updated_at() [TRIGGER]
  └─ Duplicate/alternative of handle_updated_at()

has_role()
  ├─ Reads from: user_roles
  ├─ Called by: RLS policies, other functions
  └─ Returns: boolean

upsert_product_translations_safe()
  ├─ Reads from: products, product_translations
  ├─ Writes to: product_translations
  ├─ Calls: has_role() [for permission check]
  └─ Returns: TABLE(count, error)

query_schema()
  ├─ Executes: Dynamic SQL
  ├─ Called by: Admin only
  └─ Returns: JSONB result
```

---

## 🔒 Security Analysis

### High-Risk Functions:

#### 🔴 **query_schema()** - CRITICAL
```
Risk Level: 🔴 CRITICAL
├─ Allows arbitrary SQL execution
├─ Could expose schema information
├─ Could enable data theft
└─ Could enable SQL injection

Mitigation:
✅ Admin-only access (via RLS)
✅ Implement SQL validation/whitelist
✅ Log all calls with audit trail
✅ Consider disabling in production
✅ Use parameterized queries
```

#### 🟡 **apply_for_seller()** - MEDIUM
```
Risk Level: 🟡 MEDIUM
├─ Creates seller application
├─ Relies on auth.uid() not being spoofed
└─ Assumes Supabase auth is secure

Mitigation:
✅ Requires authentication
✅ Automatically links to auth.uid()
✅ Status defaults to 'pending'
```

#### 🟢 **has_role()** - LOW
```
Risk Level: 🟢 LOW
├─ Read-only function
├─ Checks against user_roles table
└─ Returns boolean

Mitigation:
✅ No data modification
✅ Standard authorization pattern
✅ Used throughout RLS policies
```

---

## ✅ Frontend Implementation Checklist

### Seller Onboarding Flow
- [ ] Build seller application form
- [ ] Call `apply_for_seller()` on submit
- [ ] Show "Application Pending" status
- [ ] Listen for approval notification
- [ ] Redirect to seller dashboard on approval
- [ ] Show rejection notification if rejected

### Admin Dashboard
- [ ] Load seller applications list
- [ ] Call `approve_seller_application()` on approve
- [ ] Call `reject_seller_application()` on reject
- [ ] Refresh applications after action
- [ ] Show notification to user

### Product Management
- [ ] Auto-update `updated_at` on product edit
- [ ] Show "Last updated: X" timestamp
- [ ] Build translation bulk-edit form
- [ ] Call `upsert_product_translations_safe()` on submit
- [ ] Handle partial success responses
- [ ] Show error summary if failures occur

### Authorization Checks
- [ ] Check `has_role('seller')` before seller UI
- [ ] Check `has_role('admin')` before admin UI
- [ ] Handle permission denied errors gracefully
- [ ] Redirect unauthorized users appropriately

### Data Integrity
- [ ] Rely on `handle_new_user()` trigger
- [ ] Assume profiles auto-created on signup
- [ ] Assume `updated_at` auto-maintained
- [ ] Display timestamps in user's timezone
- [ ] Format "recently updated" strings

---

## ⚠️ Known Issues & Recommendations

### 1. **Duplicate Trigger Functions**
```
Issue: handle_updated_at() and update_updated_at() both exist
Status: ⚠️ Unclear if duplicates or different purposes
Recommendation:
├─ Review both implementations
├─ Keep one standardized version
├─ Delete duplicate
└─ Rename to clarify purpose
```

### 2. **Missing Reject Reason**
```
Issue: reject_seller_application() doesn't accept reason text
Status: ⚠️ User won't know why application rejected
Recommendation:
├─ Add optional reason parameter
├─ Store reason in seller_applications table
├─ Send reason in notification email
└─ Display in user dashboard
```

### 3. **Missing Product Variant Management**
```
Issue: No functions for product_variants CRUD
Status: ⚠️ Sellers can't manage variants programmatically
Recommendation:
├─ Create upsert_product_variants()
├─ Include validation for attributes
├─ Return created variant IDs
└─ Handle stock management
```

### 4. **Missing Translation Auto-Detection**
```
Issue: upsert_product_translations_safe() doesn't auto-translate
Status: ⚠️ Requires manual translation entry
Recommendation:
├─ Integrate with translation API (Google, etc.)
├─ Add auto_translate parameter
├─ Set is_machine_translated = true
└─ Cache translations to avoid repeated API calls
```

### 5. **No Pagination in query_schema()**
```
Issue: query_schema() returns entire result set
Status: ⚠️ Could cause memory issues with large results
Recommendation:
├─ Add LIMIT/OFFSET parameters
├─ Add result set size limit
├─ Return metadata (total count, page info)
└─ Add streaming for large results
```

---

## 📚 SQL Implementation Examples

### Example: handle_new_user() Implementation
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (new.id, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Example: has_role() Implementation
```sql
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role = _role
    AND status = 'active'::user_role_status
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### Example: apply_for_seller() Implementation
```sql
CREATE OR REPLACE FUNCTION apply_for_seller(
  store_name text,
  store_description text,
  store_logo text DEFAULT NULL,
  username text DEFAULT NULL,
  email text DEFAULT NULL,
  contact_number text DEFAULT NULL,
  address text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  app_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  INSERT INTO seller_applications (
    user_id, status, store_name, store_description, 
    store_logo, username, email, contact_number, address
  ) VALUES (
    auth.uid(), 'pending'::seller_application_status,
    store_name, store_description, store_logo,
    username, email, contact_number, address
  )
  RETURNING id INTO app_id;

  RETURN app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

**Status:** ✅ Functions Documented - Ready for Triggers & Storage Configuration Review
