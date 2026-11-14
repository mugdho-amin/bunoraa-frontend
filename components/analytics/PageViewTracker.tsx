"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { apiFetch } from "@/lib/api";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    const pagePath = pathname || "/";
    const queryString = searchParams?.toString() || "";
    const pageKey = `${pagePath}?${queryString}`;

    if (lastTrackedRef.current === pageKey) {
      return;
    }
    lastTrackedRef.current = pageKey;

    if (typeof window === "undefined") {
      return;
    }

    let pageViewId: string | null = null;
    let activeMilliseconds = 0;
    let lastTick = performance.now();
    let lastSentSeconds = 0;
    let disposed = false;
    let wasVisible = document.visibilityState === "visible";

    const accumulateVisibleTime = () => {
      const now = performance.now();
      if (wasVisible) {
        activeMilliseconds += Math.max(now - lastTick, 0);
      }
      lastTick = now;
      wasVisible = document.visibilityState === "visible";
    };

    const sendTime = () => {
      accumulateVisibleTime();
      const seconds = Math.floor(activeMilliseconds / 1000);
      if (!pageViewId || seconds <= lastSentSeconds) return;
      lastSentSeconds = seconds;
      void apiFetch("/analytics/track/", {
        method: "POST",
        skipAuth: true,
        suppressError: true,
        body: { event_type: "page_time", page_view_id: pageViewId, metadata: { time_on_page: seconds } },
      });
    };

    const track = async () => {
      const response = await apiFetch<{ page_view_id?: string }>("/analytics/track/", {
        method: "POST",
        skipAuth: true,
        suppressError: true,
        body: {
          event_type: "page_view",
          metadata: {
            page_path: pagePath,
            query_string: queryString,
            referrer: typeof document !== "undefined" ? document.referrer : "",
          },
        },
      });
      if (!disposed && response.success && response.data?.page_view_id) {
        pageViewId = response.data.page_view_id;
        sendTime();
      }
    };

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const intervalId = window.setInterval(sendTime, 10000);
    document.addEventListener("visibilitychange", accumulateVisibleTime);
    const idleApi = globalThis as typeof globalThis & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof idleApi.requestIdleCallback === "function") {
      idleId = idleApi.requestIdleCallback(track, { timeout: 3000 });
    } else {
      timeoutId = setTimeout(track, 1800);
    }

    return () => {
      disposed = true;
      sendTime();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", accumulateVisibleTime);
      if (idleId !== null && typeof idleApi.cancelIdleCallback === "function") {
        idleApi.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname, searchParams]);

  return null;
}
