import { notFound } from "next/navigation";
import { getBundles } from "@/lib/bundles";
import { BundleCard } from "@/components/bundles/BundleCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildItemList } from "@/lib/seo";

export async function BundlesPageContent() {
  const bundles = await getBundles();
  if (!bundles.length) notFound();
  const list = buildItemList(
    bundles.map((bundle) => ({
      name: bundle.name,
      url: `/bundles/${bundle.slug}/`,
      image: bundle.image || undefined,
      description: bundle.description || undefined,
    })),
    "Bundles"
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] py-8 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="section-eyebrow">Bundles</p>
        <h1 className="section-title">Bundle deals</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Curated kits at a better price than buying each item separately.
          One bundle, one checkout, everything ships together.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {bundles.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} />
        ))}
      </div>

      <JsonLd data={list} />
    </div>
  );
}
