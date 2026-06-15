import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { CollectionsPageContent } from "@/components/collections/CollectionsPageContent";

export const metadata: Metadata = buildPageMetadata({
  title: "Curated Collections",
  description: "Discover curated Bunoraa collections built around themes and use cases.",
  path: "/collections/",
});

export default function CollectionsPage() {
  return <CollectionsPageContent />;
}
