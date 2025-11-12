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
        
        // Include the anon API key header in addition to the Authorization bearer token.
        // Supabase REST endpoints expect the project anon key in the 'apikey' header when
        // calling from a browser via fetch.
        // Prefer explicit anon key, but fall back to the publishable key if present
        const envAnon = import.meta.env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : null);
        const envPublishable = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_PUBLISHABLE_KEY : null);
        const anonKey = envAnon || envPublishable || null;

        if (!authToken && !anonKey) {
          return {
            success: false,
            error: 'No authentication token or API key found in request',
            data: null,
            status: null,
          };
        }

        // Warn if we're using the publishable key as a fallback so it's obvious in logs
        if (!envAnon && envPublishable) {
          // eslint-disable-next-line no-console
          console.warn('VITE_SUPABASE_ANON_KEY is not set — using VITE_SUPABASE_PUBLISHABLE_KEY as a fallback for RPC requests. Consider renaming to VITE_SUPABASE_ANON_KEY to match expected env variable.');
        }

        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${anonKey}`,
            'apikey': anonKey || '',
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
