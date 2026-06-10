import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { JsonLd } from "@/components/seo/JsonLd";
import { getServerLang } from "@/lib/serverLocale";
import { buildPageKeywords, buildPageMetadata, cleanObject } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const FAQ_KEYWORDS = buildPageKeywords("Frequently Asked Questions", "Get quick answers about Bunoraa orders, products, shipping, and support.", undefined, lang);
  return buildPageMetadata({
    title: "Frequently Asked Questions",
    description: "Get quick answers about Bunoraa orders, products, shipping, returns, and support.",
    path: "/faq/",
    keywords: [
      "Bunoraa FAQ",
      "shipping Bangladesh",
      "order help",
      "returns policy",
      "payment methods",
      ...FAQ_KEYWORDS,
    ],
    lang,
  });
}

type Faq = {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
};

async function getFaqs() {
  try {
    const response = await apiFetch<Faq[]>("/pages/faqs/");
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 503)) {
      return [];
    }
    throw error;
  }
}

export default async function FaqPage() {
  const faqs = await getFaqs();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) =>
      cleanObject({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: cleanObject({
          "@type": "Answer",
          text: faq.answer,
        }),
      })
    ),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-5 py-12">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">
            FAQ
          </p>
          <h1 className="text-3xl font-semibold">Frequently asked questions</h1>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.id} variant="bordered" className="space-y-2">
              <h2 className="text-lg font-semibold">{faq.question}</h2>
              <p className="text-sm text-foreground/70">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </div>
      {faqs.length ? <JsonLd data={faqSchema} /> : null}
    </div>
  );
}
