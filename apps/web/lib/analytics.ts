const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
  [key: string]: unknown;
};

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("sid");
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("sid", id); }
  return id;
}

let viewTimer: ReturnType<typeof setTimeout> | null = null;
let lastViewedProduct: string | null = null;

export function trackEvent(type: string, payload: Record<string, unknown> = {}) {
  const sessionId = getOrCreateSessionId();
  fetch(`${API}/products/analytics/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ type, sessionId, ...payload })
  }).catch(() => {});
}

export function trackProductView(productId: string) {
  if (lastViewedProduct === productId) return;
  lastViewedProduct = productId;
  if (viewTimer) clearTimeout(viewTimer);
  viewTimer = setTimeout(() => {
    trackEvent("product_view", { productId });
  }, 1500);
}

export function trackViewItem(item: AnalyticsItem) {
  trackEvent("product_view", { productId: item.item_id, ...item });
}

export function trackViewItemList(items: AnalyticsItem[], listId?: string, listName?: string) {
  trackEvent("page_view", { meta: { list: listId ?? listName, items: items.map((i) => i.item_id) } });
}

export function trackSelectItem(item: AnalyticsItem, listId?: string, listName?: string) {
  trackEvent("product_view", { productId: item.item_id, list: listId, ...item });
}

export function trackAddToCart(...args: [AnalyticsItem] | [string, string?, number?]) {
  lastViewedProduct = null;
  if (typeof args[0] === "string") {
    trackEvent("add_to_cart", { productId: args[0], variantId: args[1], quantity: args[2] });
  } else {
    trackEvent("add_to_cart", args[0]);
  }
}

export function trackRemoveFromCart(productId: string, variantId?: string) {
  trackEvent("remove_from_cart", { productId, variantId });
}

export function trackBeginCheckout(itemsOrPayload: AnalyticsItem[] | Record<string, unknown>, total?: number, items?: AnalyticsItem[]) {
  if (Array.isArray(itemsOrPayload)) {
    trackEvent("checkout_start", { items: itemsOrPayload, amount: total });
  } else {
    trackEvent("checkout_start", itemsOrPayload);
  }
}

export function trackPurchase(orderIdOrPayload: string | Record<string, unknown>, items?: AnalyticsItem[], total?: number) {
  if (typeof orderIdOrPayload === "string") {
    trackEvent("checkout_complete", { orderId: orderIdOrPayload, items, amount: total });
    trackEvent("order_placed", { orderId: orderIdOrPayload, items, amount: total });
  } else {
    trackEvent("checkout_complete", orderIdOrPayload);
    trackEvent("order_placed", orderIdOrPayload);
  }
}

export function trackCheckoutStart() {
  trackEvent("checkout_start");
}

export function trackCheckoutComplete(orderId: string, amount: number) {
  trackEvent("checkout_complete", { orderId, amount });
  trackEvent("order_placed", { orderId, amount });
}

export function trackPageView() {
  if (typeof window === "undefined") return;
  trackEvent("page_view", { meta: { path: window.location.pathname } });
}

export function initAnalytics() {
  if (typeof window === "undefined") return;
  trackPageView();
}
