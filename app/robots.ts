import type { MetadataRoute } from "next";
import { getBackendBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Sitemaps are served from the backend/API, not the frontend
  const backendBaseUrl = getBackendBaseUrl();
  const sitemapUrl = `${backendBaseUrl}/sitemap.xml`;

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
        "/api/schema/",
        "/api/schema/swagger-ui/",
        "/api/schema/redoc/",
      ],
    },
    sitemap: sitemapUrl,
  };
}
