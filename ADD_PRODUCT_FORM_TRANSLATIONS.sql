-- Add Product Form Labels to site_texts table
-- These translations will be used in AddProductPage.tsx

-- Product Information Section
INSERT INTO public.site_texts (key, language_code, value) VALUES
('product_info.title', 'en', 'Product Information'),
('product_info.title', 'ar', 'معلومات المنتج'),

-- Product Name
('product_info.name.label', 'en', 'Product Name'),
('product_info.name.label', 'ar', 'اسم المنتج'),
('product_info.name.placeholder', 'en', 'Enter product name'),
('product_info.name.placeholder', 'ar', 'أدخل اسم المنتج'),
('product_info.name.required', 'en', '*'),
('product_info.name.required', 'ar', '*'),

-- Description
('product_info.description.label', 'en', 'Description'),
('product_info.description.label', 'ar', 'وصف المنتج'),
('product_info.description.placeholder', 'en', 'Enter product description'),
('product_info.description.placeholder', 'ar', 'أدخل وصف المنتج'),

-- Price
('product_info.price.label', 'en', 'Actual Price ($)'),
('product_info.price.label', 'ar', 'السعر الفعلي ($)'),
('product_info.price.placeholder', 'en', '0.00'),
('product_info.price.placeholder', 'ar', '0.00'),
('product_info.price.required', 'en', '*'),
('product_info.price.required', 'ar', '*'),

-- Offer Price
('product_info.offer_price.label', 'en', 'Offer Price ($)'),
('product_info.offer_price.label', 'ar', 'سعر العرض ($)'),
('product_info.offer_price.placeholder', 'en', '0.00'),
('product_info.offer_price.placeholder', 'ar', '0.00'),

-- Category
('product_info.category.label', 'en', 'Select a category'),
('product_info.category.label', 'ar', 'اختر فئة'),
('product_info.category.placeholder', 'en', 'Choose Category'),
('product_info.category.placeholder', 'ar', 'اختر الفئة'),

-- Stock
('product_info.stock.label', 'en', 'Stock'),
('product_info.stock.label', 'ar', 'المخزون'),
('product_info.stock.placeholder', 'en', '0'),
('product_info.stock.placeholder', 'ar', '0'),
('product_info.stock.required', 'en', '*'),
('product_info.stock.required', 'ar', '*'),

-- Product Image Section
('product_image.title', 'en', 'Product Image'),
('product_image.title', 'ar', 'صورة المنتج'),
('product_image.upload', 'en', 'Click to upload product image'),
('product_image.upload', 'ar', 'انقر لتحميل صورة المنتج'),
('product_image.limit', 'en', 'You can upload up to 4 images, 10MB each'),
('product_image.limit', 'ar', 'يمكنك تحميل حتى 4 صور، بحد أقصى 10 ميجابايت لكل منها'),

-- Submit Button
('product_form.submit.button', 'en', 'Add Product'),
('product_form.submit.button', 'ar', 'إضافة منتج'),
('product_form.submit.loading', 'en', 'Adding Product...'),
('product_form.submit.loading', 'ar', 'جاري الإضافة...'),

-- Error Messages
('product_form.error.product_name_required', 'en', 'Please enter the product name'),
('product_form.error.product_name_required', 'ar', 'يرجى إدخال اسم المنتج'),
('product_form.error.slug_exists', 'en', 'Product slug already exists. Please change the Product Name.'),
('product_form.error.slug_exists', 'ar', 'عنوان المنتج موجود بالفعل. يرجى تغيير اسم المنتج.'),
('product_form.error.save_failed', 'en', 'Failed to save product'),
('product_form.error.save_failed', 'ar', 'فشل حفظ المنتج'),

-- Success Messages
('product_form.success.created', 'en', 'Product added successfully!'),
('product_form.success.created', 'ar', 'تم إضافة المنتج بنجاح!'),
('product_form.success.updated', 'en', 'Product updated successfully!'),
('product_form.success.updated', 'ar', 'تم تحديث المنتج بنجاح!')

ON CONFLICT DO NOTHING;
