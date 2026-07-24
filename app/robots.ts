import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bunoraa.com";
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/cart/",
          "/checkout/",
          "/account/",
          "/wishlist/",
          "/search/",
          "/oauth/",
          "/email/",
          "/health/",
          "/status/",
          "/_next/",
          "/404",
          "/500",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ClaudeBot",
        disallow: "/",
      },
    ],
    sitemap: sitemapUrl,
  };
}
