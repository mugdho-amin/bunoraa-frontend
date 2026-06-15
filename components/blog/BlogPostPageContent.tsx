import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import type { BlogPostDetail } from "@/lib/types";
import { notFound } from "next/navigation";
import { sanitizeHtml } from "@/lib/sanitize";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbList, absoluteUrl } from "@/lib/seo";

const getBlogPost = cache(async (slug: string) => {
  try { const response = await apiFetch<BlogPostDetail>(`/pages/blog/${slug}/`, { headers: await getServerLocaleHeaders() }); return response.data; }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
});

export async function BlogPostPageContent({ slug }: { slug: string }) {
  const post = await getBlogPost(slug);
  const breadcrumbs = buildBreadcrumbList([{ name: "Home", url: "/" }, { name: "Blog", url: "/blog/" }, { name: post.title, url: `/blog/${post.slug}/` }]);
  const articleSchema = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.excerpt || undefined, image: post.featured_image ? absoluteUrl(post.featured_image) : undefined, datePublished: post.published_at || post.created_at, dateModified: post.updated_at || post.published_at || post.created_at, author: post.author_name ? { "@type": "Person", name: post.author_name } : undefined };

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-5 py-12">
      <div className="mb-8">
        {post.category_name ? <Link href="/blog/" className="text-xs uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors">{post.category_name}</Link> : <Link href="/blog/" className="text-xs uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground/80 transition-colors">Blog</Link>}
        <h1 className="mt-2 text-3xl font-semibold">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-foreground/60">
          {post.author_name ? <span>By {post.author_name}</span> : null}
          {post.published_at ? <time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time> : null}
          {post.reading_time_minutes ? <span>{post.reading_time_minutes} min read</span> : null}
        </div>
      </div>
      {post.featured_image ? <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl bg-muted"><Image src={post.featured_image} alt={post.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 896px" priority decoding="async" /></div> : null}
      {post.content ? <article className="prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} /> : null}
      {post.tags?.length ? <div className="mt-8 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">{tag}</span>)}</div> : null}
      <JsonLd data={[breadcrumbs, articleSchema]} />
    </div>
  );
}
