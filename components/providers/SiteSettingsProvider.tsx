"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { logger } from "@/lib/logger";

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
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (hasFailed) return;

    apiFetch<SiteSettings>("/pages/settings/")
      .then((response) => {
        setSettings(response.data);
        if (response.data?.media_url) {
          setMediaUrl(response.data.media_url);
        }
      })
      .catch((e) => {
        // Prevent repeated error reports in infinite loop
        setHasFailed(true);
        logger.error("SiteSettingsProvider fetch failed", e);
        setMediaUrl("/media/");
      });
  }, [hasFailed]);

  return (
    <SiteSettingsContext.Provider value={settings}>
      <MediaUrlContext.Provider value={mediaUrl}>
        {children}
      </MediaUrlContext.Provider>
    </SiteSettingsContext.Provider>
  );
}
