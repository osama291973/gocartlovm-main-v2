import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Package, TrendingUp, Star, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SellerSidebar from '@/components/layout/SellerSidebar';

const SellerDashboard = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || !hasRole('seller'))) {
      navigate('/auth');
    }
  }, [user, hasRole, authLoading, navigate]);

  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ['seller-stores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let { data: dataStores, error } = await supabase
        .from('stores')
        .select('*, products(id)')
        .eq('owner_id', user.id);

      if (error) throw error;

      if (!dataStores || dataStores.length === 0) {
        const { data: apps, error: appsErr } = await supabase
          .from('seller_applications')
          .select('store_id')
          .eq('user_id', user.id);

        if (appsErr) throw appsErr;

        const storeIds = (apps || []).map((a: any) => a.store_id).filter(Boolean);

        if (storeIds.length > 0) {
          const { data: storesByApp, error: storesErr } = await supabase
            .from('stores')
            .select('*, products(id)')
            .in('id', storeIds);

          if (storesErr) throw storesErr;

          dataStores = storesByApp || [];
        }
      }

      return dataStores || [];
    },
    enabled: !!user,
  });

  if (authLoading || storesLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Skeleton className="w-56 h-screen" />
        <div className="flex-1 p-6">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalProducts = stores?.reduce((acc, store: any) => acc + (store.products?.length || 0), 0) || 0;
  const currentStore = stores?.[0];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <SellerSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        {/* Header with Brand Link */}
        <div className="sticky top-0 z-40 border-b bg-white">
          <div className="px-6 py-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-green-600 hover:text-green-700">
              {t('header.brand') ?? 'gocart'}<span className="text-red-500">.</span>
            </Link>
            <div className="text-sm text-gray-600">
              <span>{t('header.store_label') ?? 'Store:'}</span>
              <span className="font-semibold ml-1">{currentStore?.slug || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('seller_dashboard.title') ?? 'Seller Dashboard'}</h1>
          </div>

          {/* Stats Grid - 5 columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">
                  {t('dashboard.stats.total_products') ?? 'Total Products'}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">
                  {t('dashboard.stats.total_earnings') ?? 'Total Earnings'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.00</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">
                  {t('dashboard.stats.total_orders') ?? 'Total Orders'}
                </CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">
                  {t('dashboard.stats.total_ratings') ?? 'Total Ratings'}
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">
                  {t('dashboard.stats.total_reviews') ?? 'Total Reviews'}
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders and Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('dashboard.recent_orders.title') ?? 'Recent Orders'}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t('dashboard.recent_orders.empty') ?? 'No orders yet. Start selling to see orders here'}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('dashboard.quick_stats.title') ?? 'Quick Stats'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.quick_stats.conversion_rate') ?? 'Conversion Rate'}</span>
                  <span className="font-medium">0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.quick_stats.avg_order_value') ?? 'Avg Order Value'}</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.quick_stats.customer_satisfaction') ?? 'Customer Satisfaction'}</span>
                  <span className="font-medium">--</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard