import type { Metadata } from "next";
import { PagesIndexPageContent } from "@/components/pages/PagesIndexPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Guides and Pages",
  description: "Read Bunoraa guides, policies, and informational pages.",
  path: "/pages/",
});

export default function PagesIndex() {
  return <PagesIndexPageContent />;
}
