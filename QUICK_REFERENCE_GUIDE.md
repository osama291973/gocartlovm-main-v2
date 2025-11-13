# GoCart App - Quick Reference Guide

**Project**: GoCart Multi-Vendor E-Commerce  
**Last Updated**: November 15, 2025  
**Status**: ✅ Production Ready

---

## 🚀 Quick Start

### Environment Setup
```bash
# 1. Install dependencies
npm install

# 2. Verify .env has Supabase keys
cat .env  # Should show:
# VITE_SUPABASE_URL=https://qlhpzsucftqcakiotgpc.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# VITE_SUPABASE_PROJECT_ID=qlhpzsucftqcakiotgpc
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Start dev server
npm run dev

# 4. Build for production
npm run build

# 5. Run migrations
npm run migrate
```

---

## 📊 Database Overview

### Core Tables
| Table | Purpose | Translations |
|-------|---------|--------------|
| `products` | Products catalog | `product_translations` |
| `categories` | Product categories | `category_translations` |
| `stores` | Vendor stores | `store_translations` |
| `users` / `auth.users` | User accounts | - |
| `orders` | Customer orders | - |
| `coupons` | Discount codes | - |

### Multi-Language Support
- **Languages**: English (en), Arabic (ar)
- **Storage**: Separate translation tables
- **Pattern**: `{entity}_translations` table
- **Example**: Product → `products` + `product_translations`

### Relationship Model
```
stores (1) ──→ (many) products
  ├─→ product_translations (by language_code)
  ├─→ product_variants
  └─→ reviews

categories (1) ──→ (many) products
  └─→ category_translations (by language_code)
```

---

## 🔑 Key API Endpoints

### Supabase Configuration
```
Base URL: https://qlhpzsucftqcakiotgpc.supabase.co
Project ID: qlhpzsucftqcakiotgpc
Region: Auto
```

### REST Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/rest/v1/{table}` | CRUD operations |
| POST | `/rest/v1/rpc/{function}` | RPC calls |
| GET/POST | `/storage/v1/object/` | File operations |

### Common RPC Functions
- `upsert_product_translations_safe` - Safe translation upsert

### Storage Buckets
- `product-images` - Product photos (52MB limit)
- `avatars` - User avatars
- `store-logos` - Store logos

---

## 🛣️ Application Routes Map

```
ROOT (/)
├── Authenticated Routes (MainLayout)
│   ├── /shop - Product catalog
│   ├── /product/:slug - Product detail
│   ├── /stores - Vendor list
│   ├── /cart - Shopping cart
│   ├── /account - User profile
│   └── /home - Homepage
│
├── Auth Routes
│   └── /auth - Login/Register
│   └── /create-store - Become seller
│
├── Seller Routes (/seller)
│   ├── /seller/dashboard - Overview
│   ├── /seller/add-product - Create/Edit product
│   ├── /seller/manage-product - Product list
│   └── /seller/orders - Order management
│
├── Admin Routes (/admin)
│   ├── /admin - Dashboard
│   ├── /admin/translations - Site text management
│   ├── /admin/seller-applications - Approve sellers
│   ├── /admin/stores - Store management
│   └── /admin/coupons - Coupon management
│
└── Debug
    └── /supabase-debug - Debug utilities
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                    │
├─────────────────────────────────────────────────────────────┤
│  Pages │ Components │ Hooks │ Contexts │ Types              │
├─────────────────────────────────────────────────────────────┤
│                  React Query (Caching)                       │
├─────────────────────────────────────────────────────────────┤
│              Supabase JS Client (@supabase/js)               │
├─────────────────────────────────────────────────────────────┤
│                  REST API / Realtime                         │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↓ ↓
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                          │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database:                                        │
│  ├── Tables (products, stores, orders, users, ...)          │
│  ├── Views (for complex queries)                            │
│  ├── Functions (RPC, Triggers)                              │
│  ├── RLS Policies (Row-level security)                      │
│  └── Migrations (schema versioning)                         │
├─────────────────────────────────────────────────────────────┤
│  Authentication (Auth.users, profiles, roles)               │
├─────────────────────────────────────────────────────────────┤
│  Storage (product-images, avatars, store-logos)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### Roles
```
user      - Regular customer
seller    - Store owner
admin     - System administrator
```

### Role Checks
```typescript
// In component/page
const { hasRole } = useAuth();

if (hasRole('seller')) {
  // Seller-only content
}

if (hasRole('admin')) {
  // Admin-only content
}
```

### Permission Model
- **Sellers** can manage own products/stores/orders
- **Admins** can manage everything
- **Users** can browse/purchase
- **Public** can view products/stores

### RLS Enforcement
- Automatic on all tables via Supabase RLS policies
- No need to check permissions in frontend (backend enforces)
- Malicious queries are automatically blocked

---

## 🛠️ Common Development Tasks

### Add a New Page
```typescript
// 1. Create file: src/pages/NewPage.tsx
export default function NewPage() {
  return <div>New Page</div>;
}

// 2. Add route in src/App.tsx
<Route path="/new-page" element={<NewPage />} />

// 3. Start dev server: npm run dev
```

### Fetch Data
```typescript
// Using useProducts hook
const { data: products } = useProducts({ limit: 10 });

// Using direct query
const { data } = await supabase
  .from('products')
  .select('*, product_translations(*)')
  .limit(10);
```

### Create a Product
```typescript
const { createProduct } = useCreateProduct();

const result = await createProduct(
  {
    store_id: 'store-uuid',
    slug: 'my-product',
    price: 99.99,
    stock: 10,
    description: 'Product description',
  },
  [
    { language_code: 'en', name: 'My Product', description: '...' },
    { language_code: 'ar', name: 'منتجي', description: '...' },
  ]
);

if (result.success) {
  console.log('Product created:', result.product_id);
}
```

### Update a Product
```typescript
// Update product fields
await supabase
  .from('products')
  .update({
    price: 89.99,
    stock: 5,
    description: 'Updated description',
  })
  .eq('id', productId);

// Update translations
await supabase
  .from('product_translations')
  .upsert({
    product_id: productId,
    language_code: 'en',
    name: 'Updated Name',
    description: 'Updated description',
  }, { onConflict: 'product_id,language_code' });
```

### Handle Forms
```typescript
import { useForm } from 'react-hook-form';

const MyForm = () => {
  const form = useForm({
    defaultValues: { name: '', email: '' }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      <button type="submit">Submit</button>
    </form>
  );
};
```

### Add Toast Notifications
```typescript
import { useToast } from '@/hooks/use-toast';

const MyComponent = () => {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: 'Success',
      description: 'Operation completed!',
      variant: 'default' // or 'destructive'
    });
  };

  return <button onClick={handleClick}>Click</button>;
};
```

---

## 📝 Schema Reference

### Products Table Structure
```sql
-- Core product info
id: UUID (primary key)
store_id: UUID (who owns it)
category_id: UUID (product category)
slug: TEXT UNIQUE (URL identifier)

-- Pricing & inventory
price: DECIMAL (current price)
original_price: DECIMAL (sale reference)
stock: INTEGER (available quantity)

-- Media
image_url: TEXT (main image)
gallery_urls: TEXT[] (additional images)

-- Metadata
description: TEXT (product description)
rating: DECIMAL (average rating)
reviews_count: INTEGER
is_featured: BOOLEAN
has_variants: BOOLEAN

-- Variants (if enabled)
base_price: DECIMAL (for variants)

-- Timestamps
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

### Product Translations Table
```sql
id: UUID
product_id: UUID FK → products.id
language_code: 'en' | 'ar'
name: TEXT (localized name)
description: TEXT (localized description)
is_machine_translated: BOOLEAN (optional)
translation_engine: TEXT (optional)
translated_from_language: TEXT (optional)

UNIQUE(product_id, language_code)
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] useProducts hook returns cached data
- [ ] useCreateProduct validates input
- [ ] AuthContext provides correct roles

### Integration Tests
- [ ] Seller can create product
- [ ] Product edit loads all translations
- [ ] Product delete cascades correctly
- [ ] RLS policies block unauthorized access

### E2E Tests
- [ ] Complete seller workflow: signup → store → product → edit
- [ ] Multi-language product display
- [ ] Admin approval workflow
- [ ] Order placement & tracking

---

## 🐛 Debugging Tips

### Enable Supabase Logging
```typescript
// In src/integrations/supabase/client.ts
const supabase = createClient(url, key, {
  auth: { persistSession: true },
  debug: true // Enable logging
});
```

### Check Auth State
```typescript
// In browser console
const { data: { user } } = await supabase.auth.getUser();
console.log(user);
```

### Inspect Database
```typescript
// In browser console
const { data } = await supabase
  .from('products')
  .select('*')
  .limit(1);
console.log(data);
```

### View Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by `supabase.co`
4. Check request/response for errors

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | No auth token | Login first |
| 403 Forbidden | RLS policy blocked | Check ownership |
| 404 Not Found | Invalid ID/slug | Verify in database |
| 409 Conflict | Duplicate slug | Use unique slug |
| 500 Server Error | Database issue | Check migrations |

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | UI framework |
| vite | 5.4.19 | Build tool |
| supabase-js | 2.76.1 | Backend client |
| react-query | 5.83.0 | Server state |
| react-router-dom | 6.30.1 | Routing |
| tailwindcss | 3.4.17 | Styling |
| shadcn/ui | - | Components |
| zod | 3.25.76 | Validation |
| react-hook-form | 7.61.1 | Forms |

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### RTL Support
- Arabic language automatically triggers RTL layout
- Use `isRTL` from LanguageContext
- Tailwind handles margin/padding reversal with RTL plugin

---

## 🚀 Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Build compiles without errors: `npm run build`
- [ ] No console errors in production
- [ ] Test critical workflows
- [ ] Verify RLS policies in production
- [ ] Check storage bucket permissions
- [ ] Monitor Supabase logs for errors

---

## 📚 Documentation Files

| File | Contents |
|------|----------|
| `COMPLETE_APP_INSPECTION_REPORT.md` | Full architecture & schema |
| `PRODUCT_EDIT_FIX_IMPLEMENTATION.md` | Product edit bug fix details |
| `BACKEND_MASTER_GUIDE.md` | Database implementation |
| `README.md` | Project overview |

---

## 🔗 Useful Links

- **Supabase Docs**: https://supabase.com/docs
- **React Query Docs**: https://tanstack.com/query/latest
- **Tailwind Docs**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Supabase Project**: https://app.supabase.com/project/qlhpzsucftqcakiotgpc

---

## 💡 Pro Tips

1. **Use React Query devtools** in development for debugging cache
2. **Test RLS policies** in Supabase SQL editor before deploying
3. **Cache product queries** to reduce database load
4. **Use image CDN** for gallery image optimization
5. **Monitor real-time subscriptions** to keep data in sync
6. **Batch updates** to reduce API calls
7. **Validate on both sides** (frontend + RLS)
8. **Use TypeScript** for better IDE support

---

**Last Updated**: November 15, 2025  
**Next Review**: Monthly or as needed  
**Maintainer**: Development Team
