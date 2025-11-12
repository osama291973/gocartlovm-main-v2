import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TranslationInput = {
  product_id: string;
  language_code: string;
  name: string;
  description?: string | null;
  is_machine_translated?: boolean;
  translation_engine?: string | null;
  translated_from_language?: string | null;
};

type RpcResult = {
  updated_count: number;
  error_message: string | null;
};

/**
 * Hook to call the upsert_product_translations_safe RPC from the frontend.
 * This safely upserts translations with ownership checks built into the RPC.
 *
 * Usage:
 * const { callTranslateRpc } = useCallTranslateRpc();
 * 
 * const result = await callTranslateRpc([
 *   { product_id: '...', language_code: 'en', name: '...', description: '...' }
 * ]);
 */
export function useCallTranslateRpc() {
  const callTranslateRpc = useCallback(
    async (translations: TranslationInput[], callerId?: string) => {
      try {
        // Use fetch directly to call the RPC endpoint
        // This avoids TypeScript issues with the generated Supabase types
        const { data: session } = await supabase.auth.getSession();
        const authToken = session?.session?.access_token;

        // Get Supabase URL from environment (same as client initialization)
        const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 
          (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') ||
          'https://qlhpzsucftqcakiotgpc.supabase.co';
        const rpcUrl = `${supabaseUrl}/rest/v1/rpc/upsert_product_translations_safe`;
        
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            _translations: translations,
            _caller_id: callerId || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.message || data.error || 'RPC call failed',
            data: null,
            status: response.status,
          };
        }

        // data is an array with one row: [{ updated_count, error_message }]
        const result = (data as RpcResult[])?.[0];
        if (!result) {
          return {
            success: false,
            error: 'No response from RPC',
            data: null,
            status: response.status,
          };
        }

        if (result.error_message) {
          return {
            success: false,
            error: result.error_message,
            data: result,
            status: response.status,
          };
        }

        return {
          success: true,
          error: null,
          data: result,
          status: response.status,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          error: errorMsg,
          data: null,
          status: null,
        };
      }
    },
    []
  );

  return { callTranslateRpc };
}

export default useCallTranslateRpc;
