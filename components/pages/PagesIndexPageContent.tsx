import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildItemList } from "@/lib/seo";

type PageSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
};

async function getPages() {
  try {
    const response = await apiFetch<PageSummary[]>("/pages/");
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 503)) {
      return [];
    }
    throw error;
  }
}

export async function PagesIndexPageContent() {
  const pages = await getPages();
  const pagesList = buildItemList(
    pages.map((page) => ({
      name: page.title,
      url: `/pages/${page.slug}/`,
      description: page.excerpt || undefined,
    })),
    "Pages"
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-[var(--page-gutter)] py-12">
        <h1 className="text-3xl font-semibold">Pages</h1>
        <div className="mt-6 space-y-4">
          {pages.map((page) => (
            <Card key={page.id} variant="bordered" className="space-y-2">
              <Link className="text-lg font-semibold" href={`/pages/${page.slug}/`}>
                {page.title}
              </Link>
              {page.excerpt ? (
                <p className="text-sm text-muted-foreground">{page.excerpt}</p>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
      {pages.length ? <JsonLd data={pagesList} /> : null}
    </div>
  );
}
