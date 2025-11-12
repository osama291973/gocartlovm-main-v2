import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SellerSidebar from '@/components/layout/SellerSidebar';

const SellerLayout = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !hasRole('seller'))) {
      navigate('/auth');
    }
  }, [user, hasRole, authLoading, navigate]);

  // Fetch seller's stores
  const { data: stores = [] } = useQuery({
    queryKey: ['seller-stores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let { data: dataStores, error } = await supabase
        .from('stores')
        .select('id, name, slug, logo_url, owner_id')
        .eq('owner_id', user.id);

      if (error) throw error;

      if (!dataStores || dataStores.length === 0) {
        const { data: apps, error: appsErr } = await supabase
          .from('seller_applications')
          .select('store_id')
          .eq('user_id', user.id);

        if (appsErr) throw appsErr;

        const storeIds = (apps || []).map((a: any) => a.store_id).filter(Boolean);

        if (storeIds.length > 0) {
          const { data: storesByApp, error: storesErr } = await supabase
            .from('stores')
            .select('id, name, slug, logo_url, owner_id')
            .in('id', storeIds);

          if (storesErr) throw storesErr;

          dataStores = storesByApp || [];
        }
      }

      return dataStores || [];
    },
    enabled: !!user,
  });

  // Set first store as default
  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <SellerSidebar 
        stores={stores}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={setMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b h-16 px-6 flex items-center justify-between md:justify-end">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          <div className="flex items-center gap-4">
            {selectedStore && (
              <div className="flex items-center gap-3">
                {selectedStore.logo_url && (
                  <img
                    src={selectedStore.logo_url}
                    alt={selectedStore.slug}
                    className="h-8 w-8 rounded object-cover"
                  />
                )}
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold">{selectedStore.name || selectedStore.slug}</div>
                  <div className="text-xs text-muted-foreground">Store</div>
                </div>
              </div>
            )}

            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {selectedStore ? (
            <Outlet context={{ selectedStore, stores }} />
          ) : (
            <div className="p-8">
              <p className="text-muted-foreground">Select a store to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerLayout;
