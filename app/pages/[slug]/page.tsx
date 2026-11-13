import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { permanentRedirect } from "next/navigation";
import { generatePageMetadata } from "@/components/pages/PagesSlugPageContent";
import { buildPageMetadata } from "@/lib/seo";

const PagesSlugPageContent = dynamic(
  () => import("@/components/pages/PagesSlugPageContent").then((mod) => mod.PagesSlugPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading page...</div> }
);

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
