export default function r2Loader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const q = quality || 75;

  if (src.startsWith('http://') || src.startsWith('https://')) {
    const url = new URL(src);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', q.toString());
    url.searchParams.set('auto', 'format');
    return url.toString();
  }

  const relativePath = src.startsWith('/') ? src.slice(1) : src;
  const baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_MEDIA_BASE_URL is not set. Required for image loading.");
  }

  const params = new URLSearchParams();
  params.set('w', width.toString());
  params.set('q', q.toString());
  params.set('auto', 'format');

  return `${baseUrl}/${relativePath}?${params.toString()}`;
}
