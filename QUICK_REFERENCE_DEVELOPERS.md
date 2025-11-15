# Quick Reference: Backend Tables & Frontend Integration

## 🔗 Table-to-Hook Mapping

### User Management
| Backend Table | Frontend Hook | Status | Notes |
|---|---|---|---|
| profiles | useAuth (partial) | ⚠️ Partial | Profile data not fully used |
| user_roles | useAuth | ✅ OK | Auth roles check |

### Products
| Backend Table | Frontend Hook | Status | Notes |
|---|---|---|---|
| products | useProducts | ✅ OK | Full CRUD working |
| product_translations | useTranslationMutations | ✅ OK | Multi-language |
| categories | (direct fetch) | ✅ OK | Used in forms |
| category_translations | (direct fetch) | ✅ OK | Multi-language support |
| product_variants | useProductVariants | ⚠️ Partial | Hook exists, UI missing |
| product_variant_attributes | useProductVariants | ⚠️ Partial | Not fully exposed |
| product_attributes | useProductAttributes | ✅ NEW | Created |
| product_attribute_values | useProductAttributes | ✅ NEW | Created |
| product_images | (not used - gallery_urls used instead) | ⚠️ Unused | Alternative approach used |

### Shopping
| Backend Table | Frontend Hook | Status | Notes |
|---|---|---|---|
| cart_items | useCart | ✅ OK | Full CRUD |
| orders | useOrders | ⚠️ Partial | Missing order_items creation |
| order_items | (manual insert in Checkout) | ❌ MISSING | Should be automatic |
| coupons | useCoupons | ✅ NEW | Created |

### Reviews & Ratings
| Backend Table | Frontend Hook | Status | Notes |
|---|---|---|---|
| reviews | useReviews | ✅ OK | CRUD operations |

### Locations & Shipping
| Backend Table | Frontend Hook | Status | Notes |
|---|---|---|---|
| addresses | useAddresses | ✅ OK | Full CRUD |

### Stores
| Backend Table | Frontend Hook | Status | Notes |
|---|---|---|---|
| stores | useStores (assumed) | ⚠️ Check | Verify implementation |
| store_translations | (direct fetch) | ⚠️ Partial | Not in all stores |
| seller_applications | (direct calls) | ⚠️ Check | Verify admin panel |

### Admin/System
| Backend Table | Frontend Hook | Status | Notes |
|---|---|---|---|
| site_texts | (not used) | ❌ MISSING | CMS system |

---

## 🎯 Quick Fix Priorities

### 1️⃣ MUST FIX NOW (Before Launch)

#### Coupon System
```
File: src/pages/Checkout.tsx
Add: 
  - import CouponInput from '@/components/CouponInput'
  - import { useCoupons } from '@/hooks/useCoupons'
  - <CouponInput subtotal={subtotal} onApplySuccess={...} />
  - Pass coupon_id to order creation
Status: 🟡 Component created, integration needed
```

#### Order Items
```
File: src/hooks/useOrders.ts
Change: 
  - After creating order, insert order_items records
  - Update product stock after order
Estimate: 1 hour
Status: ❌ Not done
```

#### Numeric Precision
```
File: All price calculations
Add:
  - import { toDecimal } from '@/lib/decimal'
  - Use Decimal for all financial math
Estimate: 2 hours
Status: ✅ Decimal lib created
```

### 2️⃣ SHOULD FIX SOON (Before Full Release)

#### Product Variants
```
Files needed:
  - src/components/VariantForm.tsx
  - src/components/VariantSelector.tsx
  - Update: AddProductPage.tsx, ProductDetail.tsx
Estimate: 8 hours
Status: ❌ Not done
```

#### Admin Panels
```
Files needed:
  - src/pages/AdminCoupons.tsx
  - src/pages/AdminProductAttributes.tsx
  - Update: AdminDashboard.tsx
Estimate: 12 hours
Status: ❌ Not done
```

### 3️⃣ NICE TO HAVE (After Launch)

#### Store Ratings
```
Update: useReviews.ts, useStores.ts
Add: Rating calculation logic
Estimate: 4 hours
```

#### Site CMS
```
Create: src/pages/AdminSiteTexts.tsx
Estimate: 6 hours
```

---

## 🏗️ Folder Structure Reference

```
src/
├── hooks/
│   ├── useAuth.ts ✅
│   ├── useCart.ts ✅
│   ├── useCoupons.ts ✅ NEW
│   ├── useOrders.ts ⚠️ NEEDS UPDATE
│   ├── useProducts.ts ✅
│   ├── useProductVariants.ts ⚠️ PARTIAL
│   ├── useProductAttributes.ts ✅ NEW
│   ├── useReviews.ts ✅
│   ├── useAddresses.ts ✅
│   └── ...
│
├── components/
│   ├── CouponInput.tsx ✅ NEW
│   ├── VariantForm.tsx ❌ NEEDED
│   ├── VariantSelector.tsx ❌ NEEDED
│   └── ...
│
├── pages/
│   ├── AddProductPage.tsx ✅ (needs variants)
│   ├── Checkout.tsx ⚠️ (needs coupons & order_items)
│   ├── AdminCoupons.tsx ❌ NEEDED
│   ├── AdminProductAttributes.tsx ❌ NEEDED
│   └── ...
│
├── lib/
│   ├── decimal.ts ✅ NEW
│   └── ...
│
└── types/
    └── supabase.ts ⚠️ (verify enums match backend)
```

---

## 🔄 Data Flow Examples

### Creating a Product with Translations
```
User Input (AddProductPage)
  ↓
Form Data Collection
  ↓
useCreateProduct Hook
  ├── Insert to products table
  ├── Insert to product_translations table (EN)
  └── Insert to product_translations table (AR)
  ↓
Success Toast
  ↓
Navigate to ManageProductPage
```

### Applying Coupon in Checkout
```
User enters coupon code
  ↓
useCoupons.getCouponByCode()
  ├── Query coupons table
  └── Validate (not expired, has usage left)
  ↓
Validate eligibility (min purchase, max discount)
  ↓
Calculate discount
  ↓
Update order total (subtotal - discount + shipping)
  ↓
Show discount breakdown
  ↓
On checkout: Pass coupon_id + discount to order creation
```

### Creating an Order
```
Checkout Form Submission
  ↓
Validate address selected
  ↓
useOrders.createOrderWithItems()
  ├── Create order record
  │   ├── user_id
  │   ├── address_id
  │   ├── coupon_id
  │   ├── subtotal, discount, shipping, total
  │   └── payment_status = 'pending'
  │
  ├── For each cart item:
  │   └── Create order_item record
  │       ├── product_name, product_image
  │       ├── quantity, price, total
  │       └── store_id
  │
  ├── Update product stock (stock -= quantity)
  │
  └── Clear cart
  ↓
Show success message
  ↓
Redirect to OrdersPage
```

---

## 📋 Testing Checklist

### Unit Tests Needed
- [ ] Decimal arithmetic (addition, subtraction, multiplication)
- [ ] Coupon validation logic
- [ ] Price calculation with discounts
- [ ] Order total calculation

### Integration Tests Needed
- [ ] Product creation with translations
- [ ] Cart add/update/remove
- [ ] Coupon application in checkout
- [ ] Order creation with order_items
- [ ] Variant selection and pricing

### Manual Tests Needed
- [ ] Create product in Arabic, view in English
- [ ] Apply coupon to order
- [ ] Check order items in order history
- [ ] Verify stock decreased after order
- [ ] Try expired/maxed-out coupon

---

## 🐛 Common Issues & Solutions

### Issue: Order doesn't show items
**Cause:** order_items not being created  
**Fix:** Update useOrders.ts to insert order_items after order creation  
**Test:** SELECT * FROM order_items WHERE order_id = ?

### Issue: Coupon code not found
**Cause:** Code stored in uppercase, input not converted  
**Fix:** Use `code.toUpperCase()` when checking  
**Test:** Manually query coupons table to verify code format

### Issue: Price shows wrong decimal places
**Cause:** Using JavaScript number type  
**Fix:** Use Decimal class from lib/decimal.ts  
**Test:** Calculate 10% discount on 99.99, verify it's 89.99

### Issue: Cart items missing store info
**Cause:** Not including store_id in cart query  
**Fix:** Add store_id to product select in useCart  
**Test:** Log cart items to console and verify store_id present

### Issue: Variant selector not showing
**Cause:** has_variants not true or no variants exist  
**Fix:** 
  1. Check product.has_variants === true
  2. Verify variants exist: SELECT * FROM product_variants WHERE product_id = ?
**Test:** Create product with variant, then view in shop

---

## 🚀 Deployment Checklist

### Pre-Launch
- [ ] All critical issues fixed (Coupons, Order Items, Decimals)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing complete
- [ ] Error logging configured
- [ ] Performance monitored
- [ ] RLS policies verified

### At Launch
- [ ] Backend Supabase in production
- [ ] Frontend deployed
- [ ] Database backups running
- [ ] Monitoring alerts set
- [ ] Support documentation ready

### Post-Launch
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Collect user feedback
- [ ] Plan Phase 2 features (Variants, Admin Panels)
- [ ] Schedule performance optimization

---

## 📞 Resources

### Supabase Admin
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Community: https://supabase.com/community

### Code References
- React Query: https://tanstack.com/query/latest
- TypeScript: https://www.typescriptlang.org/docs
- Shadcn/UI: https://ui.shadcn.com/docs

---

## 📊 Metrics to Track

### Frontend Performance
- Page load time
- Time to interactive
- API response times
- Error rates

### Backend Performance
- Database query times
- RLS policy overhead
- Storage usage
- Concurrent users

### Business Metrics
- Coupon usage rate
- Average order value
- Conversion rate
- Customer satisfaction

---

**Last Updated:** November 15, 2025  
**Next Review:** After Phase 1 completion  
**Maintainer:** Development Team
