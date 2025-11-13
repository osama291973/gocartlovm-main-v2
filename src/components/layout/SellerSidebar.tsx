import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Store, Plus, Package, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function SellerSidebar() {
  const { t } = useLanguage();
  const location = useLocation();

  const menu = [
    { id: 'dashboard', href: '/seller', icon: Store, label: t('seller_nav.dashboard') ?? 'Dashboard' },
    { id: 'add', href: '/seller/add-product', icon: Plus, label: t('seller_nav.add_product') ?? 'Add Product' },
    { id: 'manage', href: '/seller/manage-product', icon: Package, label: t('seller_nav.manage_product') ?? 'Manage Product' },
    { id: 'orders', href: '/seller/orders', icon: ShoppingCart, label: t('seller_nav.orders') ?? 'Orders' },
  ];

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Sidebar Header with Brand */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            G
          </div>
          <span className="text-lg font-bold">
            <span className="text-gray-800">Great</span><span className="text-green-600">Stack</span>
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menu.map((m) => {
          const Icon = m.icon;
          const isActive = location.pathname === m.href;
          return (
            <Link
              key={m.id}
              to={m.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors font-medium text-sm ${
                isActive
                  ? 'bg-gray-100 text-gray-900 border-l-4 border-green-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              <span>{m.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default SellerSidebar;
