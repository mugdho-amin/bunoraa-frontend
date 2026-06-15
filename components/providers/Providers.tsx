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
import { ToastProvider } from "@/components/ui/ToastProvider";
import { LanguageSynchronizer } from "@/components/providers/LanguageSynchronizer";
import { initPerformanceMonitoring } from "@/lib/performance";

// Initialize performance monitoring
function PerformanceMonitoring() {
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);
  return null;
}

// Register service worker for offline support
function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    const swEnabled =
      process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === "true" ||
      process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === "1";

    const unregisterLegacyWorkers = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations
            .filter((registration) => registration.active?.scriptURL?.includes("/service-worker.js"))
            .map((registration) => registration.unregister())
        );
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith("bunoraa-"))
              .map((key) => caches.delete(key))
          );
        }
      } catch (error) {
        console.error("[SW] Failed to clean up legacy service worker:", error);
      }
    };

    if (!swEnabled) {
      unregisterLegacyWorkers();
      return;
    }

    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("[SW] Service Worker registered:", registration.scope);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("[SW] New version available");
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("[SW] Service Worker registration failed:", error);
      });
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
                    <ServiceWorkerRegistration />
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
