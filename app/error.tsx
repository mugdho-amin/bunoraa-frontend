"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RefreshCw, Home, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("Global error caught:", {
        message: error.message,
        digest: error.digest,
        status: error.status,
      });
    }
  }, [error]);

  const isNetworkError =
    error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network");
  const isAuthError = error.status === 401 || error.status === 403;
  const isRateLimit = error.status === 429;

  let title = "Something went wrong";
  let description =
    "An unexpected error occurred. Our team has been notified. Please try again.";

  if (isNetworkError) {
    title = "Connection Issue";
    description =
      "We're having trouble connecting to our servers. Please check your internet connection and try again.";
  } else if (isAuthError) {
    title = "Access Denied";
    description =
      "You don't have permission to view this content or your session has expired.";
  } else if (isRateLimit) {
    title = "Too Many Requests";
    description =
      "You've been doing that a lot lately. Please wait a moment before trying again.";
  }

  return (
    <div className="relative flex min-h-[80dvh] items-center justify-center overflow-hidden bg-background p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center sm:gap-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 text-error-600 shadow-soft animate-scale-in dark:bg-error-900/40 dark:text-error-300 sm:h-20 sm:w-20">
          <AlertCircle size={36} aria-hidden="true" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
            {description}
          </p>
        </div>

        <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:gap-3">
          <Button onClick={reset} className="h-12 flex-1 gap-2 text-base shadow-glow" size="lg">
            <RefreshCw size={18} aria-hidden="true" />
            Try again
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="h-12 flex-1 gap-2 text-base"
            size="lg"
          >
            <Home size={18} aria-hidden="true" />
            Go Home
          </Button>
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className="flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}
