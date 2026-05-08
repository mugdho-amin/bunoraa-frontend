"use client";

/**
 * Cloudflare R2 / Custom Image Loader for Next.js.
 * Optimizes image delivery by appending transformation parameters
 * and ensuring the correct R2 public domain is used.
 */
export default function r2Loader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If absolute URL and not on our media domain, return as is
  if (src.startsWith('http') && !src.includes('media.bunoraa.com')) {
    return src;
  }

  // Ensure src doesn't start with a slash if it's a relative path
  const relativePath = src.startsWith('/') ? src.slice(1) : src;
  
  // Base media URL from environment or fallback
  const baseUrl = process.env.NEXT_PUBLIC_MEDIA_URL || 'https://media.bunoraa.com';
  
  // Construct URL with optimization parameters (if supported by the edge/proxy)
  // Cloudflare Images / Polish often use query params or path segments
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (quality) params.set('q', (quality || 75).toString());
  params.set('auto', 'format'); // AVIF/WebP detection

  const queryString = params.toString();
  return `${baseUrl}/${relativePath}${queryString ? `?${queryString}` : ''}`;
}
