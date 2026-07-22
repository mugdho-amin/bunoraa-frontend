import { apiFetch } from "@/lib/api";
import type { Artisan, ProductListItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { WishlistIconButton } from "@/components/wishlist/WishlistIconButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, buildBreadcrumbList, buildItemList, cleanObject } from "@/lib/seo";
import { buildProductPath } from "@/lib/productPaths";
import Image from "next/image";

async function tryGetArtisan(slug: string) { try { const response = await apiFetch<Artisan>(`/artisans/${slug}/`); return response.data; } catch { return null; } }
async function tryGetArtisanProducts(slug: string) { try { const response = await apiFetch<ProductListItem[]>("/catalog/products/", { params: { artisan: slug } }); return response.data; } catch { return [] as ProductListItem[]; } }

export async function ArtisanDetailPageContent({ slug }: { slug: string }) {
  const [artisan, products] = await Promise.all([tryGetArtisan(slug), tryGetArtisanProducts(slug)]);
  const artisanUrl = `/artisans/${slug}/`;
  const breadcrumbs = buildBreadcrumbList([{ name: "Home", url: "/" }, { name: "Artisans", url: "/artisans/" }, { name: artisan?.name || "Artisan", url: artisanUrl }]);
  const personSchema = artisan ? cleanObject({ "@context": "https://schema.org", "@type": "Person", name: artisan.name, description: artisan.bio || undefined, image: artisan.avatar ? absoluteUrl(artisan.avatar) : undefined, url: absoluteUrl(artisanUrl) }) : null;
  const productList = buildItemList(products.slice(0, 50).map((product) => ({ name: product.name, url: buildProductPath(product), image: (product.primary_image as string | undefined) || undefined, description: product.short_description || undefined })), artisan?.name ? `${artisan.name} products` : "Artisan products");

  return (
    <div className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] py-12">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Artisan</p>
        <h1 className="text-3xl font-semibold">{artisan?.name || "Artisan profile"}</h1>
        <p className="mt-2 text-muted-foreground">{artisan?.bio || "Artisan details are not available via API yet."}</p>
      </div>
      {products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} variant="bordered" className="flex flex-col gap-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                <WishlistIconButton productId={product.id} className="absolute right-3 top-3" />
                {product.primary_image ? <Image src={product.primary_image} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-2"><h2 className="text-lg font-semibold">{product.name}</h2><p className="text-sm text-muted-foreground">{product.short_description}</p></div>
              <Button asChild size="sm" variant="secondary"><Link href={buildProductPath(product)}>View product</Link></Button>
            </Card>
          ))}
        </div>
      ) : <Card variant="bordered" className="p-6 text-sm text-muted-foreground">Products for this artisan are not available via the API yet.</Card>}
      <JsonLd data={[breadcrumbs, ...(personSchema ? [personSchema] : []), ...(products.length ? [productList] : [])]} />
    </div>
  );
}
