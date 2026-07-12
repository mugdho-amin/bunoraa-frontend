"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { MenuPage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildCategoryPath } from "@/lib/categoryPaths";
import {
  X,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Heart,
  User,
  LogIn,
  UserPlus,
  Package,
  LayoutGrid,
  Layers,
  Tags,
  FileText,
  HelpCircle,
  Mail,
  ArrowRightLeft,
  UserPlus2,
  ClipboardList,
  Sparkles,
} from "lucide-react";

type Category = { id: string; name: string; slug: string; slug_path?: string | null };

/* ── Section header component ── */
const SectionHeader = ({
  icon: Icon,
  label,
  isOpen,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50 transition hover:text-foreground/70"
    onClick={onToggle}
    aria-expanded={isOpen}
  >
    <span className="inline-flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
    {isOpen ? (
      <ChevronDown className="h-3.5 w-3.5" />
    ) : (
      <ChevronRight className="h-3.5 w-3.5" />
    )}
  </button>
);

/* ── Nav link with icon ── */
const NavLink = ({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
  badge,
  highlight,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: string;
  highlight?: boolean;
}) => (
  <Link
    className={cn(
      "flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
      "border-transparent text-foreground/80 hover:border-border hover:bg-muted hover:text-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      isActive && "border-primary/25 bg-primary/10 text-primary shadow-xs",
      highlight &&
        !isActive &&
        "border-primary/30 bg-primary/5 font-medium text-primary"
    )}
    href={href}
    onClick={onClick}
  >
    <Icon className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
    <span className="flex-1 text-left">{label}</span>
    {badge ? (
      <span className="badge-pill bg-primary/15 text-primary">
        {badge}
      </span>
    ) : (
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-foreground/25" aria-hidden="true" />
    )}
  </Link>
);

export function MobileNav({
  categories,
  menuPages,
  hasBundles,
}: {
  categories: Category[];
  menuPages: MenuPage[];
  hasBundles: boolean;
}) {
  const pathname = usePathname();
  const { hasToken, profileQuery, accounts, activeAccountId, switchAccount } = useAuthContext();
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = React.useRef(false);

  const accountLabel =
    profileQuery.data?.full_name ||
    profileQuery.data?.first_name ||
    profileQuery.data?.email ||
    "";
  const otherAccounts = React.useMemo(
    () => accounts.filter((account) => account.id !== activeAccountId),
    [accounts, activeAccountId]
  );

  const normalizePath = React.useCallback((value: string) => {
    if (value.length > 1 && value.endsWith("/")) {
      return value.slice(0, -1);
    }
    return value;
  }, []);

  const isActiveLink = React.useCallback(
    (href: string) => {
      const current = normalizePath(pathname || "/");
      const target = normalizePath(href);
      if (target === "/") return current === "/";
      return current === target || current.startsWith(`${target}/`);
    },
    [pathname, normalizePath]
  );

  const closeNav = React.useCallback(() => {
    setOpen(false);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNav();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeNav]);

  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    triggerRef.current?.focus();
    wasOpenRef.current = false;
  }, [open]);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* ── Expandable sections state ── */
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    shop: true,
  });

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const isSectionOpen = (key: string) => Boolean(expandedSections[key]);

  /* ── Animated slide state ── */
  const [slideIn, setSlideIn] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setSlideIn(true));
    } else {
      setSlideIn(false);
    }
  }, [open]);

  /* ── User avatar ── */
  const initials = React.useMemo(() => {
    const name = profileQuery.data?.full_name || profileQuery.data?.first_name || "";
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }, [profileQuery.data]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn pressable"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        aria-label="Open menu"
      >
        <span className="flex flex-col gap-1.5" aria-hidden="true">
          <span className="h-0.5 w-5 rounded-full bg-foreground/90 transition-transform" />
          <span className="h-0.5 w-4 rounded-full bg-foreground/70 transition-transform" />
          <span className="h-0.5 w-5 rounded-full bg-foreground/90 transition-transform" />
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] h-[100svh] supports-[height:100dvh]:h-[100dvh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeNav();
          }}
        >
          {/* Backdrop */}
          <div
            className={cn(
              "absolute inset-0 bg-foreground/40 backdrop-blur-md transition-opacity duration-300",
              slideIn ? "opacity-100" : "opacity-0"
            )}
            onClick={closeNav}
          />

          {/* Panel — full-bleed on very small phones, max width on larger */}
          <aside
            id="mobile-navigation-panel"
            className={cn(
              "absolute inset-y-0 left-0 flex h-[100svh] min-h-[100svh] w-[min(100vw,22.5rem)] flex-col border-r border-border/80 bg-background text-foreground shadow-premium transition-transform duration-300 ease-out-expo supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:min-h-[100dvh]",
              slideIn ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-border/80 bg-muted/30 px-4 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3 sm:px-5">
              <p id="mobile-navigation-title" className="text-lg font-semibold tracking-tight">
                Menu
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                className="icon-btn h-10 w-10 min-h-10 min-w-10"
                onClick={closeNav}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── User banner ── */}
            <div className="border-b border-border/80 px-4 py-3.5 sm:px-5">
              {hasToken ? (
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 p-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary ring-2 ring-primary/10">
                    {initials || <User className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{accountLabel}</p>
                    {profileQuery.data?.email ? (
                      <p className="truncate text-xs text-foreground/50">{profileQuery.data.email}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/account/login/"
                    onClick={closeNav}
                    className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                  </Link>
                  <Link
                    href="/account/register/"
                    onClick={closeNav}
                    className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-xs transition hover:bg-muted"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* ── Search ── */}
            <div className="shrink-0 px-5 py-3">
              <SearchBar />
            </div>

            {/* ── Navigation ── */}
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm scrollbar-thin">
              {/* ── Shop section ── */}
              <SectionHeader
                icon={ShoppingBag}
                label="Shop"
                isOpen={isSectionOpen("shop")}
                onToggle={() => toggleSection("shop")}
              />
              {isSectionOpen("shop") ? (
                <div className="space-y-1 pb-2">
                  <NavLink
                    href="/products/"
                    icon={Package}
                    label="All Products"
                    isActive={isActiveLink("/products/")}
                    onClick={closeNav}
                  />
                  <NavLink
                    href="/collections/"
                    icon={Layers}
                    label="Collections"
                    isActive={isActiveLink("/collections/")}
                    onClick={closeNav}
                  />
                  {hasBundles ? (
                    <NavLink
                      href="/bundles/"
                      icon={LayoutGrid}
                      label="Bundles"
                      isActive={isActiveLink("/bundles/")}
                      onClick={closeNav}
                    />
                  ) : null}
                  <NavLink
                    href="/preorders/"
                    icon={Sparkles}
                    label="Preorders"
                    isActive={isActiveLink("/preorders/")}
                    onClick={closeNav}
                    highlight
                  />
                  <NavLink
                    href="/categories/"
                    icon={Tags}
                    label="All Categories"
                    isActive={isActiveLink("/categories/")}
                    onClick={closeNav}
                  />

                  {/* Expandable categories */}
                  {categories.length > 0 ? (
                    <>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-foreground/50 transition hover:text-foreground/70"
                        onClick={() => toggleSection("categories")}
                      >
                        <span>Browse by category</span>
                        {isSectionOpen("categories") ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      {isSectionOpen("categories") ? (
                        <div className="ml-2 space-y-0.5 border-l-2 border-border pl-3">
                          {categories.slice(0, 12).map((category) => (
                            <Link
                              key={category.id}
                              className={cn(
                                "block rounded-lg px-2.5 py-2 text-sm text-foreground/70 transition hover:bg-muted hover:text-foreground",
                                isActiveLink(buildCategoryPath(category.slug_path || category.slug)) &&
                                  "bg-primary/10 text-primary font-medium"
                              )}
                              href={buildCategoryPath(category.slug_path || category.slug)}
                              onClick={closeNav}
                            >
                              {category.name.toUpperCase()}
                            </Link>
                          ))}
                          {categories.length > 12 ? (
                            <Link
                              className="block rounded-lg px-2.5 py-2 text-xs font-medium text-primary transition hover:bg-primary/5"
                              href="/categories/"
                              onClick={closeNav}
                            >
                              View all {categories.length} categories →
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}

              <div className="my-1 border-t border-border" />

              {/* ── Account section ── */}
              {hasToken ? (
                <>
                  <SectionHeader
                    icon={User}
                    label="Account"
                    isOpen={isSectionOpen("account")}
                    onToggle={() => toggleSection("account")}
                  />
                  {isSectionOpen("account") ? (
                    <div className="space-y-1 pb-2">
                      <NavLink
                        href="/account/profile/"
                        icon={User}
                        label="Profile"
                        isActive={isActiveLink("/account/profile/")}
                        onClick={closeNav}
                      />
                      <NavLink
                        href="/account/orders/"
                        icon={ClipboardList}
                        label="Orders"
                        isActive={isActiveLink("/account/orders/")}
                        onClick={closeNav}
                      />
                      <NavLink
                        href="/wishlist/"
                        icon={Heart}
                        label="Wishlist"
                        isActive={isActiveLink("/wishlist/")}
                        onClick={closeNav}
                      />
                      <NavLink
                        href="/cart/"
                        icon={ShoppingBag}
                        label="Bag"
                        isActive={isActiveLink("/cart/")}
                        onClick={closeNav}
                      />

                      {/* Switch account */}
                      {otherAccounts.length > 0 ? (
                        <div className="mt-1 space-y-0.5 rounded-xl border border-dashed border-border p-2">
                          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/40">
                            Switch account
                          </p>
                          {otherAccounts.map((account) => (
                            <button
                              key={account.id}
                              type="button"
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground/70 transition hover:bg-muted hover:text-foreground"
                              onClick={() => {
                                switchAccount(account.id);
                                closeNav();
                              }}
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 opacity-50" />
                              <span className="truncate">
                                {account.email ||
                                  account.full_name ||
                                  account.first_name ||
                                  `Account ${account.id.slice(0, 8)}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {accounts.length < 5 ? (
                        <NavLink
                          href={`/account/login/?next=${encodeURIComponent(pathname || "/account/profile/")}&add_account=1`}
                          icon={UserPlus2}
                          label="Add account"
                          isActive={false}
                          onClick={closeNav}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="space-y-1 pb-2">
                  <NavLink
                    href="/wishlist/"
                    icon={Heart}
                    label="Wishlist"
                    isActive={isActiveLink("/wishlist/")}
                    onClick={closeNav}
                  />
                  <NavLink
                    href="/cart/"
                    icon={ShoppingBag}
                    label="Bag"
                    isActive={isActiveLink("/cart/")}
                    onClick={closeNav}
                  />
                </div>
              )}

              {/* ── Pages section ── */}
              {menuPages.length > 0 ? (
                <>
                  <div className="my-1 border-t border-border" />
                  <SectionHeader
                    icon={FileText}
                    label="Pages"
                    isOpen={isSectionOpen("pages")}
                    onToggle={() => toggleSection("pages")}
                  />
                  {isSectionOpen("pages") ? (
                    <div className="space-y-1 pb-2">
                      {menuPages.slice(0, 8).map((page) => (
                        <NavLink
                          key={page.id}
                          href={`/pages/${page.slug}/`}
                          icon={FileText}
                          label={page.title}
                          isActive={isActiveLink(`/pages/${page.slug}/`)}
                          onClick={closeNav}
                        />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}

              {/* ── Support section ── */}
              <div className="my-1 border-t border-border" />
              <SectionHeader
                icon={HelpCircle}
                label="Support"
                isOpen={isSectionOpen("support")}
                onToggle={() => toggleSection("support")}
              />
              {isSectionOpen("support") ? (
                <div className="space-y-1 pb-4">
                  <NavLink
                    href="/contact/"
                    icon={Mail}
                    label="Contact"
                    isActive={isActiveLink("/contact/")}
                    onClick={closeNav}
                  />
                  <NavLink
                    href="/faq/"
                    icon={HelpCircle}
                    label="FAQ"
                    isActive={isActiveLink("/faq/")}
                    onClick={closeNav}
                  />
                </div>
              ) : null}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

