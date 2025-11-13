-- HEADER & BANNER TRANSLATIONS
-- Add all header and promotional banner text to site_texts table

INSERT INTO public.site_texts (key, language_code, value, created_at, updated_at) VALUES

-- Promo Banner
('promo_banner.message', 'en', 'Get 20% OFF on Your First Order!', NOW(), NOW()),
('promo_banner.message', 'ar', 'احصل على خصم 20% على طلبك الأول!', NOW(), NOW()),

('promo_banner.claim_button', 'en', 'Claim Offer', NOW(), NOW()),
('promo_banner.claim_button', 'ar', 'استعمال العرض', NOW(), NOW()),

-- Header Navigation (Main)
('header.home', 'en', 'Home', NOW(), NOW()),
('header.home', 'ar', 'الرئيسية', NOW(), NOW()),

('header.shop', 'en', 'Shop', NOW(), NOW()),
('header.shop', 'ar', 'المتجر', NOW(), NOW()),

('header.seller', 'en', 'Seller', NOW(), NOW()),
('header.seller', 'ar', 'بائع', NOW(), NOW()),

('header.become_seller', 'en', 'Become a Seller', NOW(), NOW()),
('header.become_seller', 'ar', 'كن بائعًا', NOW(), NOW()),

('header.admin', 'en', 'Admin', NOW(), NOW()),
('header.admin', 'ar', 'مسؤول', NOW(), NOW()),

('header.search', 'en', 'Search for products...', NOW(), NOW()),
('header.search', 'ar', 'ابحث عن المنتجات...', NOW(), NOW()),

('header.cart', 'en', 'Cart', NOW(), NOW()),
('header.cart', 'ar', 'السلة', NOW(), NOW()),

('header.login', 'en', 'Login', NOW(), NOW()),
('header.login', 'ar', 'تسجيل الدخول', NOW(), NOW()),

-- User Dropdown Menu
('header.manage_profile', 'en', 'Manage Profile', NOW(), NOW()),
('header.manage_profile', 'ar', 'إدارة الملف الشخصي', NOW(), NOW()),

('header.my_orders', 'en', 'My Orders', NOW(), NOW()),
('header.my_orders', 'ar', 'طلباتي', NOW(), NOW()),

('header.seller_dashboard', 'en', 'Seller Dashboard', NOW(), NOW()),
('header.seller_dashboard', 'ar', 'لوحة تحكم البائع', NOW(), NOW()),

('header.admin_dashboard', 'en', 'Admin Dashboard', NOW(), NOW()),
('header.admin_dashboard', 'ar', 'لوحة تحكم المسؤول', NOW(), NOW()),

('header.logout', 'en', 'Logout', NOW(), NOW()),
('header.logout', 'ar', 'تسجيل الخروج', NOW(), NOW()),

('header.add_account', 'en', 'Add account', NOW(), NOW()),
('header.add_account', 'ar', 'إضافة حساب', NOW(), NOW())

ON CONFLICT (key, language_code) DO NOTHING;
