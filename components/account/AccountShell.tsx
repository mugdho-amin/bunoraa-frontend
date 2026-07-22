"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account/profile/", label: "Profile" },
  { href: "/account/orders/", label: "Orders" },
  { href: "/account/addresses/", label: "Addresses" },
  { href: "/account/payments/", label: "Payments" },
  { href: "/account/subscriptions/", label: "Subscriptions" },
  { href: "/account/notifications/", label: "Notifications" },
  { href: "/account/preferences/", label: "Preferences" },
  { href: "/account/security/", label: "Security" },
  { href: "/account/privacy/", label: "Privacy" },
  { href: "/account/referrals/", label: "Referrals" },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const activeItem =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href)) || NAV_ITEMS[0];

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  return (
    <AuthGate
      title="Account access"
      description="Sign in to manage your account."
      nextHref={pathname}
    >
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-content px-[var(--page-gutter)] py-6 sm:py-10 lg:py-12">
          <div className="mb-4 lg:hidden">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full justify-between rounded-2xl px-4 text-sm shadow-xs"
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="font-semibold">Account menu</span>
              <span className="truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {activeItem?.label}
              </span>
            </Button>
          </div>
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
            <aside className="hidden space-y-4 lg:block">
              <Card variant="bordered" className="space-y-3" padding="md">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Account
                </p>
                <nav className="flex flex-col gap-0.5" aria-label="Account">
                  {NAV_ITEMS.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "rounded-xl px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </Card>
              <Card variant="modern-gradient" className="space-y-2">
                <p className="text-sm font-semibold">Need help?</p>
                <p className="text-sm text-muted-foreground">
                  Reach out to our support team for any account changes or data
                  requests.
                </p>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/contact/">Contact support</Link>
                </Button>
              </Card>
            </aside>
            <main className="space-y-6">{children}</main>
          </div>
        </div>
      </div>

      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-[90] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Account navigation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setMobileNavOpen(false);
          }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            aria-label="Close account navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex h-full w-full max-w-[20rem] flex-col border-l border-border/80 bg-background shadow-premium supports-[height:100dvh]:h-[100dvh]">
            <div className="mb-2 flex items-center justify-between border-b border-border/70 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Account
                </p>
                <p className="text-sm font-semibold">{activeItem?.label}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl px-3"
                onClick={() => setMobileNavOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pr-3 scrollbar-thin">
              <Card variant="bordered" className="space-y-2" padding="sm">
                <nav className="flex flex-col gap-0.5" aria-label="Account pages">
                  {NAV_ITEMS.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "min-h-11 rounded-xl px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </Card>
              <Card variant="modern-gradient" className="space-y-2" padding="sm">
                <p className="text-sm font-semibold">Need help?</p>
                <p className="text-sm text-muted-foreground">
                  Reach out to support for account updates or data requests.
                </p>
                <Button asChild size="sm" variant="secondary" className="w-full">
                  <Link href="/contact/">Contact support</Link>
                </Button>
              </Card>
            </div>
          </aside>
        </div>
      ) : null}
    </AuthGate>
  );
}
