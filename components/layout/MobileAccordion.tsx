"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Mail, PhoneCall, MapPinHouse } from "lucide-react";
import { SocialIcon } from "@/components/layout/SocialIcon";

const CONTACT_ICON_MAP = {
  email: Mail,
  phone: PhoneCall,
  address: MapPinHouse,
} as const;

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

