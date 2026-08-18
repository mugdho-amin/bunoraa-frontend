"use client";

import * as React from "react";
import { ImageIcon } from "lucide-react";
import { useMediaUrl } from "@/components/providers/SiteSettingsProvider";
import { cn } from "@/lib/utils";

type CartItemImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
};

/**
 * Image for cart/checkout line items.
 *
 * Resolves URLs against the runtime `media_url` from site settings
 * (same resolution used by MiniCart/CartPage) instead of a build-time env.
 * Falls back to a subtle placeholder when the URL is missing or fails.
 */
export function CartItemImage({
  src,
  alt = "",
  className,
  containerClassName,
}: CartItemImageProps) {
  const mediaUrl = useMediaUrl();
  const [hasFailed, setHasFailed] = React.useState(false);

  const rawUrl = React.useMemo(() => {
    if (!src) return null;
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
      return src;
    }
    return `${mediaUrl}${src}`;
  }, [src, mediaUrl]);

  if (!rawUrl || hasFailed) {
    return (
      <div
        className={cn("relative overflow-hidden bg-muted", containerClassName)}
        aria-hidden="true"
      >
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon size={16} className="text-muted-foreground/50" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
      <img
        src={rawUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setHasFailed(true)}
        className={className}
      />
    </div>
  );
}
