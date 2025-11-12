import { Link, useLocation } from 'react-router-dom';
import { Store, Plus, Package, ShoppingCart, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Store {
  id: string;
  name: string | null;
  slug: string;
  logo_url: string | null;
  owner_id: string;
}

interface SellerSidebarProps {
  stores: Store[];
  selectedStoreId: string | null;
  onSelectStore: (storeId: string) => void;
  isMobileOpen: boolean;
  onMobileToggle: (open: boolean) => void;
}

const SellerSidebar = ({
  stores,
  selectedStoreId,
  onSelectStore,
  isMobileOpen,
  onMobileToggle,
}: SellerSidebarProps) => {
  const { signOut } = useAuth();
  const location = useLocation();

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  const isActive = (path: string) => location.pathname.includes(path);

  const menuItems = [
    { label: 'Dashboard', href: '/seller/dashboard', icon: Store },
    { label: 'Add Product', href: '/seller/add-product', icon: Plus },
    { label: 'Manage Product', href: '/seller/manage-product', icon: Package },
    { label: 'Orders', href: '/seller/orders', icon: ShoppingCart },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => onMobileToggle(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 w-64 bg-white border-r min-h-screen flex flex-col
          transition-transform duration-200 transform
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo / Brand */}
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              <span className="text-primary">go</span>
              <span>cart</span>
              <span className="text-accent">.</span>
            </span>
          </Link>
        </div>

        {/* Store Selector */}
        <div className="p-4 border-b">
          {selectedStore && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {selectedStore.logo_url && (
                      <img
                        src={selectedStore.logo_url}
                        alt={selectedStore.slug}
                        className="h-6 w-6 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <span className="truncate text-sm font-medium">
                      {selectedStore.name || selectedStore.slug}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {stores.map(store => (
                  <DropdownMenuItem
                    key={store.id}
                    onClick={() => {
                      onSelectStore(store.id);
                      onMobileToggle(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {store.logo_url && (
                        <img
                          src={store.logo_url}
                          alt={store.slug}
                          className="h-5 w-5 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{store.name || store.slug}</div>
                        <div className="text-xs text-muted-foreground">{store.slug}</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/create-store">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Store
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => onMobileToggle(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${active
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-muted-foreground hover:bg-accent'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <Button
            onClick={() => {
              signOut();
              onMobileToggle(false);
            }}
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
};

export default SellerSidebar;
