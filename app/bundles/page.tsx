import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { BundlesPageContent } from "@/components/bundles/BundlesPageContent";

export const metadata: Metadata = buildPageMetadata({
  title: "Bundles",
  description: "Shop ready-made Bunoraa bundles with complementary products.",
  path: "/bundles/",
});

export default function BundlesPage() {
  return <BundlesPageContent />;
}
