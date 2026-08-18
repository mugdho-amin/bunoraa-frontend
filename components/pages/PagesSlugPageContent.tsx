import { headers } from "next/headers";
import { apiFetch, ApiError } from "@/lib/api";
import type { PageDetail } from "@/lib/types";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { sanitizeHtml } from "@/lib/sanitize";
import { getServerLang } from "@/lib/serverLocale";
import { absoluteUrl, buildBreadcrumbList, buildPageKeywords, buildPageMetadata, cleanObject } from "@/lib/seo";
import type { Metadata } from "next";

export async function getPage(slug: string) {
  try {
    const response = await apiFetch<PageDetail>(`/cms/${slug}/`, {});
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function generatePageMetadata(slug: string): Promise<Metadata> {
  headers();
  const [page, lang] = await Promise.all([getPage(slug), getServerLang()]);
  const pageTitle = (page.meta_title || page.title).replace(/\s*\|\s*Bunoraa(?:\s+Bangladesh)?\s*$/i, '');
  return buildPageMetadata({
    title: pageTitle,
    description: page.meta_description || page.excerpt || undefined,
    path: `/pages/${page.slug}/`,
    keywords: buildPageKeywords(page.title, page.excerpt || page.meta_description, page.meta_keywords, lang),
    lang,
  });
}

export async function PagesSlugPageContent({
  slug,
}: {
  slug: string;
}) {
  headers();
  const page = await getPage(slug);
  const pageUrl = `/pages/${page.slug}/`;
  const pageSchema = cleanObject({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.meta_title || page.title,
    description: page.meta_description || page.excerpt || undefined,
    url: absoluteUrl(pageUrl),
  });
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: "/" },
    { name: "Pages", url: "/pages/" },
    { name: page.title, url: pageUrl },
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-[var(--page-gutter)] py-12">
        <h1 className="text-3xl font-semibold text-foreground">{page.title}</h1>
        <div
          className="prose mt-6 max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground/80 prose-li:text-foreground/80 prose-strong:text-foreground prose-a:text-primary prose-a:underline prose-a:underline-offset-4 prose-hr:border-border"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content || "") }}
        />
      </div>
      <JsonLd data={[pageSchema, breadcrumbs]} />
    </div>
  );
}
