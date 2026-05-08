import fs from 'fs';
import path from 'path';
import { getStoredLocale } from './locale';
import { getServerLocaleHeaders } from './serverLocale';

/**
 * Server-side translation helper.
 * Reads the translation JSON files directly from the public directory.
 */
export async function getTranslations(lang?: string) {
  // If no lang provided, try to get it from headers (server components)
  if (!lang) {
    const headers = await getServerLocaleHeaders();
    lang = headers['X-User-Language'] || 'bn';
  }

  const localePath = path.join(process.cwd(), 'public', 'locales', lang, 'common.json');
  
  try {
    const fileContent = fs.readFileSync(localePath, 'utf8');
    const translations = JSON.parse(fileContent);
    
    return {
      t: (key: string) => {
        const keys = key.split('.');
        let value = translations;
        for (const k of keys) {
          value = value?.[k];
        }
        return typeof value === 'string' ? value : key;
      },
      language: lang
    };
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
    // Fallback to English if file doesn't exist
    if (lang !== 'en') return getTranslations('en');
    
    return {
      t: (key: string) => key,
      language: 'en'
    };
  }
}
