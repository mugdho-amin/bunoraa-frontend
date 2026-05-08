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
  
  // Classify error for better user guidance
  const isNetworkError = error.message?.toLowerCase().includes("fetch") || 
                         error.message?.toLowerCase().includes("network");
  const isAuthError = error.status === 401 || error.status === 403;
  const isRateLimit = error.status === 429;
  
  let title = "Something went wrong";
  let description = error.message || "An unexpected error occurred while processing your request.";
  
  if (isNetworkError) {
    title = "Connection Issue";
    description = "We're having trouble connecting to our servers. Please check your internet connection and try again.";
  } else if (isAuthError) {
    title = "Access Denied";
    description = "You don't have permission to view this content or your session has expired.";
  } else if (isRateLimit) {
    title = "Too Many Requests";
    description = "You've been doing that a lot lately. Please wait a moment before trying again.";
  }

  return (
    <div className="min-h-[80vh] bg-background flex items-center justify-center p-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive animate-in zoom-in duration-300">
          <AlertCircle size={40} />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-muted-foreground/50 mt-4">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row w-full gap-3 mt-4">
          <Button 
            onClick={reset} 
            className="flex-1 gap-2 h-12 text-base shadow-lg shadow-primary/10"
          >
            <RefreshCw size={18} className="animate-spin-once" />
            Try again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push("/")}
            className="flex-1 gap-2 h-12 text-base"
          >
            <Home size={18} />
            Go Home
          </Button>
        </div>
        
        <button 
          onClick={() => router.back()}
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ChevronLeft size={16} />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}
