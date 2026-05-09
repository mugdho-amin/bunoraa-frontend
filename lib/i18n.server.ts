import { getServerLocaleHeaders } from './serverLocale';
import { apiFetch } from './api';

/**
 * Server-side translation helper.
 * Fetches translations exclusively from the backend API.
 */
export async function getTranslations(lang?: string, namespaces: string[] = ['common']) {
  // If no lang provided, try to get it from headers (server components)
  if (!lang) {
    const headers = await getServerLocaleHeaders();
    lang = headers['X-User-Language'] || 'en';
  }

  let translations: Record<string, any> = {};

  try {
    // Fetch dynamic translations from backend
    const response = await apiFetch<Record<string, any>>(`/i18n/messages/`, {
      params: {
        lang,
        namespaces: namespaces.join(','),
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (response.success && response.data?.messages) {
      translations = response.data.messages;
    }
  } catch (error) {
    console.error(`Failed to fetch dynamic translations for ${lang}:`, error);
  }
  
  return {
    t: (key: string, params?: Record<string, string | number>) => {
      let resolved = key;

      // 1. Try exact match (raw text keys like "Shop")
      if (typeof translations[key] === 'string') {
        resolved = translations[key];
      } else {
        // 2. Try nested paths (legacy support if needed)
        const keys = key.split('.');
        let value = translations;
        for (const k of keys) {
          value = value?.[k];
        }
        
        if (typeof value === 'string') {
          resolved = value;
        } else if (typeof translations.common?.[key] === 'string') {
          // 3. Try common namespace fallback
          resolved = translations.common[key];
        } else if (key.includes('.')) {
          // 4. Ultimate Fallback: Pretty print technical keys
          const parts = key.split('.');
          const lastPart = parts[parts.length - 1];
          resolved = lastPart
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/^\w/, (c) => c.toUpperCase());
        }
      }

      // Interpolation: replace {key} with params[key]
      if (params) {
        return Object.entries(params).reduce(
          (message, [k, v]) => message.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
          resolved
        );
      }

      return resolved;
    },
    language: lang,
  };
}
