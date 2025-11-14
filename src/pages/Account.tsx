import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAddresses } from '@/hooks/useAddresses';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2, Edit2, Plus, Check } from 'lucide-react';

const Account = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } =
    useAddresses();
  const { orders } = useOrders();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">{t('pleaseLogin')}</p>
        <Button onClick={() => navigate('/auth')}>{t('login')}</Button>
      </div>
    );
  }

  const handleAddAddress = async () => {
    if (!formData.title || !formData.street || !formData.city || !formData.country) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAddress.mutateAsync(formData as any);
      toast({
        title: 'Success',
        description: 'Address added successfully',
      });
      setIsAddDialogOpen(false);
      setFormData({
        title: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_default: false,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add address',
        variant: 'destructive',
      });
    }
  };

  const handleEditAddress = async (addressId: string) => {
    try {
      await updateAddress.mutateAsync({
        addressId,
        ...formData,
      } as any);
      toast({
        title: 'Success',
        description: 'Address updated successfully',
      });
      setEditingId(null);
      setFormData({
        title: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_default: false,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update address',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress.mutateAsync(addressId);
      toast({
        title: 'Success',
        description: 'Address deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete address',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress.mutateAsync(addressId);
      toast({
        title: 'Success',
        description: 'Default address updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set default address',
        variant: 'destructive',
      });
    }
  };

  const handleEditOpen = (address: any) => {
    setFormData({
      title: address.title,
      street: address.street,
      city: address.city,
      state: address.state || '',
      postal_code: address.postal_code || '',
      country: address.country,
      is_default: address.is_default,
    });
    setEditingId(address.id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{t('account')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{t('myOrders')}</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">{t('noOrders')}</p>
                  <Button onClick={() => navigate('/shop')}>{t('shop')}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/order/${order.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Payment: {order.payment_status}
                        </p>
                        <p className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Addresses Section */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{t('addresses')}</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('add')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('addAddress')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">{t('addressTitle')}</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Home, Office, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="street">{t('street')}</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) =>
                          setFormData({ ...formData, street: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">{t('city')}</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">{t('state')}</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postal_code">{t('postalCode')}</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) =>
                            setFormData({ ...formData, postal_code: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">{t('country')}</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAddAddress}
                      disabled={createAddress.isPending}
                    >
                      {createAddress.isPending ? `${t('saving')}...` : t('save')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noAddresses')}
                </p>
              ) : (
                <div className="space-y-2">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-3 relative">
                      {address.is_default && (
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                            <Check className="h-3 w-3" />
                            Default
                          </span>
                        </div>
                      )}
                      <p className="font-semibold text-sm mb-1">{address.title}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        {address.street}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {address.city}
                        {address.state && `, ${address.state}`}
                        {address.postal_code && ` ${address.postal_code}`}
                        {address.country && `, ${address.country}`}
                      </p>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOpen(address)}
                              className="flex-1"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{t('editAddress')}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-title">{t('addressTitle')}</Label>
                                <Input
                                  id="edit-title"
                                  value={formData.title}
                                  onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-street">{t('street')}</Label>
                                <Input
                                  id="edit-street"
                                  value={formData.street}
                                  onChange={(e) =>
                                    setFormData({ ...formData, street: e.target.value })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-city">{t('city')}</Label>
                                  <Input
                                    id="edit-city"
                                    value={formData.city}
                                    onChange={(e) =>
                                      setFormData({ ...formData, city: e.target.value })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-state">{t('state')}</Label>
                                  <Input
                                    id="edit-state"
                                    value={formData.state}
                                    onChange={(e) =>
                                      setFormData({ ...formData, state: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-postal">{t('postalCode')}</Label>
                                  <Input
                                    id="edit-postal"
                                    value={formData.postal_code}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        postal_code: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-country">{t('country')}</Label>
                                  <Input
                                    id="edit-country"
                                    value={formData.country}
                                    onChange={(e) =>
                                      setFormData({ ...formData, country: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => handleEditAddress(address.id)}
                                disabled={updateAddress.isPending}
                              >
                                {updateAddress.isPending
                                  ? `${t('saving')}...`
                                  : t('update')}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAddress(address.id)}
                          disabled={deleteAddress.isPending}
                          className="flex-1"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                      {!address.is_default && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full mt-2"
                          onClick={() => handleSetDefault(address.id)}
                          disabled={setDefaultAddress.isPending}
                        >
                          {t('setAsDefault')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;
