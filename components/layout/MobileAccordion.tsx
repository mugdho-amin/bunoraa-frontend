"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronRight, Mail, PhoneCall, MapPinHouse } from "lucide-react";

const CONTACT_ICON_MAP = {
  email: Mail,
  phone: PhoneCall,
  address: MapPinHouse,
} as const;

function SocialIcon({ platform, iconUrl }: { platform: string; iconUrl?: string | null }) {
  const iconClass = "h-4 w-4";
  if (iconUrl) {
    return <Image src={iconUrl} alt="" aria-hidden width={16} height={16} unoptimized className={iconClass} />;
  }
  switch (platform) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.2c0-.9.3-1.5 1.6-1.5h1.3V5c-.2 0-.9-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.2V11H9v3h2.6v7h1.9z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
        </svg>
      );
    case "twitter":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-6.8 7.7L23 22h-6.1l-4.8-6.2L6.7 22H3.6l7.3-8.3L3.4 2h6.3l4.4 5.8L18.9 2zm-1.1 18h1.7L8.2 3.9H6.5L17.8 20z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M6.4 8.8a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zM4.8 10.3H8V20H4.8zM10 10.3h3v1.4h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7V20h-3.2v-4.4c0-1-.1-2.4-1.5-2.4s-1.7 1.1-1.7 2.3V20H10z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28.4 28.4 0 0 0 2 12c0 1.6.1 3.2.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28.4 28.4 0 0 0 22 12c0-1.6-.1-3.2-.4-4.8zM10 15.8V8.2L16 12z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M15.7 3c.5 1.6 1.4 2.6 3.1 3V8a7 7 0 0 1-3.1-1v6.5a5.1 5.1 0 1 1-5.1-5.1h.6v2a3.1 3.1 0 1 0 2.5 3V3h2z" />
        </svg>
      );
    case "pinterest":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-2 .3-2.9l1.7-7.2s-.4-.9-.4-2.2c0-2.1 1.2-3.6 2.7-3.6 1.3 0 1.9 1 1.9 2.1 0 1.3-.8 3.3-1.2 5.1-.3 1.5.7 2.7 2.2 2.7 2.6 0 4.4-3.3 4.4-7.2 0-3-2-5.3-5.7-5.3-4.2 0-6.8 3.1-6.8 6.5 0 1.2.3 2.1.8 2.8.2.2.2.3.1.6l-.3 1.2c-.1.4-.4.5-.8.4-2-.8-2.9-2.9-2.9-5.3 0-3.9 3.3-8.6 9.8-8.6 5.2 0 8.6 3.8 8.6 7.8 0 5.3-3 9.2-7.5 9.2-1.5 0-2.8-.8-3.3-1.8l-.9 3.5c-.3 1.1-.8 2.1-1.2 2.9.9.3 1.9.5 2.9.5A10 10 0 0 0 12 2z" />
        </svg>
      );
    default:
      return (
        <span className="flex h-4 w-4 items-center justify-center text-[10px] font-bold text-muted-foreground">
          ?
        </span>
      );
  }
}

type ContactItem = {
  key: string;
  kind: string;
  label?: string;
  value: string;
  href?: string;
};

type SocialLink = {
  platform: string;
  url: string;
  label?: string;
  icon?: string | null;
};

type LinkItem = {
  key: string;
  href: string;
  label: string;
  isCta?: boolean;
};

type MobileAccordionProps = {
  footerAccordionClass: string;
  footerSummaryClass: string;
  footerListClass: string;
  footerListLinkClass: string;
  shopBrowseAllCtaClass: string;
  socialIconLinkClass: string;
  shopLinks: LinkItem[];
  collectionLinks: LinkItem[];
  companySupportLinks: LinkItem[];
  contactItems: ContactItem[];
  socialLinks: SocialLink[];
  contactIconSize: number;
  contactIconStroke: number;
  contactIconContainerClass?: string;
};

export function MobileAccordion({
  footerAccordionClass,
  footerSummaryClass,
  footerListClass,
  footerListLinkClass,
  shopBrowseAllCtaClass,
  socialIconLinkClass,
  shopLinks,
  collectionLinks,
  companySupportLinks,
  contactItems,
  socialLinks,
  contactIconSize,
  contactIconStroke,
  contactIconContainerClass = "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground",
}: MobileAccordionProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleToggle = (event: Event) => {
      const target = event.target as HTMLElement;
      const details = target.closest("details");
      if (!details || !container.contains(details)) return;
      if (!details.open) return;

      const siblings = container.querySelectorAll("details");
      for (const sibling of siblings) {
        if (sibling !== details && sibling.open) {
          sibling.open = false;
        }
      }
    };

    const detailsElements = container.querySelectorAll<HTMLDetailsElement>("details");
    detailsElements.forEach((el) => {
      el.addEventListener("toggle", handleToggle);
    });
    return () => {
      detailsElements.forEach((el) => {
        el.removeEventListener("toggle", handleToggle);
      });
    };
  }, []);

  return (
    <div ref={containerRef} className="space-y-3">
      <details className={footerAccordionClass} open>
        <summary className={footerSummaryClass}>
          <span>Shop</span>
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180"
            strokeWidth={1.8}
          />
        </summary>
        <ul className={footerListClass}>
          {shopLinks.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={
                  item.isCta ? `${shopBrowseAllCtaClass} group` : footerListLinkClass
                }
              >
                <span>{item.label}</span>
                {item.isCta ? (
                  <ChevronRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={1.8}
                  />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </details>

      <details className={footerAccordionClass}>
        <summary className={footerSummaryClass}>
          <span>Collections</span>
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180"
            strokeWidth={1.8}
          />
        </summary>
        <ul className={footerListClass}>
          {collectionLinks.map((item) => (
            <li key={item.key}>
              <Link href={item.href} className={footerListLinkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>

      <details className={footerAccordionClass}>
        <summary className={footerSummaryClass}>
          <span>Company & Support</span>
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180"
            strokeWidth={1.8}
          />
        </summary>
        <ul className={footerListClass}>
          {companySupportLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={footerListLinkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>

      <details className={footerAccordionClass}>
        <summary className={footerSummaryClass}>
          <span>Contact & Location</span>
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180"
            strokeWidth={1.8}
          />
        </summary>
        <ul className={footerListClass}>
          {contactItems.map((item) => {
            const Icon = CONTACT_ICON_MAP[item.kind as keyof typeof CONTACT_ICON_MAP] || Mail;
            return (
              <li key={item.key} className="flex items-start gap-2">
                <span
                  className={contactIconContainerClass}
                  aria-hidden="true"
                >
                  <Icon
                    size={contactIconSize}
                    strokeWidth={contactIconStroke}
                  />
                </span>
                <span className="sr-only">
                  {item.label || item.kind}
                </span>
                {item.href ? (
                  <Link href={item.href}>{item.value}</Link>
                ) : (
                  <span>{item.value}</span>
                )}
              </li>
            );
          })}
          {socialLinks.length ? (
            <li className="pt-1">
              <div className="flex items-center gap-2">
                {socialLinks.map((link) => (
                  <Link
                    key={`mobile-social-${link.platform}-${link.url}`}
                    href={link.url}
                    className={socialIconLinkClass}
                    aria-label={link.label}
                    title={link.label}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <SocialIcon platform={link.platform} iconUrl={link.icon} />
                  </Link>
                ))}
              </div>
            </li>
          ) : null}
        </ul>
      </details>
    </div>
  );
}

