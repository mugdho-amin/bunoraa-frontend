import type { Metadata } from "next";
import { getServerLang } from "@/lib/serverLocale";
import { buildPageMetadata, buildPageKeywords } from "@/lib/seo";
import { BlogPostPageContent } from "@/components/blog/BlogPostPageContent";
import { getBlogPostMeta } from "@/lib/blog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [post, lang] = await Promise.all([getBlogPostMeta(slug), getServerLang()]);
  return buildPageMetadata({
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "Read more on Bunoraa's embroidery blog.",
    path: `/blog/${post.slug}/`,
    images: post.featured_image ? [post.featured_image] : undefined,
    keywords: buildPageKeywords(post.title, post.excerpt, post.meta_keywords, lang),
    type: "article", lang,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostPageContent slug={slug} />;
}
