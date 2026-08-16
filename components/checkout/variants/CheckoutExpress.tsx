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
import { ApiError } from "@/lib/api";
import { fetchSiteSettings } from "@/lib/siteSettings";
import { formatMoney } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, Shield, Truck, RotateCcw, CreditCard, Wallet, Smartphone } from "lucide-react";
import type { CheckoutValidation, ShippingMethodOption } from "@/lib/types";

const stepOrder = ["information", "shipping", "payment", "review"] as const;
type Step = (typeof stepOrder)[number];

const parseStep = (value: string | null): Step | null => {
  if (!value) return null;
  return stepOrder.includes(value as Step) ? (value as Step) : null;
};

function ExpressWalletButton({ label, icon, onClick, className }: { label: string; icon: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-border/80 bg-foreground text-background text-sm font-semibold transition-all hover:bg-foreground/90 hover:shadow-lg active:scale-[0.98]",
        className
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function TrustPill({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Icon size={14} className="shrink-0 text-primary" />
      <span>{text}</span>
    </div>
  );
}

export function CheckoutExpress() {
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
  const [currentStepIdx, setCurrentStepIdx] = React.useState(0);

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
    setCurrentStepIdx(maxStepIndex);
    setMaxStepInitialized(true);
  }, [checkoutSession, maxStepIndex, maxStepInitialized]);

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

  const nextStep = React.useCallback(() => {
    setCurrentStepIdx((prev) => Math.min(prev + 1, 3));
    const nextStepKey = stepOrder[Math.min(currentStepIdx + 1, 3)];
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", nextStepKey);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentStepIdx, pathname, router, searchParams]);

  const goToStep = React.useCallback(
    (step: Step) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleInfoSubmit = async (values: CheckoutInfoFormValues) => {
    try {
      await updateShippingInfo.mutateAsync(values);
      setLocalMaxStep((prev) => Math.max(prev, 1));
      nextStep();
    } catch (error) {
      push(error instanceof Error ? error.message : "Could not save shipping info.", "error");
    }
  };

  const handleShippingSubmit = async (payload: { shipping_type: "delivery" | "pickup"; shipping_rate_id?: string; pickup_location_id?: string; delivery_instructions?: string }) => {
    try {
      await selectShippingMethod.mutateAsync(payload);
      setLocalMaxStep((prev) => Math.max(prev, 2));
      nextStep();
    } catch (error) {
      push(error instanceof Error ? error.message : "Could not save shipping method.", "error");
    }
  };

  const handlePaymentSubmit = async (values: CheckoutPaymentFormValues) => {
    try {
      await selectPaymentMethod.mutateAsync(values);
      setLocalMaxStep((prev) => Math.max(prev, 3));
      nextStep();
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

  const currentStepKey = stepOrder[currentStepIdx] || "information";

  return (
    <AuthGate nextHref="/checkout" allowGuest={guestCheckoutEnabled} title="Sign in to checkout" description="Please sign in to continue with checkout.">
      <div className="min-h-screen bg-background text-foreground">
        <OrderProcessingModal isOpen={isOrderTransitioning} />
        <div className="mx-auto w-full max-w-5xl px-[var(--page-gutter)] py-8 sm:py-12">
          <div className="mb-6 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Checkout</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Express checkout</h1>
          </div>

          {/* Express Wallet Buttons - Top of page */}
          {currentStepKey === "information" && (
            <Card variant="bordered" className="mb-6 p-5">
              <div className="flex items-center gap-3 mb-4">
                <Wallet size={18} className="text-primary" />
                <p className="text-sm font-semibold">Express checkout</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ExpressWalletButton label="Apple Pay" icon={<Smartphone size={20} />} onClick={() => push("Express checkout coming soon.", "info")} />
                <ExpressWalletButton label="Google Pay" icon={<Wallet size={20} />} onClick={() => push("Express checkout coming soon.", "info")} className="bg-white text-foreground border-border hover:bg-muted" />
                <ExpressWalletButton label="PayPal" icon={<CreditCard size={20} />} onClick={() => push("Express checkout coming soon.", "info")} className="bg-[#0070ba] hover:bg-[#005ea6]" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or pay with card below</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </Card>
          )}

          {/* Trust signals */}
          <div className="mb-6 grid grid-cols-3 gap-2">
            <TrustPill icon={Shield} text="Secure payment" />
            <TrustPill icon={Truck} text="Fast delivery" />
            <TrustPill icon={RotateCcw} text="Easy returns" />
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center gap-1">
              {stepOrder.map((step, index) => (
                <React.Fragment key={step}>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      index < currentStepIdx
                        ? "bg-success/10 text-success"
                        : index === currentStepIdx
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index < currentStepIdx ? (
                      <Check size={14} />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold">{index + 1}</span>
                    )}
                    <span className="hidden sm:inline">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                  </div>
                  {index < stepOrder.length - 1 && <div className={cn("h-px flex-1", index < currentStepIdx ? "bg-success/30" : "bg-border")} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:gap-8">
            <div>
              {currentStepKey === "information" && (
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
              {currentStepKey === "shipping" && (
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
              {currentStepKey === "payment" && (
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
              {currentStepKey === "review" && (
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

            {/* Compact order summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card variant="bordered" className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Order summary</p>
                <div className="space-y-3">
                  {cart?.items?.map((item) => {
                    const isBundle = item.cart_item_type === "bundle";
                    const itemName = item.product_name || item.bundle_name || "Item";
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {item.product_image ? <Image src={item.product_image} alt={itemName} fill sizes="48px" className="object-cover" quality={60} /> : null}
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">{item.quantity}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{itemName}</p>
                          {isBundle && <Badge variant="accent" size="sm">Bundle</Badge>}
                        </div>
                        <p className="text-xs font-semibold shrink-0">{formatMoney(item.total, cartSummary?.currency_code || cart?.currency || "")}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(cartSummary?.subtotal || cart?.subtotal || "0", cart?.currency || "")}</span></div>
                  {cartSummary?.discount_amount && Number(cartSummary.discount_amount) > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatMoney(cartSummary.discount_amount, cart?.currency || "")}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{cartSummary?.shipping_cost ? formatMoney(cartSummary.shipping_cost, cart?.currency || "") : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{cartSummary?.tax_amount ? formatMoney(cartSummary.tax_amount, cart?.currency || "") : "—"}</span></div>
                  <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold"><span>Total</span><span>{formatMoney(cartSummary?.total || cart?.subtotal || "0", cart?.currency || "")}</span></div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
