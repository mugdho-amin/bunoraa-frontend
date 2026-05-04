import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import path from "path";

const remotePatterns: RemotePattern[] = [
  // Localhost for development
  {
    protocol: "http",
    hostname: "localhost",
    port: "8000",
    pathname: "/**",
  },
  // S3 and S3-compatible services (AWS, Cloudflare R2, DigitalOcean Spaces, etc.)
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
  // Generic media/CDN domains
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

const shouldDisableImageOptimization =
  process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns,
    unoptimized: shouldDisableImageOptimization,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    qualities: [60, 64, 72, 75],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: false,
  experimental: {
    optimizePackageImports: [
      "@/components",
      "@/lib",
      "@/app",
    ],
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
      { source: "/catalog/category/:path*", destination: "/categories/:path*", permanent: true },
      { source: "/products/category/:path*", destination: "/categories/:path*", permanent: true },
      { source: "/categories/category/:path*", destination: "/categories/:path*", permanent: true },
      { source: "/account/", destination: "/account/profile/", permanent: false },
      { source: "/account/dashboard/", destination: "/account/profile/", permanent: false },
      {
        source: "/account/notifications/preferences/",
        destination: "/account/notifications/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
