import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Guides and Pages",
  description: "Read Bunoraa guides, policies, and informational pages.",
  path: "/pages/",
});

const PagesIndexPageContent = dynamic(
  () => import("@/components/pages/PagesIndexPageContent").then((mod) => mod.PagesIndexPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading pages...</div> }
);

export default function PagesIndex() {
  return <PagesIndexPageContent />;
}
