import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, Truck, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

interface Store {
  id: string;
  name: string | null;
  slug: string;
}

interface OrdersPageProps {
  selectedStore: Store;
}

const OrdersPage = () => {
  const { user } = useAuth();
  const context = useOutletContext<OrdersPageProps>();
  const selectedStore = context?.selectedStore;
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Fetch store orders (seller view)
  const { data: storeOrders = [] } = useQuery({
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

  // Fetch user orders (customer view)
  const { data: userOrders = [] } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase as any)
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !selectedStore?.id,
  });

  const orders = selectedStore?.id ? storeOrders : userOrders;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-yellow-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {selectedStore?.id ? 'Store Orders' : 'My Orders'}
        </h1>
        {selectedStore?.id && (
          <p className="text-muted-foreground">
            Store: <span className="font-semibold">{selectedStore?.name || selectedStore?.slug}</span>
          </p>
        )}
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
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                {selectedStore?.id
                  ? 'Orders will appear here once customers start purchasing'
                  : 'Start shopping to create your first order'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="hidden sm:flex">{getStatusIcon(order.status)}</div>
                      <div className="flex-1">
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(order.total_amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={`${getStatusColor(order.status)} capitalize`}>
                      {order.status}
                    </Badge>
                    <Badge className={`${getPaymentStatusColor(order.payment_status)} capitalize`}>
                      Payment: {order.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order ID and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-semibold font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Order Status</p>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="w-0.5 h-12 bg-gray-200" />
                  </div>
                  <div>
                    <p className="font-semibold">Order Placed</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {['processing', 'shipped', 'delivered'].includes(selectedOrder.status) && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                          selectedOrder.status === 'delivered'
                            ? 'bg-green-100'
                            : 'bg-yellow-100'
                        }`}
                      >
                        {selectedOrder.status === 'delivered' ? (
                          <CheckCircle
                            className={`h-5 w-5 ${
                              selectedOrder.status === 'delivered'
                                ? 'text-green-600'
                                : 'text-yellow-600'
                            }`}
                          />
                        ) : (
                          <Truck
                            className={`h-5 w-5 ${
                              selectedOrder.status === 'delivered'
                                ? 'text-green-600'
                                : 'text-yellow-600'
                            }`}
                          />
                        )}
                      </div>
                      {selectedOrder.status === 'delivered' && (
                        <div className="w-0.5 h-0 bg-gray-200" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {selectedOrder.status === 'delivered'
                          ? 'Delivered'
                          : 'In Transit'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedOrder.status === 'delivered'
                          ? 'Your package has been delivered'
                          : 'Your package is on its way'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-semibold mb-3">Order Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(selectedOrder.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(0)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${getStatusColor(selectedOrder.status)} capitalize`}>
                  {selectedOrder.status}
                </Badge>
                <Badge
                  className={`${getPaymentStatusColor(selectedOrder.payment_status)} capitalize`}
                >
                  Payment: {selectedOrder.payment_status}
                </Badge>
              </div>

              {/* Close Button */}
              <Button onClick={() => setSelectedOrder(null)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
