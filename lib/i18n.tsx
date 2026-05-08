"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredLocale } from './locale';

type Translations = Record<string, any>;

interface I18nContextType {
  language: string;
  t: (key: string) => string;
  changeLanguage: (lang: string) => void;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState('bn');
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredLocale();
    const initialLang = stored.language || 'bn';
    setLanguage(initialLang);
    loadTranslations(initialLang);
  }, []);

  const loadTranslations = async (lang: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/locales/${lang}/common.json`);
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return typeof value === 'string' ? value : key;
  };

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    loadTranslations(lang);
  };

  return (
    <I18nContext.Provider value={{ language, t, changeLanguage, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
