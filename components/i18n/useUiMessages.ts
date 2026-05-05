"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLocale } from "@/components/providers/LocaleProvider";

type UiNamespace = "auth" | "cart" | "checkout" | "common" | "filters" | "footer";
type MessageMap = Record<string, string>;

const FALLBACK_MESSAGES: Record<string, Partial<Record<UiNamespace, MessageMap>>> = {
  en: {
    common: {
      close: "Close",
      continue_shopping: "Continue shopping",
      loading: "Loading...",
    },
    auth: {
      authentication_required: "Authentication required",
      please_sign_in_continue: "Please sign in to continue.",
      sign_in: "Sign in",
    },
    cart: {
      bag_title: "Your bag",
      mini_bag_title: "Mini bag",
      your_bag_empty: "Your bag is empty.",
      add_items_to_see_here: "Add items to see them here.",
      view_bag: "View bag",
      checkout: "Checkout",
      subtotal: "Subtotal",
      estimated_total: "Estimated total",
      remove: "Remove",
      decrease_quantity: "Decrease quantity",
      increase_quantity: "Increase quantity",
      empty_bag_notice: "Your bag is empty.",
      items_waiting_notice: "You have items waiting in your bag.",
      added_to_bag: "Added to bag.",
      add_failed: "Could not add to bag.",
      adding: "Adding...",
      add_to_bag: "Add to bag",
    },
    checkout: {
      order_confirmed: "Order confirmed",
      thank_you: "Thank you for your purchase",
      processing_order_now: "We're processing your order now.",
      loading_order_details: "Loading order details...",
      order_number_copied: "Order number copied.",
      copy_failed: "Could not copy order number.",
      order_details_unavailable: "We couldn't load full order details yet.",
      contact_support_order: "If you need help, please contact support with your order number.",
      shipping_to: "Shipping to",
      view_order_details: "View order details",
      view_orders: "View orders",
      email_updates: "Your order is confirmed. We'll email you with updates.",
      order_confirmed_simple: "Your order is confirmed.",
    },
    filters: {
      filters: "Filters",
      clear_all: "Clear all",
      subcategories: "Subcategories",
      price_range: "Price range",
      availability: "Availability",
      in_stock_only: "In stock only",
      on_sale: "On sale",
      new_arrivals: "New arrivals",
      rating: "Rating",
      stars_plus: "{value}+ stars",
      product_count: "{count} products",
    },
    footer: {
      display_preferences: "Display preferences",
      theme: "Theme",
      language: "Language",
      currency: "Currency",
      country: "Country",
      timezone: "Timezone",
      close_preferences: "Close preferences",
      theme_changed: "Theme changed to {value}.",
      language_changed: "Language changed to {value}.",
      currency_changed: "Currency changed to {value}.",
      country_changed: "Country changed to {value}.",
      timezone_changed: "Timezone changed to {value}.",
    },
  },
  bn: {
    common: {
      close: "বন্ধ করুন",
      continue_shopping: "কেনাকাটা চালিয়ে যান",
      loading: "লোড হচ্ছে...",
    },
    auth: {
      authentication_required: "প্রমাণীকরণ প্রয়োজন",
      please_sign_in_continue: "চালিয়ে যেতে সাইন ইন করুন।",
      sign_in: "সাইন ইন",
    },
    cart: {
      bag_title: "আপনার ব্যাগ",
      mini_bag_title: "মিনি ব্যাগ",
      your_bag_empty: "আপনার ব্যাগ খালি।",
      add_items_to_see_here: "এখানে দেখতে পণ্য যোগ করুন।",
      view_bag: "ব্যাগ দেখুন",
      checkout: "চেকআউট",
      subtotal: "সাবটোটাল",
      estimated_total: "আনুমানিক মোট",
      remove: "মুছুন",
      decrease_quantity: "পরিমাণ কমান",
      increase_quantity: "পরিমাণ বাড়ান",
      empty_bag_notice: "আপনার ব্যাগ খালি।",
      items_waiting_notice: "আপনার ব্যাগে কিছু পণ্য অপেক্ষা করছে।",
      added_to_bag: "ব্যাগে যোগ করা হয়েছে।",
      add_failed: "ব্যাগে যোগ করা যায়নি।",
      adding: "যোগ করা হচ্ছে...",
      add_to_bag: "ব্যাগে যোগ করুন",
    },
    checkout: {
      order_confirmed: "অর্ডার নিশ্চিত",
      thank_you: "আপনার কেনাকাটার জন্য ধন্যবাদ",
      processing_order_now: "আমরা এখন আপনার অর্ডার প্রক্রিয়া করছি।",
      loading_order_details: "অর্ডারের বিস্তারিত লোড হচ্ছে...",
      order_number_copied: "অর্ডার নম্বর কপি হয়েছে।",
      copy_failed: "অর্ডার নম্বর কপি করা যায়নি।",
      order_details_unavailable: "এখনই অর্ডারের পূর্ণ বিবরণ লোড করা যায়নি।",
      contact_support_order: "সহায়তা প্রয়োজন হলে আপনার অর্ডার নম্বরসহ সাপোর্টে যোগাযোগ করুন।",
      shipping_to: "যেখানে পাঠানো হবে",
      view_order_details: "অর্ডারের বিস্তারিত দেখুন",
      view_orders: "অর্ডারসমূহ দেখুন",
      email_updates: "আপনার অর্ডার নিশ্চিত হয়েছে। আমরা ইমেইলে আপডেট পাঠাব।",
      order_confirmed_simple: "আপনার অর্ডার নিশ্চিত হয়েছে।",
    },
    filters: {
      filters: "ফিল্টার",
      clear_all: "সব মুছুন",
      subcategories: "সাবক্যাটাগরি",
      price_range: "দামের সীমা",
      availability: "উপলভ্যতা",
      in_stock_only: "শুধু স্টকে থাকা",
      on_sale: "ছাড়ে আছে",
      new_arrivals: "নতুন এসেছে",
      rating: "রেটিং",
      stars_plus: "{value}+ স্টার",
      product_count: "{count}টি পণ্য",
    },
    footer: {
      display_preferences: "প্রদর্শন পছন্দসমূহ",
      theme: "থিম",
      language: "ভাষা",
      currency: "মুদ্রা",
      country: "দেশ",
      timezone: "সময় অঞ্চল",
      close_preferences: "পছন্দসমূহ বন্ধ করুন",
      theme_changed: "থিম {value} করা হয়েছে।",
      language_changed: "ভাষা {value} করা হয়েছে।",
      currency_changed: "মুদ্রা {value} করা হয়েছে।",
      country_changed: "দেশ {value} করা হয়েছে।",
      timezone_changed: "সময় অঞ্চল {value} করা হয়েছে।",
    },
  },
};

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return Object.entries(params).reduce(
    (message, [key, value]) => message.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}

async function fetchNamespaceMessages(language: string, namespaces: UiNamespace[]) {
  const response = await apiFetch<{
    messages?: Partial<Record<UiNamespace, MessageMap>>;
  }>("/i18n/messages/", {
    params: {
      lang: language,
      namespaces: namespaces.join(","),
    },
    suppressError: true,
  });
  return response.data?.messages || {};
}

export function useUiMessages(namespace: UiNamespace) {
  const { locale } = useLocale();
  const language = React.useMemo(
    () => String(locale.language || "en").trim().toLowerCase() || "en",
    [locale.language]
  );
  const namespaces = React.useMemo(() => ["common", namespace] as UiNamespace[], [namespace]);
  const query = useQuery({
    queryKey: ["ui-messages", language, namespaces.join(",")],
    queryFn: () => fetchNamespaceMessages(language, namespaces),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const messages = React.useMemo(() => {
    const english = FALLBACK_MESSAGES.en || {};
    const localized = FALLBACK_MESSAGES[language] || {};
    const remote = query.data || {};
    return {
      common: {
        ...(english.common || {}),
        ...(localized.common || {}),
        ...(remote.common || {}),
      },
      namespace: {
        ...(english[namespace] || {}),
        ...(localized[namespace] || {}),
        ...(remote[namespace] || {}),
      },
    };
  }, [language, namespace, query.data]);

  const t = React.useCallback(
    (key: string, fallback?: string, params?: Record<string, string | number>) => {
      const resolved =
        messages.namespace[key] ||
        messages.common[key] ||
        fallback ||
        key;
      return interpolate(resolved, params);
    },
    [messages]
  );

  return {
    t,
    language,
    isLoading: query.isLoading,
  };
}
