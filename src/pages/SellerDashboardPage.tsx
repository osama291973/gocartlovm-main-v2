import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, TrendingUp, ShoppingCart, Star, MessageSquare } from 'lucide-react';

interface SellerDashboardPageProps {
  selectedStore: {
    id: string;
    name: string | null;
    slug: string;
    logo_url: string | null;
  };
}

const SellerDashboardPage = () => {
  const context = useOutletContext<SellerDashboardPageProps>();
  const selectedStore = context?.selectedStore;

  // Fetch store stats
  const { data: stats = {} } = useQuery({
    queryKey: ['store-stats', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return {};

      const [productsRes, ordersRes] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', selectedStore.id),
        supabase
          .from('orders')
          .select('id, total', { count: 'exact' })
          .eq('store_id', selectedStore.id),
      ]);

      const totalProducts = productsRes.count || 0;
      const totalOrders = ordersRes.count || 0;
      const totalEarnings = ((ordersRes.data as any) || []).reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0);

      return {
        totalProducts,
        totalOrders,
        totalEarnings,
        totalRatings: 0, // Calculate from reviews
        totalReviews: 0, // Calculate from reviews
      };
    },
    enabled: !!selectedStore?.id,
  });

  const summaryCards = [
    {
      title: 'dashboard_stats_total_products',
      value: stats.totalProducts || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'dashboard_stats_total_earnings',
      value: `$${(stats.totalEarnings || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'dashboard_stats_total_orders',
      value: stats.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'dashboard_stats_total_ratings',
      value: stats.totalRatings || 0,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'dashboard_stats_total_reviews',
      value: stats.totalReviews || 0,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        {/** use translations */}
        <h1 className="text-4xl font-bold mb-2">{useLanguage().t('seller_dashboard_title')}</h1>
        <p className="text-muted-foreground">
          {useLanguage().t('header_store_label')} <span className="font-semibold">{selectedStore?.name || selectedStore?.slug}</span>
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {useLanguage().t(card.title)}
                  </CardTitle>
                  <div className={`${card.bgColor} p-2 rounded`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity / Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                No orders yet. Start selling to see orders here!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="font-semibold">0%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Avg Order Value</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                <span className="font-semibold">--</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
