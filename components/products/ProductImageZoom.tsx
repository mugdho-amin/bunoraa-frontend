"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio: number;
  onZoomClick?: () => void;
};

const ZOOM = 2.5;

export function ProductImageZoom({ src, alt, priority = false, aspectRatio, onZoomClick }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 50, y: 50 });

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 992);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isHovering || isMobile) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setOrigin({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    },
    [isHovering, isMobile]
  );

  const handleActivate = React.useCallback(() => {
    if (isMobile) onZoomClick?.();
  }, [isMobile, onZoomClick]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-muted select-none overflow-hidden",
        isMobile ? "cursor-pointer" : "cursor-zoom-in"
      )}
      style={{ aspectRatio: `${aspectRatio}` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setOrigin({ x: 50, y: 50 });
      }}
      onMouseMove={isMobile ? undefined : handleMouseMove}
      onClick={!isMobile ? onZoomClick : handleActivate}
    >
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 800px"
          className={cn(
            "object-cover transition-transform duration-75 ease-out will-change-transform"
          )}
          style={
            !isMobile
              ? {
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                  transform: isHovering ? `scale(${ZOOM})` : "scale(1)",
                }
              : undefined
          }
          draggable={false}
        />
      </div>

      <div
        className={cn(
          "absolute bottom-3 left-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-foreground/50 border border-border/40 pointer-events-none transition-opacity duration-300",
          isMobile
            ? "opacity-100"
            : isHovering
              ? "opacity-0"
              : "opacity-100"
        )}
      >
        {isMobile ? "Tap to zoom" : "Hover to zoom"}
      </div>
    </div>
  );
}
