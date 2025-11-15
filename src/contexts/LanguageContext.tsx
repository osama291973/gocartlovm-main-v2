import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchSiteTexts } from '@/lib/siteTexts';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Fallback translations (primarily English - Arabic translations loaded from backend)
const translations: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    shop: 'Shop',
    stores: 'Stores',
    cart: 'Cart',
    account: 'Account',
    search: 'Search products...',
    categories: 'Categories',
    featuredProducts: 'Featured Products',
    latest_products: 'Latest Products',
    best_products: 'Best products',
    best_selling: 'Best selling',
    discounts_20: '20% discounts',
    showing_of_products: 'Showing {count} of {total} products',
    allProducts: 'All Products',
    viewAll: 'View All',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    reviews: 'Reviews',
    writeReview: 'Write a Review',
    checkout: 'Checkout',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    discount: 'Discount',
    total: 'Total',
    applyCoupon: 'Apply Coupon',
    placeOrder: 'Place Order',
    myOrders: 'My Orders',
    addresses: 'Addresses',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    add_account: 'Add account',
    manage_account_info: 'Manage your account info.',
    profile: 'Profile',
    security: 'Security',
    billing: 'Billing',
    profile_details: 'Profile details',
    full_name: 'Full name',
    add_email: 'Add email address',
    password_label: 'Password',
    set_password: 'Set password',
    manage_billing: 'Manage your subscription and payment methods.',
    development_mode: 'Development mode',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    price: 'Price',
    rating: 'Rating',
    products: 'Products',
    footer_brand: 'gocart.',
    footer_description: "Welcome to gocart, your ultimate destination for the latest and smartest gadgets. From smartphones and smartwatches to essential accessories, we bring you the best in innovation — all in one place.",
    footer_contact_phone: '+1-212-456-7890',
    footer_contact_email: 'contact@example.com',
    footer_contact_address: '794 Francisco, 94102',
    create_store: 'Create Your Store',
    product_earphones: 'Earphones',
    product_headphones: 'Headphones',
    product_smartphones: 'Smartphones',
    product_laptops: 'Laptops',
    become_seller: 'Become a Seller',
    seller_dashboard: 'Seller Dashboard',
    admin_dashboard: 'Admin Dashboard',
    manage_profile: 'Manage Profile',
    my_orders: 'My Orders',
    website: 'Website',
    privacy_policy: 'Privacy Policy',
    become_plus_member: 'Become Plus Member',
    contact: 'Contact',
    our_specifications: 'Our Specifications',
    spec_free_shipping_title: 'Free Shipping',
    spec_free_shipping_desc: 'Enjoy fast, free delivery on every order no conditions, just reliable doorstep.',
    spec_easy_return_title: '7 Days easy Return',
    spec_easy_return_desc: "Change your mind? No worries. Return any item within 7 days.",
    spec_support_title: '24/7 Customer Support',
    spec_support_desc: "We're here for you. Get expert help with our customer support.",
    seller_dashboard_title: 'Seller Dashboard',
    dashboard_stats_total_products: 'Total Products',
    dashboard_stats_total_earnings: 'Total Earnings',
    dashboard_stats_total_orders: 'Total Orders',
    dashboard_stats_total_ratings: 'Total Ratings',
    dashboard_stats_total_reviews: 'Total Reviews',
    dashboard_recent_orders_title: 'Recent Orders',
    dashboard_recent_orders_empty: 'No orders yet. Start selling to see orders here',
    dashboard_quick_stats_title: 'Quick Stats',
    dashboard_quick_stats_conversion_rate: 'Conversion Rate',
    dashboard_quick_stats_avg_order_value: 'Avg Order Value',
    dashboard_quick_stats_customer_satisfaction: 'Customer Satisfaction',
    header_brand: 'gocart',
    header_store_label: 'Store:',
    add_product: 'Add Product',
    manage_products: 'Manage Products',
    dashboard: 'Dashboard',
    store_orders: 'Store Orders',
    no_orders_yet: 'No Orders Yet',
    no_orders_empty_customer: 'Start shopping to create your first order',
    no_orders_empty_seller: 'Orders will appear here once customers start purchasing',
    no_orders: 'No orders yet',
    order_number: 'Order #',
    order_details: 'Order Details',
    order_id: 'Order ID',
    order_date: 'Order Date',
    order_status: 'Order Status',
    order_placed: 'Order Placed',
    order_summary: 'Order Summary',
    order_items: 'Order Items',
    delivery_address: 'Delivery Address',
    payment_information: 'Payment Information',
    order_notes: 'Order Notes',
    payment_method: 'Method',
    in_transit: 'In Transit',
    delivered_text: 'Delivered',
    your_package_delivered: 'Your package has been delivered',
    your_package_on_way: 'Your package is on its way',
    payment_status_label: 'Payment: ',
    qty_label: 'Qty:',
    store_label_orders: 'Store:',
    close_button: 'Close',
    admin_dashboard_title: 'Admin Dashboard',
    admin_total_products: 'Total Products',
    admin_total_revenue: 'Total Revenue',
    admin_total_orders: 'Total Orders',
    admin_total_stores: 'Total Stores',
    admin_orders_per_day: 'Orders / Day',
    admin_nav_dashboard: 'Dashboard',
    admin_nav_stores: 'Stores',
    admin_nav_applications: 'Seller Applications',
    admin_nav_coupons: 'Coupons',
    admin_nav_translations: 'Translations',
    admin_greeting: 'Hi, {name}',
    your_products: 'Your Products',
    no_products_yet: 'No products yet',
    start_adding_first_product: 'Start by adding your first product',
    product_name: 'Product Name',
    price_label: 'Price',
    stock_label: 'Stock',
    rating_label: 'Rating',
    actions_label: 'Actions',
    no_reviews: 'No reviews',
    add_product_page_title: 'Add New Products',
    add_products_to_store: 'Add products to your store:',
    click_to_upload_product_image: 'Click to upload product image',
    uploading: 'Uploading...',
  },
  ar: {
    // Arabic translations are loaded from backend database
    // This empty object ensures frontend always fetches from backend for Arabic
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [remoteTexts, setRemoteTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguage(savedLang);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLang;
    }
    // load remote site texts for the saved language
    (async () => {
      try {
        const texts = await fetchSiteTexts(savedLang || 'en');
        setRemoteTexts(texts || {});
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    // fetch remote site texts for selected language
    (async () => {
      const texts = await fetchSiteTexts(lang);
      setRemoteTexts(texts || {});
    })();
  };

  const t = (key: string) => {
    // Always prioritize backend (remoteTexts) first
    if (remoteTexts[key]) return remoteTexts[key];
    
    // Fallback to hardcoded translations (primarily for English)
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    
    // Last resort: return the key itself
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
