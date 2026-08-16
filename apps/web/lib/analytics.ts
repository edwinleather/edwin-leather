import { siteConfig } from "./site-config";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Loads gtag once, only when a measurement ID is configured. In demo/dev
// environments without NEXT_PUBLIC_GA_MEASUREMENT_ID every helper becomes a
// no-op, so the storefront never errors or sends data accidentally.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

let initialized = false;

export function analyticsEnabled(): boolean {
  return Boolean(GA_ID);
}

export function initAnalytics(): void {
  if (initialized || !GA_ID || typeof window === "undefined") return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_ID, { send_page_view: true });
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

// GA4 enhanced-ecommerce item shape.
export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
};

const CURRENCY = siteConfig.currency;

export function trackViewItemList(items: AnalyticsItem[], itemListId: string, itemListName: string): void {
  trackEvent("view_item_list", { item_list_id: itemListId, item_list_name: itemListName, items });
}

export function trackSelectItem(item: AnalyticsItem, itemListId?: string, itemListName?: string): void {
  trackEvent("select_item", { item_list_id: itemListId, item_list_name: itemListName, items: [item] });
}

export function trackViewItem(item: AnalyticsItem): void {
  trackEvent("view_item", { currency: CURRENCY, value: item.price, items: [item] });
}

export function trackAddToCart(item: AnalyticsItem): void {
  trackEvent("add_to_cart", { currency: CURRENCY, value: item.price * (item.quantity ?? 1), items: [item] });
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number, coupon?: string): void {
  trackEvent("begin_checkout", { currency: CURRENCY, value, coupon, items });
}

export function trackPurchase(payload: {
  transaction_id: string;
  value: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  items: AnalyticsItem[];
}): void {
  trackEvent("purchase", {
    currency: payload.currency ?? CURRENCY,
    value: payload.value,
    tax: payload.tax,
    shipping: payload.shipping,
    transaction_id: payload.transaction_id,
    items: payload.items
  });
}
