import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Store, Package, ShoppingCart } from 'lucide-react';

const AdminStores = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || !hasRole('admin'))) {
      navigate('/auth');
    }
  }, [user, hasRole, authLoading, navigate]);

  const { data: storesRaw, isLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stores')
        .select(`id, owner_id, slug, status, created_at, logo_url, translations:store_translations(name, description, language_code), application:seller_applications(status, username, email, contact_number, address)`);
      if (error) throw error;
      return data;
    },
    enabled: !!user && hasRole('admin'),
  });

  const stores = storesRaw || [];

  // store.status now uses 'activated' | 'deactivated'
  const allStores = stores;

  const handleChangeStatus = async (store: any, newStatus: string) => {
    try {
      // If activating and there's a pending application, use the approve RPC to also grant role
  if (newStatus === 'active') {
        const { data: appData } = await (supabase as any)
          .from('seller_applications')
          .select('id')
          .eq('store_id', store.id)
          .eq('status', 'pending')
          .limit(1);

        if (appData?.[0]?.id) {
          const res = await (supabase as any).rpc('approve_seller_application', { application_id: appData[0].id });
          if (res?.error) throw res.error;

          const { data: checkApp } = await (supabase as any)
            .from('seller_applications')
            .select('id, status, store_id')
            .eq('id', appData[0].id)
            .single();
          if (!checkApp || checkApp.status !== 'approved') {
            throw new Error('Approve RPC did not change application status (possible RLS or function error)');
          }

          toast({ title: 'Store Approved', description: 'Store status set to active.' });
          queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
          return;
        }
      }

      // Otherwise perform a direct store status update
      const { data, error } = await (supabase as any)
        .from('stores')
        .update({ status: newStatus, updated_at: new Date() })
        .eq('id', store.id)
        .select('id, status');
      if (error) throw error;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('No rows were updated when attempting to change the store status (possible RLS or permission issue)');
      }
      const updated = Array.isArray(data) ? data[0] : data;
      if (!updated || updated.status !== newStatus) {
        throw new Error('Store update succeeded but status did not change as expected');
      }

      toast({ title: 'Store Updated', description: `Store status set to ${newStatus}.` });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to change store status', variant: 'destructive' });
    }
  };

  const handleReject = async (store: any) => {
    try {
      const { data: appData } = await (supabase as any)
        .from('seller_applications')
        .select('id')
        .eq('store_id', store.id)
        .eq('status', 'pending')
        .limit(1);

      if (appData?.[0]?.id) {
        const res = await (supabase as any).rpc('reject_seller_application', { application_id: appData[0].id });
        if (res?.error) throw res.error;

        const { data: checkApp } = await (supabase as any)
          .from('seller_applications')
          .select('id, status, store_id')
          .eq('id', appData[0].id)
          .single();
        if (!checkApp || checkApp.status !== 'rejected') {
          throw new Error('Reject RPC did not change application status (possible RLS or function error)');
        }
      } else {
        const { data, error } = await (supabase as any)
          .from('stores')
    .update({ status: 'inactive', updated_at: new Date() })
          .eq('id', store.id)
          .select('id, status');
        if (error) throw error;
        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error('No rows were updated when attempting to reject the store (possible RLS or permission issue)');
        }
        const updated = Array.isArray(data) ? data[0] : data;
        if (!updated || updated.status !== 'rejected') {
          throw new Error('Store update succeeded but status is not rejected');
        }
      }

      toast({ title: 'Store Rejected', description: 'Store status set to inactive.' });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to reject store', variant: 'destructive' });
    }
  };

  if (authLoading || isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar (copy of AdminDashboard sidebar, highlight Stores) */}
        <aside className="w-64 border-r min-h-screen p-6">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary))] text-primary-foreground flex items-center justify-center text-xl font-bold mb-2">
              O
            </div>
            <p className="font-semibold">Osama Elshimy</p>
          </div>

          <nav className="space-y-2">
            <button onClick={() => navigate('/admin')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent rounded-lg">
              <Store className="h-5 w-5" />
              Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary rounded-lg border-l-4 border-primary">
              <Store className="h-5 w-5" />
              Stores
            </button>
            <button onClick={() => navigate('/admin/seller-applications')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent rounded-lg">
              <Package className="h-5 w-5" />
              Approve Store
            </button>
            <button onClick={() => navigate('/admin/coupons')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent rounded-lg">
              <ShoppingCart className="h-5 w-5" />
              Coupons
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-8">
            <a href="/" className="inline-flex items-center mb-4 text-2xl font-semibold">
              <span className="text-green-600">go</span><span className="text-black">cart</span>
            </a>
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-4xl font-bold">Stores Management</h1>
              <div className="flex items-center gap-4">
                <p className="text-sm">Hi, Osama</p>
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] text-primary-foreground flex items-center justify-center">
                  O
                </div>
              </div>
            </div>
            <hr className="border-t border-gray-200" />
          </div>

          {/* All stores (activated / deactivated) */}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-6">Live Stores</h2>
            <div className="space-y-4 w-3/5">
              {allStores.map((store: any) => {
                const en = store.translations?.find((t: any) => t.language_code === 'en');
                const ar = store.translations?.find((t: any) => t.language_code === 'ar');
                const logoUrl = store.logo_url || '/gocart-logo.svg';
                const appStatus = store.application?.[0]?.status || 'pending';
                
                return (
                  <div key={store.id} className="border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow p-6">
                    {/* Top Section: Logo + Store Name + Status Badge */}
                    <div className="flex items-start gap-4 mb-6">
                      {/* Left: Store Logo */}
                      <div className="flex-shrink-0">
                        <img
                          src={logoUrl}
                          alt="Store Logo"
                          className="h-16 w-16 rounded object-cover border"
                        />
                      </div>

                      {/* Center-Right: Store Name + Status Badge */}
                      <div className="flex-1 flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold mb-1">
                            {en?.name || ar?.name || store.slug}
                          </h3>
                          <p className="text-sm text-gray-500 mb-1">
                            {store.slug}
                          </p>
                          {store.application?.[0]?.username && (
                            <p className="text-xs text-gray-600">
                              👤 {store.application[0].username}
                            </p>
                          )}
                        </div>
                        {/* Status Badge (top right) */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                            appStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : appStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {appStatus}
                        </span>
                      </div>
                    </div>

                    {/* Store Description */}
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                      {en?.description || ar?.description || 'No description'}
                    </p>

                    {/* Spacing - Empty lines effect */}
                    <div className="mb-4"></div>

                    {/* Store Details Section (Address, Phone, Email) */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {/* Address */}
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600 min-w-max">📍</span>
                        <span>{store.application?.[0]?.address || 'No address provided'}</span>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600 min-w-max">📞</span>
                        <span>{store.application?.[0]?.contact_number || 'No phone provided'}</span>
                      </div>

                      {/* Email */}
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600 min-w-max">✉️</span>
                        <span>{store.application?.[0]?.email || 'No email provided'}</span>
                      </div>
                    </div>

                    {/* Spacing */}
                    <div className="mb-4"></div>

                    {/* Footer Section: Applied on + Toggle */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      {/* Left: Applied on Date + Owner Logo */}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Applied on {new Date(store.created_at).toLocaleDateString()} by</span>
                        <div className="w-6 h-6 rounded-full bg-[hsl(var(--primary))] text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {store.owner_id.substring(0, 1).toUpperCase()}
                        </div>
                      </div>

                      {/* Right: Active Status + Toggle Switch */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            store.status === 'active'
                              ? 'text-green-700'
                              : 'text-gray-600'
                          }`}
                        >
                          {store.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={store.status === 'active'}
                          onCheckedChange={(checked: boolean) =>
                            handleChangeStatus(store, checked ? 'active' : 'inactive')
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminStores;
