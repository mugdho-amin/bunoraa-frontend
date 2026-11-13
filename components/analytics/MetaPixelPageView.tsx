"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackMetaPixel } from "@/lib/metaPixel";

export function MetaPixelPageView() {
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    trackMetaPixel("PageView");
  }, [pathname]);

  return null;
}
