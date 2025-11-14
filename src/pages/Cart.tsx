import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';

const Cart = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    isLoadingCart,
    updateQuantity,
    removeFromCart,
    cartTotal,
  } = useCart();

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity.mutate({ cartItemId, quantity: newQuantity });
    }
  };

  const handleRemove = (cartItemId: string) => {
    removeFromCart.mutate(cartItemId);
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/checkout');
  };

  if (isLoadingCart) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <p className="mt-4">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center p-8">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">{t('cartEmpty')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('addProductsToCart')}
          </p>
          <Link to="/shop">
            <Button>{t('shop')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{t('cart')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.product?.slug || 'Product'}
                      </h3>
                      {item.variant?.sku && (
                        <p className="text-sm text-muted-foreground mb-2">
                          SKU: {item.variant.sku}
                        </p>
                      )}
                      <p className="font-bold text-lg">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(
                          item.variant?.price || item.product?.price || 0
                        )}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        disabled={updateQuantity.isPending}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={updateQuantity.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                      disabled={removeFromCart.isPending}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Subtotal */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-right font-semibold">
                      {t('subtotal')}:{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(
                        (item.variant?.price || item.product?.price || 0) *
                          item.quantity
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">{t('orderSummary')}</h3>

              <div className="space-y-2 mb-4">
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
                className="w-full mt-6"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
              >
                {t('checkout')}
              </Button>

              <Link to="/shop" className="block mt-3">
                <Button variant="outline" className="w-full">
                  {t('continueShopping')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
