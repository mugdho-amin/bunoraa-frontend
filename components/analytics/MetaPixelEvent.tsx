"use client";

import { useEffect, useRef } from "react";
import { trackMetaPixel, type MetaPixelEventParams } from "@/lib/metaPixel";

export function MetaPixelEvent({
  eventName,
  eventKey,
  params,
}: {
  eventName: string;
  eventKey: string;
  params?: MetaPixelEventParams;
}) {
  const lastEventKey = useRef<string | null>(null);

  useEffect(() => {
    if (!eventKey || lastEventKey.current === eventKey) return;
    lastEventKey.current = eventKey;
    trackMetaPixel(eventName, params);
  }, [eventKey, eventName, params]);

  return null;
}
