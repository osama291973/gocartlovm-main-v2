/**
 * Implementation Guide: Backend-Frontend Integration
 * 
 * This document provides step-by-step instructions for implementing
 * missing features and fixing compatibility issues.
 * 
 * Generated: November 15, 2025
 */

# Implementation Guide

## Phase 1: Critical Fixes (Priority: HIGH)

### 1.1 Fix Order Creation with Order Items

**File:** `src/hooks/useOrders.ts`

**Current Problem:** 
Orders are created without `order_items` records, breaking the order details view.

**Solution:**
Update the `createOrder` mutation to:
1. Create order record
2. Create order_items for each cart item
3. Update product stock
4. Clear cart

```typescript
// Add this to useOrders.ts
export const useOrders = () => {
  const createOrderWithItems = useMutation({
    mutationFn: async (params: {
      address_id: string;
      cartItems: CartItem[];
      coupon_id?: string;
      payment_method?: string;
      discount?: number;
      shipping?: number;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      // Calculate totals
      const subtotal = params.cartItems.reduce(
        (sum, item) => sum + ((item.variant?.price || item.product?.price || 0) * item.quantity),
        0
      );
      const discount = params.discount || 0;
      const shipping = params.shipping || 0;
      const total = subtotal - discount + shipping;

      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          address_id: params.address_id,
          coupon_id: params.coupon_id || null,
          subtotal,
          discount,
          shipping,
          total,
          payment_status: 'pending',
          status: 'pending',
          payment_method: params.payment_method,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = params.cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        store_id: item.product?.store_id, // Add store_id to product data
        quantity: item.quantity,
        price: item.variant?.price || item.product?.price || 0,
        total: (item.variant?.price || item.product?.price || 0) * item.quantity,
        product_name: item.product?.name || 'Unknown Product',
        product_image: item.product?.image_url || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Update product stock for each item
      for (const item of params.cartItems) {
        const newStock = (item.product?.stock || 0) - item.quantity;
        await supabase
          .from('products')
          .update({ stock: Math.max(0, newStock) })
          .eq('id', item.product_id);
      }

      return order;
    },
  });

  return { createOrderWithItems };
};
```

### 1.2 Implement Coupon System in Checkout

**File:** `src/pages/Checkout.tsx`

**Changes:**
1. Import coupon components and hooks
2. Add coupon input section
3. Calculate discount and apply to total

```typescript
import { CouponInput } from '@/components/CouponInput';
import { useCoupons } from '@/hooks/useCoupons';

// In component:
const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
const [discount, setDiscount] = useState(0);
const { calculateDiscount } = useCoupons();

const subtotal = cartItems.reduce(...); // existing code
const shipping = 0; // calculate based on address
const total = subtotal - discount + shipping;

// In JSX, add coupon section before order summary:
<Card>
  <CardHeader>
    <CardTitle>Promo Code</CardTitle>
  </CardHeader>
  <CardContent>
    <CouponInput
      subtotal={subtotal}
      appliedCoupon={appliedCoupon}
      onApplySuccess={(coupon, discountAmount) => {
        setAppliedCoupon(coupon);
        setDiscount(discountAmount);
      }}
      onRemove={() => {
        setAppliedCoupon(null);
        setDiscount(0);
      }}
    />
  </CardContent>
</Card>

// Update order creation call:
await createOrderWithItems.mutateAsync({
  address_id: selectedAddress,
  cartItems: cartItems,
  coupon_id: appliedCoupon?.id || null,
  discount: discount,
  shipping: shipping,
});
```

### 1.3 Verify and Update Cart Hook

**File:** `src/hooks/useCart.ts`

**Current Issue:** 
Cart items may not include all product data needed for checkout.

**Fix:**
Expand the select query to include store_id and name:

```typescript
const { data: cartItems = [] } = useQuery({
  queryKey: ['cart', user?.id],
  queryFn: async () => {
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        product_id,
        variant_id,
        quantity,
        created_at,
        updated_at,
        product:products(
          id, 
          name,
          slug, 
          stock, 
          price,
          store_id,
          image_url
        ),
        variant:product_variants(id, sku, price, stock)
      `)
      .eq('user_id', user.id);

    if (error) throw error;
    return data || [];
  },
});
```

---

## Phase 2: Feature Implementation (Priority: MEDIUM)

### 2.1 Implement Product Variants UI

**Files to Create:**

#### A. `src/components/VariantSelector.tsx`
```typescript
// For customers to select variant options
export const VariantSelector = ({ product, onSelect }) => {
  // Fetch attributes and variants
  // Display variant options
  // Handle quantity and selection
  // Return selected variant data
};
```

#### B. `src/components/VariantForm.tsx`
```typescript
// For sellers to create/edit variants
export const VariantForm = ({ product, onSubmit }) => {
  // Form fields for SKU, price, stock
  // Display product attributes
  // Handle variant attribute selection
};
```

#### C. `src/components/VariantManager.tsx`
```typescript
// For sellers to manage existing variants
export const VariantManager = ({ product }) => {
  // List existing variants
  // Edit/delete options
  // Bulk actions
};
```

### 2.2 Add Variant Support to AddProductPage

**File:** `src/pages/AddProductPage.tsx`

**Changes:**
1. Add "Has Variants" toggle
2. Show variant form when enabled
3. Save variants with product

```typescript
// Add to form state:
const [hasVariants, setHasVariants] = useState(false);
const [variants, setVariants] = useState<VariantInput[]>([]);

// Add toggle section in form:
<div>
  <label className="flex items-center gap-2">
    <input 
      type="checkbox"
      checked={hasVariants}
      onChange={(e) => setHasVariants(e.target.checked)}
    />
    This product has variations (Size, Color, etc.)
  </label>
</div>

// Show variant form if enabled:
{hasVariants && (
  <VariantForm 
    product={formData}
    onAddVariant={(variant) => setVariants([...variants, variant])}
  />
)}

// In submit, pass variants to createProduct:
const result = await createProduct(productData, translations, variants);
```

### 2.3 Create Admin Coupons Page

**File:** `src/pages/AdminCoupons.tsx`

```typescript
export const AdminCoupons = () => {
  const { adminCoupons, loadingAdminCoupons } = useCoupons();
  
  // Sections:
  // 1. List of active coupons with stats
  // 2. Create new coupon form
  // 3. Edit/delete actions
  // 4. Usage tracking
  
  return (
    <div>
      <h1>Coupon Management</h1>
      <CouponCreateForm />
      <CouponList coupons={adminCoupons} />
    </div>
  );
};
```

---

## Phase 3: Optional Enhancements (Priority: LOW)

### 3.1 Implement Product Attributes Admin

**File:** `src/pages/AdminProductAttributes.tsx`

Manage product attributes system for variant management.

### 3.2 Implement Store Ratings

Calculate and display store ratings based on product reviews.

### 3.3 Implement Site Texts CMS

Allow admins to manage site-wide text strings via `site_texts` table.

---

## Testing Checklist

- [ ] Order creation includes order_items
- [ ] Order items have correct store_id
- [ ] Product stock decreases after order
- [ ] Coupon discount is applied correctly
- [ ] Coupon validation works (min purchase, expiry, etc.)
- [ ] Cart items include all required data
- [ ] Variants can be created and selected
- [ ] Product attributes display correctly
- [ ] All RLS policies allow proper access

---

## Database Migration Requirements

None required - backend schema is complete and compatible.

## Performance Considerations

1. **Index Usage:** All indexes are properly created
2. **Query Optimization:** Use `.select()` with specific fields
3. **Caching:** React Query already configured
4. **Pagination:** Implement for large result sets

## Security Considerations

1. **RLS Policies:** All in place, verify they work
2. **User Validation:** Always check auth in mutations
3. **Store Ownership:** Verify seller owns store before allowing changes
4. **Price Validation:** Use Decimal lib for precision

---

## Code Examples

### Using Decimal for Price Calculations
```typescript
import { toDecimal } from '@/lib/decimal';

const subtotal = toDecimal('99.99');
const discountPercent = toDecimal('10');
const discount = subtotal.times(discountPercent).dividedBy(100);
const total = subtotal.minus(discount);

console.log(total.toString()); // "89.99"
```

### Applying Coupon in Checkout
```typescript
const { appliedCoupon, discount } = state;

const orderParams = {
  address_id: selectedAddress,
  cartItems: cartItems,
  coupon_id: appliedCoupon?.id || null,
  discount: discount,
  payment_method: selectedMethod,
};

await createOrderWithItems.mutateAsync(orderParams);
```

---

## Support & Troubleshooting

### Issue: Coupon validation fails
**Solution:** Check coupon expiry date format and usage limits

### Issue: Order items not created
**Solution:** Verify order creation returned the order object before inserting items

### Issue: Stock not updating
**Solution:** Ensure product stock field is numeric and not readonly

### Issue: Variant selection not showing
**Solution:** Verify product has `has_variants: true` and variants exist in DB

---

**End of Implementation Guide**
