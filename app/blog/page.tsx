import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { BlogPageContent } from "@/components/blog/BlogPageContent";

export const metadata: Metadata = buildPageMetadata({
  title: "Embroidery Blog & Guides",
  description: "Explore Bunoraa's embroidery blog — care guides, stitching techniques, artisan stories, and Bangladeshi craft inspiration.",
  path: "/blog/",
});

export default function BlogPage() {
  return <BlogPageContent />;
}
