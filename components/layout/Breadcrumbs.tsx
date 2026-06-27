"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  name: string;
  url: string;
};

function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@id": item.url.startsWith("http") ? item.url : `https://bunoraa.com${item.url}`,
        name: item.name,
      },
    })),
  };
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(items)),
        }}
      />
      <nav
        aria-label="Breadcrumb"
        className={cn("flex items-center space-x-2 text-[11px] font-normal tracking-wide text-foreground/40", className)}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={item.url}>
              {index > 0 && (
                <span className="text-[10px] opacity-60 px-0.5" aria-hidden="true">&gt;</span>
              )}
              {isLast ? (
                <span className="truncate max-w-[150px] sm:max-w-none text-foreground/50" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
}
