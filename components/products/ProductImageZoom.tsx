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

export function ProductImageZoom({ src, alt, priority = false, aspectRatio }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
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
    const container = containerRef.current!;
    const wrapper = wrapperRef.current!;

    let inst: ReturnType<typeof ImageZoom> | null = null;

    function init() {
      if (inst) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;

      const imgEl = container.querySelector<HTMLImageElement>("img");
      if (!imgEl) return;

      const nw = imgEl.naturalWidth || cw;
      const nh = imgEl.naturalHeight || ch;
      const scale = Math.min((nw / cw) * 0.5, (nh / ch) * 0.5, 6);

      inst = new ImageZoom(container, {
        width: cw,
        height: ch,
        scale,
        offset: { vertical: 0, horizontal: 10 },
        zoomContainer: wrapper,
        zoomStyle:
          "opacity: 0.95; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);",
        zoomLensStyle:
          "opacity: 0.15; background-color: #000; border: 2px solid rgba(255,255,255,0.3); border-radius: 4px;",
      });
      instanceRef.current = inst;
    }

    // Retry once layout is settled
    const ro = new ResizeObserver(() => {
      if (!inst && container.clientWidth > 0 && container.clientHeight > 0) {
        init();
      }
    });
    ro.observe(container);

    const imgEl = container.querySelector<HTMLImageElement>("img");
    if (imgEl) {
      if (imgEl.complete && imgEl.naturalWidth > 0) {
        init();
      } else {
        imgEl.addEventListener("load", init, { once: true });
      }
    }

    return () => {
      ro.disconnect();
      if (inst) {
        inst.kill();
        inst = null;
      }
      instanceRef.current = null;
    };
  }, [src, isMobile]);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-full overflow-hidden bg-muted",
          isMobile ? "" : "cursor-crosshair"
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 800px"
          className={cn(
            "object-cover select-none",
            isMobile && "transition-transform duration-300 hover:scale-110"
          )}
          draggable={false}
        />
      </div>
      {isMobile && (
        <div className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-foreground/50 border border-border/40 pointer-events-none">
          Tap to zoom
        </div>
      )}
    </div>
  );
}
