import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getServerLang } from "@/lib/serverLocale";
import { buildPageKeywords, buildPageMetadata } from "@/lib/seo";

const ContactPageClient = dynamic(
  () => import("@/components/contact/ContactPageClient").then((mod) => mod.ContactPageClient)
);

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return buildPageMetadata({
    title: "Contact Bunoraa",
    description: "Contact Bunoraa for support, sales, and partnership inquiries.",
    path: "/contact/",
    keywords: buildPageKeywords("Contact Bunoraa", "Contact Bunoraa for support, sales, and partnership inquiries.", undefined, lang),
    lang,
  });
}

export default function ContactPage() {
  return <ContactPageClient />;
}
