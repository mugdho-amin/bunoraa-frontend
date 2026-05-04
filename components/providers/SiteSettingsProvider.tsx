"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";

const SiteSettingsContext = createContext<SiteSettings | null>(null);
const MediaUrlContext = createContext<string>("/media/");

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function useMediaUrl() {
  return useContext(MediaUrlContext);
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [mediaUrl, setMediaUrl] = useState("/media/");

  useEffect(() => {
    apiFetch<SiteSettings>("/pages/settings/")
      .then((response) => {
        setSettings(response.data);
        if (response.data?.media_url) {
          setMediaUrl(response.data.media_url);
        }
      })
      .catch(() => {
        // Fallback to default media URL
        setMediaUrl("/media/");
      });
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      <MediaUrlContext.Provider value={mediaUrl}>
        {children}
      </MediaUrlContext.Provider>
    </SiteSettingsContext.Provider>
  );
}
