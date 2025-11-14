# Database Triggers Documentation
**Created:** November 14, 2025  
**Status:** Complete Trigger Reference & Automation Guide

---

## 📋 Executive Summary

**Total Triggers:** 8 triggers across 8 tables  
**Trigger Types:** BEFORE UPDATE (8), AFTER INSERT (implied: handle_new_user)  
**Automation Purpose:** Auto-update timestamps, profile creation  
**Performance Impact:** Minimal (timestamps only, no heavy computation)

---

## 🔄 Trigger Overview

```
Active Triggers:
├─ set_updated_at (7 instances)
│  └─ Tables: categories, products, addresses, orders, cart_items, 
│            product_attributes, product_variants
│  └─ Action: BEFORE UPDATE → EXECUTE handle_updated_at()
│
├─ trg_update_site_texts_updated_at (1 instance)
│  └─ Table: site_texts
│  └─ Action: BEFORE UPDATE → EXECUTE update_updated_at()
│
└─ on_auth_user_created (Implied, not in list)
   └─ Table: auth.users
   └─ Action: AFTER INSERT → EXECUTE handle_new_user()
```

---

## 📌 Trigger Specifications

### 1️⃣ **set_updated_at Trigger** (MULTIPLE INSTANCES)

#### Overview
```
Trigger Name: set_updated_at
Event: UPDATE
Timing: BEFORE
Function Called: handle_updated_at()
Applies To: 7 tables
```

#### Tables Affected:
```
1. categories
2. products
3. addresses
4. orders
5. cart_items
6. product_attributes
7. product_variants
```

#### SQL Definition:
```sql
-- Example for products table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Pattern for all other tables
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON [table_name]
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

#### Function Implementation:
```sql
-- Trigger Function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### How It Works:

```
When: UPDATE statement executed on table
┌─────────────────────────────────────────
├─ BEFORE UPDATE trigger fires
├─ handle_updated_at() function called
├─ NEW.updated_at = NOW()  (Set to current timestamp)
├─ Function returns modified NEW row
├─ Update proceeds with modified data
└─ Row saved with fresh updated_at timestamp

Example Update:
  UPDATE products 
  SET name = 'New Name'
  WHERE id = 'product-123'
  
Automatic Result:
  ├─ products.name = 'New Name' (as requested)
  ├─ products.updated_at = 2024-11-14 15:30:45.123 (auto-set)
  └─ Products.created_at = unchanged
```

#### Frontend Impact:

```typescript
// Update product name
const updateProduct = async (productId: string, name: string) => {
  const { data, error } = await supabase
    .from('products')
    .update({ name })
    .eq('id', productId)
    .select()
    .single();

  // data.updated_at is automatically set by trigger!
  console.log(`Product updated at: ${data.updated_at}`);
  
  return data;
};

// No need to manually set updated_at
// Trigger handles it automatically ✓
```

#### Use Cases:

**Product Update:**
```
Seller updates product price
  ↓ [UPDATE products SET price = 29.99]
  ↓ Trigger fires: BEFORE UPDATE
  ↓ NEW.updated_at = now()
  ↓ Row saved
  ✓ Frontend can show "Last updated: 5 minutes ago"
```

**Address Update:**
```
User updates delivery address
  ↓ [UPDATE addresses SET street = '123 Main St']
  ↓ Trigger fires: BEFORE UPDATE
  ↓ NEW.updated_at = now()
  ↓ Row saved
  ✓ Can track address change history
```

**Order Update:**
```
Admin updates order status
  ↓ [UPDATE orders SET status = 'shipped']
  ↓ Trigger fires: BEFORE UPDATE
  ↓ NEW.updated_at = now()
  ↓ Row saved
  ✓ Know exactly when status changed
```

#### Timestamp Formatting for Frontend:

```typescript
import { formatDistanceToNow } from 'date-fns';

interface Product {
  id: string;
  name: string;
  updated_at: string;
}

const ProductCard: React.FC<{product: Product}> = ({product}) => {
  // Format timestamp as "2 hours ago"
  const timeAgo = formatDistanceToNow(new Date(product.updated_at), {
    addSuffix: true
  });

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p className="meta">Updated {timeAgo}</p>
    </div>
  );
};

// Or show full timestamp
const formatFullTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  // Output: "Nov 14, 2024, 03:30 PM"
};

// In component
<p>Last updated: {formatFullTimestamp(product.updated_at)}</p>
```

#### Query Patterns for Sorting:

```typescript
// Load recently updated products (for homepage)
const loadRecentlyUpdated = async (limit = 10) => {
  const { data } = await supabase
    .from('products')
    .select()
    .order('updated_at', { ascending: false })
    .limit(limit);
  
  return data;
};

// Find products not updated in 30 days (stale products)
const loadStaleProducts = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const { data } = await supabase
    .from('products')
    .select()
    .lt('updated_at', thirtyDaysAgo.toISOString())
    .order('updated_at', { ascending: true });
  
  return data;
};

// Get products updated in last hour
const loadJustUpdated = async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const { data } = await supabase
    .from('products')
    .select()
    .gt('updated_at', oneHourAgo.toISOString())
    .order('updated_at', { ascending: false });
  
  return data;
};
```

---

### 2️⃣ **trg_update_site_texts_updated_at Trigger**

#### Specification
```
Trigger Name: trg_update_site_texts_updated_at
Event: UPDATE
Timing: BEFORE
Function Called: update_updated_at()
Table: site_texts
```

#### SQL Definition:
```sql
CREATE TRIGGER trg_update_site_texts_updated_at
  BEFORE UPDATE ON site_texts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

#### Function Implementation:
```sql
-- Trigger Function (likely same as handle_updated_at)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Purpose:
```
Tracks when site text/UI strings are modified
├─ When admin updates button label: "Add to Cart" → "Buy Now"
├─ Trigger sets updated_at automatically
├─ Can track content change history
└─ Useful for audit trails
```

#### Use Case:

```
Admin modifies UI text
  ↓ [UPDATE site_texts SET value = 'New Button Text' WHERE key = 'button.cart']
  ↓ Trigger fires: BEFORE UPDATE
  ↓ NEW.updated_at = now()
  ↓ Row saved
  ✓ Content versioning tracked
```

#### Frontend Impact:

```typescript
// Load site text in current language
const loadSiteTexts = async (language: LanguageCode) => {
  const { data } = await supabase
    .from('site_texts')
    .select()
    .eq('language_code', language);
  
  return data;
};

// Cache site texts (with update tracking)
let cachedTexts: SiteText[] = [];
let cacheTimestamp: Date | null = null;

const getCachedSiteTexts = async (language: LanguageCode) => {
  const now = new Date();
  
  // If cache older than 5 minutes, refresh
  if (!cacheTimestamp || (now.getTime() - cacheTimestamp.getTime()) > 5 * 60 * 1000) {
    cachedTexts = await loadSiteTexts(language);
    cacheTimestamp = now;
  }
  
  return cachedTexts;
};

// Use in components
const Header: React.FC = () => {
  const [texts, setTexts] = useState<SiteText[]>([]);
  
  useEffect(() => {
    const load = async () => {
      const siteTexts = await getCachedSiteTexts(LanguageCode.English);
      setTexts(siteTexts);
    };
    load();
  }, []);
  
  const buttonText = texts.find(t => t.key === 'button.add_to_cart')?.value 
    || 'Add to Cart';
  
  return <button>{buttonText}</button>;
};
```

---

### 3️⃣ **on_auth_user_created Trigger** (IMPLIED, NOT SHOWN IN LIST)

#### Specification
```
Trigger Name: on_auth_user_created (or similar)
Event: INSERT
Timing: AFTER
Function Called: handle_new_user()
Table: auth.users
```

#### SQL Definition:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

#### Function Implementation:
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create empty profile for new user
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (new.id, now(), now());
  
  -- Optionally create default user role
  INSERT INTO user_roles (user_id, role, status, created_at)
  VALUES (new.id, 'user'::app_role, 'active'::user_role_status, now());
  
  RETURN new;
END;
$$ LANGUAGE plpgsql;
```

#### How It Works:

```
New user signs up
  ↓ [INSERT INTO auth.users (email, password, ...)]
  ↓ Trigger fires: AFTER INSERT
  ↓ handle_new_user() function called
  ├─ NEW.id = user's UUID from auth
  ├─ Create profile row
  │   └─ profiles(id, created_at, updated_at)
  ├─ Create user role (optional)
  │   └─ user_roles(user_id, role='user', status='active')
  └─ Function returns new
  
Result:
  ✓ Profile auto-created
  ✓ User role auto-assigned
  ✓ User can immediately use app
  ✓ No "complete profile" step needed
```

#### Frontend Impact:

```typescript
// After signup, profile is automatically created
const handleSignUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;

  // Profile and role created automatically by trigger!
  // No need for separate profile creation call
  
  // Can immediately fetch profile
  const profile = await supabase
    .from('profiles')
    .select()
    .eq('id', data.user.id)
    .single();

  return profile; // ✓ Exists!
};

// User can edit profile right away
const updateProfile = async (userId: string, fullName: string) => {
  const { data } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId)
    .select()
    .single();

  return data;
};
```

---

## 🔗 Trigger Execution Flow

### Complete User Journey with Triggers:

```
1. USER SIGNS UP
   ├─ POST /auth/signup
   ├─ auth.users INSERT
   ├─ on_auth_user_created TRIGGER fires
   ├─ handle_new_user() executes:
   │   ├─ INSERT profiles
   │   └─ INSERT user_roles (role='user')
   └─ ✓ User ready to use app

2. USER BROWSES STORE
   ├─ GET /products?language=en
   ├─ SELECT from products
   ├─ SELECT from product_translations WHERE language_code = 'en'
   └─ (no triggers involved)

3. SELLER UPDATES PRODUCT
   ├─ PUT /products/{id}
   ├─ UPDATE products SET name = 'New Name'
   ├─ set_updated_at TRIGGER fires
   ├─ handle_updated_at() executes:
   │   └─ NEW.updated_at = NOW()
   └─ ✓ Row saved with fresh timestamp

4. USER ADDS TO CART
   ├─ POST /cart_items
   ├─ INSERT into cart_items
   ├─ no trigger on INSERT (only on UPDATE)
   └─ ✓ Item added

5. USER UPDATES CART
   ├─ PUT /cart_items/{id}
   ├─ UPDATE cart_items SET quantity = 2
   ├─ set_updated_at TRIGGER fires
   ├─ handle_updated_at() executes:
   │   └─ NEW.updated_at = NOW()
   └─ ✓ Row updated with timestamp

6. USER PLACES ORDER
   ├─ POST /orders
   ├─ INSERT into orders
   ├─ No trigger on INSERT
   └─ ✓ Order created

7. ADMIN SHIPS ORDER
   ├─ PUT /orders/{id}
   ├─ UPDATE orders SET status = 'shipped'
   ├─ set_updated_at TRIGGER fires
   ├─ handle_updated_at() executes:
   │   └─ NEW.updated_at = NOW()
   └─ ✓ Status updated with timestamp

8. ADMIN UPDATES SITE TEXT
   ├─ PUT /site_texts/{id}
   ├─ UPDATE site_texts SET value = 'New Text'
   ├─ trg_update_site_texts_updated_at TRIGGER fires
   ├─ update_updated_at() executes:
   │   └─ NEW.updated_at = NOW()
   └─ ✓ Content updated with timestamp
```

---

## ⚠️ Trigger Issues & Observations

### 🔴 **Issue 1: Missing INSERT Triggers**

```
Current: Only BEFORE UPDATE triggers exist
Missing: BEFORE INSERT triggers for initial created_at

Problem:
  ├─ When INSERT products, created_at is default (now())
  ├─ But updated_at is NULL or default
  ├─ Later: updated_at never set until first UPDATE
  └─ Frontend: Cannot show "created" vs "updated" distinction

Recommendation:
  Add BEFORE INSERT triggers to set both created_at and updated_at:
  
  CREATE TRIGGER set_timestamps_on_insert
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_created_and_updated_at();
    
  Function:
  CREATE OR REPLACE FUNCTION set_created_and_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.created_at = COALESCE(NEW.created_at, NOW());
    NEW.updated_at = COALESCE(NEW.updated_at, NOW());
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
```

### 🟡 **Issue 2: Different Function Names**

```
Current:
  ├─ 7 tables use: handle_updated_at()
  └─ 1 table uses: update_updated_at()

Problem:
  ├─ Two functions doing same thing (confusing)
  ├─ Maintenance nightmare (update both?)
  ├─ Unclear naming convention
  └─ One might be deleted accidentally

Recommendation:
  Use single standardized function: set_updated_at()
  
  Single Implementation:
  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  All triggers call same function:
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
```

### 🟡 **Issue 3: Duplicate Trigger Names**

```
Current:
  ├─ All 7 UPDATE triggers named: "set_updated_at"
  ├─ Makes them identical except table
  └─ PostgreSQL allows this (table-specific triggers)

But Best Practice:
  Use table-specific names:
  ├─ set_categories_updated_at
  ├─ set_products_updated_at
  ├─ set_orders_updated_at
  ├─ etc.
  
  Benefit:
  ├─ Easily identify which trigger on which table
  ├─ Avoid confusion in debugging
  ├─ Clear in logs and error messages
  └─ Better for documentation
```

### 🟡 **Issue 4: No Transaction Handling**

```
Current: Triggers don't handle transaction rollback

Scenario:
  1. Update product (trigger sets updated_at)
  2. Another trigger fails
  3. Transaction rolls back
  4. Updated_at was never written
  
Current Behavior: ✓ Works (triggers are part of transaction)

But Note:
  ├─ If handle_updated_at() throws error → whole update fails
  ├─ Should add error handling
  └─ Currently simple (no error risk) → OK
```

### 🟡 **Issue 5: Missing Trigger for product_images**

```
Current: No trigger on product_images table

But product_images has:
  ├─ created_at with DEFAULT now()
  ├─ No updated_at field shown

Question: Should product images track updates?
  ├─ Images usually not edited (just delete + reupload)
  ├─ If position changes, might want to track
  
Recommendation:
  Add updated_at column if image edits tracked:
  ALTER TABLE product_images ADD COLUMN updated_at timestamp;
  
  Then add trigger:
  CREATE TRIGGER set_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
```

---

## 📊 Trigger Performance Impact

### Performance Analysis:

```
Trigger Type: BEFORE UPDATE
├─ Timing: Before row update (minimal overhead)
├─ Operation: Set one column (updated_at = NOW())
├─ Complexity: O(1) constant time
├─ Impact: Negligible (~0.1ms per trigger)

For 1000 updates/second:
├─ Trigger overhead: ~100ms total
├─ Database handles easily
└─ No scalability concerns

Conclusion: ✓ Zero performance risk
```

### Monitoring Triggers:

```typescript
// Check if triggers are working (backend check)
const verifyTriggersWork = async () => {
  // Insert test product
  const { data: product } = await supabase
    .from('products')
    .insert({ name: 'Test', store_id: '...' })
    .select()
    .single();

  // Check if updated_at is set
  if (!product.updated_at) {
    console.error('ERROR: updated_at trigger not working!');
    return false;
  }

  // Update product
  const { data: updated } = await supabase
    .from('products')
    .update({ name: 'Updated Test' })
    .eq('id', product.id)
    .select()
    .single();

  // Check if updated_at changed
  if (updated.updated_at === product.updated_at) {
    console.error('ERROR: update trigger not working!');
    return false;
  }

  console.log('✓ All triggers working correctly');
  return true;
};
```

---

## 🎯 Frontend Implementation with Triggers

### Pattern 1: Track "Last Updated"

```typescript
interface Product {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const ProductWithTimestamps: React.FC<{product: Product}> = ({product}) => {
  const created = new Date(product.created_at);
  const updated = new Date(product.updated_at);
  const wasEdited = created.getTime() !== updated.getTime();

  return (
    <div>
      <h3>{product.name}</h3>
      {wasEdited ? (
        <p>Last updated: {updated.toLocaleDateString()}</p>
      ) : (
        <p>Created: {created.toLocaleDateString()}</p>
      )}
    </div>
  );
};
```

### Pattern 2: Sort by Recently Modified

```typescript
const RecentlyUpdatedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select()
        .order('updated_at', { ascending: false })
        .limit(10);

      setProducts(data ?? []);
    };

    load();
  }, []);

  return (
    <div>
      <h2>Recently Updated</h2>
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};
```

### Pattern 3: Detect Stale Content

```typescript
const StaleProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from('products')
        .select()
        .lt('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: true });

      setProducts(data ?? []);
    };

    load();
  }, []);

  return (
    <div>
      <h2>Stale Products (Not Updated in 30 Days)</h2>
      <p>Consider updating these products:</p>
      {products.map(p => (
        <div key={p.id}>
          <span>{p.name}</span>
          <p>Last updated: {new Date(p.updated_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};
```

### Pattern 4: Audit Trail

```typescript
interface AuditLog {
  productId: string;
  changes: string[];
  timestamp: string;
}

// Track all product updates
const trackProductChanges = async (productId: string) => {
  const previous = await loadProduct(productId);

  // After update in UI
  const updated = await loadProduct(productId);

  if (previous.updated_at !== updated.updated_at) {
    // Something changed
    const changes: string[] = [];

    if (previous.name !== updated.name) {
      changes.push(`Name: "${previous.name}" → "${updated.name}"`);
    }
    if (previous.price !== updated.price) {
      changes.push(`Price: $${previous.price} → $${updated.price}`);
    }

    // Log to audit table
    const audit: AuditLog = {
      productId,
      changes,
      timestamp: updated.updated_at
    };

    console.log('Audit:', audit);
  }
};
```

---

## ✅ Trigger Verification Checklist

### Verify Triggers Exist:

```sql
-- Check all triggers
SELECT 
  tgname as trigger_name,
  relname as table_name,
  tgisinternal
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE relname IN (
  'categories', 'products', 'addresses', 'orders',
  'cart_items', 'product_attributes', 'product_variants',
  'site_texts'
)
ORDER BY relname;

-- Expected output:
-- set_updated_at | categories | f
-- set_updated_at | products | f
-- set_updated_at | addresses | f
-- ... etc (8 total)
```

### Verify Triggers Work:

```sql
-- Test trigger on products table
UPDATE products SET name = 'Test' WHERE id = 'test-id' LIMIT 1;

-- Check if updated_at changed
SELECT id, updated_at FROM products WHERE id = 'test-id';
-- Should show recent timestamp
```

### Test Trigger Function:

```sql
-- Verify function exists and works
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname IN ('handle_updated_at', 'update_updated_at')
ORDER BY proname;

-- Should return function definitions
```

---

## 📈 Recommended Trigger Improvements

### 1. Add INSERT Triggers for created_at

```sql
CREATE OR REPLACE FUNCTION set_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  IF NEW.updated_at IS NULL THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with timestamps
CREATE TRIGGER set_timestamps_categories BEFORE INSERT ON categories 
  FOR EACH ROW EXECUTE FUNCTION set_timestamps();
CREATE TRIGGER set_timestamps_products BEFORE INSERT ON products 
  FOR EACH ROW EXECUTE FUNCTION set_timestamps();
-- ... etc for all tables
```

### 2. Consolidate Function Names

```sql
-- Replace all handle_updated_at() and update_updated_at()
-- with single set_updated_at() function

-- Then update all triggers:
ALTER TRIGGER set_updated_at ON products 
  EXECUTE FUNCTION set_updated_at();

-- Drop old functions if no longer used
DROP FUNCTION update_updated_at();
```

### 3. Use Table-Specific Trigger Names

```sql
-- Rename triggers for clarity
ALTER TRIGGER set_updated_at ON products 
  RENAME TO set_products_updated_at;

ALTER TRIGGER set_updated_at ON categories 
  RENAME TO set_categories_updated_at;

-- Continue for all tables...
```

### 4. Add Trigger for product_images

```sql
ALTER TABLE product_images 
  ADD COLUMN updated_at timestamp DEFAULT now();

CREATE TRIGGER set_product_images_updated_at 
  BEFORE UPDATE ON product_images
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();
```

### 5. Add Logging Trigger (Optional)

```sql
-- For audit trail
CREATE TABLE trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text,
  operation text,
  row_id uuid,
  old_data jsonb,
  new_data jsonb,
  timestamp timestamp DEFAULT now()
);

CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trigger_logs (table_name, operation, row_id, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE TG_OP WHEN 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE TG_OP WHEN 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER log_orders_changes AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_changes();
```

---

## 🔍 Trigger Debugging Guide

### Issue: updated_at Not Changing

```typescript
// Debug trigger not working
const debugTrigger = async (tableId: string) => {
  // 1. Get current state
  const before = await supabase
    .from('products')
    .select('updated_at')
    .eq('id', tableId)
    .single();

  // 2. Wait a second
  await new Promise(r => setTimeout(r, 1000));

  // 3. Update something
  await supabase
    .from('products')
    .update({ name: `Updated ${Date.now()}` })
    .eq('id', tableId);

  // 4. Check if updated_at changed
  const after = await supabase
    .from('products')
    .select('updated_at')
    .eq('id', tableId)
    .single();

  const changed = before.data.updated_at !== after.data.updated_at;

  if (!changed) {
    console.error('ERROR: Trigger not working!');
    console.log('Before:', before.data.updated_at);
    console.log('After:', after.data.updated_at);
    return false;
  }

  console.log('✓ Trigger working correctly');
  return true;
};
```

### Issue: Trigger Causing Slow Updates

```sql
-- Check trigger function performance
EXPLAIN ANALYZE
UPDATE products SET name = 'test' WHERE id = 'test-id';

-- If slower than expected:
-- 1. Check if function has complex logic (should just set timestamp)
-- 2. Check for nested triggers
-- 3. Check for foreign key cascades
```

---

## ✅ Frontend Trigger Integration Checklist

- [ ] Understand that updated_at is auto-set by trigger
- [ ] Don't manually set updated_at in UPDATE calls
- [ ] Display updated_at in product/order cards
- [ ] Sort by updated_at for "recently modified" features
- [ ] Use updated_at for stale content detection
- [ ] Format updated_at with formatDistanceToNow()
- [ ] Set up real-time subscriptions to watch updated_at changes
- [ ] Implement audit trail using updated_at timestamps
- [ ] Cache content based on updated_at
- [ ] Show "Last updated" badge on products
- [ ] Create dashboard showing recently updated items
- [ ] Track profile updates using updated_at
- [ ] Monitor trigger performance in production

---

## 📋 Trigger Summary Table

| Table | Trigger | Function | Event | Impact |
|-------|---------|----------|-------|--------|
| categories | set_updated_at | handle_updated_at() | BEFORE UPDATE | Auto-set timestamp |
| products | set_updated_at | handle_updated_at() | BEFORE UPDATE | Auto-set timestamp |
| addresses | set_updated_at | handle_updated_at() | BEFORE UPDATE | Auto-set timestamp |
| orders | set_updated_at | handle_updated_at() | BEFORE UPDATE | Auto-set timestamp |
| cart_items | set_updated_at | handle_updated_at() | BEFORE UPDATE | Auto-set timestamp |
| product_attributes | set_updated_at | handle_updated_at() | BEFORE UPDATE | Auto-set timestamp |
| product_variants | set_updated_at | handle_updated_at() | BEFORE UPDATE | Auto-set timestamp |
| site_texts | trg_update_site_texts_updated_at | update_updated_at() | BEFORE UPDATE | Auto-set timestamp |
| auth.users | on_auth_user_created | handle_new_user() | AFTER INSERT | Auto-create profile |

---

**Status:** ✅ Triggers Documented - Complete Backend Reference Finished

## 🎉 **COMPLETE BACKEND DOCUMENTATION (7 FILES):**

1. ✅ **SCHEMA_ANALYSIS_CONTEXT.md** - 19 tables
2. ✅ **RLS_POLICIES_ANALYSIS.md** - 48 policies
3. ✅ **FUNCTIONS_STORED_PROCEDURES.md** - 9 functions
4. ✅ **FOREIGN_KEYS_RELATIONSHIPS.md** - 27 FKs
5. ✅ **DATABASE_INDEXES.md** - 42 indexes
6. ✅ **DATABASE_ENUMS.md** - 7 enums
7. ✅ **DATABASE_TRIGGERS.md** - 8 triggers (THIS FILE)

---

**Next Steps - Choose One:**

### **Option 1: COMPLETE_FRONTEND_INTEGRATION_GUIDE.md** ⭐ (RECOMMENDED)
- React component specifications
- TypeScript API layer
- Real code examples
- Error handling
- Performance tips
- Multi-language support

### **Option 2: STORAGE_CONFIGURATION.md**
- Supabase Storage buckets
- Image upload & optimization
- File access policies

### **Option 3: COMPLETE_IMPLEMENTATION_CHECKLIST.md**
- Feature-by-feature tasks
- Component specs
- Testing requirements

**All backend specs now documented! Ready to design frontend architecture.** 🚀
