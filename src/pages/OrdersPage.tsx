import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Store {
  id: string;
  name: string | null;
  slug: string;
}

interface OrdersPageProps {
  selectedStore: Store;
}

const OrdersPage = () => {
  const context = useOutletContext<OrdersPageProps>();
  const selectedStore = context?.selectedStore;

  // Fetch store orders
  const { data: orders = [] } = useQuery({
    queryKey: ['store-orders', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await (supabase as any)
        .from('orders')
        .select('*')
        .eq('store_id', selectedStore.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ORDER_PLACED':
        return 'bg-blue-100 text-blue-800';
      case 'PACKED':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Store Orders</h1>
        <p className="text-muted-foreground">
          Store: <span className="font-semibold">{selectedStore?.name || selectedStore?.slug}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {orders.length > 0 ? `${orders.length} Orders` : 'No Orders Yet'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                Orders will appear here once customers start purchasing
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">SR. NO.</th>
                    <th className="text-left py-3 px-4 font-semibold">CUSTOMER</th>
                    <th className="text-left py-3 px-4 font-semibold">TOTAL</th>
                    <th className="text-left py-3 px-4 font-semibold">PAYMENT</th>
                    <th className="text-left py-3 px-4 font-semibold">STATUS</th>
                    <th className="text-left py-3 px-4 font-semibold">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any, index: number) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{order.customer_name || 'Customer'}</div>
                        <div className="text-xs text-muted-foreground">{order.customer_email || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        ${Number(order.total).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm capitalize">{order.payment_method || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getStatusColor(order.status)} cursor-pointer`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;
