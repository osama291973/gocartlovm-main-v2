import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, DollarSign, ShoppingCart, Store } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

const AdminDashboard = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || !hasRole('admin'))) {
      navigate('/auth');
    }
  }, [user, hasRole, authLoading, navigate]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [productsRes, ordersRes, storesRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total'),
        supabase.from('stores').select('*', { count: 'exact', head: true }),
      ]);

  const totalRevenue = (ordersRes.data || []).reduce((sum: number, order: any) => sum + Number(order?.total || 0), 0);

      return {
        totalProducts: productsRes.count || 0,
        totalRevenue,
        totalOrders: ordersRes.data?.length || 0,
        totalStores: storesRes.count || 0,
      };
    },
    enabled: !!user,
  });

  const mockChartData = Array.from({ length: 30 }, (_, i) => ({
    date: `2025-${String(Math.floor(i / 30) + 8).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
    orders: Math.floor(Math.random() * 50) + 10,
  }));

  const { t } = useLanguage();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <aside className="w-64 border-r p-6">
            <Skeleton className="h-12 w-12 rounded-full mb-6" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </aside>
          <main className="flex-1 p-8">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r min-h-screen p-6">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary))] text-primary-foreground flex items-center justify-center text-xl font-bold mb-2">
              O
            </div>
            <p className="font-semibold">Osama Elshimy</p>
          </div>

          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary rounded-lg border-l-4 border-primary">
              <Store className="h-5 w-5" />
              Dashboard
            </button>
            <button onClick={() => navigate('/admin/stores')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent rounded-lg">
              <Store className="h-5 w-5" />
              Stores
            </button>
            <button 
              onClick={() => navigate('/admin/seller-applications')}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent rounded-lg"
            >
              <Package className="h-5 w-5" />
              Seller Applications
            </button>
            <button onClick={() => navigate('/admin/coupons')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent rounded-lg">
              <ShoppingCart className="h-5 w-5" />
              Coupons
            </button>
            <button
              onClick={() => navigate('/admin/translations')}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent rounded-lg"
            >
              <Store className="h-5 w-5" />
              Translations
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header with Logo Text */}
          <div className="mb-8">
            <a href="/" className="inline-flex items-center mb-4 text-2xl font-semibold">
              <span className="text-green-600">go</span><span className="text-black">cart</span>
            </a>
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold">{t('admin_dashboard_title')}</h1>
              <div className="flex items-center gap-4">
                <p className="text-sm">{t('admin_greeting').replace('{name}', user?.user_metadata?.full_name || 'Admin')}</p>
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] text-primary-foreground flex items-center justify-center">
                  O
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin_total_products')}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProducts || 12}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin_total_revenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.totalRevenue.toFixed(2) || '338703.80'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin_total_orders')}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrders || 831}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin_total_stores')}</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalStores || 3}</div>
              </CardContent>
            </Card>
          </div>

            <Card>
            <CardHeader>
              <CardTitle>{t('admin_orders_per_day')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ orders: { color: 'hsl(var(--primary))' } }} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorOrders)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;