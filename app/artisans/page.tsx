import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { ArtisansPageContent } from "@/components/artisans/ArtisansPageContent";

export const metadata: Metadata = buildPageMetadata({
  title: "Artisans",
  description: "Meet Bunoraa artisans and explore products from each maker.",
  path: "/artisans/",
});

export default function ArtisansPage() {
  return <ArtisansPageContent />;
}
