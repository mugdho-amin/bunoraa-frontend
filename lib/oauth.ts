import { getBrowserApiOrigin } from "@/lib/api";

export function getOAuthBaseUrl(): string {
  return getBrowserApiOrigin();
}
