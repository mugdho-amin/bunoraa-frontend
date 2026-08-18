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
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { OrderProcessingModal } from "@/components/checkout/OrderProcessingModal";
import { useCheckoutData } from "@/components/checkout/useCheckoutData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchSiteSettings } from "@/lib/siteSettings";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, User, Truck, CreditCard, ClipboardCheck, Lock } from "lucide-react";
import type { CheckoutValidation, ShippingMethodOption } from "@/lib/types";
import { CartItemImage } from "@/components/checkout/CartItemImage";

const stepOrder = ["information", "shipping", "payment", "review"] as const;
type Step = (typeof stepOrder)[number];

const stepMeta: Record<Step, { label: string; icon: React.ElementType; description: string }> = {
  information: { label: "Contact & Shipping", icon: User, description: "Where should we deliver?" },
  shipping: { label: "Delivery Method", icon: Truck, description: "How should we ship it?" },
  payment: { label: "Payment", icon: CreditCard, description: "How would you like to pay?" },
  review: { label: "Review & Place Order", icon: ClipboardCheck, description: "Everything look good?" },
};

const parseStep = (value: string | null): Step | null => {
  if (!value) return null;
  return stepOrder.includes(value as Step) ? (value as Step) : null;
};

function AccordionPanel({
  step,
  isCurrent,
  isComplete,
  isClickable,
  onToggle,
  children,
  summary,
}: {
  step: Step;
  isCurrent: boolean;
  isComplete: boolean;
  isClickable: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  summary?: React.ReactNode;
}) {
  const meta = stepMeta[step];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-300",
        isCurrent
          ? "border-primary/40 bg-card shadow-md"
          : isComplete
            ? "border-success/20 bg-card"
            : "border-border/60 bg-card/50"
      )}
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-4 p-5 text-left transition-colors",
          isClickable && "cursor-pointer hover:bg-muted/30",
          !isClickable && "cursor-default"
        )}
        disabled={!isClickable}
        aria-expanded={isCurrent}
        onClick={onToggle}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
            isComplete
              ? "bg-success text-white"
              : isCurrent
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          )}
        >
          {isComplete ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", isCurrent ? "text-foreground" : "text-muted-foreground")}>
            {meta.label}
          </p>
          {!isCurrent && summary ? (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{summary}</p>
          ) : !isCurrent ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
          ) : null}
        </div>
        {isComplete && !isCurrent ? (
          <span className="shrink-0 text-xs font-medium text-success">Completed</span>
        ) : null}
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-300",
            isCurrent && "rotate-180 text-primary"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-400 ease-in-out",
          isCurrent ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/60 p-5 pt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutAccordion() {
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
  const isLoading = checkoutQuery.isLoading || cartQuery.isLoading || cartSummaryQuery.isLoading;

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
  }, [checkoutSession, maxStepIndex, maxStepInitialized]);

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
    if (!shippingPayload || !["shipping", "payment", "review"].includes(currentStep)) return;
    const key = JSON.stringify(shippingPayload);
    if (key === lastRatesKey.current) return;
    lastRatesKey.current = key;
    calculateShipping.mutate(shippingPayload, {
      onSuccess: (data) => { setShippingRates(data.methods || []); setShippingRatesError(null); },
      onError: (error) => { setShippingRates([]); setShippingRatesError(error instanceof Error ? error.message : "Failed to load shipping rates."); },
    });
  }, [shippingPayload, currentStep, calculateShipping]);

  const validationKey = React.useMemo(() => {
    if (currentStep !== "review") return "";
    return JSON.stringify({ cartId: cart?.id, cartUpdatedAt: cart?.updated_at, total: cartSummary?.total, shipping: cartSummary?.shipping_cost, sm: checkoutSession?.shipping_method, pm: checkoutSession?.payment_method, gw: checkoutSession?.gift_wrap, coupon: checkoutSession?.coupon_code || cartSummary?.coupon_code });
  }, [currentStep, cart?.id, cart?.updated_at, cartSummary?.total, cartSummary?.shipping_cost, cartSummary?.coupon_code, checkoutSession?.shipping_method, checkoutSession?.payment_method, checkoutSession?.gift_wrap, checkoutSession?.coupon_code]);

  React.useEffect(() => {
    if (currentStep !== "review" || completeCheckout.isPending || completeCheckout.isSuccess || cartEmpty || !validationKey || validateCart.isPending) return;
    if (validationKey === lastValidationKey.current) return;
    lastValidationKey.current = validationKey;
    validateCart.mutate(undefined, {
      onSuccess: (data) => setValidation(data),
      onError: () => setValidation(null),
    });
  }, [cartEmpty, completeCheckout.isPending, completeCheckout.isSuccess, currentStep, validationKey, validateCart]);

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

  const infoSummary = checkoutSession ? `${checkoutSession.shipping_first_name} ${checkoutSession.shipping_last_name} · ${checkoutSession.shipping_city || "—"}` : undefined;
  const shippingSummary = checkoutSession?.shipping_method ? (checkoutSession.shipping_method === "pickup" ? `Store pickup` : `Delivery · ${checkoutSession.shipping_method}`) : undefined;
  const paymentSummary = checkoutSession?.payment_method ? `Payment selected` : undefined;

  if (guestSettingsQuery.isLoading && !hasToken) {
    return <div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-16"><Card variant="bordered" className="h-32 animate-pulse" /></div>;
  }
  if (!hasToken && guestSettingsQuery.isError) {
    return <div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-16"><Card variant="bordered" className="space-y-3 text-center"><h1 className="text-2xl font-semibold">Checkout unavailable</h1><Button asChild><Link href="/cart/">Back to bag</Link></Button></Card></div>;
  }
  if (isLoading) {
    return <AuthGate nextHref="/checkout" allowGuest={guestCheckoutEnabled}><div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-16"><Card variant="bordered" className="h-32 animate-pulse" /></div></AuthGate>;
  }
  if (cartEmpty) {
    return <AuthGate nextHref="/checkout" allowGuest={guestCheckoutEnabled}><div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-16"><Card variant="bordered" className="space-y-3 text-center"><h1 className="text-2xl font-semibold">Your bag is empty</h1><div className="flex justify-center gap-3"><Button asChild><Link href="/cart/">Go to bag</Link></Button><Button asChild variant="secondary"><Link href="/products/">Continue shopping</Link></Button></div></Card></div></AuthGate>;
  }

  return (
    <AuthGate nextHref="/checkout" allowGuest={guestCheckoutEnabled} title="Sign in to checkout" description="Please sign in to continue with checkout.">
      <div className="min-h-screen bg-background text-foreground">
        <OrderProcessingModal isOpen={isOrderTransitioning} />
        <div className="mx-auto w-full max-w-4xl px-[var(--page-gutter)] py-8 sm:py-12">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Checkout</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Secure checkout</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
              <Lock size={12} />
              <span>Encrypted &amp; secure</span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-8">
            <div className="space-y-3">
              {stepOrder.map((step, index) => {
                const isCurrent = step === currentStep;
                const isComplete = index < clampedIndex;
                const isClickable = index <= clampedIndex;
                return (
                  <AccordionPanel
                    key={step}
                    step={step}
                    isCurrent={isCurrent}
                    isComplete={isComplete}
                    isClickable={isClickable}
                    onToggle={() => isClickable && goToStep(step)}
                    summary={step === "information" ? infoSummary : step === "shipping" ? shippingSummary : step === "payment" ? paymentSummary : undefined}
                  >
                    {step === "information" && (
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
                    {step === "shipping" && (
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
                    {step === "payment" && (
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
                    {step === "review" && (
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
                  </AccordionPanel>
                );
              })}
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              {/* Product image grid */}
              {cart?.items && cart.items.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Your items</p>
                  <div className="grid grid-cols-2 gap-2">
                    {cart.items.slice(0, 4).map((item) => {
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
                  {(cart.item_count || 0) > 4 && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">+{(cart.item_count || 0) - 4} more items</p>
                  )}
                </div>
              )}

              <CheckoutSummary
                cart={cart}
                cartSummary={cartSummary}
                checkoutSession={checkoutSession}
                onApplyCoupon={(code) => applyCoupon.mutateAsync(code)}
                onRemoveCoupon={() => removeCoupon.mutateAsync()}
                onUpdateGift={(payload) => updateGiftOptions.mutateAsync(payload)}
                isUpdatingGift={updateGiftOptions.isPending}
                isApplyingCoupon={applyCoupon.isPending}
                isRemovingCoupon={removeCoupon.isPending}
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
