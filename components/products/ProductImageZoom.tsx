"use client";

import * as React from "react";
import Image from "next/image";
import ImageZoom from "js-image-zoom";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio: number;
};

function initMagnifierZoom(container: HTMLElement, img: HTMLImageElement) {
  const cw = container.clientWidth;
  const ch = container.clientHeight;
  if (cw === 0 || ch === 0) return null;

  const nw = img.naturalWidth || cw;
  const nh = img.naturalHeight || ch;
  const scale = Math.min((nw / cw) * 0.5, (nh / ch) * 0.5, 6);

  return new ImageZoom(container, {
    width: cw,
    height: ch,
    scale,
    offset: { vertical: 0, horizontal: 10 },
    zoomStyle:
      "opacity: 0.95; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);",
    zoomLensStyle:
      "opacity: 0.15; background-color: #000; border: 2px solid rgba(255,255,255,0.3); border-radius: 4px;",
  });
}

export function ProductImageZoom({ src, alt, priority = false, aspectRatio }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const instanceRef = React.useRef<ReturnType<typeof ImageZoom> | null>(null);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 992);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Desktop magnifier zoom
  React.useEffect(() => {
    if (isMobile) return;
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const start = () => {
      if (instanceRef.current) return;
      const inst = initMagnifierZoom(container, img);
      if (inst) instanceRef.current = inst;
    };

    if (img.complete && img.naturalWidth > 0) {
      start();
    } else {
      img.addEventListener("load", start, { once: true });
    }

    return () => {
      instanceRef.current = null;
    };
  }, [src, isMobile]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden bg-muted",
        isMobile ? "" : "cursor-crosshair"
      )}
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 800px"
        className={cn(
          "h-full w-full object-cover select-none",
          isMobile && "transition-transform duration-300 hover:scale-110"
        )}
        draggable={false}
      />
      {isMobile && (
        <div className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-foreground/50 border border-border/40 pointer-events-none">
          Tap to zoom
        </div>
      )}
    </div>
  );
}
