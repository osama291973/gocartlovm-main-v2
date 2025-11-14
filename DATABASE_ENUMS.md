# Database Enums Documentation
**Created:** November 14, 2025  
**Status:** Complete Enum Reference & Type Definitions

---

## 📋 Executive Summary

**Total Enums:** 11 enum types  
**Total Values:** 42 enum values  
**Status:** Mix of active, deprecated, and consolidated enums  
**Frontend Implication:** TypeScript type definitions needed

---

## 🔄 Enum Status Overview

```
Active Enums (Used in Schema):
├─ language_code (2 values)
├─ seller_application_status (3 values)
├─ app_role (3 values) - CURRENT
├─ order_status_enum (6 values) - CURRENT
├─ payment_status_enum (4 values) - CURRENT
├─ store_status (2 values)
└─ user_role_status (4 values)

Deprecated/Obsolete Enums:
├─ app_role_old (4 values) - REPLACED by app_role
├─ order_status (6 values) - REPLACED by order_status_enum
├─ payment_status (4 values) - REPLACED by payment_status_enum
├─ store_status_old (4 values) - REPLACED by store_status
└─ ⚠️ Migration may be incomplete

Note: Duplicates suggest schema migration in progress
```

---

## 🌐 ACTIVE ENUMS

### 1️⃣ **language_code** (2 Values)

```
Enum: language_code
├─ en (English)
└─ ar (Arabic)
```

**Database Definition:**
```sql
CREATE TYPE language_code AS ENUM ('en', 'ar');
```

**Usage in Tables:**
```
├─ category_translations.language_code
├─ product_translations.language_code
├─ product_attribute_translations.language_code
├─ product_attribute_value_translations.language_code
├─ store_translations.language_code
└─ site_texts.language_code
```

**Frontend Implementation:**

```typescript
// TypeScript enum for type safety
export enum LanguageCode {
  English = 'en',
  Arabic = 'ar'
}

// Language labels for UI
export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  [LanguageCode.English]: 'English',
  [LanguageCode.Arabic]: 'العربية'
};

// Direction support
export const LANGUAGE_DIRECTIONS: Record<LanguageCode, 'ltr' | 'rtl'> = {
  [LanguageCode.English]: 'ltr',
  [LanguageCode.Arabic]: 'rtl'
};

// Usage
const currentLanguage: LanguageCode = 'en';
const isArabic = currentLanguage === LanguageCode.Arabic;
```

**Multi-Language Query Pattern:**

```typescript
// Load product in selected language
const loadProduct = async (productId: string, language: LanguageCode) => {
  const { data } = await supabase
    .from('products')
    .select(`
      id, price, stock,
      product_translations!inner(name, description)
    `)
    .eq('id', productId)
    .eq('product_translations.language_code', language)
    .single();

  return data;
};

// Fallback pattern: Try language, then fall back to English
const loadProductWithFallback = async (
  productId: string, 
  language: LanguageCode
) => {
  // Try requested language first
  let product = await loadProduct(productId, language);
  
  // Fallback to English if not found
  if (!product) {
    product = await loadProduct(productId, LanguageCode.English);
  }
  
  return product;
};
```

**Frontend Checklist:**
- [ ] Determine current user language (from context, localStorage, browser)
- [ ] Always include language_code in translation queries
- [ ] Implement fallback to 'en' if translation missing
- [ ] Set document direction (dir="ltr" or dir="rtl") based on language
- [ ] Format dates/numbers per language
- [ ] Support language switching on all pages
- [ ] Cache translations per language

---

### 2️⃣ **seller_application_status** (3 Values)

```
Enum: seller_application_status
├─ pending  (Awaiting admin review)
├─ approved (Seller account activated)
└─ rejected (Application denied)
```

**Database Definition:**
```sql
CREATE TYPE seller_application_status AS ENUM (
  'pending',
  'approved', 
  'rejected'
);
```

**Usage in Tables:**
```
└─ seller_applications.status
```

**State Flow Diagram:**
```
User submits application
    ↓ (apply_for_seller())
[pending] ← Application in admin queue
    ├─ Admin approves
    │   ↓ (approve_seller_application())
    │  [approved] ← Store created, seller role assigned
    │
    └─ Admin rejects
        ↓ (reject_seller_application())
       [rejected] ← Application denied, can reapply
```

**Frontend Implementation:**

```typescript
export enum SellerApplicationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

export const APPLICATION_STATUS_LABELS: Record<SellerApplicationStatus, string> = {
  [SellerApplicationStatus.Pending]: 'Application Pending',
  [SellerApplicationStatus.Approved]: 'Approved',
  [SellerApplicationStatus.Rejected]: 'Rejected'
};

export const APPLICATION_STATUS_COLORS: Record<SellerApplicationStatus, string> = {
  [SellerApplicationStatus.Pending]: 'yellow',    // Warning color
  [SellerApplicationStatus.Approved]: 'green',    // Success color
  [SellerApplicationStatus.Rejected]: 'red'       // Error color
};

// User dashboard component
const SellerApplicationStatus: React.FC<{status: SellerApplicationStatus}> = ({status}) => {
  return (
    <Badge color={APPLICATION_STATUS_COLORS[status]}>
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
};

// Check if user can create store (approved only)
const canCreateStore = (status: SellerApplicationStatus) => {
  return status === SellerApplicationStatus.Approved;
};

// Allow reapplication after rejection
const canReapply = (status: SellerApplicationStatus) => {
  return status === SellerApplicationStatus.Rejected;
};
```

**User Journey:**

```
1. User visits dashboard
   ├─ Check seller_applications.status
   ├─ If [pending]: Show "Application under review"
   ├─ If [approved]: Show "Seller account active"
   └─ If [rejected]: Show "Application rejected - Reapply?"

2. User wants to become seller
   ├─ Check if no existing [pending] application
   ├─ Call apply_for_seller() → Status set to [pending]
   └─ Show "Thank you! Awaiting review"

3. Admin approves
   ├─ Call approve_seller_application()
   ├─ Status: [pending] → [approved]
   ├─ Create store record
   ├─ Assign seller role
   └─ User can now create products

4. Admin rejects
   ├─ Call reject_seller_application()
   ├─ Status: [pending] → [rejected]
   └─ Show rejection notification
```

**Frontend Checklist:**
- [ ] Load seller application status on user login
- [ ] Display application status badge
- [ ] Show "Apply for seller" button only if not already applied
- [ ] Show "Reapply" button only if rejected
- [ ] Display seller store/products only if approved
- [ ] Subscribe to real-time status changes (optional)
- [ ] Send notification email on status change (backend)

---

### 3️⃣ **app_role** (3 Values) - ACTIVE VERSION

```
Enum: app_role
├─ user    (Regular customer)
├─ seller  (Seller with approved application)
└─ admin   (Administrator with full access)
```

**Database Definition:**
```sql
CREATE TYPE app_role AS ENUM ('user', 'seller', 'admin');
```

**Usage in Tables:**
```
└─ user_roles.role
```

**Role Hierarchy & Capabilities:**

```
user (Default role)
├─ ✓ Browse products
├─ ✓ Create reviews
├─ ✓ Manage cart
├─ ✓ Place orders
├─ ✓ Apply for seller status
├─ ✓ Manage profile
└─ ✓ Manage addresses

seller (After application approval)
├─ All user capabilities +
├─ ✓ Create/edit products
├─ ✓ Manage product variants
├─ ✓ Upload product images
├─ ✓ Add product translations
├─ ✓ Manage store profile
├─ ✓ View own orders (products sold)
└─ ✗ Cannot approve other sellers

admin (System administrator)
├─ All capabilities +
├─ ✓ Approve/reject seller applications
├─ ✓ Manage all products
├─ ✓ Manage all stores
├─ ✓ Manage site text/translations
├─ ✓ View all orders
├─ ✓ Manage users & roles
└─ ✓ System administration
```

**Frontend Implementation:**

```typescript
export enum AppRole {
  User = 'user',
  Seller = 'seller',
  Admin = 'admin'
}

// Get all user roles
const getUserRoles = async (userId: string): Promise<AppRole[]> => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active');
  
  return data?.map(r => r.role) ?? [];
};

// Check if user has specific role
const hasRole = async (userId: string, role: AppRole): Promise<boolean> => {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
};

// Or use database function
const checkRole = async (userId: string, role: AppRole): Promise<boolean> => {
  const { data } = await supabase
    .rpc('has_role', {
      _user_id: userId,
      _role: role
    });
  
  return data ?? false;
};

// UI component to show role-based content
const RoleGuard: React.FC<{
  roles: AppRole[];
  children: React.ReactNode;
}> = ({ roles, children }) => {
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  
  useEffect(() => {
    const loadRoles = async () => {
      const roles = await getUserRoles(user.id);
      setUserRoles(roles);
    };
    loadRoles();
  }, [user.id]);
  
  // Show content if user has any of the required roles
  if (!roles.some(r => userRoles.includes(r))) {
    return <div>Access Denied</div>;
  }
  
  return <>{children}</>;
};

// Usage
<RoleGuard roles={[AppRole.Seller, AppRole.Admin]}>
  <SellerDashboard />
</RoleGuard>

// Check highest role priority
const getHighestRole = (roles: AppRole[]): AppRole => {
  if (roles.includes(AppRole.Admin)) return AppRole.Admin;
  if (roles.includes(AppRole.Seller)) return AppRole.Seller;
  return AppRole.User;
};

// Show dashboard based on role
const Dashboard = ({ userId }: { userId: string }) => {
  const [role, setRole] = useState<AppRole | null>(null);
  
  useEffect(() => {
    const loadRole = async () => {
      const roles = await getUserRoles(userId);
      setRole(getHighestRole(roles));
    };
    loadRole();
  }, [userId]);
  
  switch (role) {
    case AppRole.Admin:
      return <AdminDashboard />;
    case AppRole.Seller:
      return <SellerDashboard />;
    case AppRole.User:
    default:
      return <UserDashboard />;
  }
};
```

**RLS Policy Usage:**

```sql
-- Seller products policy uses app_role
CREATE POLICY "Sellers can manage their products"
  ON products
  USING (
    store_id IN (
      SELECT s.id FROM stores s
      WHERE s.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
    )
  );
```

**Frontend Checklist:**
- [ ] Load user roles on authentication
- [ ] Cache roles in context/state
- [ ] Check roles before showing UI elements
- [ ] Use has_role() function for permission checks
- [ ] Guard route/pages with role requirements
- [ ] Show "Access Denied" for unauthorized access
- [ ] Update roles on real-time status changes
- [ ] Log role-based actions (audit trail)

---

### 4️⃣ **order_status_enum** (6 Values)

```
Enum: order_status_enum
├─ pending      (Order created, awaiting confirmation)
├─ processing   (Payment confirmed, preparing shipment)
├─ shipped      (Order left warehouse)
├─ delivered    (Order received by customer)
├─ cancelled    (Order cancelled by user/admin)
└─ returned     (Customer initiated return)
```

**Database Definition:**
```sql
CREATE TYPE order_status_enum AS ENUM (
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned'
);
```

**Usage in Tables:**
```
└─ orders.status (DEFAULT: 'pending')
```

**Order Status Flow Diagram:**

```
User places order
    ↓
[pending] ← Order created, awaiting payment confirmation
    ├─ User cancels before payment
    │   ↓
    │  [cancelled] ← Order cancelled
    │
    ├─ Payment confirmed
    │   ↓
    │  [processing] ← Preparing shipment
    │   ├─ Admin ships order
    │   │   ↓
    │   │  [shipped] ← In transit
    │   │   ├─ Delivered to customer
    │   │   │   ↓
    │   │   │  [delivered] ← Order complete ✓
    │   │   │   ├─ Customer requests return
    │   │   │   │   ↓
    │   │   │   │  [returned] ← Return initiated
    │   │   │   │
    │   │   │   └─ Order complete (no return)
    │   │   │
    │   │   └─ Delivery failed / Lost in transit
    │   │       ↓
    │   │      [cancelled] or [pending]?
    │   │       (Business decision)
    │   │
    │   └─ Payment failed
    │       ↓
    │      [cancelled]
    │
    └─ Payment timeout (24h+)
        ↓
       [cancelled] (Auto-cancel if not paid)
```

**Frontend Implementation:**

```typescript
export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Returned = 'returned'
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'Pending',
  [OrderStatus.Processing]: 'Processing',
  [OrderStatus.Shipped]: 'Shipped',
  [OrderStatus.Delivered]: 'Delivered',
  [OrderStatus.Cancelled]: 'Cancelled',
  [OrderStatus.Returned]: 'Returned'
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'Order received. Awaiting payment confirmation.',
  [OrderStatus.Processing]: 'Payment confirmed. Preparing your order.',
  [OrderStatus.Shipped]: 'Your order is on its way!',
  [OrderStatus.Delivered]: 'Order delivered successfully.',
  [OrderStatus.Cancelled]: 'Order was cancelled.',
  [OrderStatus.Returned]: 'Return initiated. Awaiting refund.'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'yellow',      // Warning
  [OrderStatus.Processing]: 'blue',     // Info
  [OrderStatus.Shipped]: 'cyan',        // Info
  [OrderStatus.Delivered]: 'green',     // Success
  [OrderStatus.Cancelled]: 'red',       // Danger
  [OrderStatus.Returned]: 'orange'      // Warning
};

// User actions available per status
export const AVAILABLE_ACTIONS: Record<OrderStatus, string[]> = {
  [OrderStatus.Pending]: ['cancel'],
  [OrderStatus.Processing]: ['cancel'],
  [OrderStatus.Shipped]: ['track'],
  [OrderStatus.Delivered]: ['return', 'review'],
  [OrderStatus.Cancelled]: [],
  [OrderStatus.Returned]: []
};

// Order timeline component
const OrderTimeline: React.FC<{status: OrderStatus}> = ({status}) => {
  const statusOrder: OrderStatus[] = [
    OrderStatus.Pending,
    OrderStatus.Processing,
    OrderStatus.Shipped,
    OrderStatus.Delivered
  ];
  
  const currentIndex = statusOrder.indexOf(status);
  
  return (
    <div className="timeline">
      {statusOrder.map((s, idx) => (
        <div 
          key={s}
          className={`timeline-item ${
            idx <= currentIndex ? 'completed' : 'pending'
          } ${s === status ? 'active' : ''}`}
        >
          <div className="timeline-dot"></div>
          <div className="timeline-label">{ORDER_STATUS_LABELS[s]}</div>
        </div>
      ))}
    </div>
  );
};

// Load user orders
const loadOrderHistory = async (userId: string) => {
  const { data } = await supabase
    .from('orders')
    .select(`
      id, status, payment_status, total, created_at,
      order_items(product_id, quantity, price),
      orders_products(name, image_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return data;
};

// Order card component
const OrderCard: React.FC<{order: Order}> = ({order}) => {
  return (
    <Card>
      <div className="order-header">
        <span>Order #{order.id}</span>
        <Badge color={ORDER_STATUS_COLORS[order.status]}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>
      <p className="order-description">
        {ORDER_STATUS_DESCRIPTIONS[order.status]}
      </p>
      <OrderTimeline status={order.status} />
      <div className="order-actions">
        {AVAILABLE_ACTIONS[order.status].map(action => (
          <Button key={action} onClick={() => handleAction(action)}>
            {action.charAt(0).toUpperCase() + action.slice(1)}
          </Button>
        ))}
      </div>
    </Card>
  );
};
```

**Frontend Checklist:**
- [ ] Display order status with icon/color
- [ ] Show order timeline (pending → processing → shipped → delivered)
- [ ] Enable actions based on current status (cancel, track, return)
- [ ] Auto-refresh order status every 5 minutes
- [ ] Subscribe to real-time order status updates
- [ ] Show "Estimated delivery date" for shipped orders
- [ ] Show tracking link if available
- [ ] Notify user of status changes
- [ ] Disable prohibited actions (e.g., cannot cancel delivered order)

---

### 5️⃣ **payment_status_enum** (4 Values)

```
Enum: payment_status_enum
├─ pending  (Awaiting payment)
├─ paid     (Payment received)
├─ failed   (Payment declined)
└─ refunded (Refund issued)
```

**Database Definition:**
```sql
CREATE TYPE payment_status_enum AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);
```

**Usage in Tables:**
```
└─ orders.payment_status (DEFAULT: 'pending')
```

**Payment Status Flow:**

```
Order created
    ↓
[pending] ← Awaiting payment
    ├─ Customer processes payment
    │   ├─ Payment gateway approves
    │   │   ↓
    │   │  [paid] ← Payment confirmed
    │   │   ├─ Order processing
    │   │   └─ Shipped
    │   │
    │   └─ Payment gateway rejects
    │       ↓
    │      [failed] ← Payment failed, retry or cancel
    │       ├─ User retries payment
    │       │   ├─ Success → [paid]
    │       │   └─ Failure → [failed]
    │       │
    │       └─ User cancels order
    │           ↓
    │          Order cancelled
    │
└─ Order shipped
    ├─ Customer satisfied
    └─ Customer requests refund
        ↓
       [refunded] ← Refund processed
```

**Frontend Implementation:**

```typescript
export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Failed = 'failed',
  Refunded = 'refunded'
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'Awaiting Payment',
  [PaymentStatus.Paid]: 'Paid',
  [PaymentStatus.Failed]: 'Payment Failed',
  [PaymentStatus.Refunded]: 'Refunded'
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'yellow',    // Warning
  [PaymentStatus.Paid]: 'green',        // Success
  [PaymentStatus.Failed]: 'red',        // Error
  [PaymentStatus.Refunded]: 'blue'      // Info
};

// Checkout flow
const CheckoutFlow: React.FC = () => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    PaymentStatus.Pending
  );
  
  const handlePayment = async (paymentMethod: string) => {
    try {
      const result = await processPayment(paymentMethod);
      
      if (result.success) {
        setPaymentStatus(PaymentStatus.Paid);
        // Create order
        await createOrder();
      } else {
        setPaymentStatus(PaymentStatus.Failed);
      }
    } catch (error) {
      setPaymentStatus(PaymentStatus.Failed);
    }
  };
  
  return (
    <div className="checkout">
      {paymentStatus === PaymentStatus.Pending && (
        <PaymentForm onSubmit={handlePayment} />
      )}
      {paymentStatus === PaymentStatus.Paid && (
        <SuccessMessage>Payment confirmed!</SuccessMessage>
      )}
      {paymentStatus === PaymentStatus.Failed && (
        <ErrorMessage>
          Payment failed. Please try again.
          <RetryButton onClick={() => setPaymentStatus(PaymentStatus.Pending)} />
        </ErrorMessage>
      )}
    </div>
  );
};

// Order detail with payment status
const OrderDetail: React.FC<{orderId: string}> = ({orderId}) => {
  const [order, setOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    const loadOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select()
        .eq('id', orderId)
        .single();
      
      setOrder(data);
    };
    
    loadOrder();
  }, [orderId]);
  
  if (!order) return <Loading />;
  
  return (
    <div className="order-detail">
      <h2>Order Details</h2>
      <section>
        <h3>Payment Status</h3>
        <Badge color={PAYMENT_STATUS_COLORS[order.payment_status]}>
          {PAYMENT_STATUS_LABELS[order.payment_status]}
        </Badge>
        
        {order.payment_status === PaymentStatus.Failed && (
          <button onClick={() => retryPayment(orderId)}>
            Retry Payment
          </button>
        )}
        
        {order.payment_status === PaymentStatus.Paid && (
          <p>Thank you for your payment!</p>
        )}
        
        {order.payment_status === PaymentStatus.Refunded && (
          <p>Refund has been processed.</p>
        )}
      </section>
    </div>
  );
};
```

**Frontend Checklist:**
- [ ] Show payment status on checkout page
- [ ] Handle payment failure gracefully
- [ ] Enable payment retry after failure
- [ ] Show payment confirmation
- [ ] Track refund status
- [ ] Prevent order actions if payment pending
- [ ] Show invoice after payment confirmed
- [ ] Handle payment gateway responses
- [ ] Log payment status changes

---

### 6️⃣ **store_status** (2 Values)

```
Enum: store_status
├─ active   (Store is operational)
└─ inactive (Store suspended/not operational)
```

**Database Definition:**
```sql
CREATE TYPE store_status AS ENUM ('active', 'inactive');
```

**Usage in Tables:**
```
└─ stores.status (DEFAULT: 'inactive')
```

**Store Status Logic:**

```
Seller creates store
    ↓
[inactive] ← Store created but not visible
    ├─ Admin approves store
    │   ↓
    │  [active] ← Store visible, selling enabled ✓
    │   ├─ Seller operates store
    │   │   └─ Products can be purchased
    │   │
    │   └─ Admin suspends store (violations)
    │       ↓
    │      [inactive] ← Products hidden, no sales
    │
    └─ Store permanently closed
        ↓
       [inactive] + soft delete?
```

**Frontend Implementation:**

```typescript
export enum StoreStatus {
  Active = 'active',
  Inactive = 'inactive'
}

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  [StoreStatus.Active]: 'Active',
  [StoreStatus.Inactive]: 'Inactive'
};

export const STORE_STATUS_COLORS: Record<StoreStatus, string> = {
  [StoreStatus.Active]: 'green',
  [StoreStatus.Inactive]: 'gray'
};

// Load only active stores for marketplace
const loadActiveStores = async () => {
  const { data } = await supabase
    .from('stores')
    .select()
    .eq('status', StoreStatus.Active)
    .order('rating', { ascending: false });
  
  return data;
};

// Load all stores for admin
const loadAllStores = async () => {
  const { data } = await supabase
    .from('stores')
    .select()
    .order('created_at', { ascending: false });
  
  return data;
};

// Store card with status
const StoreCard: React.FC<{store: Store}> = ({store}) => {
  if (store.status === StoreStatus.Inactive) {
    // Show grayed out for inactive stores
    return (
      <div className="store-card disabled">
        <p>This store is currently inactive</p>
      </div>
    );
  }
  
  return (
    <div className="store-card">
      <h3>{store.name}</h3>
      <p>Rating: {store.rating}/5</p>
      <Button>Browse Store</Button>
    </div>
  );
};

// Seller dashboard status control
const StoreStatusControl: React.FC<{store: Store}> = ({store}) => {
  const isAdmin = hasRole(AppRole.Admin);
  
  if (!isAdmin) return null;
  
  return (
    <div className="status-control">
      <label>Store Status:</label>
      <select 
        value={store.status}
        onChange={(e) => updateStoreStatus(store.id, e.target.value)}
      >
        <option value={StoreStatus.Active}>Active</option>
        <option value={StoreStatus.Inactive}>Inactive</option>
      </select>
    </div>
  );
};
```

**Frontend Checklist:**
- [ ] Only show active stores in marketplace
- [ ] Show all stores in admin dashboard
- [ ] Gray out/disable inactive store listings
- [ ] Display suspension reason if available (in comments)
- [ ] Allow admin to toggle store status
- [ ] Notify seller when store status changes
- [ ] Prevent purchases from inactive stores
- [ ] Archive store on deletion (don't delete records)

---

### 7️⃣ **user_role_status** (4 Values)

```
Enum: user_role_status
├─ active   (Role is in effect)
├─ inactive (Role deactivated but not deleted)
├─ pending  (Role awaiting activation)
└─ revoked  (Role removed due to violations)
```

**Database Definition:**
```sql
CREATE TYPE user_role_status AS ENUM (
  'active',
  'inactive', 
  'pending',
  'revoked'
);
```

**Usage in Tables:**
```
└─ user_roles.status (DEFAULT: 'active')
```

**Role Status Flow:**

```
Admin assigns role to user
    ↓
[pending] ← Role awaiting activation
    ├─ User accepts role
    │   ↓
    │  [active] ← Role in effect ✓
    │   ├─ User operates with role
    │   └─ Admin revokes for violations
    │       ↓
    │      [revoked] ← Role removed permanently
    │
    └─ Admin deactivates role
        ↓
       [inactive] ← Temporary deactivation
        ├─ Admin reactivates
        │   ↓
        │  [active]
        │
        └─ Later admin revokes
            ↓
           [revoked]
```

**Frontend Implementation:**

```typescript
export enum UserRoleStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Revoked = 'revoked'
}

export const USER_ROLE_STATUS_LABELS: Record<UserRoleStatus, string> = {
  [UserRoleStatus.Active]: 'Active',
  [UserRoleStatus.Inactive]: 'Inactive',
  [UserRoleStatus.Pending]: 'Pending',
  [UserRoleStatus.Revoked]: 'Revoked'
};

export const USER_ROLE_STATUS_COLORS: Record<UserRoleStatus, string> = {
  [UserRoleStatus.Active]: 'green',
  [UserRoleStatus.Inactive]: 'gray',
  [UserRoleStatus.Pending]: 'yellow',
  [UserRoleStatus.Revoked]: 'red'
};

// Get only active roles for permission checks
const getActiveRoles = async (userId: string): Promise<AppRole[]> => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('status', UserRoleStatus.Active);
  
  return data?.map(r => r.role) ?? [];
};

// Check if specific role is active for user
const hasActiveRole = async (
  userId: string, 
  role: AppRole
): Promise<boolean> => {
  const { data } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', role)
    .eq('status', UserRoleStatus.Active)
    .single();
  
  return !!data;
};

// Admin: Manage user roles
const UserRoleManagement: React.FC<{userId: string}> = ({userId}) => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  
  useEffect(() => {
    const loadRoles = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select()
        .eq('user_id', userId);
      
      setRoles(data ?? []);
    };
    
    loadRoles();
  }, [userId]);
  
  const updateRoleStatus = async (roleId: string, status: UserRoleStatus) => {
    await supabase
      .from('user_roles')
      .update({ status })
      .eq('id', roleId);
    
    // Reload roles
  };
  
  return (
    <div className="role-management">
      <h3>User Roles</h3>
      {roles.map(role => (
        <div key={role.id} className="role-item">
          <span>{role.role}</span>
          <Badge color={USER_ROLE_STATUS_COLORS[role.status]}>
            {USER_ROLE_STATUS_LABELS[role.status]}
          </Badge>
          <select 
            value={role.status}
            onChange={(e) => updateRoleStatus(role.id, e.target.value as UserRoleStatus)}
          >
            <option value={UserRoleStatus.Active}>Active</option>
            <option value={UserRoleStatus.Inactive}>Inactive</option>
            <option value={UserRoleStatus.Revoked}>Revoked</option>
          </select>
        </div>
      ))}
    </div>
  );
};
```

**Frontend Checklist:**
- [ ] Load only active roles for permission checks
- [ ] Treat pending roles as inactive (no access)
- [ ] Log role status changes for audit trail
- [ ] Notify user of role changes
- [ ] Admin can toggle role status
- [ ] Show revoked roles with explanation
- [ ] Refresh permissions when role status changes
- [ ] Prevent user from performing actions if role becomes inactive

---

## ⚠️ DEPRECATED ENUMS (Do Not Use)

### ❌ **app_role_old** (DEPRECATED - Use `app_role` instead)

```
OLD VALUES (Deprecated):
├─ user
├─ seller_pending
├─ seller_approved
└─ admin

REPLACED BY:
├─ user (same)
├─ seller (replaces seller_pending + seller_approved)
├─ admin (same)

Migration Status: ⚠️ May need data migration
```

**Issue:** Old enum has "seller_pending" and "seller_approved" as role values, but now we track seller status separately in `seller_applications.status`. 

**Migration Path:**
```sql
-- Update old values to new
UPDATE user_roles 
SET role = 'seller'::app_role
WHERE role IN ('seller_pending', 'seller_approved');

-- Then drop old enum
DROP TYPE app_role_old;
```

---

### ❌ **order_status** (DEPRECATED - Use `order_status_enum` instead)

```
OLD:
├─ pending
├─ confirmed
├─ processing
├─ shipped
├─ delivered
└─ cancelled

NEW (order_status_enum):
├─ pending
├─ processing
├─ shipped
├─ delivered
├─ cancelled
└─ returned (NEW)

Difference: 'confirmed' removed, 'returned' added
```

---

### ❌ **payment_status** (DEPRECATED - Use `payment_status_enum` instead)

```
Both have same values (4), but enum was renamed/consolidated
Migration: Straightforward, values are identical
```

---

### ❌ **store_status_old** (DEPRECATED - Use `store_status` instead)

```
OLD:
├─ pending
├─ active
├─ suspended
└─ closed

NEW (store_status):
├─ active
└─ inactive

Changes:
├─ 'pending' removed (use seller_applications.status)
├─ 'suspended' → 'inactive'
├─ 'closed' → 'inactive' (or soft delete)
```

**Migration Needed:**
```sql
-- Update old values
UPDATE stores 
SET status = CASE 
  WHEN status = 'pending' THEN 'inactive'
  WHEN status = 'suspended' THEN 'inactive'
  WHEN status = 'closed' THEN 'inactive'
  ELSE status
END;

-- Convert to new type
ALTER TABLE stores 
ALTER COLUMN status TYPE store_status 
USING status::text::store_status;
```

---

## 📋 Enum Usage by Table

```
address (no enums)
cart_items (no enums)
categories (no enums)
category_translations:
  └─ language_code

coupons (no enums)

order_items (no enums)
orders:
  ├─ status (order_status_enum)
  └─ payment_status (payment_status_enum)

product_attribute_translations:
  └─ language_code
product_attribute_values (no enums)
product_attribute_value_translations:
  └─ language_code
product_attributes (no enums)

product_images (no enums)

product_translations:
  └─ language_code

product_variant_attributes (no enums)
product_variants (no enums)

products (no enums)

profiles (no enums)

reviews (no enums)

seller_applications:
  └─ status (seller_application_status)

site_texts:
  └─ language_code

store_translations:
  └─ language_code

stores:
  └─ status (store_status)

user_roles:
  ├─ role (app_role)
  └─ status (user_role_status)
```

---

## 🚀 TypeScript Type Definitions

Create a single file for all enum definitions:

```typescript
// types/enums.ts

// Languages
export enum LanguageCode {
  English = 'en',
  Arabic = 'ar'
}

// Seller Application Status
export enum SellerApplicationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

// App Roles
export enum AppRole {
  User = 'user',
  Seller = 'seller',
  Admin = 'admin'
}

// Order Status
export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Returned = 'returned'
}

// Payment Status
export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Failed = 'failed',
  Refunded = 'refunded'
}

// Store Status
export enum StoreStatus {
  Active = 'active',
  Inactive = 'inactive'
}

// User Role Status
export enum UserRoleStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Revoked = 'revoked'
}

// Type unions for database operations
export type AnyEnum = 
  | LanguageCode
  | SellerApplicationStatus
  | AppRole
  | OrderStatus
  | PaymentStatus
  | StoreStatus
  | UserRoleStatus;

// Type for enum value validation
export const enum_values = {
  language_code: Object.values(LanguageCode),
  seller_application_status: Object.values(SellerApplicationStatus),
  app_role: Object.values(AppRole),
  order_status_enum: Object.values(OrderStatus),
  payment_status_enum: Object.values(PaymentStatus),
  store_status: Object.values(StoreStatus),
  user_role_status: Object.values(UserRoleStatus)
} as const;
```

---

## ✅ Frontend Enum Implementation Checklist

- [ ] Create TypeScript enums for all active enum types
- [ ] Create label/color maps for UI display
- [ ] Import enums in components that use them
- [ ] Use enums in type definitions (not string literals)
- [ ] Validate enum values on form submission
- [ ] Create helper functions for enum operations
- [ ] Update RLS policies if using new enums
- [ ] Add migrations to handle deprecated enums
- [ ] Test enum type safety with TypeScript strict mode
- [ ] Document enum values in component props
- [ ] Create Storybook stories for enum-based UI states

---

## 🎯 Data Flow with Enums

```
User Signs Up
  ├─ Create user in auth.users
  ├─ Create profile (trigger: handle_new_user)
  ├─ Assign role: user_roles
  │   ├─ role = 'user' (AppRole.User)
  │   └─ status = 'active' (UserRoleStatus.Active)
  └─ Default language = 'en' (LanguageCode.English)

User Applies for Seller
  ├─ Call: apply_for_seller()
  ├─ Create: seller_applications
  │   └─ status = 'pending' (SellerApplicationStatus.Pending)
  └─ Show: "Application submitted"

Admin Approves Seller
  ├─ Call: approve_seller_application()
  ├─ Update: seller_applications
  │   └─ status = 'approved'
  ├─ Create: store
  │   └─ status = 'active' (StoreStatus.Active)
  ├─ Create: user_roles
  │   ├─ role = 'seller' (AppRole.Seller)
  │   └─ status = 'active'
  └─ Notify: User can now create products

User Places Order
  ├─ Create: orders
  │   ├─ status = 'pending' (OrderStatus.Pending)
  │   └─ payment_status = 'pending' (PaymentStatus.Pending)
  ├─ Create: order_items
  └─ Show: "Order received. Awaiting payment."

User Pays
  ├─ Call: Payment gateway
  ├─ Update: orders.payment_status
  │   └─ 'paid' (PaymentStatus.Paid)
  ├─ Update: orders.status
  │   └─ 'processing' (OrderStatus.Processing)
  └─ Notify: "Payment confirmed"

Seller Ships Order
  ├─ Update: orders.status
  │   └─ 'shipped' (OrderStatus.Shipped)
  └─ Notify: "Order shipped"

Customer Receives
  ├─ Update: orders.status
  │   └─ 'delivered' (OrderStatus.Delivered)
  └─ Show: "Leave a review"
```

---

**Status:** ✅ Enums Documented - Complete Backend Reference Now Available

## 📚 **Complete Backend Documentation Set (6 Files):**

1. ✅ **SCHEMA_ANALYSIS_CONTEXT.md** - 19 tables
2. ✅ **RLS_POLICIES_ANALYSIS.md** - 48 policies
3. ✅ **FUNCTIONS_STORED_PROCEDURES.md** - 9 functions
4. ✅ **FOREIGN_KEYS_RELATIONSHIPS.md** - 27 FKs
5. ✅ **DATABASE_INDEXES.md** - 42 indexes
6. ✅ **DATABASE_ENUMS.md** - 7 active enums (THIS FILE)

---

**Next Phase Options:**

1. **Create COMPLETE_FRONTEND_INTEGRATION_GUIDE.md**
   - API patterns for each enum
   - React component examples
   - Form handling
   - Type safety patterns

2. **Create Storage & File Upload Documentation**
   - Supabase Storage configuration
   - File upload policies
   - Image optimization

3. **Create Testing & Validation Guide**
   - Enum validation patterns
   - Test cases for each enum
   - Error scenarios

Would you like to proceed with the **Complete Frontend Integration Guide** or focus on another area? 🚀
