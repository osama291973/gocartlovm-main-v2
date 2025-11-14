import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, Truck, CheckCircle, AlertCircle, ChevronRight, MapPin, CreditCard, FileText } from 'lucide-react';

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
  const { t } = useLanguage();
  const context = useOutletContext<OrdersPageProps>();
  const selectedStore = context?.selectedStore;
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [selectedOrderAddress, setSelectedOrderAddress] = useState<any | null>(null);

  // Fetch store orders (seller view) - get unique orders from order_items
  const { data: storeOrders = [] } = useQuery({
    queryKey: ['store-orders', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await (supabase as any)
        .from('order_items')
        .select('order_id')
        .eq('store_id', selectedStore.id)
        .order('order_id', { ascending: false });

      if (error) throw error;

      // Get unique order IDs
      const uniqueOrderIds = [...new Set((data || []).map((item: any) => item.order_id))];

      if (uniqueOrderIds.length === 0) return [];

      // Fetch full order details
      const { data: orders, error: ordersError } = await (supabase as any)
        .from('orders')
        .select('*')
        .in('id', uniqueOrderIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      return orders || [];
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

  // Fetch order items when an order is selected
  const { data: orderItems = [] } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder?.id) return [];

      const { data, error } = await (supabase as any)
        .from('order_items')
        .select('*')
        .eq('order_id', selectedOrder.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedOrder?.id,
  });

  // Fetch address when an order is selected
  const { data: address = null } = useQuery({
    queryKey: ['order-address', selectedOrder?.address_id],
    queryFn: async () => {
      if (!selectedOrder?.address_id) return null;

      const { data, error } = await (supabase as any)
        .from('addresses')
        .select('*')
        .eq('id', selectedOrder.address_id)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!selectedOrder?.address_id,
  });

  const orders = selectedStore?.id ? storeOrders : userOrders;

  // Update selected order items and address when they change
  useEffect(() => {
    setSelectedOrderItems(orderItems);
  }, [orderItems]);

  useEffect(() => {
    setSelectedOrderAddress(address);
  }, [address]);

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
          {selectedStore?.id ? t('store_orders') : t('my_orders')}
        </h1>
        {selectedStore?.id && (
          <p className="text-muted-foreground">
            {t('store_label_orders')} <span className="font-semibold">{selectedStore?.name || selectedStore?.slug}</span>
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {orders.length > 0 ? `${orders.length} ${t('myOrders')}` : t('no_orders_yet')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">{t('no_orders')}</p>
              <p className="text-sm text-muted-foreground">
                {selectedStore?.id
                  ? t('no_orders_empty_seller')
                  : t('no_orders_empty_customer')}
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
                        <p className="font-semibold">{t('order_number')}{order.id.slice(0, 8)}</p>
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
                          }).format(order.total)}
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
                      {t('payment_status_label')}{order.payment_status}
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
            <DialogTitle>{t('order_details')}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order ID and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('order_id')}</p>
                  <p className="font-semibold font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('order_date')}</p>
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
                <p className="text-sm font-semibold">{t('order_status')}</p>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="w-0.5 h-12 bg-gray-200" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('order_placed')}</p>
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
                          ? t('delivered_text')
                          : t('in_transit')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedOrder.status === 'delivered'
                          ? t('your_package_delivered')
                          : t('your_package_on_way')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-semibold mb-3">{t('order_summary')}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('subtotal')}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(selectedOrder.subtotal)}
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('discount')}</span>
                      <span className="font-medium text-green-600">
                        -{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(selectedOrder.discount)}
                      </span>
                    </div>
                  )}
                  {selectedOrder.shipping > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('shipping')}</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(selectedOrder.shipping)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>{t('total')}</span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrderItems.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">{t('order_items')}</p>
                  <div className="space-y-3">
                    {selectedOrderItems.map((item: any) => (
                      <div key={item.id} className="flex gap-3 bg-muted/30 rounded-lg p-3">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('qty_label')} {item.quantity} × {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(item.price)}
                          </p>
                          <p className="font-semibold text-sm">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(item.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {selectedOrderAddress && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">{t('delivery_address')}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                    <p className="font-medium">{selectedOrderAddress.title}</p>
                    <p className="text-muted-foreground">{selectedOrderAddress.street}</p>
                    <p className="text-muted-foreground">
                      {selectedOrderAddress.city}, {selectedOrderAddress.state} {selectedOrderAddress.postal_code}
                    </p>
                    <p className="text-muted-foreground">{selectedOrderAddress.country}</p>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">{t('payment_information')}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                  {selectedOrder.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('payment_method')}</span>
                      <span className="font-medium capitalize">{selectedOrder.payment_method}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">{t('order_notes')}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${getStatusColor(selectedOrder.status)} capitalize`}>
                  {selectedOrder.status}
                </Badge>
                <Badge
                  className={`${getPaymentStatusColor(selectedOrder.payment_status)} capitalize`}
                >
                  {t('payment_status_label')}{selectedOrder.payment_status}
                </Badge>
              </div>

              {/* Close Button */}
              <Button onClick={() => setSelectedOrder(null)} className="w-full">
                {t('close_button')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
