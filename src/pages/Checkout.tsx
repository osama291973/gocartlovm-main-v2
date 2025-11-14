import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useAddresses } from '@/hooks/useAddresses';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { cartItems, clearCart, cartTotal } = useCart();
  const { addresses, defaultAddress } = useAddresses();
  const { createOrder } = useOrders();

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // Set default address on load
  useEffect(() => {
    if (defaultAddress) {
      setSelectedAddress(defaultAddress.id);
    } else if (addresses.length > 0) {
      setSelectedAddress(addresses[0].id);
    }
  }, [addresses, defaultAddress]);

  const handleCheckout = async () => {
    if (!selectedAddress) {
      toast({
        title: 'Error',
        description: 'Please select an address',
        variant: 'destructive',
      });
      return;
    }

    // Group cart items by store
    const ordersByStore = cartItems.reduce(
      (acc, item) => {
        // For now, we'll use a default store
        if (!acc['default']) {
          acc['default'] = [];
        }
        acc['default'].push(item);
        return acc;
      },
      {} as Record<string, any[]>
    );

    try {
      setIsProcessing(true);

      // Create orders for each store
      for (const [storeId, items] of Object.entries(ordersByStore)) {
        const storeTotal = (items as any[]).reduce(
          (sum, item) =>
            sum + (item.variant?.price || item.product?.price || 0) * item.quantity,
          0
        );

        await createOrder.mutateAsync({
          store_id: storeId === 'default' ? '' : storeId,
          address_id: selectedAddress,
          total_amount: storeTotal,
          payment_status: 'pending',
        });
      }

      // Clear cart and show success
      await clearCart.mutateAsync();

      toast({
        title: 'Success',
        description: 'Order placed successfully!',
      });

      // Redirect to orders page
      navigate('/orders');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  const selectedAddressObj = addresses.find((a) => a.id === selectedAddress);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{t('checkout')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>{t('shippingAddress')}</CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    {t('noAddressFound')}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/account')}>
                    {t('addAddress')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select value={selectedAddress || ''} onValueChange={setSelectedAddress}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectAddress')} />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          {address.title} - {address.street}, {address.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedAddressObj && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <p className="font-semibold mb-2">{selectedAddressObj.title}</p>
                      <p className="text-sm">{selectedAddressObj.street}</p>
                      <p className="text-sm">
                        {selectedAddressObj.city}
                        {selectedAddressObj.state && `, ${selectedAddressObj.state}`}
                        {selectedAddressObj.postal_code && ` ${selectedAddressObj.postal_code}`}
                      </p>
                      <p className="text-sm">{selectedAddressObj.country}</p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/account')}
                  >
                    {t('manageAddresses')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items Review */}
          <Card>
            <CardHeader>
              <CardTitle>{t('orderItems')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center pb-4 border-b">
                    <div>
                      <p className="font-semibold">{item.product?.slug}</p>
                      {item.variant?.sku && (
                        <p className="text-sm text-muted-foreground">SKU: {item.variant.sku}</p>
                      )}
                      <p className="text-sm">
                        {t('quantity')}: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(
                        (item.variant?.price || item.product?.price || 0) * item.quantity
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>{t('orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(cartTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('shipping')}</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('tax')}</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(0)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('total')}</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(cartTotal)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={isProcessing || !selectedAddress || addresses.length === 0}
              >
                {isProcessing ? `${t('processing')}...` : t('placeOrder')}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/cart')}
                disabled={isProcessing}
              >
                {t('backToCart')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
