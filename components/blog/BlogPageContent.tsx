import Link from "next/link";
import Image from "next/image";
import { apiFetch, ApiError } from "@/lib/api";
import type { BlogPostListItem } from "@/lib/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildItemList } from "@/lib/seo";
import { Card } from "@/components/ui/Card";

async function getBlogPosts() {
  try {
    const response = await apiFetch<BlogPostListItem[]>("/cms/blog/");
    return {
      posts: Array.isArray(response.data) ? response.data : [],
      unavailable: false,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { posts: [], unavailable: false };
    }
    if (error instanceof ApiError && error.status === 503) {
      return { posts: [], unavailable: true };
    }
    throw error;
  }
}

export async function BlogPageContent() {
  const { posts, unavailable } = await getBlogPosts();
  if (!posts.length) {
    return (
      <div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-16 text-center sm:py-20">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Bunoraa Journal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Embroidery Blog &amp; Guides</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          {unavailable
            ? "Our journal is temporarily unavailable. Browse the collection while we restore it."
            : "We’re preparing stories, care guides, and artisan features. In the meantime, explore the pieces made by our artisan community."}
        </p>
        <Link
          href="/products/"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Browse products
        </Link>
      </div>
    );
  }
  const itemList = buildItemList(posts.map((post) => ({ name: post.title, url: `/blog/${post.slug}/`, image: post.featured_image || undefined, description: post.excerpt || undefined })), "Blog Posts", "/blog/#itemlist");

  return (
    <div className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] py-12">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Blog</p>
        <h1 className="text-3xl font-semibold">Embroidery Blog & Guides</h1>
        <p className="mt-2 text-muted-foreground">Care guides, stitching techniques, artisan stories, and Bangladeshi craft inspiration.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}/`} className="group block">
            <Card variant="bordered" className="flex flex-col gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                {post.featured_image ? <Image src={post.featured_image} alt={post.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" loading="lazy" decoding="async" /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {post.category_name ? <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">{post.category_name}</span> : null}
                  {post.reading_time_minutes ? <span>{post.reading_time_minutes} min read</span> : null}
                </div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{post.title}</h2>
                {post.excerpt ? <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p> : null}
                {post.author_name ? <p className="text-xs text-muted-foreground mt-auto">By {post.author_name}</p> : null}
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <JsonLd data={[itemList]} />
    </div>
  );
}
