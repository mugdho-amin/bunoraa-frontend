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

const LENS_SIZE = 280;
const ZOOM = 4;

export function ProductImageZoom({ src, alt, priority = false, aspectRatio, onZoomClick }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lensRef = React.useRef<HTMLDivElement>(null);
  const dims = React.useRef({ cw: 0 });
  const [isMobile, setIsMobile] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [lensPos, setLensPos] = React.useState({ x: -999, y: -999 });
  const [bgOffset, setBgOffset] = React.useState({ x: 0, y: 0 });
  const [bgW, setBgW] = React.useState(0);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 992);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track container dimensions for background scaling
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sync = () =>
      requestAnimationFrame(() => {
        const cw = container.clientWidth;
        dims.current = { cw };
        setBgW(ZOOM * cw);
      });

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(container);
    return () => ro.disconnect();
  }, [src]);

  // Desktop: outer magnifier lens following cursor
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const half = LENS_SIZE / 2;

      const cx = Math.max(half, Math.min(rect.width - half, mx));
      const cy = Math.max(half, Math.min(rect.height - half, my));

      const { cw } = dims.current;
      if (!cw) return;

      // Map container position → zoomed background position
      const bgX = (cx / cw) * bgW - half;
      const bgY = (cy / cw) * bgW - half;

      setLensPos({ x: cx - half, y: cy - half });
      setBgOffset({ x: bgX, y: bgY });
    },
    [isMobile, bgW]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-muted select-none overflow-hidden",
        isMobile ? "cursor-pointer" : "cursor-none"
      )}
      style={{ aspectRatio: `${aspectRatio}` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setLensPos({ x: -999, y: -999 });
      }}
      onMouseMove={handleMouseMove}
      onClick={() => onZoomClick?.()}
    >
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
          draggable={false}
        />
      </div>

      {/* Desktop: outer magnifier lens */}
      {!isMobile && (
        <div
          ref={lensRef}
          className={cn(
            "absolute pointer-events-none z-10 overflow-hidden border border-white/40 shadow-2xl transition-opacity duration-150",
            isHovering ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            left: lensPos.x,
            top: lensPos.y,
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${bgW}px auto`,
            backgroundPosition: `-${bgOffset.x}px -${bgOffset.y}px`,
          }}
        />
      )}

      {/* Hint badge */}
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
