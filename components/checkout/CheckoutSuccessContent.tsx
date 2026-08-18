"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useUiMessages } from "@/components/i18n/useUiMessages";
import { apiFetch } from "@/lib/api";
import { formatAddressLine } from "@/lib/address";
import type { OrderDetail } from "@/lib/types";

async function fetchOrder(orderId: string, accessToken?: string | null) {
  const response = await apiFetch<OrderDetail>(`/orders/${orderId}/`, { allowGuest: Boolean(accessToken), params: accessToken ? { access_token: accessToken } : undefined });
  return response.data;
}

function SuccessContent() {
  const { hasToken } = useAuthContext();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const { t } = useUiMessages("checkout");
  const siteSettings = useSiteSettings();
  const orderId = searchParams.get("order_id");
  const orderNumber = searchParams.get("order_number");
  const accessToken = searchParams.get("access_token");
  const allowGuest = Boolean(accessToken);
  const brandSlogan = siteSettings?.brand_slogan || "";
  const brandStoryShort = siteSettings?.brand_story_short || "";

  const handleBrandShare = React.useCallback(() => {
    const message = [
      brandSlogan,
      brandStoryShort,
      "Shop hand-embroidered fashion and artisan goods:",
    ].filter(Boolean).join(" — ");
    const url = `https://bunoraa.com`;
    if (navigator.share) {
      navigator.share({ title: "Bunoraa", text: message, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`, "_blank", "noopener,noreferrer");
    }
  }, [brandSlogan, brandStoryShort]);

  const handleCopyOrderNumber = React.useCallback(async (value?: string | null) => {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); push(t("order_number_copied", "Order number copied."), "success"); }
    catch { push(t("copy_failed", "Could not copy order number."), "error"); }
  }, [push, t]);

  const orderQuery = useQuery({
    queryKey: ["orders", orderId, accessToken || ""],
    queryFn: () => fetchOrder(orderId as string, accessToken),
    enabled: Boolean(orderId && (hasToken || accessToken)),
  });

  return (
    <AuthGate nextHref="/checkout" allowGuest={allowGuest}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-4xl px-[var(--page-gutter)] py-16">
          <Card variant="bordered" className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("order_confirmed", "Order confirmed")}</p>
              <h1 className="text-3xl font-semibold">{t("thank_you", "Thank you for your purchase")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("processing_order_now", "We're processing your order now.")}</p>
            </div>
            {orderQuery.isLoading ? <p className="text-sm text-muted-foreground">{t("loading_order_details", "Loading order details...")}</p>
            : orderQuery.isError ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t("order_details_unavailable", "We couldn't load full order details yet.")}</p>
                {orderNumber ? <button type="button" className="text-sm font-semibold underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => handleCopyOrderNumber(orderNumber)} title="Copy order number">Order #{orderNumber}</button> : null}
                <p className="text-xs text-muted-foreground">{t("contact_support_order", "If you need help, please contact support with your order number.")}</p>
              </div>
            ) : orderQuery.data ? (
              <div className="space-y-3 text-sm">
                <button type="button" className="text-left text-sm text-muted-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => handleCopyOrderNumber(orderQuery.data?.order_number)} title="Copy order number">Order #{orderQuery.data.order_number}</button>
                {orderQuery.data.payment_status && orderQuery.data.payment_status !== "succeeded" ? <p className="text-sm text-amber-600">Payment status: {orderQuery.data.payment_status}</p> : null}
                <p className="text-lg font-semibold">Total {orderQuery.data.total}</p>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("shipping_to", "Shipping to")}</p>
                  <p className="mt-2 font-semibold">{[orderQuery.data.shipping_address?.first_name, orderQuery.data.shipping_address?.last_name].filter(Boolean).join(" ") || "Recipient"}</p>
                  <p className="text-muted-foreground">{formatAddressLine(orderQuery.data.shipping_address)}</p>
                </div>
              </div>
            ) : orderNumber ? (
              <div className="space-y-2 text-sm">
                <button type="button" className="text-left text-sm text-muted-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => handleCopyOrderNumber(orderNumber)} title="Copy order number">Order #{orderNumber}</button>
                <p className="text-sm text-muted-foreground">{t("email_updates", "Your order is confirmed. We'll email you with updates.")}</p>
              </div>
            ) : <p className="text-sm text-muted-foreground">{t("order_confirmed_simple", "Your order is confirmed.")}</p>}
            <div className="flex flex-wrap gap-3">
              {orderId ? <Button asChild><Link href={accessToken ? `/orders/${orderId}/?access_token=${encodeURIComponent(accessToken)}` : "/orders/"}>{accessToken ? t("view_order_details", "View order details") : t("view_orders", "View orders")}</Link></Button> : null}
              <Button asChild variant="secondary"><Link href="/">{t("continue_shopping", "Continue shopping")}</Link></Button>
            </div>
          </Card>

          {brandSlogan || brandStoryShort ? (
            <Card variant="bordered" className="mt-6 space-y-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-card to-accent/10">
              <div className="p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">{t("brand_story_eyebrow", "Do you know our name?")}</p>
                {brandSlogan ? <p className="mt-3 text-xl font-semibold italic text-foreground">{brandSlogan}</p> : null}
                {brandStoryShort ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{brandStoryShort}</p> : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild variant="secondary" size="sm"><Link href="/about/">{t("read_our_story", "Read our story")}</Link></Button>
                  <Button variant="secondary" size="sm" onClick={handleBrandShare}>{t("share_with_friends", "Share with friends")}</Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </AuthGate>
  );
}

export function CheckoutSuccessPageContent() {
  return <Suspense fallback={null}><SuccessContent /></Suspense>;
}
