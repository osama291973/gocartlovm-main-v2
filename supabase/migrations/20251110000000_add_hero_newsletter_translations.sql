-- Add hero section and newsletter translations
INSERT INTO public.site_texts (key, language_code, value, namespace, type)
VALUES
    -- Hero Section - English
    ('hero_news_tag', 'en', 'NEWS', 'site', 'text'),
    ('hero_news_text', 'en', 'Free Shipping on Orders Above $50!', 'site', 'text'),
    ('hero_title_line1', 'en', 'Gadgets you''ll love.', 'site', 'text'),
    ('hero_title_line2', 'en', 'Prices you''ll trust.', 'site', 'text'),
    ('hero_starts_from_label', 'en', 'Starts from', 'site', 'text'),
    ('hero_cta', 'en', 'LEARN MORE', 'site', 'text'),

    -- Hero Section - Arabic
    ('hero_news_tag', 'ar', 'أخبار', 'site', 'text'),
    ('hero_news_text', 'ar', 'شحن مجاني للطلبات التي تزيد عن 50 دولار!', 'site', 'text'),
    ('hero_title_line1', 'ar', 'أجهزة ستعشقها', 'site', 'text'),
    ('hero_title_line2', 'ar', 'أسعار تثق بها', 'site', 'text'),
    ('hero_starts_from_label', 'ar', 'يبدأ من', 'site', 'text'),
    ('hero_cta', 'ar', 'اعرف أكثر', 'site', 'text'),

    -- Newsletter Section - English
    ('newsletter_title', 'en', 'Join Newsletter', 'site', 'text'),
    ('newsletter_desc', 'en', 'Subscribe to get exclusive deals, new arrivals, and insider updates delivered straight to your inbox every week.', 'site', 'text'),
    ('newsletter_input_placeholder', 'en', 'Enter your email address', 'site', 'text'),
    ('newsletter_button', 'en', 'Get Updates', 'site', 'text'),
    ('newsletter_toast_title', 'en', 'Subscribed!', 'site', 'text'),
    ('newsletter_toast_desc', 'en', 'Thank you for subscribing to our newsletter.', 'site', 'text'),

    -- Newsletter Section - Arabic
    ('newsletter_title', 'ar', 'انضم إلى النشرة الإخبارية', 'site', 'text'),
    ('newsletter_desc', 'ar', 'اشترك للحصول على عروض حصرية، وصول جديد، وتحديثات مباشرة إلى صندوق بريدك كل أسبوع.', 'site', 'text'),
    ('newsletter_input_placeholder', 'ar', 'أدخل بريدك الإلكتروني', 'site', 'text'),
    ('newsletter_button', 'ar', 'احصل على التحديثات', 'site', 'text'),
    ('newsletter_toast_title', 'ar', 'تم الاشتراك!', 'site', 'text'),
    ('newsletter_toast_desc', 'ar', 'شكرًا لاشتراكك في النشرة الإخبارية.', 'site', 'text'),

    -- Hero Cards - English
    ('hero_card_best_products_title', 'en', 'Best products', 'site', 'text'),
    ('hero_card_best_products_desc', 'en', 'Find the perfect gadget', 'site', 'text'),
    ('hero_card_discounts_title', 'en', '20% discounts', 'site', 'text'),
    ('hero_card_discounts_desc', 'en', 'Limited time offers', 'site', 'text'),
    ('hero_card_view_more', 'en', 'View more', 'site', 'text'),

    -- Hero Cards - Arabic
    ('hero_card_best_products_title', 'ar', 'أفضل المنتجات', 'site', 'text'),
    ('hero_card_best_products_desc', 'ar', 'اعثر على الجهاز المثالي', 'site', 'text'),
    ('hero_card_discounts_title', 'ar', 'خصم 20%', 'site', 'text'),
    ('hero_card_discounts_desc', 'ar', 'عروض لفترة محدودة', 'site', 'text'),
    ('hero_card_view_more', 'ar', 'عرض المزيد', 'site', 'text')
ON CONFLICT (key, language_code) 
DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();