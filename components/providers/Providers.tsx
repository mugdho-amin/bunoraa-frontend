"use client";

import * as React from "react";
import { useEffect } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";
import { AccessibilityProvider } from "@/components/providers/AccessibilityProvider";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { MaintenanceOverlay } from "@/components/layout/MaintenanceOverlay";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { LanguageSynchronizer } from "@/components/providers/LanguageSynchronizer";
import { initPerformanceMonitoring } from "@/lib/performance";

function PerformanceMonitoring() {
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);
  return null;
}

// The storefront no longer registers a service worker. Retire every worker
// installed by earlier releases, including the Serwist `/sw.js` worker, so
// returning visitors cannot be served stale precached chunks.
const LEGACY_WORKER_PATHS = ["/sw.js", "/service-worker.js", "/notifications-sw.js"];
const LEGACY_CACHE_PREFIXES = ["bunoraa-", "serwist-", "workbox-"];
const LEGACY_CACHE_NAMES = new Set([
  "apis",
  "next-static-js-assets",
  "static-js-assets",
  "google-fonts-webfonts",
  "google-fonts-stylesheets",
  "static-font-assets",
  "static-image-assets",
  "next-image",
  "static-audio-assets",
  "static-video-assets",
  "static-style-assets",
]);

function LegacyServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations
            .filter((registration) =>
              [registration.active, registration.installing, registration.waiting].some(
                (worker) =>
                  worker?.scriptURL &&
                  LEGACY_WORKER_PATHS.some((path) => worker.scriptURL.endsWith(path))
              )
            )
            .map((registration) => registration.unregister())
        );

        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter(
              (key) =>
                LEGACY_CACHE_NAMES.has(key) ||
                LEGACY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))
            )
            .map((key) => caches.delete(key))
        );
      } catch (error) {
        console.error("[SW] Failed to clean up legacy service worker:", error);
      }
    })();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SiteSettingsProvider>
      <ThemeProvider>
        <ToastProvider>
          <QueryProvider>
            <AuthProvider>
              <AccessibilityProvider>
                <LocaleProvider>
                  <LanguageSynchronizer />
                  <WebSocketProvider>
                    <PerformanceMonitoring />
                    <LegacyServiceWorkerCleanup />
                    <MaintenanceOverlay />
                    {children}
                  </WebSocketProvider>
                </LocaleProvider>
              </AccessibilityProvider>
            </AuthProvider>
          </QueryProvider>
        </ToastProvider>
      </ThemeProvider>
    </SiteSettingsProvider>
  );
}
