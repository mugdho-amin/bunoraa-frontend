import type { Metadata } from "next";
import { getServerLang } from "@/lib/serverLocale";
import { buildPageKeywords, buildPageMetadata } from "@/lib/seo";
import { FaqPageContent } from "@/components/faq/FaqPageContent";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const FAQ_KEYWORDS = buildPageKeywords("Frequently Asked Questions", "Get quick answers about Bunoraa orders, products, shipping, and support.", undefined, lang);
  return buildPageMetadata({
    title: "Frequently Asked Questions",
    description: "Get quick answers about Bunoraa orders, products, shipping, returns, and support.",
    path: "/faq/",
    keywords: ["Bunoraa FAQ", "shipping Bangladesh", "order help", "returns policy", "payment methods", ...FAQ_KEYWORDS],
    lang,
  });
}

export default function FaqPage() {
  return <FaqPageContent />;
}
