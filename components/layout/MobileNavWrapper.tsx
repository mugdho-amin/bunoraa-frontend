"use client";

import { MobileNav } from "@/components/layout/MobileNav";
import type { MenuPage } from "@/lib/types";

type Category = { id: string; name: string; slug: string };

interface MobileNavWrapperProps {
  categories: Category[];
  menuPages: MenuPage[];
  hasBundles: boolean;
}

export function MobileNavWrapper({
  categories,
  menuPages,
  hasBundles,
}: MobileNavWrapperProps) {
  return (
    <MobileNav
      categories={categories}
      menuPages={menuPages}
      hasBundles={hasBundles}
    />
  );
}
