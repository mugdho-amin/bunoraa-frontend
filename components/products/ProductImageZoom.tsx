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

const ZOOM = 4;

export function ProductImageZoom({ src, alt, priority = false, onZoomClick }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const dims = React.useRef({ iw: 0, ih: 0 });
  const [isMobile, setIsMobile] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [shade, setShade] = React.useState({ x: 0, y: 0, w: 0, h: 0 });
  const [mag, setMag] = React.useState({
    x: -9999, y: -9999, w: 0, h: 0, bgX: 0, bgY: 0, bgW: 0,
  });

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 992);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track actual img rendered dimensions for magnifier mapping
  React.useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const sync = () =>
      requestAnimationFrame(() => {
        const ir = img.getBoundingClientRect();
        if (ir.width > 0 && ir.height > 0) {
          dims.current = { iw: ir.width, ih: ir.height };
        }
      });
    if (img.complete && img.naturalWidth > 0) sync();
    else img.addEventListener("load", sync, { once: true });
    const ro = new ResizeObserver(sync);
    ro.observe(img);
    return () => ro.disconnect();
  }, [src]);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile) return;
      const img = imgRef.current;
      if (!img) return;
      const ir = img.getBoundingClientRect();
      const { iw, ih } = dims.current;
      if (!iw || !ih) return;

      const mx = e.clientX - ir.left;
      const my = e.clientY - ir.top;

      const sw = iw / ZOOM;
      const sh = ih / ZOOM;

      const sx = Math.max(0, Math.min(iw - sw, mx - sw / 2));
      const sy = Math.max(0, Math.min(ih - sh, my - sh / 2));

      setShade({ x: sx, y: sy, w: sw, h: sh });

      const bgW = ZOOM * iw;
      const bgX = (sx / iw) * bgW;
      const bgY = (sy / ih) * bgW;

      setMag({
        x: ir.right + 15,
        y: ir.top,
        w: iw,
        h: ih,
        bgX,
        bgY,
        bgW,
      });
    },
    [isMobile]
  );

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full bg-muted select-none",
          isMobile ? "cursor-pointer" : "cursor-crosshair"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setShade({ x: 0, y: 0, w: 0, h: 0 });
          setMag({ x: -9999, y: -9999, w: 0, h: 0, bgX: 0, bgY: 0, bgW: 0 });
        }}
        onMouseMove={handleMouseMove}
        onClick={() => onZoomClick?.()}
      >
        <Image
          ref={imgRef}
          src={src}
          alt={alt}
          width={800}
          height={1000}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 800px"
          className="w-full h-auto"
          draggable={false}
        />

        {!isMobile && isHovering && (
          <div
            className="absolute pointer-events-none border border-white/60 bg-white/20"
            style={{
              left: shade.x,
              top: shade.y,
              width: shade.w,
              height: shade.h,
            }}
          />
        )}

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

      {!isMobile && isHovering && mag.w > 0 && (
        <div
          className="fixed pointer-events-none z-50 overflow-hidden border border-border shadow-2xl bg-white"
          style={{
            left: mag.x,
            top: mag.y,
            width: mag.w,
            height: mag.h,
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${mag.bgW}px auto`,
            backgroundPosition: `-${mag.bgX}px -${mag.bgY}px`,
          }}
        />
      )}
    </>
  );
}
