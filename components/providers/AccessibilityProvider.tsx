"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { preferencesKey } from "@/components/account/usePreferences";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { UserPreferences } from "@/lib/types";

const ACCESSIBILITY_STORAGE_KEY = "bunoraa-accessibility";

type AccessibilityPreferences = Pick<
  UserPreferences,
  "reduce_motion" | "high_contrast" | "large_text"
>;

function readCachedAccessibility(): AccessibilityPreferences | null {
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AccessibilityPreferences;
  } catch {
    return null;
  }
}

function persistAccessibility(preferences: AccessibilityPreferences) {
  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage errors.
  }
}

function applyAccessibilityPreferences(
  root: HTMLElement,
  preferences: AccessibilityPreferences | null | undefined
) {
  const reduceMotion = preferences?.reduce_motion ?? false;
  const highContrast = preferences?.high_contrast ?? false;
  const largeText = preferences?.large_text ?? false;

  root.setAttribute("data-reduce-motion", reduceMotion ? "true" : "false");
  root.setAttribute("data-high-contrast", highContrast ? "true" : "false");
  root.setAttribute("data-large-text", largeText ? "true" : "false");
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { hasToken } = useAuthContext();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const root = document.documentElement;

    const syncAccessibility = () => {
      const cached = readCachedAccessibility();
      const prefs = queryClient.getQueryData<UserPreferences>(preferencesKey);
      const resolvedPreferences: AccessibilityPreferences = {
        reduce_motion: prefs?.reduce_motion ?? cached?.reduce_motion ?? false,
        high_contrast: prefs?.high_contrast ?? cached?.high_contrast ?? false,
        large_text: prefs?.large_text ?? cached?.large_text ?? false,
      };

      applyAccessibilityPreferences(root, resolvedPreferences);

      if (prefs) {
        persistAccessibility(resolvedPreferences);
      }
    };

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const queryKey = event?.query?.queryKey;
      if (
        Array.isArray(queryKey) &&
        queryKey.length === preferencesKey.length &&
        queryKey.every((value, index) => value === preferencesKey[index])
      ) {
        syncAccessibility();
      }
    });

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === ACCESSIBILITY_STORAGE_KEY) {
        syncAccessibility();
      }
    };

    syncAccessibility();
    window.addEventListener("storage", handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
      root.removeAttribute("data-reduce-motion");
      root.removeAttribute("data-high-contrast");
      root.removeAttribute("data-large-text");
    };
  }, [hasToken, queryClient]);

  return <>{children}</>;
}
