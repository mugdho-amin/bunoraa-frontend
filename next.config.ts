import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import path from "path";

const remotePatterns: RemotePattern[] = [
  {
    protocol: "http",
    hostname: "localhost",
    port: "8000",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.amazonaws.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.r2.cloudflarestorage.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.digitaloceanspaces.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "media.**",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "cdn.**",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.bunoraa.com",
    pathname: "/**",
  },
];

const shouldDisableImageOptimization = process.env.NODE_ENV !== "production";
const isProduction = process.env.NODE_ENV === "production";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.googletagmanager.com https://cdn.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://accounts.google.com;
  img-src 'self' blob: data: https: http:;
  font-src 'self' data:;
  connect-src 'self' https: http: ws: wss: https://accounts.google.com https://www.google-analytics.com;
  frame-src 'self' https://accounts.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`;

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), browsing-topics=()",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

if (isProduction) {
  securityHeaders.push({
    key: "Content-Security-Policy",
    value: cspHeader.replace(/\s{2,}/g, " ").trim(),
  });
}

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    loader: "custom",
    loaderFile: "./lib/r2-loader.ts",
    remotePatterns,
    unoptimized: shouldDisableImageOptimization,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    qualities: [60, 64, 70, 72, 75],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  output: "standalone",
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname),
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/catalog", destination: "/", permanent: true },
      { source: "/catalog/", destination: "/", permanent: true },
      { source: "/catalog/products/:path*", destination: "/products/:path*", permanent: true },

      { source: "/catalog/category/women/:path*", destination: "/women/:path*", permanent: true },
      { source: "/catalog/category/men/:path*", destination: "/men/:path*", permanent: true },
      { source: "/catalog/category/kids/:path*", destination: "/kids/:path*", permanent: true },
      { source: "/catalog/category/home-decor/:path*", destination: "/home-decor/:path*", permanent: true },
      { source: "/catalog/category/techniques/:path*", destination: "/techniques/:path*", permanent: true },
      { source: "/catalog/category/collections/:path*", destination: "/collections/:path*", permanent: true },

      { source: "/products/category/:path*", destination: "/categories/:path*", permanent: true },
      { source: "/categories/category/:path*", destination: "/categories/:path*", permanent: true },

      { source: "/categories/women/:path*", destination: "/women/:path*", permanent: true },
      { source: "/categories/women/", destination: "/women/", permanent: true },
      { source: "/categories/men/:path*", destination: "/men/:path*", permanent: true },
      { source: "/categories/men/", destination: "/men/", permanent: true },
      { source: "/categories/kids/:path*", destination: "/kids/:path*", permanent: true },
      { source: "/categories/kids/", destination: "/kids/", permanent: true },
      { source: "/categories/home-decor/:path*", destination: "/home-decor/:path*", permanent: true },
      { source: "/categories/home-decor/", destination: "/home-decor/", permanent: true },
      { source: "/categories/techniques/:path*", destination: "/techniques/:path*", permanent: true },
      { source: "/categories/techniques/", destination: "/techniques/", permanent: true },
      { source: "/categories/collections/:path*", destination: "/collections/:path*", permanent: true },
      { source: "/categories/collections/", destination: "/collections/", permanent: true },

      { source: "/account/", destination: "/account/profile/", permanent: false },
      { source: "/account/dashboard/", destination: "/account/profile/", permanent: false },
      {
        source: "/account/notifications/preferences/",
        destination: "/account/notifications/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.bunoraa.com";
    const apiBaseUrl = backendBaseUrl.replace(/\/api\/v\d+\/?$/, "");

    return [
      {
        source: "/sitemap.xml",
        destination: `${apiBaseUrl}/sitemap.xml`,
      },
      {
        source: "/sitemap-:section.xml",
        destination: `${apiBaseUrl}/sitemap-:section.xml`,
      },
      {
        source: "/admin/:path*/",
        destination: `${apiBaseUrl}/admin/:path*/`,
      },
      {
        source: "/health/:path*/",
        destination: `${apiBaseUrl}/health/:path*/`,
      },
      {
        source: "/status",
        destination: `${apiBaseUrl}/status`,
      },
      {
        source: "/oauth/:path*/",
        destination: `${apiBaseUrl}/oauth/:path*/`,
      },
      {
        source: "/email/:path*/",
        destination: `${apiBaseUrl}/email/:path*/`,
      },
      {
        source: "/api/schema/:path*/",
        destination: `${apiBaseUrl}/api/schema/:path*/`,
      },
    ];
  },
};

export default nextConfig;
