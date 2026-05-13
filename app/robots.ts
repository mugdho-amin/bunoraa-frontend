import type { MetadataRoute } from "next";
import { getBackendBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Sitemaps are proxied from the backend to the frontend domain
  const sitemapUrl = "https://bunoraa.com/sitemap.xml";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/oauth/",
        "/email/",
        "/health/",
        "/status/",
        "/api/schema/",
        "/api/schema/swagger-ui/",
        "/api/schema/redoc/",
      ],
    },
    sitemap: sitemapUrl,
  };
}
