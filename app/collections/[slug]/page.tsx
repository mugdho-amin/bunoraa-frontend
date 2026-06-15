import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generateCollectionMetadata } from "@/components/collections/CollectionDetailPageContent";

const CollectionDetailPageContent = dynamic(
  () => import("@/components/collections/CollectionDetailPageContent").then((mod) => mod.CollectionDetailPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-foreground/60">Loading collection...</div> }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return generateCollectionMetadata(slug);
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CollectionDetailPageContent slug={slug} />;
}
