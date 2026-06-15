import type { Metadata } from "next";
import { getServerLang } from "@/lib/serverLocale";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/siteSettings.server";
import { AboutPageContent } from "@/components/about/AboutPageContent";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const siteSettings = await getSiteSettings().catch(() => null);
  const brandName = siteSettings?.site_name || "";
  return buildPageMetadata({
    title: brandName ? `About ${brandName}` : "About",
    description: siteSettings?.site_description || "Learn more about Bunoraa.",
    path: "/about/",
    lang,
  });
}

export default function AboutPage() {
  return <AboutPageContent />;
}
