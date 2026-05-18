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

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    loader: 'custom',
    loaderFile: './lib/r2-loader.ts',
    remotePatterns,
    unoptimized: shouldDisableImageOptimization,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    qualities: [60, 64, 72, 75],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: false,
  output: 'standalone',
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@hookform/resolvers",
      "zod",
    ],
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
    optimizeCss: false,
  },
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname),
    },
  },
  async redirects() {
    return [
      { source: "/catalog", destination: "/", permanent: true },
      { source: "/catalog/", destination: "/", permanent: true },
      { source: "/catalog/products/:path*", destination: "/products/:path*", permanent: true },

      // Direct Taxonomy Mapping: Resolves /catalog/category/ and /categories/ legacy paths straight to flat root folders
      { source: "/catalog/category/women/:path*", destination: "/women/:path*", permanent: true },
      { source: "/catalog/category/men/:path*", destination: "/men/:path*", permanent: true },
      { source: "/catalog/category/kids/:path*", destination: "/kids/:path*", permanent: true },
      { source: "/catalog/category/home-decor/:path*", destination: "/home-decor/:path*", permanent: true },
      { source: "/catalog/category/techniques/:path*", destination: "/techniques/:path*", permanent: true },
      { source: "/catalog/category/collections/:path*", destination: "/collections/:path*", permanent: true },

      { source: "/products/category/:path*", destination: "/categories/:path*", permanent: true },
      { source: "/categories/category/:path*", destination: "/categories/:path*", permanent: true },

      // Clean, unnested redirects for absolute paths
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

      // Client Dashboard Management Accounts
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
    ];
  },
};

export default nextConfig;
