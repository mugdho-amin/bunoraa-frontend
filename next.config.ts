import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import path from "path";
import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";

// next.config.ts is processed by Next.js, not compiled by standard tsc.
// The @next/bundle-analyzer import is only resolved at build time when ANALYZE=true.
let withBundleAnalyzer: (config: NextConfig) => NextConfig = (c) => c;
if (process.env.ANALYZE === "true") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    withBundleAnalyzer = require("@next/bundle-analyzer")();
  } catch {
    console.warn("⚠ @next/bundle-analyzer not installed. Run: npm install -D @next/bundle-analyzer");
  }
}

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

// NOTE: CSP is applied only in production (see below).
// TODO: Migrate to nonce-based CSP for stronger protection.
// Implementation plan:
//   1. Add middleware.ts (or proxy.ts for Next.js 16+)
//   2. Generate a unique nonce per request: Buffer.from(crypto.randomUUID()).toString('base64')
//   3. Set nonce in CSP header: script-src 'self' 'nonce-{nonce}' 'strict-dynamic'
//   4. Pass nonce via x-nonce header and use <Script nonce={nonce}> in layout
//   5. Pages must use dynamic rendering: export const dynamic = 'force-dynamic'
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.googletagmanager.com https://cdn.cloudflare.com;
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

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: "/~offline/", revision: randomUUID() },
  ],
  disable: !isProduction,
  reloadOnOnline: true,
  globPublicPatterns: ["favicon.ico", "icon.png", "apple-icon.png", "site.webmanifest"],
});

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  serverExternalPackages: [],
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
    // WARNING: SVG uploads can contain embedded scripts (XSS vector).
    // Server-side SVG sanitization is REQUIRED before upload:
    //   - Use a library like 'sanitize-svg' or DOMPurify with SVG profile on the backend
    //   - Strip <script>, on*, data:, and javascript: URIs
    //   - The contentSecurityPolicy below provides a defense-in-depth layer
    //     by blocking script execution in image contexts.
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
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backendBaseUrl) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL environment variable is required for rewrites. Set it to your backend API URL.");
    }
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

export default withSerwist(withBundleAnalyzer(nextConfig));
