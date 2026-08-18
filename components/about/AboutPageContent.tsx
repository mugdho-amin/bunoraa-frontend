import Link from "next/link";
import { cache } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Collection, ContactSettings, PageDetail, SiteSettings } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { absoluteUrl, cleanObject } from "@/lib/seo";
import { asArray } from "@/lib/array";
import { sanitizeHtml } from "@/lib/sanitize";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { getSiteSettings } from "@/lib/siteSettings.server";

type CategoryPreview = { id: string; name: string; slug: string; slug_path?: string | null; product_count?: number | null };
type ListPayload<T> = T[] | { results?: T[]; count?: number };
type QueryParams = Record<string, string | number | boolean | Array<string | number | boolean> | undefined>;

const SOCIAL_SITE_FIELDS: Array<{ key: keyof SiteSettings; label: string }> = [
  { key: "facebook_url", label: "Facebook" }, { key: "instagram_url", label: "Instagram" },
  { key: "twitter_url", label: "Twitter" }, { key: "linkedin_url", label: "LinkedIn" },
  { key: "youtube_url", label: "YouTube" }, { key: "tiktok_url", label: "TikTok" },
];

const pickText = (...values: Array<string | null | undefined>) => { for (const value of values) { if (value?.trim()) return value.trim(); } return ""; };
const stripHtml = (value?: string | null) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const formatCount = (value: number) => new Intl.NumberFormat("en-US").format(value);
const formatDate = (value?: string | null) => { if (!value) return null; const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) return null; return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(parsed); };
const normalizeExternalHref = (value?: string | null) => { const trimmed = String(value || "").trim(); if (!trimmed) return ""; if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed; return `https://${trimmed.replace(/^\/+/, "")}`; };
const resolveCount = (payload: unknown, metaCount?: number) => { if (typeof metaCount === "number") return metaCount; if (payload && typeof payload === "object" && !Array.isArray(payload) && typeof (payload as { count?: unknown }).count === "number") return (payload as { count: number }).count; return asArray<unknown>(payload).length; };

const getAboutPage = cache(async (): Promise<PageDetail | null> => { try { const response = await apiFetch<PageDetail>("/cms/about/"); return response.data; } catch (error) { if (error instanceof ApiError && error.status === 404) return null; return null; } });
const getContactSettings = cache(async (): Promise<ContactSettings | null> => { try { const response = await apiFetch<ContactSettings>("/contacts/settings/", { headers: await getServerLocaleHeaders(), next: { revalidate: 300 } }); return response.data; } catch { return null; } });
const getCategorySnapshot = cache(async () => { try { const response = await apiFetch<ListPayload<CategoryPreview>>("/catalog/categories/", { params: { has_products: true, page_size: 6 } }); const items = asArray<CategoryPreview>(response.data).slice(0, 6); return { items, count: resolveCount(response.data, response.meta?.pagination?.count) }; } catch { return { items: [] as CategoryPreview[], count: 0 }; } });
const getCollectionSnapshot = cache(async () => { try { const response = await apiFetch<ListPayload<Collection>>("/catalog/collections/", { params: { page_size: 3 } }); const items = asArray<Collection>(response.data).slice(0, 3); return { items, count: resolveCount(response.data, response.meta?.pagination?.count) }; } catch { return { items: [] as Collection[], count: 0 }; } });

async function getEndpointCount(path: string, params?: QueryParams) { try { const response = await apiFetch<ListPayload<unknown>>(path, { params: { page_size: 1, ...params } }); return resolveCount(response.data, response.meta?.pagination?.count); } catch { return 0; } }

type SocialLink = { label: string; href: string };
function getSocialLinks(siteSettings: SiteSettings | null, contactSettings: ContactSettings | null): SocialLink[] {
  const fromContactSettings = Object.entries(contactSettings?.social_links || {}).map(([key, value]) => ({ label: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()), href: normalizeExternalHref(value) })).filter((item) => item.href);
  const fromSiteSettings = SOCIAL_SITE_FIELDS.map((field) => ({ label: field.label, href: normalizeExternalHref(siteSettings?.[field.key] as string | null | undefined) })).filter((item) => item.href);
  const candidateLinks = fromContactSettings.length ? fromContactSettings : fromSiteSettings;
  const seen = new Set<string>();
  return candidateLinks.filter((item) => { const normalized = item.href.toLowerCase(); if (seen.has(normalized)) return false; seen.add(normalized); return true; });
}

export async function AboutPageContent() {
  const localeHeaders = await getServerLocaleHeaders();
  const isBengali = (localeHeaders["X-User-Language"] || "en").toLowerCase().startsWith("bn");
  const [page, siteSettings, contactSettings, categorySnapshot, collectionSnapshot, productCount, bundleCount, artisanCount] = await Promise.all([
    getAboutPage(), getSiteSettings(), getContactSettings(), getCategorySnapshot(), getCollectionSnapshot(),
    getEndpointCount("/catalog/products/"), getEndpointCount("/catalog/bundles/"), getEndpointCount("/artisans/"),
  ]);

  const brandName = pickText(siteSettings?.site_name);
  const title = page?.title || (brandName ? `About ${brandName}` : "About");
  const heroSummary = page?.excerpt || pickText(siteSettings?.site_description, siteSettings?.site_tagline, siteSettings?.tagline);
  const brandSlogan = pickText(siteSettings?.brand_slogan);
  const brandStoryTitle = pickText(siteSettings?.brand_story_title);
  const brandStoryShort = pickText(siteSettings?.brand_story_short);
  const brandStoryBody = pickText(siteSettings?.brand_story_body);
  const supportEmail = pickText(contactSettings?.support_email, siteSettings?.support_email, contactSettings?.general_email, siteSettings?.contact_email);
  const salesEmail = pickText(contactSettings?.sales_email);
  const phone = pickText(siteSettings?.contact_phone, contactSettings?.phone);
  const address = pickText(siteSettings?.contact_address, siteSettings?.address);
  const businessHours = pickText(contactSettings?.business_hours_note);
  const responseTime = pickText(siteSettings?.support_reply_time_note);
  const socialLinks = getSocialLinks(siteSettings, contactSettings);
  const updatedAtLabel = formatDate(page?.updated_at || page?.created_at);

  const stats = [
    { key: "products", label: "Products", value: productCount, href: productCount > 0 ? "/products/" : "" },
    { key: "categories", label: "Categories", value: categorySnapshot.count, href: categorySnapshot.count > 0 ? "/categories/" : "" },
    { key: "collections", label: "Collections", value: collectionSnapshot.count, href: collectionSnapshot.count > 0 ? "/collections/" : "" },
    { key: "bundles", label: "Bundles", value: bundleCount, href: bundleCount > 0 ? "/bundles/" : "" },
    { key: "artisans", label: "Artisans", value: artisanCount, href: artisanCount > 0 ? "/artisans/" : "" },
  ];

  const aboutPageSchema = cleanObject({ "@context": "https://schema.org", "@type": "AboutPage", name: page?.meta_title || title, description: page?.meta_description || heroSummary, url: absoluteUrl("/about/") });
  const organizationSchema = cleanObject({ "@context": "https://schema.org", "@type": "Organization", name: brandName, description: pickText(siteSettings?.site_description, heroSummary), url: absoluteUrl("/"), email: supportEmail || undefined, telephone: phone || undefined, address: address ? { "@type": "PostalAddress", streetAddress: address } : undefined, sameAs: socialLinks.filter((item) => /^https?:\/\//i.test(item.href)).map((item) => item.href) });

  return (
    <div className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] py-12 space-y-10">
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-background to-accent/10 px-5 sm:px-8 py-8 sm:py-10">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">About</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h1>
        {heroSummary ? <p className="mt-4 max-w-3xl text-sm sm:text-base text-muted-foreground">{stripHtml(heroSummary)}</p> : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="primary-gradient"><Link href="/products/">Explore products</Link></Button>
          <Button asChild variant="secondary"><Link href="/contact/">Contact us</Link></Button>
        </div>
      </section>

      {brandStoryTitle || brandStoryShort || brandStoryBody ? (
        <section aria-labelledby="brand-story-heading" className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-background to-accent/10">
          <div className="px-5 sm:px-8 py-8 sm:py-10">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{isBengali ? "আমাদের নাম" : "Our name"}</p>
            <h2 id="brand-story-heading" className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">{brandStoryTitle}</h2>
            {brandStoryShort ? <p className="mt-4 max-w-3xl text-sm sm:text-base font-medium text-foreground/80">{brandStoryShort}</p> : null}
            {brandStoryBody ? (
              <div className="mt-6 max-w-3xl space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
                {brandStoryBody.split(/\n{2,}/).map((paragraph) => {
                  const trimmed = paragraph.trim();
                  return trimmed ? <p key={trimmed.slice(0, 64)}>{trimmed}</p> : null;
                })}
              </div>
            ) : null}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {(isBengali ? [
                { term: "বুনন", reading: "Bunon", gloss: "বাংলা শব্দ 'বুনন' মানে বোনা — সুতো থেকে সৌন্দর্য গড়ে ওঠার ধৈর্যের শিল্প।" },
                { term: "অরোরা", reading: "Aurora", gloss: "ভোরের প্রথম আলো — সোনালি ও গোলাপি রঙে রাঙা আকাশ, আমাদের পণ্যের রঙ।" },
                { term: "বুনোরা", reading: "Bunoraa", gloss: "বুনন + অরোরা — হাতে-বোনা আলো। আমাদের নামই আমাদের প্রতিশ্রুতি।" },
              ] : [
                { term: "বুনন", reading: "Bunon", gloss: "Bengali for \"weaving\" — the patient art of turning a single thread into beauty." },
                { term: "অরোরা", reading: "Aurora", gloss: "The first light of dawn — the sky threaded with gold and rose." },
                { term: "বুনোরা", reading: "Bunoraa", gloss: "Bunon woven with Aurora — hand-embroidered light. Our name is our promise." },
              ]).map((item) => (
                <div key={item.reading} className="rounded-2xl border border-border/70 bg-card/50 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-rose-300 to-sky-400 text-sm font-bold text-white" aria-hidden="true">{item.term.slice(0, 1)}</span>
                    <div>
                      <p className="font-semibold">{item.term}</p>
                      <p className="text-xs text-muted-foreground">{item.reading}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.gloss}</p>
                </div>
              ))}
            </div>
            {brandSlogan ? (
              <p className="mt-8 border-t border-border/70 pt-6 text-center text-base sm:text-lg font-semibold italic text-foreground/90">{brandSlogan}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.filter((item) => item.value > 0).map((item) => (
          <Card key={item.key} variant="bordered" className="rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{formatCount(item.value)}</p>
            {item.href ? <Link href={item.href} className="mt-3 inline-flex text-sm text-primary">View {item.label.toLowerCase()}</Link> : null}
          </Card>
        ))}
      </section>

      {page?.content || brandName || updatedAtLabel || supportEmail || phone || businessHours || responseTime ? (
        <section className="grid gap-6 lg:grid-cols-3">
          {page?.content ? (
            <Card variant="bordered" className="lg:col-span-2 p-6 sm:p-7">
              <h2 className="text-xl font-semibold">Our story</h2>
              <div className="mt-5 max-w-none space-y-4 text-sm leading-relaxed text-muted-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_li]:text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary/80 [&_.lead]:text-base [&_.lead]:font-medium [&_.lead]:text-foreground/80" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} />
            </Card>
          ) : null}
          {brandName || updatedAtLabel || supportEmail || phone || businessHours || responseTime ? (
            <Card variant="bordered" className="p-6 sm:p-7">
              <h2 className="text-xl font-semibold">Quick facts</h2>
              <dl className="mt-5 space-y-3 text-sm">
                {brandName ? <div><dt className="text-muted-foreground">Brand</dt><dd className="font-medium">{brandName}</dd></div> : null}
                {updatedAtLabel ? <div><dt className="text-muted-foreground">Page updated</dt><dd className="font-medium">{updatedAtLabel}</dd></div> : null}
                {supportEmail ? <div><dt className="text-muted-foreground">Support</dt><dd><Link href={`mailto:${supportEmail}`} className="font-medium text-primary">{supportEmail}</Link></dd></div> : null}
                {phone ? <div><dt className="text-muted-foreground">Phone</dt><dd><Link href={`tel:${phone}`} className="font-medium text-primary">{phone}</Link></dd></div> : null}
                {businessHours ? <div><dt className="text-muted-foreground">Business hours</dt><dd className="font-medium">{businessHours}</dd></div> : null}
                {responseTime ? <div><dt className="text-muted-foreground">Support response time</dt><dd className="font-medium">{responseTime}</dd></div> : null}
              </dl>
            </Card>
          ) : null}
        </section>
      ) : null}

      {categorySnapshot.items.length || collectionSnapshot.items.length ? (
        <section className="grid gap-6 lg:grid-cols-2">
          {categorySnapshot.items.length ? (
            <Card variant="bordered" className="p-6 sm:p-7">
              <h2 className="text-xl font-semibold">Top categories</h2>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {categorySnapshot.items.map((category) => (
                  <Link key={category.id} href={buildCategoryPath(category.slug_path || category.slug)} className="inline-flex items-center rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm hover:bg-muted">
                    {category.name}
                    {typeof category.product_count === "number" ? <span className="ml-2 text-xs text-muted-foreground">{category.product_count}</span> : null}
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
          {collectionSnapshot.items.length ? (
            <Card variant="bordered" className="p-6 sm:p-7">
              <h2 className="text-xl font-semibold">Featured collections</h2>
              <ul className="mt-5 space-y-3">
                {collectionSnapshot.items.map((collection) => (
                  <li key={collection.id}><Link href={`/collections/${collection.slug}/`} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card/40 px-3 py-3 text-sm transition hover:border-border"><span className="font-medium">{collection.name}</span><span className="text-muted-foreground">View</span></Link></li>
                ))}
              </ul>
            </Card>
          ) : null}
        </section>
      ) : null}

      {supportEmail || salesEmail || phone || address || socialLinks.length ? (
        <section className="grid gap-6 lg:grid-cols-2">
          {supportEmail || salesEmail || phone || address ? (
            <Card variant="bordered" className="p-6 sm:p-7">
              <h2 className="text-xl font-semibold">Contact & support</h2>
              <div className="mt-5 space-y-3 text-sm">
                {supportEmail ? <p><span className="text-muted-foreground">Support:</span> <Link href={`mailto:${supportEmail}`} className="text-primary">{supportEmail}</Link></p> : null}
                {salesEmail ? <p><span className="text-muted-foreground">Sales:</span> <Link href={`mailto:${salesEmail}`} className="text-primary">{salesEmail}</Link></p> : null}
                {phone ? <p><span className="text-muted-foreground">Phone:</span> <Link href={`tel:${phone}`} className="text-primary">{phone}</Link></p> : null}
                {address ? <p><span className="text-muted-foreground">Address:</span> {address}</p> : null}
              </div>
            </Card>
          ) : null}
          {socialLinks.length ? (
            <Card variant="bordered" className="p-6 sm:p-7">
              <h2 className="text-xl font-semibold">Follow {brandName || "us"}</h2>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 text-sm">
                {socialLinks.map((link) => (
                  <li key={`${link.label}-${link.href}`}><Link href={link.href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-border/70 bg-card/40 px-3 py-2.5 transition hover:border-border"><span>{link.label}</span><span className="text-muted-foreground">Visit</span></Link></li>
                ))}
              </ul>
            </Card>
          ) : null}
        </section>
      ) : null}

      <JsonLd data={[aboutPageSchema, organizationSchema]} />
    </div>
  );
}
