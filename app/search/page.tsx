import type { Metadata } from "next";
import { getTranslations } from "@/lib/i18n.server";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SearchPageContent } from "@/components/search/SearchPageContent";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const resolved = await searchParams;
  const query = typeof resolved.q === "string" ? resolved.q.trim() : "";
  const { t } = await getTranslations();
  return buildNoIndexMetadata({
    title: query ? `${t("common.search.results_for")} "${query}"` : t("common.search.title"),
    description: query ? `${t("common.search.results_for")} "${query}" on Bunoraa.` : t("common.search.catalog_search"),
    path: "/search/",
  });
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolved = await searchParams;
  return <SearchPageContent searchParams={resolved} />;
}
