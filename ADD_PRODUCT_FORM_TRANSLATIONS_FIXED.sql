-- CORRECTED SQL for site_texts table
-- Now includes created_at and updated_at timestamps

INSERT INTO public.site_texts (key, language_code, value, created_at, updated_at) VALUES

-- Product Information Section
('product_info.title', 'en', 'Product Information', NOW(), NOW()),
('product_info.title', 'ar', 'معلومات المنتج', NOW(), NOW()),

-- Product Name
('product_info.name.label', 'en', 'Product Name', NOW(), NOW()),
('product_info.name.label', 'ar', 'اسم المنتج', NOW(), NOW()),
('product_info.name.placeholder', 'en', 'Enter product name', NOW(), NOW()),
('product_info.name.placeholder', 'ar', 'أدخل اسم المنتج', NOW(), NOW()),
('product_info.name.required', 'en', '*', NOW(), NOW()),
('product_info.name.required', 'ar', '*', NOW(), NOW()),

-- Description
('product_info.description.label', 'en', 'Description', NOW(), NOW()),
('product_info.description.label', 'ar', 'وصف المنتج', NOW(), NOW()),
('product_info.description.placeholder', 'en', 'Enter product description', NOW(), NOW()),
('product_info.description.placeholder', 'ar', 'أدخل وصف المنتج', NOW(), NOW()),

-- Price
('product_info.price.label', 'en', 'Actual Price ($)', NOW(), NOW()),
('product_info.price.label', 'ar', 'السعر الفعلي ($)', NOW(), NOW()),
('product_info.price.placeholder', 'en', '0.00', NOW(), NOW()),
('product_info.price.placeholder', 'ar', '0.00', NOW(), NOW()),
('product_info.price.required', 'en', '*', NOW(), NOW()),
('product_info.price.required', 'ar', '*', NOW(), NOW()),

-- Offer Price
('product_info.offer_price.label', 'en', 'Offer Price ($)', NOW(), NOW()),
('product_info.offer_price.label', 'ar', 'سعر العرض ($)', NOW(), NOW()),
('product_info.offer_price.placeholder', 'en', '0.00', NOW(), NOW()),
('product_info.offer_price.placeholder', 'ar', '0.00', NOW(), NOW()),

-- Category
('product_info.category.label', 'en', 'Select a category', NOW(), NOW()),
('product_info.category.label', 'ar', 'اختر فئة', NOW(), NOW()),
('product_info.category.placeholder', 'en', 'Choose Category', NOW(), NOW()),
('product_info.category.placeholder', 'ar', 'اختر الفئة', NOW(), NOW()),

-- Stock
('product_info.stock.label', 'en', 'Stock', NOW(), NOW()),
('product_info.stock.label', 'ar', 'المخزون', NOW(), NOW()),
('product_info.stock.placeholder', 'en', '0', NOW(), NOW()),
('product_info.stock.placeholder', 'ar', '0', NOW(), NOW()),
('product_info.stock.required', 'en', '*', NOW(), NOW()),
('product_info.stock.required', 'ar', '*', NOW(), NOW()),

-- Product Image Section
('product_image.title', 'en', 'Product Image', NOW(), NOW()),
('product_image.title', 'ar', 'صورة المنتج', NOW(), NOW()),
('product_image.upload', 'en', 'Click to upload product image', NOW(), NOW()),
('product_image.upload', 'ar', 'انقر لتحميل صورة المنتج', NOW(), NOW()),
('product_image.limit', 'en', 'You can upload up to 4 images, 10MB each', NOW(), NOW()),
('product_image.limit', 'ar', 'يمكنك تحميل حتى 4 صور، بحد أقصى 10 ميجابايت لكل منها', NOW(), NOW()),

-- Submit Button
('product_form.submit.button', 'en', 'Add Product', NOW(), NOW()),
('product_form.submit.button', 'ar', 'إضافة منتج', NOW(), NOW()),
('product_form.submit.loading', 'en', 'Adding Product...', NOW(), NOW()),
('product_form.submit.loading', 'ar', 'جاري الإضافة...', NOW(), NOW()),

-- Error Messages
('product_form.error.product_name_required', 'en', 'Please enter the product name', NOW(), NOW()),
('product_form.error.product_name_required', 'ar', 'يرجى إدخال اسم المنتج', NOW(), NOW()),
('product_form.error.slug_exists', 'en', 'Product slug already exists. Please change the Product Name.', NOW(), NOW()),
('product_form.error.slug_exists', 'ar', 'عنوان المنتج موجود بالفعل. يرجى تغيير اسم المنتج.', NOW(), NOW()),
('product_form.error.save_failed', 'en', 'Failed to save product', NOW(), NOW()),
('product_form.error.save_failed', 'ar', 'فشل حفظ المنتج', NOW(), NOW()),

-- Success Messages
('product_form.success.created', 'en', 'Product added successfully!', NOW(), NOW()),
('product_form.success.created', 'ar', 'تم إضافة المنتج بنجاح!', NOW(), NOW()),
('product_form.success.updated', 'en', 'Product updated successfully!', NOW(), NOW()),
('product_form.success.updated', 'ar', 'تم تحديث المنتج بنجاح!', NOW(), NOW())

ON CONFLICT (key, language_code) DO NOTHING;
