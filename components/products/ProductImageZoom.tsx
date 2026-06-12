"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio: number;
};

const LENS = 160;

export function ProductImageZoom({ src, alt, priority = false, aspectRatio }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lensRef = React.useRef<HTMLDivElement>(null);
  const infoRef = React.useRef({ nw: 0, nh: 0, cw: 0, ch: 0 });
  const [isMobile, setIsMobile] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 992);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track natural image + container dimensions
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const img = container.querySelector<HTMLImageElement>("img");
    if (!img) return;

    const sync = () =>
      requestAnimationFrame(() => {
        infoRef.current = {
          nw: img.naturalWidth || container.clientWidth,
          nh: img.naturalHeight || container.clientHeight,
          cw: container.clientWidth,
          ch: container.clientHeight,
        };
      });

    if (img.complete && img.naturalWidth > 0) {
      sync();
    } else {
      img.addEventListener("load", sync, { once: true });
    }

    const ro = new ResizeObserver(sync);
    ro.observe(container);
    return () => ro.disconnect();
  }, [src]);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isHovering) return;
      const rect = containerRef.current?.getBoundingClientRect();
      const lens = lensRef.current;
      if (!rect || !lens) return;

      const { nw, nh, cw, ch } = infoRef.current;
      if (!cw || !ch) return;

      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const half = LENS / 2;

      // Clamp lens within container
      const cx = Math.max(half, Math.min(rect.width - half, mx));
      const cy = Math.max(half, Math.min(rect.height - half, my));

      lens.style.left = cx - half + "px";
      lens.style.top = cy - half + "px";

      // Map cursor → natural-image pixel, then center lens on that pixel
      const imgX = (cx / cw) * nw;
      const imgY = (cy / ch) * nh;
      lens.style.backgroundPosition = `-${imgX - half}px -${imgY - half}px`;
    },
    [isHovering]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-muted select-none",
        isMobile ? "" : "cursor-none"
      )}
      style={{ aspectRatio: `${aspectRatio}` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={isMobile ? undefined : handleMouseMove}
    >
      <div className="relative w-full h-full overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 800px"
          className={cn(
            "object-cover",
            isMobile && "transition-transform duration-300 hover:scale-110"
          )}
          draggable={false}
        />
      </div>

      {!isMobile && (
        <div
          ref={lensRef}
          className={cn(
            "absolute pointer-events-none z-10 overflow-hidden rounded-full shadow-2xl ring-2 ring-white/30 transition-opacity duration-150",
            isHovering ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: LENS,
            height: LENS,
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "auto",
          }}
        />
      )}

      {isMobile && (
        <div className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-foreground/50 border border-border/40 pointer-events-none">
          Tap to zoom
        </div>
      )}
    </div>
  );
}
