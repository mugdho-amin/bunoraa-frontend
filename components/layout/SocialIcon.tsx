import Image from "next/image";
import { CircleMinus } from "lucide-react";

const KNOWN_PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
  "tiktok",
  "pinterest",
] as const;

type KnownPlatform = (typeof KNOWN_PLATFORMS)[number];

const normalizePlatform = (value?: string | null) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
  return normalized.replace(/-url$/, "");
};

const detectPlatform = (
  platform?: string | null,
  iconUrl?: string | null
): KnownPlatform | null => {
  const fromName = normalizePlatform(platform);
  if (KNOWN_PLATFORMS.includes(fromName as KnownPlatform)) {
    return fromName as KnownPlatform;
  }
  const url = String(iconUrl || "").toLowerCase();
  const fromUrl = KNOWN_PLATFORMS.find((name) => url.includes(name));
  return fromUrl || null;
};

export function SocialIcon({
  platform,
  iconUrl,
  className = "h-4 w-4 object-contain",
}: {
  platform?: string | null;
  iconUrl?: string | null;
  className?: string;
}) {
  const detected = detectPlatform(platform, iconUrl);

  if (detected === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.2c0-.9.3-1.5 1.6-1.5h1.3V5c-.2 0-.9-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.2V11H9v3h2.6v7h1.9z" />
      </svg>
    );
  }

  if (detected === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  if (detected === "twitter") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M18.9 2H22l-6.8 7.7L23 22h-6.1l-4.8-6.2L6.7 22H3.6l7.3-8.3L3.4 2h6.3l4.4 5.8L18.9 2zm-1.1 18h1.7L8.2 3.9H6.5L17.8 20z" />
      </svg>
    );
  }

  if (detected === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M6.4 8.8a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zM4.8 10.3H8V20H4.8zM10 10.3h3v1.4h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7V20h-3.2v-4.4c0-1-.1-2.4-1.5-2.4s-1.7 1.1-1.7 2.3V20H10z" />
      </svg>
    );
  }

  if (detected === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28.4 28.4 0 0 0 2 12c0 1.6.1 3.2.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28.4 28.4 0 0 0 22 12c0-1.6-.1-3.2-.4-4.8zM10 15.8V8.2L16 12z" />
      </svg>
    );
  }

  if (detected === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M15.7 3c.5 1.6 1.4 2.6 3.1 3V8a7 7 0 0 1-3.1-1v6.5a5.1 5.1 0 1 1-5.1-5.1h.6v2a3.1 3.1 0 1 0 2.5 3V3h2z" />
      </svg>
    );
  }

  if (detected === "pinterest") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-2 .3-2.9l1.7-7.2s-.4-.9-.4-2.2c0-2.1 1.2-3.6 2.7-3.6 1.3 0 1.9 1 1.9 2.1 0 1.3-.8 3.3-1.2 5.1-.3 1.5.7 2.7 2.2 2.7 2.6 0 4.4-3.3 4.4-7.2 0-3-2-5.3-5.7-5.3-4.2 0-6.8 3.1-6.8 6.5 0 1.2.3 2.1.8 2.8.2.2.2.3.1.6l-.3 1.2c-.1.4-.4.5-.8.4-2-.8-2.9-2.9-2.9-5.3 0-3.9 3.3-8.6 9.8-8.6 5.2 0 8.6 3.8 8.6 7.8 0 5.3-3 9.2-7.5 9.2-1.5 0-2.8-.8-3.3-1.8l-.9 3.5c-.3 1.1-.8 2.1-1.2 2.9.9.3 1.9.5 2.9.5A10 10 0 0 0 12 2z" />
      </svg>
    );
  }

  if (iconUrl) {
    return (
      <Image
        src={iconUrl}
        alt={`${platform || ""} icon`}
        width={16}
        height={16}
        className={className}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return <CircleMinus className={className} aria-hidden="true" strokeWidth={1.8} />;
}
