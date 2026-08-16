"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useAddresses } from "@/components/account/useAddresses";
import { CheckoutInfoStep, CheckoutInfoFormValues } from "@/components/checkout/CheckoutInfoStep";
import { CheckoutShippingStep } from "@/components/checkout/CheckoutShippingStep";
import { CheckoutPaymentStep, CheckoutPaymentFormValues } from "@/components/checkout/CheckoutPaymentStep";
import { CheckoutReviewStep } from "@/components/checkout/CheckoutReviewStep";
import { OrderProcessingModal } from "@/components/checkout/OrderProcessingModal";
import { useCheckoutData } from "@/components/checkout/useCheckoutData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchSiteSettings } from "@/lib/siteSettings";
import { formatMoney } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Shield, Truck, RotateCcw, CreditCard, Gift, Tag } from "lucide-react";
import type { CheckoutValidation, ShippingMethodOption } from "@/lib/types";

const stepOrder = ["information", "shipping", "payment", "review"] as const;
type Step = (typeof stepOrder)[number];

const parseStep = (value: string | null): Step | null => {
  if (!value) return null;
  return stepOrder.includes(value as Step) ? (value as Step) : null;
};

function CompactSection({
  number,
  title,
  isExpanded,
  isComplete,
  onToggle,
  children,
}: {
  number: number;
  title: string;
  isExpanded: boolean;
  isComplete: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 py-5 text-left transition-colors hover:text-primary"
        aria-expanded={isExpanded}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
            isComplete
              ? "bg-success text-white"
              : isExpanded
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          )}
        >
          {isComplete ? <Check size={14} strokeWidth={2.5} /> : number}
        </span>
        <span className={cn("flex-1 text-sm font-semibold", isExpanded ? "text-foreground" : "text-muted-foreground")}>
          {title}
        </span>
        <ChevronDown
          size={16}
          className={cn("text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180 text-primary")}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-400 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutCompact() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const auth = useAuthContext();
  const { profileQuery, hasToken } = auth;
  const guestSettingsQuery = useQuery({
    queryKey: ["site-settings", "checkout"],
    queryFn: fetchSiteSettings,
    enabled: !hasToken,
    staleTime: 60_000,
  });
  const guestCheckoutEnabled = Boolean(guestSettingsQuery.data?.guest_checkout_enabled);
  const allowGuestCheckout = hasToken || guestCheckoutEnabled;
  const { addressesQuery } = useAddresses({ enabled: hasToken });

  const {
    checkoutQuery, cartQuery, cartSummaryQuery, countriesQuery, pickupLocationsQuery,
    paymentGatewaysQuery, savedPaymentMethodsQuery, updateShippingInfo, selectShippingMethod,
    selectPaymentMethod, completeCheckout, calculateShipping, validateCart, updateGiftOptions,
    applyCoupon, removeCoupon,
  } = useCheckoutData({ enabled: allowGuestCheckout, enablePaymentMethods: hasToken });

  const checkoutSession = checkoutQuery.data;
  const cart = cartQuery.data;
  const cartSummary = cartSummaryQuery.data;
  const profile = profileQuery.data;
  const countries = React.useMemo(() => countriesQuery.data ?? [], [countriesQuery.data]);
  const pickupLocations = React.useMemo(() => pickupLocationsQuery.data ?? [], [pickupLocationsQuery.data]);

  const resolveCountryName = React.useCallback(
    (value?: string | null) => {
      if (!value) return "";
      const trimmed = value.trim();
      if (!trimmed) return "";
      const byCode = countries.find((c) => c.code.toLowerCase() === trimmed.toLowerCase());
      if (byCode) return byCode.name;
      const byName = countries.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      return byName?.name || trimmed;
    },
    [countries]
  );

  const [localMaxStep, setLocalMaxStep] = React.useState(0);
  const [maxStepInitialized, setMaxStepInitialized] = React.useState(false);
  const [validation, setValidation] = React.useState<CheckoutValidation | null>(null);
  const [shippingRates, setShippingRates] = React.useState<ShippingMethodOption[]>([]);
  const [shippingRatesError, setShippingRatesError] = React.useState<string | null>(null);
  const lastRatesKey = React.useRef("");
  const lastValidationKey = React.useRef("");
  const lastAutoInfoKey = React.useRef("");
  const lastAutoShippingKey = React.useRef("");
  const [autoSavingInfo, setAutoSavingInfo] = React.useState(false);
  const [autoSavingShipping, setAutoSavingShipping] = React.useState(false);
  const [isRedirectingAfterOrder, setIsRedirectingAfterOrder] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<number>(0);

  const cartEmpty = !cart || cart.item_count === 0;
  const isOrderTransitioning = completeCheckout.isPending || completeCheckout.isSuccess || isRedirectingAfterOrder;

  const infoComplete = Boolean(
    checkoutSession?.email && checkoutSession?.shipping_first_name && checkoutSession?.shipping_last_name &&
    checkoutSession?.shipping_address_line_1 && checkoutSession?.shipping_city &&
    checkoutSession?.shipping_postal_code && checkoutSession?.shipping_country
  );
  const shippingComplete = Boolean(checkoutSession?.shipping_method);
  const paymentComplete = Boolean(
    checkoutSession?.payment_method && checkoutSession?.current_step &&
    ["payment", "review", "processing", "completed"].includes(checkoutSession.current_step)
  );

  let maxStepIndex = 0;
  if (infoComplete) maxStepIndex = 1;
  if (shippingComplete) maxStepIndex = 2;
  if (paymentComplete) maxStepIndex = 3;

  React.useEffect(() => {
    if (maxStepInitialized) return;
    if (!checkoutSession) return;
    setLocalMaxStep(maxStepIndex);
    setMaxStepInitialized(true);
  }, [checkoutSession, maxStepInitialized, maxStepIndex]);

  const shippingPayload = React.useMemo(() => {
    if (!infoComplete || !cart || !cartSummary || !checkoutSession) return null;
    const countryName = resolveCountryName(checkoutSession.shipping_country) || checkoutSession.shipping_country || "";
    return {
      country: countryName, state: checkoutSession.shipping_state || "",
      city: checkoutSession.shipping_city || "", postal_code: checkoutSession.shipping_postal_code || "",
      subtotal: cartSummary.subtotal || cart.subtotal || "0", item_count: cart.item_count || 1,
      product_ids: cart.items?.flatMap((item) => {
        if (item.cart_item_type === "bundle") return item.bundle_items?.map((l) => l.product_id).filter(Boolean) || [];
        return item.product_id ? [item.product_id] : [];
      }) || [],
    };
  }, [infoComplete, cart, cartSummary, checkoutSession, resolveCountryName]);

  React.useEffect(() => {
    if (!shippingPayload) return;
    const key = JSON.stringify(shippingPayload);
    if (key === lastRatesKey.current) return;
    lastRatesKey.current = key;
    calculateShipping.mutate(shippingPayload, {
      onSuccess: (data) => { setShippingRates(data.methods || []); setShippingRatesError(null); },
      onError: (error) => { setShippingRates([]); setShippingRatesError(error instanceof Error ? error.message : "Failed to load shipping rates."); },
    });
  }, [shippingPayload, calculateShipping]);

  const fallbackCountry = React.useMemo(() => {
    const resolved = resolveCountryName(checkoutSession?.shipping_country);
    if (resolved) return resolved;
    const defaultCountry = countries.find((c) => c.code === "BD") || countries.find((c) => c.name.toLowerCase() === "bangladesh");
    return defaultCountry?.name || countries[0]?.name || "";
  }, [checkoutSession?.shipping_country, countries, resolveCountryName]);

  const shippingCountryName = resolveCountryName(checkoutSession?.shipping_country) || fallbackCountry;
  const billingCountryName = resolveCountryName(checkoutSession?.billing_country) || fallbackCountry;

  const infoDefaults = React.useMemo<Partial<CheckoutInfoFormValues>>(() => ({
    email: checkoutSession?.email || profile?.email || "",
    shipping_first_name: checkoutSession?.shipping_first_name || profile?.first_name || "",
    shipping_last_name: checkoutSession?.shipping_last_name || profile?.last_name || "",
    shipping_phone: checkoutSession?.shipping_phone || profile?.phone || "",
    shipping_address_line_1: checkoutSession?.shipping_address_line_1 || "",
    shipping_address_line_2: checkoutSession?.shipping_address_line_2 || "",
    shipping_city: checkoutSession?.shipping_city || "",
    shipping_state: checkoutSession?.shipping_state || "",
    shipping_postal_code: checkoutSession?.shipping_postal_code || "",
    shipping_country: resolveCountryName(checkoutSession?.shipping_country) || fallbackCountry,
    saved_shipping_address_id: checkoutSession?.saved_shipping_address_id || null,
    save_address: false,
  }), [checkoutSession, profile, fallbackCountry, resolveCountryName]);

  const paymentDefaults = React.useMemo<Partial<CheckoutPaymentFormValues>>(() => ({
    payment_method: checkoutSession?.payment_method || "",
    billing_same_as_shipping: checkoutSession?.billing_same_as_shipping ?? true,
    billing_first_name: checkoutSession?.billing_first_name || "",
    billing_last_name: checkoutSession?.billing_last_name || "",
    billing_address_line_1: checkoutSession?.billing_address_line_1 || "",
    billing_address_line_2: checkoutSession?.billing_address_line_2 || "",
    billing_city: checkoutSession?.billing_city || "",
    billing_state: checkoutSession?.billing_state || "",
    billing_postal_code: checkoutSession?.billing_postal_code || "",
    billing_country: resolveCountryName(checkoutSession?.billing_country) || fallbackCountry,
  }), [checkoutSession, fallbackCountry, resolveCountryName]);

  const shippingToBillingDefaults = React.useMemo<Partial<CheckoutPaymentFormValues>>(() => ({
    billing_first_name: checkoutSession?.shipping_first_name || "",
    billing_last_name: checkoutSession?.shipping_last_name || "",
    billing_address_line_1: checkoutSession?.shipping_address_line_1 || "",
    billing_address_line_2: checkoutSession?.shipping_address_line_2 || "",
    billing_city: checkoutSession?.shipping_city || "",
    billing_state: checkoutSession?.shipping_state || "",
    billing_postal_code: checkoutSession?.shipping_postal_code || "",
    billing_country: resolveCountryName(checkoutSession?.shipping_country) || fallbackCountry,
  }), [checkoutSession, fallbackCountry, resolveCountryName]);

  const handleAutoSaveShipping = React.useCallback(
    (payload: { shipping_type: "delivery" | "pickup"; shipping_rate_id?: string; pickup_location_id?: string }) => {
      const key = JSON.stringify(payload);
      if (key === lastAutoShippingKey.current) return;
      lastAutoShippingKey.current = key;
      setAutoSavingShipping(true);
      selectShippingMethod.mutate(payload, { onSettled: () => setAutoSavingShipping(false) });
    },
    [selectShippingMethod]
  );

  const handleAutoSaveInfoSelection = React.useCallback(
    (values: CheckoutInfoFormValues) => {
      if (!values.saved_shipping_address_id || updateShippingInfo.isPending) return;
      const key = JSON.stringify(values);
      if (key === lastAutoInfoKey.current) return;
      lastAutoInfoKey.current = key;
      setAutoSavingInfo(true);
      updateShippingInfo.mutate(values, {
        onError: (error) => push(error instanceof Error ? error.message : "Could not save selected address.", "error"),
        onSettled: () => setAutoSavingInfo(false),
      });
    },
    [push, updateShippingInfo]
  );

  const handleInfoSubmit = async (values: CheckoutInfoFormValues) => {
    try {
      await updateShippingInfo.mutateAsync(values);
      setLocalMaxStep((prev) => Math.max(prev, 1));
      setExpandedSection(1);
    } catch (error) {
      push(error instanceof Error ? error.message : "Could not save shipping info.", "error");
    }
  };

  const handleShippingSubmit = async (payload: { shipping_type: "delivery" | "pickup"; shipping_rate_id?: string; pickup_location_id?: string; delivery_instructions?: string }) => {
    try {
      await selectShippingMethod.mutateAsync(payload);
      setLocalMaxStep((prev) => Math.max(prev, 2));
      setExpandedSection(2);
    } catch (error) {
      push(error instanceof Error ? error.message : "Could not save shipping method.", "error");
    }
  };

  const handlePaymentSubmit = async (values: CheckoutPaymentFormValues) => {
    try {
      await selectPaymentMethod.mutateAsync(values);
      setLocalMaxStep((prev) => Math.max(prev, 3));
      setExpandedSection(3);
    } catch (error) {
      push(error instanceof Error ? error.message : "Could not save payment method.", "error");
    }
  };

  const handleReviewSubmit = async (values: { terms_accepted: boolean; order_notes?: string }) => {
    try {
      if (cartEmpty) { push("Your bag is empty.", "error"); return; }
      let validationResult = validation;
      if (!validationResult) { validationResult = await validateCart.mutateAsync(); setValidation(validationResult); }
      if (validationResult && !validationResult.is_valid && validationResult.issues.length) {
        push("Resolve the checkout issues before placing the order.", "error"); return;
      }
      const result = await completeCheckout.mutateAsync(values);
      const payload = result && typeof result === "object" && "data" in result ? (result as { data?: Record<string, unknown> }).data : null;
      setIsRedirectingAfterOrder(true);
      const redirectUrl = payload?.payment_redirect_url || payload?.redirect_url;
      if (typeof redirectUrl === "string" && redirectUrl.trim()) { window.location.href = redirectUrl; return; }
      const orderId = payload?.order_id as string | undefined;
      const orderNumber = payload?.order_number as string | undefined;
      const guestAccessToken = payload?.guest_access_token as string | undefined;
      if (orderId || orderNumber) {
        const params = new URLSearchParams();
        if (orderId) params.set("order_id", orderId);
        if (orderNumber) params.set("order_number", orderNumber);
        if (guestAccessToken) params.set("access_token", guestAccessToken);
        router.replace(`/checkout/success?${params.toString()}`);
      } else {
        router.replace(!hasToken ? `/checkout/success?order=${orderNumber || orderId}` : "/orders/");
      }
    } catch (error) {
      setIsRedirectingAfterOrder(false);
      push(error instanceof Error ? error.message : "Could not place the order.", "error");
    }
  };

  if (cartEmpty) {
    return <AuthGate nextHref="/checkout" allowGuest={guestCheckoutEnabled}><div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-16"><Card variant="bordered" className="space-y-3 text-center"><h1 className="text-2xl font-semibold">Your bag is empty</h1><Button asChild><Link href="/cart/">Go to bag</Link></Button></Card></div></AuthGate>;
  }

  const currencyCode = cart?.currency || "";
  const totalLabel = cartSummary?.formatted_total || formatMoney(cartSummary?.total || cart?.subtotal || "0", currencyCode);

  return (
    <AuthGate nextHref="/checkout" allowGuest={guestCheckoutEnabled} title="Sign in to checkout" description="Please sign in to continue with checkout.">
      <div className="min-h-screen bg-background text-foreground">
        <OrderProcessingModal isOpen={isOrderTransitioning} />
        <div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-8 sm:py-12">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Checkout</p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Complete your order</h1>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Shield size={14} />
              <span>SSL Encrypted</span>
            </div>
          </div>

          {/* Mini order summary - mobile */}
          <Card variant="bordered" className="mb-6 p-4 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {cart?.items?.slice(0, 3).map((item) => (
                  <div key={item.id} className="relative h-10 w-10 overflow-hidden rounded-lg border-2 border-background bg-muted">
                    {item.product_image ? <Image src={item.product_image} alt="" fill sizes="40px" className="object-cover" quality={50} /> : null}
                  </div>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">{cart?.item_count} item{cart?.item_count === 1 ? "" : "s"}</p>
              </div>
              <p className="text-sm font-bold">{totalLabel}</p>
            </div>
          </Card>

          {/* Compact sections */}
          <Card variant="bordered" className="divide-y-0">
            <CompactSection number={1} title="Contact & Shipping" isExpanded={expandedSection === 0} isComplete={infoComplete} onToggle={() => infoComplete && setExpandedSection(0)}>
              <CheckoutInfoStep
                defaultValues={infoDefaults}
                countries={countries}
                savedAddresses={addressesQuery.data || []}
                defaultSelectedAddressId={checkoutSession?.saved_shipping_address_id || null}
                allowSaveAddress={Boolean(hasToken)}
                onSubmit={handleInfoSubmit}
                onSavedAddressSelectionChange={handleAutoSaveInfoSelection}
                isSubmitting={updateShippingInfo.isPending}
                isAutoSavingSelection={autoSavingInfo}
              />
            </CompactSection>

            <CompactSection number={2} title="Delivery Method" isExpanded={expandedSection === 1} isComplete={shippingComplete} onToggle={() => shippingComplete && setExpandedSection(1)}>
              <CheckoutShippingStep
                shippingRates={shippingRates}
                shippingRatesLoading={calculateShipping.isPending}
                shippingRatesError={shippingRatesError}
                pickupLocations={pickupLocations}
                defaultShippingType={checkoutSession?.shipping_method === "pickup" ? "pickup" : "delivery"}
                defaultRateId={cartSummary?.shipping_rate_id || ""}
                defaultMethodCode={checkoutSession?.shipping_method || ""}
                defaultPickupId={cartSummary?.pickup_location_id || checkoutSession?.pickup_location?.id || ""}
                defaultInstructions={checkoutSession?.delivery_instructions || ""}
                currencyCode={cartSummary?.currency_code || cartSummary?.currency || ""}
                onSubmit={handleShippingSubmit}
                onSelectionChange={handleAutoSaveShipping}
                onBack={() => setExpandedSection(0)}
                isSubmitting={selectShippingMethod.isPending}
                isAutoSaving={autoSavingShipping}
              />
            </CompactSection>

            <CompactSection number={3} title="Payment" isExpanded={expandedSection === 2} isComplete={paymentComplete} onToggle={() => paymentComplete && setExpandedSection(2)}>
              <CheckoutPaymentStep
                gateways={paymentGatewaysQuery.data || []}
                savedMethods={savedPaymentMethodsQuery.data || []}
                countries={countries}
                defaultValues={paymentDefaults}
                shippingDefaults={shippingToBillingDefaults}
                currencyCode={cartSummary?.currency_code || cartSummary?.currency || ""}
                onSubmit={handlePaymentSubmit}
                onBack={() => setExpandedSection(1)}
                isSubmitting={selectPaymentMethod.isPending}
                isLoadingGateways={paymentGatewaysQuery.isLoading}
              />
            </CompactSection>

            <CompactSection number={4} title="Review & Place Order" isExpanded={expandedSection === 3} isComplete={false} onToggle={() => paymentComplete && setExpandedSection(3)}>
              <CheckoutReviewStep
                checkoutSession={checkoutSession}
                shippingCountryName={shippingCountryName}
                billingCountryName={billingCountryName}
                cartSummary={cartSummary}
                validation={validation}
                isValidating={validateCart.isPending}
                onSubmit={handleReviewSubmit}
                onBack={() => setExpandedSection(2)}
                isSubmitting={completeCheckout.isPending}
              />
            </CompactSection>
          </Card>

          {/* Trust bar */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Shield, text: "Secure checkout" },
              { icon: Truck, text: "Fast delivery" },
              { icon: RotateCcw, text: "7-day returns" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 py-3 text-center">
                <Icon size={16} className="text-primary" />
                <span className="text-[11px] font-medium text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
