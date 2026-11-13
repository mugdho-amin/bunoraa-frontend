import { ImageResponse } from "next/og";
import { StorefrontSocialImage } from "@/components/seo/StorefrontSocialImage";

export const alt = "Bunoraa artisan fashion and home collections";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(<StorefrontSocialImage />, size);
}
