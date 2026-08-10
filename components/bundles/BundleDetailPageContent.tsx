import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { getServerLang } from "@/lib/serverLocale";
import { apiFetch, ApiError } from "@/lib/api";
import type { Bundle } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AddBundleToCart } from "@/components/bundles/AddBundleToCart";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildBreadcrumbList,
  buildItemList,
  buildPageKeywords,
  buildPageMetadata,
} from "@/lib/seo";
import { buildProductPath } from "@/lib/productPaths";

export const getBundle = cache(async (slug: string) => {
  try {
    const response = await apiFetch<Bundle>(`/catalog/bundles/${slug}/`, {
      headers: await getServerLocaleHeaders(),
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
});

export async function generateBundleMetadata(slug: string): Promise<Metadata> {
  const [bundle, lang] = await Promise.all([getBundle(slug), getServerLang()]);
  return buildPageMetadata({
    title: bundle.meta_title || bundle.name,
    description:
      bundle.meta_description ||
      bundle.description ||
      `Explore products included in the ${bundle.name} bundle.`,
    path: `/bundles/${bundle.slug}/`,
    keywords: buildPageKeywords(bundle.name, bundle.description, undefined, lang),
    lang,
  });
}

export async function BundleDetailPageContent({ slug }: { slug: string }) {
  const bundle = await getBundle(slug);
  if (!bundle) notFound();

  const bundleUrl = `/bundles/${bundle.slug}/`;
  const currency = bundle.currency || "BDT";
  const price = formatMoney(bundle.price, currency);
  const worth = formatMoney(bundle.value, currency);
  const savings = formatMoney(bundle.savings, currency);
  const hasSavings = Boolean(bundle.savings && parseFloat(bundle.savings) > 0);
  const availableUnits = bundle.available_units;
  const soldOut = availableUnits === 0;
  const lowStock =
    typeof availableUnits === "number" && availableUnits > 0 && availableUnits <= 3;

  const itemLines = (bundle.items || []).map((line) => ({
    product: line.product,
    quantity: line.quantity,
  }));
  const products = itemLines.map((line) => line.product);

  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: "/" },
    { name: "Bundles", url: "/bundles/" },
    { name: bundle.name, url: bundleUrl },
  ]);
  const productList = buildItemList(
    products.slice(0, 50).map((product) => ({
      name: product.name,
      url: buildProductPath(product),
      image: (product.primary_image as string | undefined) || undefined,
      description: product.short_description || undefined,
    })),
    `${bundle.name} items`
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-content px-[var(--page-gutter)] pb-32 pt-6 md:pb-12 sm:pt-10">
        <nav className="mb-5 hidden text-xs text-muted-foreground sm:block">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/bundles/" className="hover:text-primary">Bundles</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{bundle.name}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10">
          {/* Media */}
          <div className="relative overflow-hidden rounded-2xl bg-muted">
            <div className="relative aspect-square w-full sm:aspect-[4/3]">
              {bundle.image ? (
                <Image
                  src={bundle.image}
                  alt={bundle.name}
                  fill
                  priority
                  quality={85}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 56vw"
                />
              ) : null}
            </div>
            {soldOut ? (
              <Badge variant="error" className="absolute left-4 top-4">
                Sold out
              </Badge>
            ) : lowStock ? (
              <Badge variant="warning" className="absolute left-4 top-4">
                Only {availableUnits} left
              </Badge>
            ) : null}
          </div>

          {/* Info + purchase card */}
          <div className="flex flex-col gap-5 lg:pt-2">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Bundle
                </p>
                {bundle.is_featured ? <Badge variant="accent">Featured</Badge> : null}
              </div>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {bundle.name}
              </h1>
              {bundle.description ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {bundle.description}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">
                  {bundle.item_count ?? 0} items
                </Badge>
                {hasSavings ? (
                  <Badge variant="success">You save {savings}</Badge>
                ) : null}
              </div>
            </div>

            <Card variant="elevated" className="p-5">
              <dl>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">Items worth</dt>
                  <dd className="text-sm text-muted-foreground line-through">
                    {worth}
                  </dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <dt className="text-sm font-medium">Bundle price</dt>
                  <dd className="text-2xl font-semibold text-primary">{price}</dd>
                </div>
                {hasSavings ? (
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <dt className="text-sm text-muted-foreground">You save</dt>
                    <dd className="text-sm font-semibold text-success">{savings}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4">
                {soldOut ? (
                  <p className="text-sm text-error">
                    This bundle is currently out of stock.
                  </p>
                ) : lowStock ? (
                  <p className="mb-3 text-sm text-warning">
                    Only {availableUnits} bundles left — order before they run out.
                  </p>
                ) : null}
                <AddBundleToCart
                  bundleId={bundle.id}
                  bundleName={bundle.name}
                  availableUnits={availableUnits ?? 0}
                  className="mt-1"
                />
              </div>

              <ul className="mt-5 space-y-2 border-t pt-4 text-xs text-muted-foreground">
                <li>Bundle ships together as one kit</li>
                <li>Availability is based on the items inside</li>
                <li>
                  <Link href="/cart/" className="underline-offset-2 hover:underline">
                    View my bag
                  </Link>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* What's inside */}
        <section className="mt-12 sm:mt-16" aria-labelledby="bundle-contents">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-eyebrow">What&apos;s inside</p>
              <h2 id="bundle-contents" className="section-title">
                {bundle.name}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {bundle.item_count ?? 0} items · worth {worth}
            </p>
          </div>

          {itemLines.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {itemLines.map((line, index) => {
                const product = line.product;
                const unitPrice = parseFloat(product.current_price || "0");
                return (
                  <Card key={product.id ?? index} variant="bordered" className="p-3">
                    <Link
                      href={buildProductPath(product)}
                      className="flex items-center gap-3"
                    >
                      {product.primary_image ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={product.primary_image}
                            alt={product.name}
                            fill
                            quality={70}
                            className="object-cover"
                            sizes="64px"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 shrink-0 rounded-lg bg-muted" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Qty {line.quantity}
                        </p>
                        {unitPrice > 0 ? (
                          <p className="mt-1 text-xs font-semibold">
                            {formatMoney(product.current_price, currency)}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bundle details are available, but the product list is not exposed via API yet.
            </p>
          )}
        </section>

        <div className="mt-10 flex justify-center">
          <Button asChild variant="secondary">
            <Link href="/products/">Shop all products</Link>
          </Button>
        </div>
      </div>

      {/* Mobile sticky purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 md:hidden">
        <div className="flex items-center gap-3 px-[var(--page-gutter)] py-3">
          <div className="min-w-0 shrink-0">
            <p className="truncate text-xs text-muted-foreground">{bundle.name}</p>
            <p className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-primary">{price}</span>
              {hasSavings ? (
                <span className="text-[11px] text-success">save {savings}</span>
              ) : null}
            </p>
          </div>
          <AddBundleToCart
            bundleId={bundle.id}
            bundleName={bundle.name}
            availableUnits={availableUnits ?? 0}
            compact
            className="min-w-0 flex-1"
          />
        </div>
      </div>

      <JsonLd data={[breadcrumbs, ...(products.length ? [productList] : [])]} />
    </div>
  );
}