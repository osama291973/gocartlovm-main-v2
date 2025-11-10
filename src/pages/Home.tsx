import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import StoreCard from '@/components/StoreCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const Home = () => {
  const { language, t } = useLanguage();

  type CategoryWithTranslations = Database['public']['Tables']['categories']['Row'] & {
    category_translations: Array<Database['public']['Tables']['category_translations']['Row']>
  };

  type ProductWithTranslations = Database['public']['Tables']['products']['Row'] & {
    product_translations: Array<{
      id: string;
      product_id: string;
      language_code: 'en' | 'ar';
      name: string;
      description: string | null;
    }>
  };

  type StoreWithTranslations = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    cover_url: string | null;
    rating: number;
    total_products: number;
    created_at: string;
    updated_at: string;
    store_translations: Array<{
      id: string;
      store_id: string;
      language_code: 'en' | 'ar';
      name: string;
      description: string | null;
    }>;
  };

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          category_translations (
            id,
            name,
            description,
            language_code
          )
        `)
        .limit(6) as unknown as { 
          data: CategoryWithTranslations[],
          error: any 
        };
      if (error) throw error;
      return data;
    },
  });

  const { data: featuredProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['featured-products', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_translations (
            id,
            name,
            description,
            language_code
          )
        `)
        .eq('is_featured', true)
        .limit(8) as unknown as {
          data: ProductWithTranslations[],
          error: any
        };
      if (error) throw error;
      return data;
    },
  });

  const { data: bestRatedProducts, isLoading: bestRatedLoading } = useQuery({
    queryKey: ['best-rated-products', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_translations (
            id,
            name,
            description,
            language_code
          )
        `)
        .order('rating', { ascending: false })
        .limit(8) as unknown as {
          data: ProductWithTranslations[],
          error: any
        };
      if (error) throw error;
      return data;
    },
  });

  const { data: bestSellingProducts, isLoading: bestSellingLoading } = useQuery({
    queryKey: ['best-selling-products', language],
    queryFn: async () => {
      // approximate best-selling by reviews_count (proxy for popularity)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_translations (
            id,
            name,
            description,
            language_code
          )
        `)
        .order('reviews_count', { ascending: false })
        .limit(8) as unknown as {
          data: ProductWithTranslations[],
          error: any
        };
      if (error) throw error;
      return data;
    },
  });

  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ['stores', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          store_translations (
            id,
            name,
            description,
            language_code
          )
        `)
        .limit(6) as unknown as {
          data: StoreWithTranslations[],
          error: any
        };
      if (error) throw error;
      return data;
    },
  });

  interface Translation {
    id: string;
    language_code: 'en' | 'ar';
    name: string;
    description?: string | null;
  }

  const getTranslation = (translations: Translation[], fallback: string) => {
    const translation = translations?.find((t) => t.language_code === language);
    return translation?.name || fallback;
  };

  return (
    <div className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        <section className="lg:col-span-8 rounded-3xl bg-[hsl(var(--hero-mint))] p-8 md:p-12 relative overflow-hidden min-h-[500px] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-[hsl(var(--accent))] text-accent-foreground px-4 py-1.5 rounded-full text-xs font-medium mb-8">
              <span className="font-bold">{t('hero_news_tag')}</span>
              <span>{t('hero_news_text')}</span>
            </div>
            
            <div className="max-w-md">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {t('hero_title_line1')}
              </h1>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                {t('hero_title_line2')}
              </h2>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">{t('hero_starts_from_label')}</p>
            <p className="text-4xl font-bold mb-6">$4.90</p>
            
            <Button 
              size="lg" 
              className="bg-foreground text-background hover:bg-foreground/90 rounded-lg"
            >
              {t('hero_cta')}
            </Button>
          </div>
        </section>

        <div className="lg:col-span-4 grid grid-rows-2 gap-6 h-full">
          <Link to="/shop" className="block h-full">
            <div className="rounded-3xl bg-[hsl(var(--hero-peach))] p-8 h-full hover:scale-[1.02] transition-transform flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold">{t('hero_card_best_products_title')}</h3>
                <p className="text-sm text-muted-foreground mt-2">{t('hero_card_best_products_desc')}</p>
              </div>
              <p className="text-sm font-medium flex items-center gap-2 mt-4">
                {t('hero_card_view_more')} <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </Link>
          
          <Link to="/shop" className="block h-full">
            <div className="rounded-3xl bg-[hsl(var(--hero-blue))] p-8 h-full hover:scale-[1.02] transition-transform flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold">{t('hero_card_discounts_title')}</h3>
                <p className="text-sm text-muted-foreground mt-2">{t('hero_card_discounts_desc')}</p>
              </div>
              <p className="text-sm font-medium flex items-center gap-2 mt-4">
                {t('hero_card_view_more')} <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Categories Carousel */}
      <section className="mb-12 overflow-hidden px-6 md:px-12 lg:px-20 relative">
        <div className="overflow-hidden relative">
          <div 
            className={`infinite-scroll-container ${language === 'ar' ? 'infinite-scroll-rtl' : ''}`}
            style={{ '--scroll-items': categories?.length || 8 } as React.CSSProperties}
          >
            <div className="infinite-scroll-content">
              {/* Original items */}
              {categoriesLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="inline-flex px-1.5">
                      <Skeleton className="min-w-[120px] h-10 rounded-full" />
                    </div>
                  ))
                : categories?.map((category) => (
                    <Link 
                      key={category.id}
                      to={`/shop?category=${category.slug}`}
                      className="inline-flex px-1.5"
                    >
                      <div className="px-6 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {getTranslation(category.category_translations, 'Category')}
                        </span>
                      </div>
                    </Link>
                  ))}
              
              {/* Cloned items for seamless loop */}
              {!categoriesLoading && categories?.map((category) => (
                <Link 
                  key={`clone-${category.id}`}
                  to={`/shop?category=${category.slug}`}
                  className="inline-flex px-1.5"
                >
                  <div className="px-6 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors whitespace-nowrap">
                    <span className="text-sm font-medium">
                      {getTranslation(category.category_translations, 'Category')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Gradient masks for smooth fade (same placement for LTR/RTL by design) */}
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        </div>
      </section>

      {/* Latest Products */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">{t('latest_products')}</h2>
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {t('showing_of_products')
                .replace('{count}', String(featuredProducts?.length || 0))
                .replace('{total}', '12')}
            </span>
            <Link to="/shop" className="flex items-center gap-1 text-primary hover:underline font-medium">
              {t('viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {productsLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-lg" />
              ))
            : featuredProducts?.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={getTranslation(product.product_translations, 'Product')}
                  price={Number(product.price)}
                  originalPrice={product.original_price ? Number(product.original_price) : undefined}
                  imageUrl={product.image_url}
                  rating={Number(product.rating)}
                  reviewsCount={product.reviews_count}
                  stock={product.stock}
                  isFeatured={product.is_featured}
                />
              ))}
        </div>
      </section>

      {/* Our Specifications */}
      <section className="my-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">{t('our_specifications')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('spec_intro') || t('footer_description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">{t('spec_free_shipping_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('spec_free_shipping_desc')}</p>
          </div>

          <div className="text-center p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">{t('spec_easy_return_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('spec_easy_return_desc')}</p>
          </div>

          <div className="text-center p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">{t('spec_support_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('spec_support_desc')}</p>
          </div>
        </div>
      </section>

      {/* Best Rated Products */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">{t('best_products')}</h2>
          <div className="flex items-center justify-center gap-3 text-sm">
            <Link to="/shop" className="flex items-center gap-1 text-primary hover:underline font-medium">
              {t('viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {bestRatedLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-lg" />
              ))
            : bestRatedProducts?.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={getTranslation(product.product_translations, 'Product')}
                  price={Number(product.price)}
                  originalPrice={product.original_price ? Number(product.original_price) : undefined}
                  imageUrl={product.image_url}
                  rating={Number(product.rating)}
                  reviewsCount={product.reviews_count}
                  stock={product.stock}
                  isFeatured={product.is_featured}
                />
              ))}
        </div>
      </section>

      {/* Best Selling Products */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">{t('best_selling')}</h2>
          <div className="flex items-center justify-center gap-3 text-sm">
            <Link to="/shop" className="flex items-center gap-1 text-primary hover:underline font-medium">
              {t('viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {bestSellingLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-lg" />
              ))
            : bestSellingProducts?.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={getTranslation(product.product_translations, 'Product')}
                  price={Number(product.price)}
                  originalPrice={product.original_price ? Number(product.original_price) : undefined}
                  imageUrl={product.image_url}
                  rating={Number(product.rating)}
                  reviewsCount={product.reviews_count}
                  stock={product.stock}
                  isFeatured={product.is_featured}
                />
              ))}
        </div>
      </section>

      {/* Featured Stores */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">{t('stores')}</h2>
          <Link to="/stores">
            <Button variant="ghost">
              {t('viewAll')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {storesLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))
            : stores?.map((store) => (
                <StoreCard
                  key={store.id}
                  id={store.id}
                  slug={store.slug}
                  name={getTranslation(store.store_translations, 'Store')}
                  description={store.store_translations?.find((t) => t.language_code === language)?.description}
                  logoUrl={store.logo_url}
                  coverUrl={store.cover_url}
                  rating={Number(store.rating)}
                  totalProducts={store.total_products}
                />
              ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
