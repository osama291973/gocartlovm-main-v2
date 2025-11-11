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
        .select(`id, owner_id, slug, status, created_at, logo_url, translations:store_translations(name, description, language_code), application:seller_applications(status)`);
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
  if (newStatus === 'activated') {
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

          toast({ title: 'Store Approved', description: 'Store status set to activated.' });
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
    .update({ status: 'deactivated', updated_at: new Date() })
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

      toast({ title: 'Store Rejected', description: 'Store status set to deactivated.' });
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
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2">
                <img src="/gocart-logo.svg" alt="GoCart Logo" className="h-10 w-10" />
                <span className="text-2xl font-bold text-primary">gocart<span className="text-green-600">.</span></span>
              </a>
              <h1 className="text-4xl font-bold ml-6">Stores Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm">Hi, Osama</p>
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] text-primary-foreground flex items-center justify-center">
                O
              </div>
            </div>
          </div>

          {/* All stores (activated / deactivated) */}

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Live Stores</h2>
            <div className="space-y-8">
              {allStores.map((store: any) => {
                const en = store.translations?.find((t: any) => t.language_code === 'en');
                const ar = store.translations?.find((t: any) => t.language_code === 'ar');
                const logoUrl = store.logo_url || '/gocart-logo.svg';
                const appStatus = store.application?.[0]?.status || 'pending';
                // Determine direction based on language (default: left-to-right)
                const lang = (en?.name || ar?.name) === ar?.name ? 'ar' : 'en';
                const direction = lang === 'ar' ? 'rtl' : 'ltr';
                return (
                  <Card key={store.id} className={`p-8 w-full max-w-6xl mx-auto flex flex-col gap-4`} style={{ direction }}>
                    <div className={`flex items-center gap-6 mb-2 ${direction === 'rtl' ? 'justify-end' : ''}`}>
                      <img src={logoUrl} alt="Store Logo" className="h-20 w-20 rounded-full border" />
                      <div className="flex flex-col flex-1">
                        <h3 className="text-2xl font-bold mb-1">{en?.name || ar?.name || store.slug}</h3>
                        <p className="text-sm text-muted-foreground mb-1">Owner: {store.owner_id}</p>
                        <p className="text-sm mb-1">{en?.description || ar?.description || 'No description'}</p>
                        <p className="text-xs text-muted-foreground">Created: {new Date(store.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${appStatus === 'approved' ? 'bg-green-100 text-green-800' : appStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>{appStatus}</span>
                    </div>
                    {/* Toggle at bottom, full width */}
                    <div className={`flex items-center gap-3 mt-6 ${direction === 'rtl' ? 'justify-start' : 'justify-end'}`}>
                      <Switch
                        checked={store.status === 'activated'}
                        onCheckedChange={(checked: boolean) => handleChangeStatus(store, checked ? 'activated' : 'deactivated')}
                      />
                      <span className={`text-sm px-3 py-1 rounded-full ${store.status === 'activated' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{store.status === 'activated' ? 'Active' : 'Inactive'}</span>
                    </div>
                  </Card>
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
