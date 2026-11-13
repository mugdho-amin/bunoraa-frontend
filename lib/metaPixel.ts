export type MetaPixelEventParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaPixel(
  eventName: string,
  params?: MetaPixelEventParams
) {
  if (typeof window === "undefined" || !window.fbq) return;

  if (params) window.fbq("track", eventName, params);
  else window.fbq("track", eventName);
}

export function getMetaContentId(id?: string | null, sku?: string | null) {
  return sku?.trim() || id?.trim() || "";
}
