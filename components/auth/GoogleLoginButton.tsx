"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";

interface GoogleLoginButtonProps {
  nextUrl?: string;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleLoginButton({ 
  nextUrl = "/account/profile/",
  onError 
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined");
      return;
    }

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            setIsLoading(true);
            try {
              const res = await apiFetch<any>("/accounts/google/login/", {
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
            } catch (error: any) {
              console.error("Google login error:", error);
              onError?.(error.message || "Google sign-in failed. Please try again.");
            } finally {
              setIsLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            width: "buttonRef.current.offsetWidth",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
          });
        }
      }
    };

    // Script might still be loading
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeGoogle();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [nextUrl, router, onError]);

  return (
    <div className="w-full">
      <div 
        ref={buttonRef} 
        className={`w-full min-h-[44px] flex justify-center ${isLoading ? "opacity-50 pointer-events-none" : ""}`} 
      />
      {isLoading && (
        <p className="text-center text-xs text-foreground/50 mt-2 animate-pulse">
          Authenticating with Google...
        </p>
      )}
    </div>
  );
}
