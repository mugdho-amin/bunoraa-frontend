"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { useEffect } from "react";

/**
 * Client-side component that synchronizes the HTML lang attribute
 * with the user's selected language preference
 */
export function LanguageSynchronizer() {
  const { locale } = useLocale();

  useEffect(() => {
    if (!locale.language) return;

    // Extract the language code (e.g., 'en', 'bn', 'hi')
    const languageCode = locale.language.split("-")[0].toLowerCase();

    // Update the HTML element's lang attribute
    if (document.documentElement.lang !== languageCode) {
      document.documentElement.lang = languageCode;
      document.documentElement.setAttribute("data-language", languageCode);
    }
  }, [locale.language]);

  return null;
}
