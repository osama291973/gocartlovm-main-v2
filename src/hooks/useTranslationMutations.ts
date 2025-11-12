import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TranslationInput = {
  product_id: string;
  language_code: string;
  name: string;
  description?: string | null;
  is_machine_translated?: boolean;
};

/**
 * Hook-style wrapper that provides helpers to upsert product translations.
 *
 * Usage:
 * const { upsertTranslation, upsertTranslations } = useTranslationMutations();
 */
export function useTranslationMutations() {
  const upsertTranslation = useCallback(async (t: TranslationInput) => {
    const payload = {
      product_id: t.product_id,
      language_code: t.language_code,
      name: t.name,
      description: t.description ?? null,
      is_machine_translated: t.is_machine_translated ?? false,
    };

    const { data, error, status } = await supabase
      .from('product_translations')
      // cast to any to match generated types and avoid TypeScript mismatch
      .upsert([payload] as any, { onConflict: 'product_id,language_code' })
      .select();

    return { data, error, status };
  }, []);

  const upsertTranslations = useCallback(async (translations: TranslationInput[]) => {
    const payloads = translations.map((t) => ({
      product_id: t.product_id,
      language_code: t.language_code,
      name: t.name,
      description: t.description ?? null,
      is_machine_translated: t.is_machine_translated ?? false,
    }));

    const { data, error, status } = await supabase
      .from('product_translations')
      // cast to any to match generated types and avoid TypeScript mismatch
      .upsert(payloads as any, { onConflict: 'product_id,language_code' })
      .select();

    return { data, error, status };
  }, []);

  return { upsertTranslation, upsertTranslations };
}

export default useTranslationMutations;
