"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
  logoSrc?: string;
  fallbackLogoSrc?: string;
  className?: string;
};

/**
 * A personalized, elegant spinner for Bunoraa.
 * Replaces the traditional progress bar with a sophisticated,
 * branding-aware motion experience.
 */
export function LoadingScreen({
  title,
  subtitle,
  fullScreen = false,
  logoSrc,
  fallbackLogoSrc,
  className,
}: LoadingScreenProps) {
  const [src, setSrc] = React.useState("/icon.png");

  const handleImageError = () => {
    if (src === "/icon.png" && fallbackLogoSrc) {
      setSrc(fallbackLogoSrc);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-background transition-colors duration-500",
        fullScreen ? "fixed inset-0 z-[100] h-screen w-screen" : "h-full min-h-[400px] w-full",
        className
      )}
    >
      {/* Soft Ambient Background Glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/3 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center">
        {/* The Personalized Spinner */}
        <div className="relative h-24 w-24">
          {/* Outer Ring - Constant Rotation */}
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/10" />
          
          {/* Animated Gradient Ring */}
          <svg className="h-full w-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#spinner-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="180 120"
              className="animate-[spinner-dash_2s_ease-in-out_infinite] opacity-80"
            />
          </svg>

          {/* Logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-background shadow-inner">
               <Image 
                src={logoSrc} 
                alt="B" 
                width={32}
                height={32}
                className="object-contain"
               />
            </div>
          </div>
        </div>

        {/* Textual Content */}
        <div className="mt-8 flex flex-col items-center gap-2">
          {title ? (
            <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
              {title}
            </h2>
          ) : null}
          
          {subtitle && (
            <p className="max-w-[240px] text-center text-sm text-foreground/40 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spinner-dash {
          0% {
            stroke-dasharray: 1, 300;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 150, 300;
            stroke-dashoffset: -70;
          }
          100% {
            stroke-dasharray: 150, 300;
            stroke-dashoffset: -280;
          }
        }
      `}</style>
    </div>
  );
}
