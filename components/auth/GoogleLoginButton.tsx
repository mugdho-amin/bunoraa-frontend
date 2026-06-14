"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
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
  const router = useRouter();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const promptFiredRef = useRef(false);
  const lastWidthRef = useRef(0);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<LoginResponseData>("/accounts/google/login/", {
        method: "POST",
        body: { credential: response.credential },
      });

      if (res.data?.access && res.data?.refresh) {
        setTokens(res.data.access, res.data.refresh, true);
        router.push(nextUrl);
        router.refresh();
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
  }, [nextUrl, router, onError]);

  const renderGoogleButton = useCallback((width: number) => {
    const google = window.google;
    if (!google?.accounts?.id || !containerRef.current || !clientId) return;

    const roundedWidth = Math.round(width);
    if (Math.abs(roundedWidth - lastWidthRef.current) < 10) return;
    lastWidthRef.current = roundedWidth;

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

      const isDark = theme === "dark" || theme === "moonlight" || 
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

      const buttonWidth = Math.min(400, Math.max(200, width));

      google.accounts.id.renderButton(containerRef.current, {
        theme: isDark ? "filled_black" : "outline",
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
  }, [handleCredentialResponse, clientId, theme]);

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
        className="min-h-[44px] w-full flex justify-center"
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

