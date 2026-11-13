import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { generatePageMetadata, PagesSlugPageContent } from "@/components/pages/PagesSlugPageContent";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "about-us") {
    return buildPageMetadata({
      title: "About Bunoraa",
      description: "Learn about Bunoraa, our artisans, and our commitment to handcrafted goods.",
      path: "/about/",
    });
  }
  return generatePageMetadata(slug);
}

export default async function PageDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "about-us") {
    permanentRedirect("/about/");
  }
  return <PagesSlugPageContent slug={slug} />;
}
