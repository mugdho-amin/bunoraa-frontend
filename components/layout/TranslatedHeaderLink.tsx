"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

interface TranslatedHeaderLinkProps {
  href: string;
  className?: string;
  labelKey: string;
  badgeKey?: string;
}

export function TranslatedHeaderLink({ 
  href, 
  className, 
  labelKey, 
  badgeKey 
}: TranslatedHeaderLinkProps) {
  const { t } = useTranslation();
  
  return (
    <Link
      className={className}
      href={href}
      prefetch={false}
    >
      {t(labelKey)}
      {badgeKey && (
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70 group-hover:text-white/80 xl:inline">
          {t(badgeKey)}
        </span>
      )}
    </Link>
  );
}
