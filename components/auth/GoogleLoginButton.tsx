"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { setTokens, upsertActiveAccountProfile } from "@/lib/auth";
import { useTheme } from "@/components/theme/ThemeProvider";

interface GoogleLoginButtonProps {
  nextUrl?: string;
  onError?: (message: string) => void;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface LoginResponseData {
  access: string;
  refresh: string;
  user?: {
    id?: string;
    email?: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
  };
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: string;
              text?: string;
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
            }
          ) => void;
          prompt: (notification?: (obj: { isDisplayMoment: () => boolean; isSkippedMoment: () => boolean; getSkippedReason: () => string }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export function GoogleLoginButton({ 
  nextUrl = "/account/profile/",
  onError 
}: GoogleLoginButtonProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefersDark, setPrefersDark] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const initializedRef = useRef(false);
  const promptFiredRef = useRef(false);
  const lastRenderRef = useRef<{
    width: number;
    theme: "outline" | "filled_black" | "filled_blue";
  } | null>(null);

  function decodeGoogleCredential(credential: string): Record<string, unknown> | null {
    try {
      const parts = credential.split(".");
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
      const decoded = window.atob(padded);
      const payload = JSON.parse(decoded);
      return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isDark =
    theme === "dark" ||
    theme === "moonlight" ||
    (theme === "system" && prefersDark);
  const googleButtonTheme = isDark ? "filled_black" : "outline";

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<LoginResponseData>("/accounts/google/login/", {
        method: "POST",
        body: { credential: response.credential },
        skipAuth: true,
        retryOnAuth: false,
      });

      if (res.data?.access && res.data?.refresh) {
        setTokens(res.data.access, res.data.refresh, true);
        const googlePayload = decodeGoogleCredential(response.credential);
        const googlePicture = typeof googlePayload?.picture === "string" ? googlePayload.picture : null;
        const avatar = res.data.user?.avatar || res.data.user?.avatar_url || googlePicture || null;
        if (res.data.user?.email) {
          upsertActiveAccountProfile({
            email: res.data.user.email,
            first_name: res.data.user.first_name ?? null,
            full_name: res.data.user.full_name ?? null,
            avatar,
          });
        }
        window.location.href = nextUrl;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: unknown) {
      console.error("Google login error:", error);
      const message = error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [nextUrl, onError]);

  const renderGoogleButton = useCallback((width: number) => {
    const google = window.google;
    if (!google?.accounts?.id || !containerRef.current || !clientId) return;

    const roundedWidth = Math.round(width);
    const lastRender = lastRenderRef.current;
    if (
      lastRender &&
      Math.abs(roundedWidth - lastRender.width) < 10 &&
      lastRender.theme === googleButtonTheme
    ) {
      return;
    }
    lastRenderRef.current = {
      width: roundedWidth,
      theme: googleButtonTheme,
    };

    try {
      if (!initializedRef.current) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        initializedRef.current = true;
      }

      const buttonWidth = Math.min(400, Math.max(200, width));
      containerRef.current.replaceChildren();

      google.accounts.id.renderButton(containerRef.current, {
        theme: googleButtonTheme,
        size: "large",
        width: `${buttonWidth}`,
        text: "continue_with",
        shape: "rectangular",
      });

      if (!promptFiredRef.current) {
        google.accounts.id.prompt();
        promptFiredRef.current = true;
      }
    } catch (err) {
      console.error("Failed to initialize Google login:", err);
      setError("Failed to initialize Google login.");
    }
  }, [handleCredentialResponse, clientId, googleButtonTheme]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncPreference = () => setPrefersDark(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      if (containerRef.current) {
        renderGoogleButton(containerRef.current.offsetWidth);
      }
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (containerRef.current) {
          renderGoogleButton(containerRef.current.offsetWidth);
        }
      };
      document.head.appendChild(script);
    }
  }, [renderGoogleButton, clientId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          renderGoogleButton(entry.contentRect.width);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [renderGoogleButton]);

  useEffect(() => {
    return () => {
      if (window.google?.accounts?.id) {
        try { window.google.accounts.id.cancel(); } catch {}
      }
    };
  }, []);

  if (!clientId) {
    return null;
  }

  return (
    <div className="w-full space-y-2">
      <div 
        ref={containerRef} 
        className="flex min-h-[44px] w-full justify-center overflow-hidden rounded-lg bg-card"
      />
      {isLoading && (
        <p className="text-center text-xs text-foreground/50 animate-pulse">
          Signing you in...
        </p>
      )}
      {error && (
        <p className="text-center text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

