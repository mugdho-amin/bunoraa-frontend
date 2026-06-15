import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerLang } from "@/lib/serverLocale";
import { buildPageKeywords, buildPageMetadata } from "@/lib/seo";
import { ArtisanDetailPageContent } from "@/components/artisans/ArtisanDetailPageContent";
import { tryGetArtisanMeta } from "@/lib/artisans";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  headers();
  const [artisan, lang] = await Promise.all([tryGetArtisanMeta(slug), getServerLang()]);
  return buildPageMetadata({
    title: artisan?.name ? `${artisan.name} | Artisan` : "Artisan Profile",
    description: artisan?.bio || "Meet Bunoraa artisans and explore their curated products.",
    path: `/artisans/${slug}/`,
    keywords: buildPageKeywords(artisan?.name || "Artisan", artisan?.bio, undefined, lang),
    lang,
  });
}

export default async function ArtisanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  headers();
  return <ArtisanDetailPageContent slug={slug} />;
}
