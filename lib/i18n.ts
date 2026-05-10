"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api";

type TranslationBundle = Record<string, any>;

// Cache for keys reported in the current session to avoid duplicates
const reportedKeys = new Set<string>();
let reportQueue: string[] = [];
let reportTimeout: NodeJS.Timeout | null = null;

const flushReportQueue = async () => {
  if (reportQueue.length === 0) return;
  
  const keysToSend = [...reportQueue];
  reportQueue = [];
  reportTimeout = null;

  try {
    await apiFetch(`/i18n/messages/report-missing/`, {
      method: "POST",
      body: { keys: keysToSend },
    });
  } catch (error) {
    console.error("Failed to report missing keys:", error);
    // If it failed (e.g. 429), we don't retry immediately to avoid further load
  }
};

/**
 * Client-side translation hook with automatic missing key reporting.
 */
export function useTranslation(namespaces: string[] = ["common"], lang?: string) {
  const [translations, setTranslations] = useState<TranslationBundle>({});
  const [isLoading, setIsLoading] = useState(true);

  // Use the lang from prop or detected from browser/cookie
  const currentLang = lang || (typeof document !== 'undefined' ? 
    (document.cookie.match(/language=([^;]+)/)?.[1] || 'en') : 'en');

  const fetchTranslations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch<{ messages: TranslationBundle }>(`/i18n/messages/`, {
        params: {
          lang: currentLang,
          namespaces: namespaces.join(","),
        },
      });

      if (response.success && response.data?.messages) {
        setTranslations(response.data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch client-side translations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLang, namespaces]);

  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  const reportMissingKey = useCallback((key: string) => {
    if (reportedKeys.has(key)) return;
    
    reportedKeys.add(key);
    reportQueue.push(key);

    if (reportTimeout) {
      clearTimeout(reportTimeout);
    }
    
    reportTimeout = setTimeout(flushReportQueue, 1000);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let resolved = key;
      let isMissing = false;

      // 1. Try exact match (raw text keys like "Shop")
      if (typeof translations[key] === "string") {
        resolved = translations[key];
      } else {
        // 2. Try nested paths (legacy support)
        const keys = key.split(".");
        let value = translations;
        for (const k of keys) {
          value = value?.[k];
        }
        
        if (typeof value === "string") {
          resolved = value;
        } else if (typeof translations.common?.[key] === "string") {
          // 3. Try common namespace fallback
          resolved = translations.common[key];
        } else {
          isMissing = true;
          // 4. Ultimate Fallback: Pretty print technical keys
          if (key.includes('.')) {
            const parts = key.split('.');
            const lastPart = parts[parts.length - 1];
            resolved = lastPart
              .replace(/_/g, ' ')
              .replace(/([A-Z])/g, ' $1')
              .trim()
              .replace(/^\w/, (c) => c.toUpperCase());
          }
        }
      }

      // If we're on the client and the key is missing, report it
      if (typeof window !== 'undefined' && !isLoading && isMissing) {
        reportMissingKey(key);
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
    [translations, isLoading, reportMissingKey]
  );

  return { t, isLoading, language: currentLang };
}
