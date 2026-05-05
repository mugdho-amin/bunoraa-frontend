"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

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
          prompt: () => void;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const renderGoogleButton = useCallback((width: number) => {
    const google = window.google;
    if (!google?.accounts?.id || !googleButtonRef.current) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    try {
      // Clear previous button content
      googleButtonRef.current.innerHTML = "";

      // Initialize
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: GoogleCredentialResponse) => {
          setIsLoading(true);
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
            onError?.(message);
          } finally {
            setIsLoading(false);
          }
        },
      });

      // Render the real Google button inside the hidden container
      // width must be a string representing pixels
      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: `${Math.floor(width)}`,
        text: "signin_with",
      });
    } catch (err) {
      console.error("Failed to initialize Google button:", err);
    }
  }, [nextUrl, router, onError]);

  useEffect(() => {
    const checkScript = () => {
      if (window.google?.accounts?.id) {
        setIsScriptReady(true);
        return true;
      }
      return false;
    };

    if (!checkScript()) {
      const interval = setInterval(() => {
        if (checkScript()) {
          setIsScriptReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (!isScriptReady || !containerRef.current) return;

    // Use ResizeObserver to ensure the invisible Google button 
    // always matches the size of our theme-friendly button
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        renderGoogleButton(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isScriptReady, renderGoogleButton]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative w-full group">
      {/* 
        The Visible Button: 100% Theme Friendly.
        Uses your site's variables, fonts, and Tailwind classes.
        'pointer-events-none' ensures clicks pass through to the Google button below.
      */}
      <Button
        type="button"
        variant="secondary"
        className="w-full flex items-center justify-center gap-3 h-12 border border-border bg-card group-hover:bg-muted text-foreground transition-all duration-200 pointer-events-none"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span className="font-medium">Continue with Google</span>
      </Button>

      {/* 
        The Functional Button: 100% Invisible Overlay.
        This is the REAL Google button. It is absolute-positioned and transparent.
        Because it's an iframe, we can't style it, so we hide it and let the user click through.
      */}
      <div 
        ref={googleButtonRef} 
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        aria-hidden="true"
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl z-20">
          <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}







