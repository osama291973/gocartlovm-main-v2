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
          {t('promo_banner.main_text') ?? 'Get 20% OFF on Your First Order!'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden md:inline-block bg-white/10 text-white text-xs py-1 px-3 rounded-full hover:bg-white/20 transition"
        >
          {t('promo_banner.claim_offer') ?? 'Claim Offer'}
        </button>

        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label={t('common.close') ?? 'Close'}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default PromoBanner;