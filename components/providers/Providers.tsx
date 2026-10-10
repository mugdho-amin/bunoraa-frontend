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

// Serwist registers /sw.js from the root layout. This cleanup retires the
// workers from the pre-Serwist implementation without touching Serwist.
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
                  worker?.scriptURL.includes("/service-worker.js") ||
                  worker?.scriptURL.includes("/notifications-sw.js")
              )
            )
            .map((registration) => registration.unregister())
        );

        const keys = await caches.keys();
        await Promise.all(
          keys.filter((key) => key.startsWith("bunoraa-")).map((key) => caches.delete(key))
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
