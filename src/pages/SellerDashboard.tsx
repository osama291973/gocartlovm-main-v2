import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Package, TrendingUp, Star, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SellerSidebar from '@/components/layout/SellerSidebar';

const SellerDashboard: React.FC = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!authLoading && (!user || !hasRole('seller'))) {
      // navigate away handled elsewhere
    }
  }, [user, hasRole, authLoading]);

  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ['seller-stores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('stores').select('*, products(id)').eq('owner_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const totalProducts = stores?.reduce((acc: number, s: any) => acc + (s.products?.length || 0), 0) || 0;

  if (authLoading || storesLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="w-full h-16 bg-white flex items-center justify-between px-8 border-b">
          <div className="text-2xl font-bold">gocart<span className="text-green-500">.</span></div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        <div className="flex flex-1">
          <div className="w-56 bg-white border-r p-4">
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top header (white) */}
      <header className="w-full h-16 bg-white flex items-center justify-between px-8 border-b sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold text-slate-800">gocart<span className="text-green-500">.</span></div>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm text-gray-700 hover:text-gray-900">Home</Link>
          <LanguageSwitcher />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">{user?.email?.split('@')[0] ?? 'User'}</span>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-semibold">{(user?.email || 'U').toString().charAt(0).toUpperCase()}</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-start h-full">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r overflow-y-auto">
          <div className="px-4 py-6">
            <SellerSidebar />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-2">{t('seller_dashboard_title') ?? 'Seller Dashboard'}</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs text-gray-600">{t('dashboard_stats_total_products') ?? 'Total Products'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProducts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xs text-gray-600">{t('dashboard_stats_total_earnings') ?? 'Total Earnings'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$26,097</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xs text-gray-600">{t('dashboard_stats_total_orders') ?? 'Total Orders'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">151</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xs text-gray-600">{t('dashboard_stats_total_ratings') ?? 'Total Ratings'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">13</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="pb-6 border-b">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Store className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold">Great Stack</div>
                            <div className="text-xs text-gray-500">Fri Aug 22 2025</div>
                            <p className="text-sm text-gray-600 mt-2">Sample review content...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="pb-4 border-b">
                        <div className="font-semibold">Bluetooth Speaker</div>
                        <div className="text-xs text-gray-500">Electronics</div>
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={14} className="text-green-500" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;
