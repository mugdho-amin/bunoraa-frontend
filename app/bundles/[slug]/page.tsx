import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generateBundleMetadata } from "@/components/bundles/BundleDetailPageContent";

const BundleDetailPageContent = dynamic(
  () => import("@/components/bundles/BundleDetailPageContent").then((mod) => mod.BundleDetailPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading bundle...</div> }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return generateBundleMetadata(slug);
}

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BundleDetailPageContent slug={slug} />;
}
