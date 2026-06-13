"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api";

type TranslationValue = string | TranslationBundle;
interface TranslationBundle {
  [key: string]: TranslationValue;
}
const DEFAULT_NAMESPACES = ["common"];
const TRANSLATION_CACHE_TTL_MS = 5 * 60 * 1000;
type CachedTranslationEntry = {
  expiresAt: number;
  messages: TranslationBundle;
};

// Cache for keys reported in the current session to avoid duplicates
const reportedKeys = new Set<string>();
let reportQueue: string[] = [];
let reportTimeout: ReturnType<typeof setTimeout> | null = null;
let refCount = 0;
const translationCache = new Map<string, CachedTranslationEntry>();
const translationRequestCache = new Map<string, Promise<TranslationBundle>>();

function flushReportQueue() {
  refCount = 0;
  if (reportQueue.length === 0) return;
  
  const keysToSend = [...reportQueue];
  reportQueue = [];
  reportTimeout = null;

  apiFetch(`/i18n/messages/report-missing/`, {
    method: "POST",
    body: { keys: keysToSend },
  }).catch((error) => {
    console.error("Failed to report missing keys:", error);
  });
}

function reportMissingKeySingleton(key: string) {
  if (reportedKeys.has(key)) return;
  
  reportedKeys.add(key);
  reportQueue.push(key);
  refCount++;

  if (reportTimeout) {
    clearTimeout(reportTimeout);
  }
  
  reportTimeout = setTimeout(flushReportQueue, 1000);
}

function getCachedTranslation(requestKey: string) {
  const cachedEntry = translationCache.get(requestKey);
  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    translationCache.delete(requestKey);
    return null;
  }

  return cachedEntry.messages;
}

function setCachedTranslation(requestKey: string, messages: TranslationBundle) {
  translationCache.set(requestKey, {
    expiresAt: Date.now() + TRANSLATION_CACHE_TTL_MS,
    messages,
  });
}

function isTranslationBundle(value: TranslationValue | undefined): value is TranslationBundle {
  return typeof value === "object" && value !== null;
}

async function fetchTranslationBundle(currentLang: string, namespaceKey: string) {
  const requestKey = `${currentLang}:${namespaceKey}`;
  const cachedTranslations = getCachedTranslation(requestKey);
  if (cachedTranslations) {
    return cachedTranslations;
  }

  const inFlightRequest = translationRequestCache.get(requestKey);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = (async () => {
    const response = await apiFetch<{ messages: TranslationBundle }>(`/i18n/messages/`, {
      params: {
        lang: currentLang,
        namespaces: namespaceKey,
      },
    });

    const messages = response.success && response.data?.messages ? response.data.messages : {};
    setCachedTranslation(requestKey, messages);
    return messages;
  })();

  translationRequestCache.set(requestKey, request);

  try {
    return await request;
  } finally {
    translationRequestCache.delete(requestKey);
  }
}

/**
 * Client-side translation hook with automatic missing key reporting.
 */
export function useTranslation(namespaces: string[] = DEFAULT_NAMESPACES, lang?: string) {
  const [translations, setTranslations] = useState<TranslationBundle>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentLang, setCurrentLang] = useState(lang || 'en');

  // Use the lang from prop or detected from browser/cookie
  useEffect(() => {
    if (lang) {
      setCurrentLang(lang);
      return;
    }
    const cookieLang = document.cookie.match(/language=([^;]+)/)?.[1];
    if (cookieLang) {
      setCurrentLang(cookieLang);
    }
  }, [lang]);
  const namespaceList = Array.from(
    new Set(
      (namespaces.length ? namespaces : DEFAULT_NAMESPACES)
        .map((namespace) => String(namespace || "").trim())
        .filter(Boolean)
    )
  );
  const namespaceKey = namespaceList.join(",");

  const fetchTranslations = useCallback(async () => {
    const requestKey = `${currentLang}:${namespaceKey}`;
    const cachedTranslations = getCachedTranslation(requestKey);
    if (cachedTranslations) {
      setTranslations(cachedTranslations);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const messages = await fetchTranslationBundle(currentLang, namespaceKey);
      setTranslations(messages);
    } catch (error) {
      console.error("Failed to fetch client-side translations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLang, namespaceKey]);

  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

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
        let value: TranslationValue | undefined = translations;
        for (const k of keys) {
          if (!isTranslationBundle(value)) {
            value = undefined;
            break;
          }
          value = value[k];
        }
        
        if (typeof value === "string") {
          resolved = value;
        } else if (isTranslationBundle(translations.common) && typeof translations.common[key] === "string") {
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
        reportMissingKeySingleton(key);
      }

      // Interpolation: replace {key} with params[key]
      if (params) {
        return Object.entries(params).reduce(
          (message, [k, v]) => {
            const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return message.replace(new RegExp(`\\{${escapedKey}\\}`, "g"), String(v));
          },
          resolved
        );
      }

      return resolved;
    },
    [translations, isLoading]
  );

  return { t, isLoading, language: currentLang };
}
