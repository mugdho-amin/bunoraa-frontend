import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import type { BlogPostListItem } from "@/lib/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildItemList } from "@/lib/seo";
import { Card } from "@/components/ui/Card";

async function getBlogPosts() {
  try { const response = await apiFetch<BlogPostListItem[]>("/pages/blog/"); return Array.isArray(response.data) ? response.data : []; }
  catch (error) { if (error instanceof ApiError && (error.status === 404 || error.status === 503)) return []; throw error; }
}

export async function BlogPageContent() {
  const posts = await getBlogPosts();
  if (!posts.length) notFound();
  const itemList = buildItemList(posts.map((post) => ({ name: post.title, url: `/blog/${post.slug}/`, image: post.featured_image || undefined, description: post.excerpt || undefined })), "Blog Posts", "/blog/#itemlist");

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 py-12">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Blog</p>
        <h1 className="text-3xl font-semibold">Embroidery Blog & Guides</h1>
        <p className="mt-2 text-foreground/70">Care guides, stitching techniques, artisan stories, and Bangladeshi craft inspiration.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}/`} className="group block">
            <Card variant="bordered" className="flex flex-col gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                {post.featured_image ? <Image src={post.featured_image} alt={post.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" loading="lazy" decoding="async" /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
                <div className="flex items-center gap-2 text-xs text-foreground/60">
                  {post.category_name ? <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">{post.category_name}</span> : null}
                  {post.reading_time_minutes ? <span>{post.reading_time_minutes} min read</span> : null}
                </div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{post.title}</h2>
                {post.excerpt ? <p className="text-sm text-foreground/70 line-clamp-2">{post.excerpt}</p> : null}
                {post.author_name ? <p className="text-xs text-foreground/50 mt-auto">By {post.author_name}</p> : null}
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <JsonLd data={[itemList]} />
    </div>
  );
}
