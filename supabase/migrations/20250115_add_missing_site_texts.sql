-- Migration: Add Missing Site Texts
-- This migration adds any missing translation keys that are in the frontend LanguageContext
-- but not yet in the site_texts table. It uses INSERT ... ON CONFLICT to avoid duplicates.
-- 
-- Created: 2025-11-15
-- Purpose: Ensure all frontend translations are available in backend for management

-- Insert missing English translations (will skip if key,language_code combination already exists)
INSERT INTO public.site_texts (key, language_code, value, type, namespace, context) VALUES

-- Product form translations
('product_form.error.product_name_required', 'en', 'Product name is required', 'error', 'product_form', 'Product form validation'),
('product_form.error.price_required', 'en', 'Price is required', 'error', 'product_form', 'Product form validation'),
('product_form.error.stock_required', 'en', 'Stock quantity is required', 'error', 'product_form', 'Product form validation'),
('product_form.error.slug_exists', 'en', 'This product slug already exists', 'error', 'product_form', 'Product form validation'),
('product_form.error.save_failed', 'en', 'Failed to save product', 'error', 'product_form', 'Product form error'),
('product_form.success.created', 'en', 'Product created successfully', 'success', 'product_form', 'Product form success'),
('product_form.success.updated', 'en', 'Product updated successfully', 'success', 'product_form', 'Product form success'),

-- Product form field labels
('product_form.slug_label', 'en', 'Product Slug', 'ui', 'product_form', 'Field label'),
('product_form.price_label', 'en', 'Price', 'ui', 'product_form', 'Field label'),
('product_form.stock_label', 'en', 'Stock', 'ui', 'product_form', 'Field label'),
('product_form.category_label', 'en', 'Category', 'ui', 'product_form', 'Field label'),
('product_form.description_label', 'en', 'Description', 'ui', 'product_form', 'Field label'),
('product_form.name_en_label', 'en', 'Product Name (English)', 'ui', 'product_form', 'Field label'),
('product_form.description_en_label', 'en', 'Description (English)', 'ui', 'product_form', 'Field label'),
('product_form.name_ar_label', 'en', 'Product Name (Arabic)', 'ui', 'product_form', 'Field label'),
('product_form.description_ar_label', 'en', 'Description (Arabic)', 'ui', 'product_form', 'Field label'),
('product_form.images_label', 'en', 'Product Images', 'ui', 'product_form', 'Field label'),
('product_form.show_translations', 'en', 'Show Other Language Translations', 'ui', 'product_form', 'Checkbox label'),
('product_form.auto_translate', 'en', 'Auto-translate', 'ui', 'product_form', 'Checkbox label'),
('product_form.upload_image', 'en', 'Upload Image', 'ui', 'product_form', 'Button label'),
('product_form.remove_image', 'en', 'Remove Image', 'ui', 'product_form', 'Button label'),
('product_form.submit_button', 'en', 'Save Product', 'ui', 'product_form', 'Button label'),
('product_form.generating_from_image', 'en', 'Generating product from image...', 'ui', 'product_form', 'Loading message'),

-- Checkout related
('checkout.title', 'en', 'Checkout', 'ui', 'checkout', 'Page title'),
('checkout.order_summary', 'en', 'Order Summary', 'ui', 'checkout', 'Section title'),
('checkout.items', 'en', 'Items', 'ui', 'checkout', 'Items count'),
('checkout.subtotal_label', 'en', 'Subtotal', 'ui', 'checkout', 'Price label'),
('checkout.shipping_label', 'en', 'Shipping', 'ui', 'checkout', 'Price label'),
('checkout.tax_label', 'en', 'Tax', 'ui', 'checkout', 'Price label'),
('checkout.discount_label', 'en', 'Discount', 'ui', 'checkout', 'Price label'),
('checkout.total_label', 'en', 'Total', 'ui', 'checkout', 'Price label'),
('checkout.coupon_code', 'en', 'Coupon Code', 'ui', 'checkout', 'Form label'),
('checkout.apply_coupon', 'en', 'Apply', 'ui', 'checkout', 'Button label'),
('checkout.shipping_address', 'en', 'Shipping Address', 'ui', 'checkout', 'Section title'),
('checkout.payment_method', 'en', 'Payment Method', 'ui', 'checkout', 'Section title'),
('checkout.place_order', 'en', 'Place Order', 'ui', 'checkout', 'Button label'),

-- Coupon related
('coupon.invalid_code', 'en', 'Invalid coupon code', 'error', 'coupon', 'Validation error'),
('coupon.expired', 'en', 'This coupon has expired', 'error', 'coupon', 'Validation error'),
('coupon.minimum_purchase', 'en', 'Minimum purchase amount not met', 'error', 'coupon', 'Validation error'),
('coupon.already_used', 'en', 'This coupon has already been used', 'error', 'coupon', 'Validation error'),
('coupon.applied_success', 'en', 'Coupon applied successfully', 'success', 'coupon', 'Success message'),
('coupon.remove_success', 'en', 'Coupon removed successfully', 'success', 'coupon', 'Success message'),

-- Admin pages
('admin.translations.title', 'en', 'Manage Translations', 'ui', 'admin', 'Page title'),
('admin.translations.description', 'en', 'Manage all site text translations', 'ui', 'admin', 'Page description'),
('admin.translations.search', 'en', 'Search translations...', 'ui', 'admin', 'Search placeholder'),
('admin.translations.key', 'en', 'Key', 'ui', 'admin', 'Column header'),
('admin.translations.language', 'en', 'Language', 'ui', 'admin', 'Column header'),
('admin.translations.value', 'en', 'Value', 'ui', 'admin', 'Column header'),
('admin.translations.type', 'en', 'Type', 'ui', 'admin', 'Column header'),
('admin.translations.namespace', 'en', 'Namespace', 'ui', 'admin', 'Column header'),
('admin.translations.actions', 'en', 'Actions', 'ui', 'admin', 'Column header'),
('admin.translations.edit', 'en', 'Edit', 'ui', 'admin', 'Button label'),
('admin.translations.delete', 'en', 'Delete', 'ui', 'admin', 'Button label'),
('admin.translations.save', 'en', 'Save Changes', 'ui', 'admin', 'Button label'),
('admin.translations.saved', 'en', 'Translations saved successfully', 'success', 'admin', 'Success message'),
('admin.translations.error', 'en', 'Failed to save translations', 'error', 'admin', 'Error message'),

-- Account/User
('account.settings_title', 'en', 'Account Settings', 'ui', 'account', 'Page title'),
('account.edit_profile', 'en', 'Edit Profile', 'ui', 'account', 'Button label'),
('account.change_password', 'en', 'Change Password', 'ui', 'account', 'Button label'),
('account.saved_addresses', 'en', 'Saved Addresses', 'ui', 'account', 'Section title'),
('account.add_address', 'en', 'Add Address', 'ui', 'account', 'Button label'),
('account.edit_address', 'en', 'Edit Address', 'ui', 'account', 'Button label'),
('account.delete_address', 'en', 'Delete Address', 'ui', 'account', 'Button label'),
('account.make_default', 'en', 'Make Default', 'ui', 'account', 'Button label'),
('account.default_address', 'en', 'Default Address', 'ui', 'account', 'Badge label'),

-- Common UI
('common.loading', 'en', 'Loading...', 'ui', 'common', 'Loading message'),
('common.error', 'en', 'An error occurred', 'error', 'common', 'Error message'),
('common.success', 'en', 'Success', 'success', 'common', 'Success message'),
('common.cancel', 'en', 'Cancel', 'ui', 'common', 'Button label'),
('common.save', 'en', 'Save', 'ui', 'common', 'Button label'),
('common.delete', 'en', 'Delete', 'ui', 'common', 'Button label'),
('common.edit', 'en', 'Edit', 'ui', 'common', 'Button label'),
('common.back', 'en', 'Back', 'ui', 'common', 'Button label'),
('common.next', 'en', 'Next', 'ui', 'common', 'Button label'),
('common.previous', 'en', 'Previous', 'ui', 'common', 'Button label'),

-- Product form translations (Arabic)
('product_form.error.product_name_required', 'ar', 'اسم المنتج مطلوب', 'error', 'product_form', 'Product form validation'),
('product_form.error.price_required', 'ar', 'السعر مطلوب', 'error', 'product_form', 'Product form validation'),
('product_form.error.stock_required', 'ar', 'كمية المخزون مطلوبة', 'error', 'product_form', 'Product form validation'),
('product_form.error.slug_exists', 'ar', 'معرف المنتج هذا موجود بالفعل', 'error', 'product_form', 'Product form validation'),
('product_form.error.save_failed', 'ar', 'فشل حفظ المنتج', 'error', 'product_form', 'Product form error'),
('product_form.success.created', 'ar', 'تم إنشاء المنتج بنجاح', 'success', 'product_form', 'Product form success'),
('product_form.success.updated', 'ar', 'تم تحديث المنتج بنجاح', 'success', 'product_form', 'Product form success'),

-- Product form field labels (Arabic)
('product_form.slug_label', 'ar', 'معرف المنتج', 'ui', 'product_form', 'Field label'),
('product_form.price_label', 'ar', 'السعر', 'ui', 'product_form', 'Field label'),
('product_form.stock_label', 'ar', 'المخزون', 'ui', 'product_form', 'Field label'),
('product_form.category_label', 'ar', 'الفئة', 'ui', 'product_form', 'Field label'),
('product_form.description_label', 'ar', 'الوصف', 'ui', 'product_form', 'Field label'),
('product_form.name_en_label', 'ar', 'اسم المنتج (إنجليزي)', 'ui', 'product_form', 'Field label'),
('product_form.description_en_label', 'ar', 'الوصف (إنجليزي)', 'ui', 'product_form', 'Field label'),
('product_form.name_ar_label', 'ar', 'اسم المنتج (عربي)', 'ui', 'product_form', 'Field label'),
('product_form.description_ar_label', 'ar', 'الوصف (عربي)', 'ui', 'product_form', 'Field label'),
('product_form.images_label', 'ar', 'صور المنتج', 'ui', 'product_form', 'Field label'),
('product_form.show_translations', 'ar', 'إظهار ترجمات اللغة الأخرى', 'ui', 'product_form', 'Checkbox label'),
('product_form.auto_translate', 'ar', 'ترجمة تلقائية', 'ui', 'product_form', 'Checkbox label'),
('product_form.upload_image', 'ar', 'رفع صورة', 'ui', 'product_form', 'Button label'),
('product_form.remove_image', 'ar', 'إزالة الصورة', 'ui', 'product_form', 'Button label'),
('product_form.submit_button', 'ar', 'حفظ المنتج', 'ui', 'product_form', 'Button label'),
('product_form.generating_from_image', 'ar', 'جاري إنشاء المنتج من الصورة...', 'ui', 'product_form', 'Loading message'),

-- Checkout related (Arabic)
('checkout.title', 'ar', 'إتمام الطلب', 'ui', 'checkout', 'Page title'),
('checkout.order_summary', 'ar', 'ملخص الطلب', 'ui', 'checkout', 'Section title'),
('checkout.items', 'ar', 'العناصر', 'ui', 'checkout', 'Items count'),
('checkout.subtotal_label', 'ar', 'المجموع الفرعي', 'ui', 'checkout', 'Price label'),
('checkout.shipping_label', 'ar', 'الشحن', 'ui', 'checkout', 'Price label'),
('checkout.tax_label', 'ar', 'الضريبة', 'ui', 'checkout', 'Price label'),
('checkout.discount_label', 'ar', 'الخصم', 'ui', 'checkout', 'Price label'),
('checkout.total_label', 'ar', 'الإجمالي', 'ui', 'checkout', 'Price label'),
('checkout.coupon_code', 'ar', 'كود القسيمة', 'ui', 'checkout', 'Form label'),
('checkout.apply_coupon', 'ar', 'تطبيق', 'ui', 'checkout', 'Button label'),
('checkout.shipping_address', 'ar', 'عنوان الشحن', 'ui', 'checkout', 'Section title'),
('checkout.payment_method', 'ar', 'طريقة الدفع', 'ui', 'checkout', 'Section title'),
('checkout.place_order', 'ar', 'تأكيد الطلب', 'ui', 'checkout', 'Button label'),

-- Coupon related (Arabic)
('coupon.invalid_code', 'ar', 'كود قسيمة غير صالح', 'error', 'coupon', 'Validation error'),
('coupon.expired', 'ar', 'هذه القسيمة منتهية الصلاحية', 'error', 'coupon', 'Validation error'),
('coupon.minimum_purchase', 'ar', 'الحد الأدنى للشراء غير كافي', 'error', 'coupon', 'Validation error'),
('coupon.already_used', 'ar', 'هذه القسيمة تم استخدامها بالفعل', 'error', 'coupon', 'Validation error'),
('coupon.applied_success', 'ar', 'تم تطبيق القسيمة بنجاح', 'success', 'coupon', 'Success message'),
('coupon.remove_success', 'ar', 'تم إزالة القسيمة بنجاح', 'success', 'coupon', 'Success message'),

-- Admin pages (Arabic)
('admin.translations.title', 'ar', 'إدارة الترجمات', 'ui', 'admin', 'Page title'),
('admin.translations.description', 'ar', 'إدارة جميع ترجمات نصوص الموقع', 'ui', 'admin', 'Page description'),
('admin.translations.search', 'ar', 'ابحث عن الترجمات...', 'ui', 'admin', 'Search placeholder'),
('admin.translations.key', 'ar', 'المفتاح', 'ui', 'admin', 'Column header'),
('admin.translations.language', 'ar', 'اللغة', 'ui', 'admin', 'Column header'),
('admin.translations.value', 'ar', 'القيمة', 'ui', 'admin', 'Column header'),
('admin.translations.type', 'ar', 'النوع', 'ui', 'admin', 'Column header'),
('admin.translations.namespace', 'ar', 'النطاق', 'ui', 'admin', 'Column header'),
('admin.translations.actions', 'ar', 'الإجراءات', 'ui', 'admin', 'Column header'),
('admin.translations.edit', 'ar', 'تعديل', 'ui', 'admin', 'Button label'),
('admin.translations.delete', 'ar', 'حذف', 'ui', 'admin', 'Button label'),
('admin.translations.save', 'ar', 'حفظ التغييرات', 'ui', 'admin', 'Button label'),
('admin.translations.saved', 'ar', 'تم حفظ الترجمات بنجاح', 'success', 'admin', 'Success message'),
('admin.translations.error', 'ar', 'فشل حفظ الترجمات', 'error', 'admin', 'Error message'),

-- Account/User (Arabic)
('account.settings_title', 'ar', 'إعدادات الحساب', 'ui', 'account', 'Page title'),
('account.edit_profile', 'ar', 'تعديل الملف الشخصي', 'ui', 'account', 'Button label'),
('account.change_password', 'ar', 'تغيير كلمة المرور', 'ui', 'account', 'Button label'),
('account.saved_addresses', 'ar', 'العناوين المحفوظة', 'ui', 'account', 'Section title'),
('account.add_address', 'ar', 'إضافة عنوان', 'ui', 'account', 'Button label'),
('account.edit_address', 'ar', 'تعديل العنوان', 'ui', 'account', 'Button label'),
('account.delete_address', 'ar', 'حذف العنوان', 'ui', 'account', 'Button label'),
('account.make_default', 'ar', 'اجعله العنوان الافتراضي', 'ui', 'account', 'Button label'),
('account.default_address', 'ar', 'العنوان الافتراضي', 'ui', 'account', 'Badge label'),

-- Common UI (Arabic)
('common.loading', 'ar', 'جاري التحميل...', 'ui', 'common', 'Loading message'),
('common.error', 'ar', 'حدث خطأ', 'error', 'common', 'Error message'),
('common.success', 'ar', 'نجح', 'success', 'common', 'Success message'),
('common.cancel', 'ar', 'إلغاء', 'ui', 'common', 'Button label'),
('common.save', 'ar', 'حفظ', 'ui', 'common', 'Button label'),
('common.delete', 'ar', 'حذف', 'ui', 'common', 'Button label'),
('common.edit', 'ar', 'تعديل', 'ui', 'common', 'Button label'),
('common.back', 'ar', 'رجوع', 'ui', 'common', 'Button label'),
('common.next', 'ar', 'التالي', 'ui', 'common', 'Button label'),
('common.previous', 'ar', 'السابق', 'ui', 'common', 'Button label')

ON CONFLICT (key, language_code) DO NOTHING;

-- Note: Using ON CONFLICT DO NOTHING ensures that if any key,language_code combination
-- already exists in the table, it will not be updated or cause an error.
-- This allows safe re-running of this migration without conflicts.
