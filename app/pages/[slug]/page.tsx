import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/components/pages/PagesSlugPageContent";

const PagesSlugPageContent = dynamic(
  () => import("@/components/pages/PagesSlugPageContent").then((mod) => mod.PagesSlugPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-foreground/60">Loading page...</div> }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata(slug);
}

export default async function PageDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PagesSlugPageContent slug={slug} />;
}
