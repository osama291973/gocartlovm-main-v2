-- SELLER SIDEBAR & NAVIGATION TRANSLATIONS
-- Add navigation menu items to site_texts table for localization

INSERT INTO public.site_texts (key, language_code, value, created_at, updated_at) VALUES

-- Seller Sidebar Menu Items
('seller_nav.dashboard', 'en', 'Dashboard', NOW(), NOW()),
('seller_nav.dashboard', 'ar', 'لوحة التحكم', NOW(), NOW()),

('seller_nav.add_product', 'en', 'Add Product', NOW(), NOW()),
('seller_nav.add_product', 'ar', 'إضافة منتج', NOW(), NOW()),

('seller_nav.manage_product', 'en', 'Manage Product', NOW(), NOW()),
('seller_nav.manage_product', 'ar', 'إدارة المنتجات', NOW(), NOW()),

('seller_nav.orders', 'en', 'Orders', NOW(), NOW()),
('seller_nav.orders', 'ar', 'الطلبات', NOW(), NOW()),

('seller_nav.create_store', 'en', 'Create New Store', NOW(), NOW()),
('seller_nav.create_store', 'ar', 'إنشاء متجر جديد', NOW(), NOW()),

('seller_nav.logout', 'en', 'Logout', NOW(), NOW()),
('seller_nav.logout', 'ar', 'تسجيل الخروج', NOW(), NOW()),

-- Seller Dashboard Page Labels
('seller_dashboard.title', 'en', 'Seller Dashboard', NOW(), NOW()),
('seller_dashboard.title', 'ar', 'لوحة تحكم البائع', NOW(), NOW()),

('seller_dashboard.total_reviews', 'en', 'Total Reviews', NOW(), NOW()),
('seller_dashboard.total_reviews', 'ar', 'إجمالي المراجعات', NOW(), NOW()),

('seller_dashboard.total_ratings', 'en', 'Total Ratings', NOW(), NOW()),
('seller_dashboard.total_ratings', 'ar', 'إجمالي التقييمات', NOW(), NOW()),

('seller_dashboard.total_orders', 'en', 'Total Orders', NOW(), NOW()),
('seller_dashboard.total_orders', 'ar', 'إجمالي الطلبات', NOW(), NOW()),

('seller_dashboard.total_earnings', 'en', 'Total Earnings', NOW(), NOW()),
('seller_dashboard.total_earnings', 'ar', 'إجمالي الأرباح', NOW(), NOW()),

('seller_dashboard.total_products', 'en', 'Total Products', NOW(), NOW()),
('seller_dashboard.total_products', 'ar', 'إجمالي المنتجات', NOW(), NOW()),

('seller_dashboard.quick_stats', 'en', 'Quick Stats', NOW(), NOW()),
('seller_dashboard.quick_stats', 'ar', 'إحصائيات سريعة', NOW(), NOW()),

('seller_dashboard.conversion_rate', 'en', 'Conversion Rate', NOW(), NOW()),
('seller_dashboard.conversion_rate', 'ar', 'معدل التحويل', NOW(), NOW()),

('seller_dashboard.avg_order_value', 'en', 'Avg Order Value', NOW(), NOW()),
('seller_dashboard.avg_order_value', 'ar', 'متوسط قيمة الطلب', NOW(), NOW()),

('seller_dashboard.customer_satisfaction', 'en', 'Customer Satisfaction', NOW(), NOW()),
('seller_dashboard.customer_satisfaction', 'ar', 'رضا العملاء', NOW(), NOW()),

('seller_dashboard.recent_orders', 'en', 'Recent Orders', NOW(), NOW()),
('seller_dashboard.recent_orders', 'ar', 'الطلبات الأخيرة', NOW(), NOW()),

('seller_dashboard.no_orders', 'en', 'No orders yet. Start selling to see orders here', NOW(), NOW()),
('seller_dashboard.no_orders', 'ar', 'لا توجد طلبات حتى الآن. ابدأ البيع لترى الطلبات هنا', NOW(), NOW()),

-- Manage Product Page
('seller_product.title', 'en', 'Manage Products', NOW(), NOW()),
('seller_product.title', 'ar', 'إدارة المنتجات', NOW(), NOW()),

('seller_product.store_label', 'en', 'Store', NOW(), NOW()),
('seller_product.store_label', 'ar', 'المتجر', NOW(), NOW()),

('seller_product.your_products', 'en', 'Your Products', NOW(), NOW()),
('seller_product.your_products', 'ar', 'منتجاتك', NOW(), NOW()),

('seller_product.no_products', 'en', 'No products yet', NOW(), NOW()),
('seller_product.no_products', 'ar', 'لا توجد منتجات بعد', NOW(), NOW()),

('seller_product.edit', 'en', 'Edit', NOW(), NOW()),
('seller_product.edit', 'ar', 'تحرير', NOW(), NOW()),

('seller_product.delete', 'en', 'Delete', NOW(), NOW()),
('seller_product.delete', 'ar', 'حذف', NOW(), NOW()),

('seller_product.view', 'en', 'View', NOW(), NOW()),
('seller_product.view', 'ar', 'عرض', NOW(), NOW()),

-- Orders Page
('seller_orders.title', 'en', 'Orders', NOW(), NOW()),
('seller_orders.title', 'ar', 'الطلبات', NOW(), NOW()),

('seller_orders.order_id', 'en', 'Order ID', NOW(), NOW()),
('seller_orders.order_id', 'ar', 'رقم الطلب', NOW(), NOW()),

('seller_orders.customer', 'en', 'Customer', NOW(), NOW()),
('seller_orders.customer', 'ar', 'العميل', NOW(), NOW()),

('seller_orders.total', 'en', 'Total', NOW(), NOW()),
('seller_orders.total', 'ar', 'المجموع', NOW(), NOW()),

('seller_orders.status', 'en', 'Status', NOW(), NOW()),
('seller_orders.status', 'ar', 'الحالة', NOW(), NOW()),

('seller_orders.no_orders', 'en', 'No orders yet', NOW(), NOW()),
('seller_orders.no_orders', 'ar', 'لا توجد طلبات بعد', NOW(), NOW())

ON CONFLICT (key, language_code) DO NOTHING;
