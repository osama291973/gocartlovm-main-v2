import { useCallback } from 'react';

/**
 * Hook to auto-translate text between English and Arabic
 * Uses Google Translate API (free tier) via a workaround
 * 
 * Usage:
 * const { translateText } = useAutoTranslate();
 * const arabicText = await translateText('Hello', 'en', 'ar');
 */
export function useAutoTranslate() {
  const translateText = useCallback(
    async (text: string, sourceLang: 'en' | 'ar', targetLang: 'en' | 'ar'): Promise<string | null> => {
      if (!text || text.trim() === '') return null;
      if (sourceLang === targetLang) return text;

      try {
        // Using Google Translate API via web endpoint (no API key required)
        // This is a free but unofficial method - works for small texts
        const encoded = encodeURIComponent(text);
        const url = `https://translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit`;
        
        // Alternative: Use a simpler method with Google's public API
        const translatorUrl = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sourceLang}|${targetLang}`;
        
        const response = await fetch(translatorUrl);
        const data = await response.json();
        
        if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
          return data.responseData.translatedText;
        }
        
        return null;
      } catch (error) {
        console.error('Translation error:', error);
        return null;
      }
    },
    []
  );

  return { translateText };
}

export default useAutoTranslate;
