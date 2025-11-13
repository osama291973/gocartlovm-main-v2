import { X } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useLanguage();

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 flex items-center justify-between">
      <div className="flex-1 text-center">
        <span className="text-sm font-medium">
          {t('promo_banner.main_text')}
        </span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="ml-4 p-1 hover:bg-purple-700 rounded transition-colors"
        aria-label={t('common.close') || 'Close'}
      >
        <X size={20} />
      </button>
    </div>
  );
}