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

const ZOOM = 5;

function getVisibleImageRect(
  cw: number,
  ch: number,
  naturalAR: number,
): { x: number; y: number; w: number; h: number } {
  const containerAR = cw / ch;
  if (containerAR > naturalAR) {
    const h = ch;
    const w = h * naturalAR;
    return { x: (cw - w) / 2, y: 0, w, h };
  }
  const w = cw;
  const h = w / naturalAR;
  return { x: 0, y: (ch - h) / 2, w, h };
}

export function ProductImageZoom({ src, alt, priority = false, aspectRatio, onZoomClick }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [shade, setShade] = React.useState({ x: 0, y: 0, w: 0, h: 0 });
  const [mag, setMag] = React.useState({
    x: -9999, y: -9999, w: 0, h: 0, bgX: 0, bgY: 0, bgW: 0, bgH: 0,
  });

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 992);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile) return;
      const container = containerRef.current;
      if (!container) return;

      const cr = container.getBoundingClientRect();
      const cw = cr.width;
      const ch = cr.height;
      if (!cw || !ch) return;

      const vi = getVisibleImageRect(cw, ch, aspectRatio);
      const mx = e.clientX - (cr.left + vi.x);
      const my = e.clientY - (cr.top + vi.y);

      const sw = vi.w / ZOOM;
      const sh = vi.h / ZOOM;

      const sx = Math.max(0, Math.min(vi.w - sw, mx - sw / 2));
      const sy = Math.max(0, Math.min(vi.h - sh, my - sh / 2));

      setShade({ x: vi.x + sx, y: vi.y + sy, w: sw, h: sh });

      const gap = 20;
      const magW = Math.min(vi.w, 420);
      const magH = Math.min(vi.h, 420);
      const magX = cr.left + vi.x + vi.w + gap;
      const magRight = magX + magW;
      const clampedX =
        magRight > window.innerWidth
          ? Math.max(10, cr.left + vi.x - gap - magW)
          : magX;
      const magY = Math.max(
        10,
        Math.min(e.clientY - magH / 2, window.innerHeight - magH - 10)
      );

      const bgW = ZOOM * vi.w;
      const bgH = ZOOM * vi.h;
      setMag({
        x: clampedX,
        y: magY,
        w: magW,
        h: magH,
        bgX: (sx / vi.w) * bgW,
        bgY: (sy / vi.h) * bgH,
        bgW,
        bgH,
      });
    },
    [isMobile, aspectRatio],
  );

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full select-none overflow-hidden",
          isMobile ? "cursor-pointer" : "cursor-crosshair"
        )}
        style={{ aspectRatio: `${aspectRatio}` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setShade({ x: 0, y: 0, w: 0, h: 0 });
          setMag({ x: -9999, y: -9999, w: 0, h: 0, bgX: 0, bgY: 0, bgW: 0, bgH: 0 });
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
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            className="object-contain"
            draggable={false}
          />
        </div>

        {!isMobile && isHovering && (
          <div
            className="absolute pointer-events-none border border-primary/60 bg-primary/10 backdrop-blur-[1px] transition-all duration-75"
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
            "absolute bottom-3 left-3 bg-background/90 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-foreground/80 border border-border/50 pointer-events-none transition-opacity duration-300",
            isMobile
              ? "opacity-100"
              : isHovering
                ? "opacity-0"
                : "opacity-100"
          )}
        >
          {isMobile ? "Tap to view full image" : "Hover to zoom • Click for modal"}
        </div>
      </div>

      {!isMobile && isHovering && mag.w > 0 && (
        <div
          className="fixed pointer-events-none z-[80] overflow-hidden border border-border/80 bg-background shadow-2xl animate-in fade-in duration-150"
          style={{
            left: mag.x,
            top: mag.y,
            width: mag.w,
            height: mag.h,
          }}
        >
          <div
            style={{
              width: mag.bgW,
              height: mag.bgH,
              transform: `translate(-${mag.bgX}px, -${mag.bgY}px)`,
              position: "relative",
            }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              quality={95}
              sizes={`${mag.bgW}px`}
              className="object-contain max-w-none"
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
