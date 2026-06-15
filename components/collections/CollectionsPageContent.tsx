import Link from "next/link";
import Image from "next/image";
import { apiFetch, ApiError } from "@/lib/api";
import type { Collection } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildItemList } from "@/lib/seo";
import { asArray } from "@/lib/array";

async function getCollections() {
  try { const response = await apiFetch<Collection[] | { results?: Collection[]; count?: number }>("/catalog/collections/"); return asArray<Collection>(response.data); }
  catch (error) { if (error instanceof ApiError && (error.status === 404 || error.status === 503)) return []; throw error; }
}

export async function CollectionsPageContent() {
  const collections = await getCollections();
  if (!collections.length) {
    return (
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 py-12 text-center">
        <div className="mb-8"><p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Collections</p><h1 className="text-3xl font-semibold">Curated sets</h1></div>
        <p className="text-foreground/60 mb-6">Collections are being curated. Check back soon.</p>
        <Link href="/products/" className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Browse products</Link>
      </div>
    );
  }
  const list = buildItemList(collections.map((collection) => ({ name: collection.name, url: `/collections/${collection.slug}/`, image: collection.image || undefined, description: collection.description || undefined })), "Collections");

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 py-12">
      <div className="mb-8"><p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Collections</p><h1 className="text-3xl font-semibold">Curated sets</h1></div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Card key={collection.id} variant="bordered" className="flex flex-col gap-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              {collection.image ? <Image src={collection.image} alt={collection.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" loading="lazy" decoding="async" /> : null}
            </div>
            <div className="flex flex-1 flex-col gap-2"><h2 className="text-lg font-semibold">{collection.name}</h2><p className="text-sm text-foreground/70">{collection.description}</p></div>
            <Button asChild variant="primary-gradient"><Link href={`/collections/${collection.slug}/`}>View collection</Link></Button>
          </Card>
        ))}
      </div>
      <JsonLd data={list} />
    </div>
  );
}
