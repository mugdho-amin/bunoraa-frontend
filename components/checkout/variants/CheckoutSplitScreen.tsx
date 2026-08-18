"use client";

import * as React from "react";
import Link from "next/link";
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
import { useToast } from "@/components/ui/ToastProvider";
import { fetchSiteSettings } from "@/lib/siteSettings";
import { formatMoney } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import { Check, Shield, Lock, ArrowRight, ArrowLeft, MapPin, Truck, CreditCard, ClipboardCheck, ChevronDown, Gift, Package } from "lucide-react";
import type { CheckoutValidation, ShippingMethodOption } from "@/lib/types";
import { CartItemImage } from "@/components/checkout/CartItemImage";

const stepOrder = ["information", "shipping", "payment", "review"] as const;
type Step = (typeof stepOrder)[number];

const stepConfig: Record<Step, { label: string; icon: React.ElementType; shortLabel: string }> = {
  information: { label: "Contact & Shipping", icon: MapPin, shortLabel: "Shipping" },
  shipping: { label: "Delivery Method", icon: Truck, shortLabel: "Delivery" },
  payment: { label: "Payment", icon: CreditCard, shortLabel: "Payment" },
  review: { label: "Review & Order", icon: ClipboardCheck, shortLabel: "Review" },
};

const parseStep = (value: string | null): Step | null => {
  if (!value) return null;
  return stepOrder.includes(value as Step) ? (value as Step) : null;
};

function StepProgress({ current, completedSteps }: { current: Step; completedSteps: number }) {
  const currentIdx = stepOrder.indexOf(current);

  return (
    <div className="flex items-center gap-2">
      {stepOrder.map((step, index) => {
        const isComplete = index < completedSteps;
        const isCurrent = index === currentIdx;
        const config = stepConfig[step];

        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                  isComplete
                    ? "bg-success text-white"
                    : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/10"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? <Check size={14} strokeWidth={2.5} /> : index + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  isCurrent ? "text-foreground" : isComplete ? "text-success" : "text-muted-foreground"
                )}
              >
                {config.shortLabel}
              </span>
            </div>
            {index < stepOrder.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 sm:w-10",
                  index < currentIdx ? "bg-success/40" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OrderVisualSummary({
  cart,
  cartSummary,
  checkoutSession,
}: {
  cart: ReturnType<typeof useCheckoutData>["cartQuery"]["data"];
  cartSummary: ReturnType<typeof useCheckoutData>["cartSummaryQuery"]["data"];
  checkoutSession: ReturnType<typeof useCheckoutData>["checkoutQuery"]["data"];
}) {
  const currencyCode = cart?.currency || "";
  const itemCount = cart?.item_count || 0;

  return (
    <div className="space-y-6">
      {/* Product images */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Your items</p>
        <div className="grid grid-cols-2 gap-2">
          {cart?.items?.slice(0, 4).map((item) => {
            const isBundle = item.cart_item_type === "bundle";
            const itemName = item.product_name || item.bundle_name || "Item";
            return (
              <div key={item.id} className="relative">
                <CartItemImage
                  src={item.product_image}
                  alt={itemName}
                  containerClassName="aspect-square rounded-xl"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                  {item.quantity}
                </span>
                {isBundle && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase backdrop-blur">Bundle</span>
                )}
              </div>
            );
          })}
        </div>
        {itemCount > 4 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">+{itemCount - 4} more items</p>
        )}
      </div>

      {/* Price breakdown */}
      <div className="rounded-xl bg-muted/30 p-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
          <span className="font-medium">{cartSummary?.formatted_subtotal || formatMoney(cartSummary?.subtotal || cart?.subtotal || "0", currencyCode)}</span>
        </div>
        {cartSummary?.discount_amount && Number(cartSummary.discount_amount) > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="font-medium">-{cartSummary.formatted_discount || formatMoney(cartSummary.discount_amount, currencyCode)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">{cartSummary?.formatted_shipping || (cartSummary?.shipping_cost ? formatMoney(cartSummary.shipping_cost, currencyCode) : "Calculated next")}</span>
        </div>
        {cartSummary?.tax_amount && Number(cartSummary.tax_amount) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">{cartSummary?.formatted_tax || formatMoney(cartSummary.tax_amount, currencyCode)}</span>
          </div>
        )}
        {(checkoutSession?.gift_wrap || (cartSummary?.gift_wrap_cost && Number(cartSummary.gift_wrap_cost) > 0)) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{cartSummary?.gift_wrap_label || "Gift wrap"}</span>
            <span className="font-medium">{cartSummary?.formatted_gift_wrap || formatMoney(cartSummary?.gift_wrap_cost || "0", currencyCode)}</span>
          </div>
        )}
        {checkoutSession?.is_gift && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <Gift size={12} />
            <span>This order is a gift</span>
          </div>
        )}
        <div className="border-t border-border/60 pt-2.5 flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{cartSummary?.formatted_total || formatMoney(cartSummary?.total || cart?.subtotal || "0", currencyCode)}</span>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock size={12} className="shrink-0 text-primary" />
          <span>Your payment is secured with 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  );
}

export function CheckoutSplitScreen() {
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

  const stepParam = parseStep(searchParams.get("step"));
  const allowedIndex = maxStepInitialized ? localMaxStep : maxStepIndex;
  const targetIndex = stepParam ? stepOrder.indexOf(stepParam) : allowedIndex;
  const clampedIndex = Math.min(targetIndex, allowedIndex);
  const currentStep = stepOrder[clampedIndex] || "information";

  const goToStep = React.useCallback(
    (step: Step) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("step") !== currentStep) {
      params.set("step", currentStep);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [currentStep, pathname, router, searchParams]);

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
      goToStep("shipping");
    } catch (error) {
      push(error instanceof Error ? error.message : "Could not save shipping info.", "error");
    }
  };

  const handleShippingSubmit = async (payload: { shipping_type: "delivery" | "pickup"; shipping_rate_id?: string; pickup_location_id?: string; delivery_instructions?: string }) => {
    try {
      await selectShippingMethod.mutateAsync(payload);
      setLocalMaxStep((prev) => Math.max(prev, 2));
      goToStep("payment");
    } catch (error) {
      push(error instanceof Error ? error.message : "Could not save shipping method.", "error");
    }
  };

  const handlePaymentSubmit = async (values: CheckoutPaymentFormValues) => {
    try {
      await selectPaymentMethod.mutateAsync(values);
      setLocalMaxStep((prev) => Math.max(prev, 3));
      goToStep("review");
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

  const stepIdx = stepOrder.indexOf(currentStep);

  if (cartEmpty) {
    return <AuthGate nextHref="/checkout" allowGuest={guestCheckoutEnabled}><div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-16"><Card variant="bordered" className="space-y-3 text-center"><h1 className="text-2xl font-semibold">Your bag is empty</h1><Button asChild><Link href="/cart/">Go to bag</Link></Button></Card></div></AuthGate>;
  }

  return (
    <AuthGate nextHref="/checkout" allowGuest={guestCheckoutEnabled} title="Sign in to checkout" description="Please sign in to continue with checkout.">
      <div className="min-h-screen bg-background text-foreground">
        <OrderProcessingModal isOpen={isOrderTransitioning} />

        {/* Progress bar */}
        <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-[var(--page-gutter)] py-4">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-primary" />
              <span className="text-sm font-semibold">Secure Checkout</span>
            </div>
            <StepProgress current={currentStep} completedSteps={stepIdx} />
            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Lock size={12} />
              <span>SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Main split layout */}
        <div className="mx-auto max-w-6xl px-[var(--page-gutter)] py-8 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
            {/* Left: Form */}
            <div className="min-w-0">
              <div className="mb-6">
                <h2 className="text-xl font-semibold sm:text-2xl">{stepConfig[currentStep].label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Step {stepIdx + 1} of 4</p>
              </div>

              <div className="space-y-6">
                {currentStep === "information" && (
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
                )}
                {currentStep === "shipping" && (
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
                    onBack={() => goToStep("information")}
                    isSubmitting={selectShippingMethod.isPending}
                    isAutoSaving={autoSavingShipping}
                  />
                )}
                {currentStep === "payment" && (
                  <CheckoutPaymentStep
                    gateways={paymentGatewaysQuery.data || []}
                    savedMethods={savedPaymentMethodsQuery.data || []}
                    countries={countries}
                    defaultValues={paymentDefaults}
                    shippingDefaults={shippingToBillingDefaults}
                    currencyCode={cartSummary?.currency_code || cartSummary?.currency || ""}
                    onSubmit={handlePaymentSubmit}
                    onBack={() => goToStep("shipping")}
                    isSubmitting={selectPaymentMethod.isPending}
                    isLoadingGateways={paymentGatewaysQuery.isLoading}
                  />
                )}
                {currentStep === "review" && (
                  <CheckoutReviewStep
                    checkoutSession={checkoutSession}
                    shippingCountryName={shippingCountryName}
                    billingCountryName={billingCountryName}
                    cartSummary={cartSummary}
                    validation={validation}
                    isValidating={validateCart.isPending}
                    onSubmit={handleReviewSubmit}
                    onBack={() => goToStep("payment")}
                    isSubmitting={completeCheckout.isPending}
                  />
                )}
              </div>
            </div>

            {/* Right: Visual order summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <OrderVisualSummary cart={cart} cartSummary={cartSummary} checkoutSession={checkoutSession} />

              {/* Coupon */}
              <div className="mt-4">
                <details className="group rounded-xl border border-border/60 bg-card">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground">
                    <Tag size={14} />
                    Have a coupon?
                    <ChevronDown size={14} className="ml-auto transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-4 pb-4">
                    <CouponInput
                      appliedCode={cartSummary?.coupon_code || cart?.coupon_code || checkoutSession?.coupon_code || ""}
                      onApply={(code) => applyCoupon.mutateAsync(code)}
                      onRemove={() => removeCoupon.mutateAsync()}
                      isApplying={applyCoupon.isPending}
                      isRemoving={removeCoupon.isPending}
                    />
                  </div>
                </details>
              </div>

              {/* Gift options */}
              <div className="mt-4">
                <details className="group rounded-xl border border-border/60 bg-card">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground">
                    <Gift size={14} />
                    Gift options
                    <ChevronDown size={14} className="ml-auto transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-4 pb-4">
                    <GiftOptions
                      isGift={Boolean(checkoutSession?.is_gift)}
                      giftMessage={checkoutSession?.gift_message || ""}
                      giftWrap={Boolean(checkoutSession?.gift_wrap)}
                      giftWrapEnabled={Boolean(cartSummary?.gift_wrap_enabled)}
                      giftWrapLabel={cartSummary?.gift_wrap_label || "Gift wrap"}
                      giftWrapAmount={cartSummary?.gift_wrap_amount}
                      currencyCode={cartSummary?.currency_code || cart?.currency || ""}
                      onUpdate={(payload) => updateGiftOptions.mutateAsync(payload)}
                      isUpdating={updateGiftOptions.isPending}
                    />
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}

function GiftOptions({
  isGift: initialIsGift,
  giftMessage: initialMessage,
  giftWrap: initialWrap,
  giftWrapEnabled,
  giftWrapLabel,
  giftWrapAmount,
  currencyCode,
  onUpdate,
  isUpdating,
}: {
  isGift: boolean;
  giftMessage: string;
  giftWrap: boolean;
  giftWrapEnabled: boolean;
  giftWrapLabel: string;
  giftWrapAmount?: string | null;
  currencyCode: string;
  onUpdate: (payload: { is_gift?: boolean; gift_message?: string; gift_wrap?: boolean }) => Promise<unknown>;
  isUpdating: boolean;
}) {
  const { push } = useToast();
  const [isGift, setIsGift] = React.useState(initialIsGift);
  const [giftMessage, setGiftMessage] = React.useState(initialMessage);
  const [giftWrap, setGiftWrap] = React.useState(initialWrap);
  const [saving, setSaving] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => { setIsGift(initialIsGift); }, [initialIsGift]);
  React.useEffect(() => { setGiftMessage(initialMessage); }, [initialMessage]);
  React.useEffect(() => { setGiftWrap(initialWrap); }, [initialWrap]);

  const saveGiftOptions = React.useCallback(async (gift: boolean, message: string, wrap: boolean) => {
    setSaving(true);
    try {
      await onUpdate({ is_gift: gift, gift_message: message, gift_wrap: wrap });
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  }, [onUpdate]);

  const debouncedSave = React.useCallback((gift: boolean, message: string, wrap: boolean) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveGiftOptions(gift, message, wrap), 600);
  }, [saveGiftOptions]);

  React.useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleToggleGift = (checked: boolean) => {
    setIsGift(checked);
    if (!checked) {
      setGiftWrap(false);
      setGiftMessage("");
      saveGiftOptions(false, "", false);
    } else {
      debouncedSave(checked, giftMessage, giftWrap);
    }
  };

  const handleMessageChange = (value: string) => {
    setGiftMessage(value);
    debouncedSave(isGift, value, giftWrap);
  };

  const handleToggleWrap = (checked: boolean) => {
    setGiftWrap(checked);
    debouncedSave(isGift, giftMessage, checked);
  };

  const statusText = saving ? "Saving..." : isUpdating ? "Saving..." : null;

  return (
    <div className="space-y-3">
      {/* Main gift toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Gift size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">Mark as a gift</p>
            <p className="text-[11px] text-muted-foreground">Add a personal message</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isGift}
          onClick={() => handleToggleGift(!isGift)}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-lg border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            isGift ? "border-primary bg-primary" : "border-border bg-muted"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 rounded-[5px] bg-background shadow-sm transition-transform duration-200",
              isGift ? "translate-x-[22px]" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {/* Gift message & wrap — shown when gift is on */}
      {isGift && (
        <div className="space-y-3 animate-in slide-in-from-top-1 fade-in duration-200">
          <div className="relative">
            <textarea
              rows={2}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              placeholder="Write a gift message..."
              value={giftMessage}
              onChange={(e) => handleMessageChange(e.target.value)}
            />
          </div>

          {giftWrapEnabled && (
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Package size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{giftWrapLabel}</p>
                  {giftWrapAmount && (
                    <p className="text-[11px] text-muted-foreground">
                      +{formatMoney(giftWrapAmount, currencyCode)}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={giftWrap}
                onClick={() => handleToggleWrap(!giftWrap)}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-lg border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  giftWrap ? "border-primary bg-primary" : "border-border bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 rounded-[5px] bg-background shadow-sm transition-transform duration-200",
                    giftWrap ? "translate-x-[22px]" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          )}

          {/* Save status */}
          {statusText && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>{statusText}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function CouponInput({
  appliedCode,
  onApply,
  onRemove,
  isApplying,
  isRemoving,
}: {
  appliedCode: string;
  onApply: (code: string) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  isApplying: boolean;
  isRemoving: boolean;
}) {
  const { push } = useToast();
  const [code, setCode] = React.useState(appliedCode || "");

  React.useEffect(() => { setCode(appliedCode || ""); }, [appliedCode]);

  const handleApply = async () => {
    if (!code.trim()) { push("Enter a coupon code.", "error"); return; }
    try { await onApply(code.trim()); push("Coupon applied.", "success"); }
    catch (error) { push(error instanceof Error ? error.message : "Could not apply coupon.", "error"); }
  };

  const handleRemove = async () => {
    try { await onRemove(); setCode(""); push("Coupon removed.", "info"); }
    catch (error) { push(error instanceof Error ? error.message : "Could not remove coupon.", "error"); }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-success-500/5 px-3 py-2">
        <p className="text-xs text-foreground/80">Applied: <span className="font-semibold text-success-600">{appliedCode}</span></p>
        <Button type="button" size="sm" variant="ghost" onClick={handleRemove} disabled={isRemoving} className="h-7 px-2 text-xs">
          {isRemoving ? "..." : "Remove"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        className="h-9 flex-1 rounded-lg border border-border bg-transparent px-3 text-xs"
        placeholder="Coupon code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <Button type="button" size="sm" variant="secondary" className="h-9 px-3 text-xs" onClick={handleApply} disabled={isApplying}>
        {isApplying ? "..." : "Apply"}
      </Button>
    </div>
  );
}
