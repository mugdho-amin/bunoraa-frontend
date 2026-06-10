import type { Metadata } from "next";
import { getServerLang } from "@/lib/serverLocale";
import { buildPageKeywords, buildPageMetadata } from "@/lib/seo";
import { ContactPageClient } from "@/components/contact/ContactPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return buildPageMetadata({
    title: "Contact",
    description: "Get in touch with support, sales, and partnership inquiries.",
    path: "/contact/",
    keywords: buildPageKeywords("Contact", "Get in touch with support, sales, and partnership inquiries.", undefined, lang),
    lang,
  });
}

export default function ContactPage() {
  return <ContactPageClient />;
}
