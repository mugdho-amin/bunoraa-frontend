import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import type { Artisan } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildItemList } from "@/lib/seo";
import { asArray } from "@/lib/array";
import Image from "next/image";

async function getArtisans() {
  try { const response = await apiFetch<Artisan[] | { results?: Artisan[]; count?: number }>("/artisans/"); return asArray<Artisan>(response.data); }
  catch (error) { if (error instanceof ApiError && (error.status === 404 || error.status === 503)) return []; throw error; }
}

export async function ArtisansPageContent() {
  const artisans = await getArtisans();
  if (!artisans.length) {
    return (
      <div className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] py-12 text-center">
        <div className="mb-8"><p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Artisans</p><h1 className="text-3xl font-semibold">Meet the makers</h1></div>
        <p className="text-muted-foreground mb-6">Artisans are being onboarded. Check back soon.</p>
        <Link href="/products/" className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">Browse products</Link>
      </div>
    );
  }
  const list = buildItemList(artisans.map((artisan) => ({ name: artisan.name, url: `/artisans/${artisan.slug}/`, image: artisan.avatar || undefined, description: artisan.bio || undefined })), "Artisans");

  return (
    <div className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] py-12">
      <div className="mb-8"><p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Artisans</p><h1 className="text-3xl font-semibold">Meet the makers</h1></div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {artisans.map((artisan) => (
          <Card key={artisan.id} variant="bordered" className="flex flex-col gap-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">{artisan.avatar ? <Image src={artisan.avatar} alt={artisan.name} fill quality={72} className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" loading="lazy" decoding="async" /> : null}</div>
            <div className="flex flex-1 flex-col gap-2"><h2 className="text-lg font-semibold">{artisan.name}</h2><p className="text-sm text-muted-foreground">{artisan.bio}</p></div>
            <Button asChild variant="primary-gradient"><Link href={`/artisans/${artisan.slug}/`}>View artisan</Link></Button>
          </Card>
        ))}
      </div>
      <JsonLd data={list} />
    </div>
  );
}
