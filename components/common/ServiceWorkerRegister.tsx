"use client";

import * as React from "react";

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return;

    // The legacy /service-worker.js was superseded by the Serwist worker at
    // /sw.js (registered via <SerwistProvider> in the root layout). Only
    // register the legacy worker when explicitly opted in, so we never request
    // a file that is not part of the deployment.
    const legacySwEnabled =
      process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === "true" ||
      process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === "1";
    if (!legacySwEnabled) return;

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js", {
          scope: "/",
        });
        if (!cancelled) {
          if (registration.installing) {
            console.debug("[SW] Installing");
          } else if (registration.waiting) {
            console.debug("[SW] Waiting");
          } else if (registration.active) {
            console.debug("[SW] Active");
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.debug("[SW] Registration failed:", error);
        }
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
