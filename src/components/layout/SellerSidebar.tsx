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
    <div className="flex flex-col h-full">
      {/* Store Logo / Header */}
      <div className="px-4 py-6 border-b">
        <Link to="/seller" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded flex items-center justify-center text-white font-bold text-sm">GS</div>
          <div className="text-sm font-semibold text-gray-900">{t('seller_sidebar_store_logo') ?? 'GreatStack'}</div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-auto">
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
    </div>
  );
}

export default SellerSidebar;
