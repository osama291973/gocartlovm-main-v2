// Utility wrapper for calling a local (or remote) LibreTranslate server.
// Usage:
//   import { translateText, translateBatch } from '@/utils/libreTranslate'
//   const t = await translateText('Hello', 'en', 'ar')

const DEFAULT_URL = 'http://localhost:5000';

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function translateText(
  text: string,
  source: string = 'auto',
  target: string = 'ar'
): Promise<string> {
  if (!text) return '';
  const base = (import.meta.env?.VITE_LIBRETRANSLATE_URL as string) || DEFAULT_URL;
  const url = `${base.replace(/\/$/, '')}/translate`;

  const body = {
    q: text,
    source: source || 'auto',
    target,
    format: 'text'
  } as any;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const data = await safeJson(res);
    const msg = data?.error || data?.message || `LibreTranslate returned ${res.status}`;
    throw new Error(msg);
  }

  const data = await safeJson(res);
  // LibreTranslate usually responds with { translatedText: '...' }
  if (!data) throw new Error('No JSON response from LibreTranslate');
  return data.translatedText || data.translated_text || data.result || data.translation || '';
}

export async function translateBatch(
  items: { text: string; source?: string; target?: string }[]
): Promise<string[]> {
  const results: string[] = [];
  for (const it of items) {
    try {
      const t = await translateText(it.text, it.source || 'auto', it.target || 'ar');
      results.push(t);
    } catch (e) {
      // push empty string on failure so caller can decide
      results.push('');
    }
  }
  return results;
}

export default { translateText, translateBatch };
