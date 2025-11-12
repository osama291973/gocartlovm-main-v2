import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCallTranslateRpc } from './useCallTranslateRpc';
import { useTranslationMutations } from './useTranslationMutations';

type TranslationInput = {
  language_code: string;
  name: string;
  description?: string | null;
};

type ProductInput = {
  store_id: string;
  category_id?: string | null;
  slug: string;
  name?: string; // used for default EN translation
  description?: string | null; // used for default EN translation
  price: number;
  original_price?: number | null;
  stock: number;
  image_url?: string | null;
  gallery_urls?: string[] | null;
  has_variants?: boolean;
  base_price?: number | null;
};

type UseCreateProductResult = {
  isLoading: boolean;
  error: string | null;
  createProduct: (
    product: ProductInput,
    translations: TranslationInput[]
  ) => Promise<{
    success: boolean;
    product_id?: string;
    error?: string;
  }>;
};

/**
 * Hook to create a product with translations.
 * 
 * Flow:
 * 1. Insert product row
 * 2. Upsert translations using the safe RPC (which includes ownership checks)
 * 
 * Usage:
 * const { createProduct, isLoading, error } = useCreateProduct();
 * 
 * const result = await createProduct(
 *   {
 *     store_id: '...',
 *     slug: 'my-product',
 *     price: 99.99,
 *     stock: 10,
 *   },
 *   [
 *     { language_code: 'en', name: 'Product Name', description: 'English description' },
 *     { language_code: 'ar', name: 'اسم المنتج', description: 'الوصف بالعربية' },
 *   ]
 * );
 */
export function useCreateProduct(): UseCreateProductResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { callTranslateRpc } = useCallTranslateRpc();
  const { upsertTranslations } = useTranslationMutations();

  const createProduct = useCallback(
    async (product: ProductInput, translations: TranslationInput[]) => {
      setIsLoading(true);
      setError(null);

      try {
        // Get current user
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) {
          throw new Error('Not authenticated');
        }

        // Step 1: Insert product
        const { data: createdProduct, error: insertError } = await supabase
          .from('products')
          .insert([
            {
              store_id: product.store_id,
              category_id: product.category_id || null,
              slug: product.slug,
              price: product.price,
              original_price: product.original_price || null,
              stock: product.stock,
              image_url: product.image_url || null,
              gallery_urls: product.gallery_urls || null,
              has_variants: product.has_variants ?? false,
              base_price: product.base_price || null,
            } as any,
          ] as any)
          .select('id')
          .single();

        if (insertError || !createdProduct) {
          throw new Error(`Failed to create product: ${insertError?.message}`);
        }

        const productId = (createdProduct as any).id;

        // Step 2: Upsert translations using the safe RPC
        // (The RPC will check ownership and skip any translations for products the user doesn't own)
        const translationPayloads = translations.map((t) => ({
          product_id: productId,
          language_code: t.language_code,
          name: t.name,
          description: t.description || null,
          is_machine_translated: false, // User-entered, so not machine translated
          translation_engine: null,
          translated_from_language: null,
        }));

        const rpcResult = await callTranslateRpc(translationPayloads);

        if (!rpcResult.success) {
          // Log warning but don't fail — product was created, translations might just have had an issue
          console.warn('Translation upsert warning:', rpcResult.error);
        }

        setIsLoading(false);
        return {
          success: true,
          product_id: productId,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        setIsLoading(false);
        return {
          success: false,
          error: errorMsg,
        };
      }
    },
    [callTranslateRpc]
  );

  return { createProduct, isLoading, error };
}

export default useCreateProduct;
