const API_URL = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

export type PlaceOrderPayload = {
  email: string;
  paymentMethod: "razorpay" | "cod";
  items: { productId: string; variantId: string; quantity: number }[];
  couponCode?: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
};

export type OrderResponse = {
  id: string;
  orderNumber: string;
  email: string;
  orderStatus: string;
  paymentStatus: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
};

export type PlaceOrderResult =
  | { ok: true; demo: boolean; order: OrderResponse }
  | { ok: false; demo?: boolean; error: string };

export async function placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, demo: Boolean(body?.demo), error: body?.error || `Request failed (${response.status})` };
    }
    return { ok: true, demo: Boolean(body?.demo), order: body?.order };
  } catch {
    return { ok: false, error: "Could not reach the checkout service. Your order was not charged." };
  }
}

export type RazorpayOrderResult =
  | { ok: true; orderId: string; amount: number; currency: string; keyId: string }
  | { ok: false; error: string };

export async function createRazorpayOrder(orderId: string, receipt: string): Promise<RazorpayOrderResult> {
  try {
    const response = await fetch(`${API_URL}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId, receipt })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error || `Payment setup failed (${response.status})` };
    return { ok: true, orderId: body.orderId, amount: body.amount, currency: body.currency, keyId: body.keyId };
  } catch {
    return { ok: false, error: "Could not reach the payment service." };
  }
}

export async function verifyPayment(orderId: string, paymentId: string, signature: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId, paymentId, signature })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error || "Payment verification failed" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the payment service." };
  }
}

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  phone?: string;
  emailVerified?: boolean;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string; code?: string; devOtp?: string };

async function authRequest(path: string, payload: unknown): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_URL}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, error: body?.error || `Request failed (${response.status})`, code: body?.details?.code, devOtp: body?.devOtp };
    }
    return { ok: true, user: body?.user };
  } catch {
    return { ok: false, error: "Could not reach the authentication service." };
  }
}

export function signup(payload: { firstName: string; lastName?: string; email: string; phone: string; password: string }) {
  return authRequest("signup", payload) as Promise<{ ok: boolean } & { devOtp?: string; cooldownMs?: number; message?: string; error?: string; code?: string }>;
}

export function verifyOtp(payload: { email: string; code: string }) {
  return authRequest("verify-otp", payload);
}

export function resendOtp(email: string) {
  return authRequest("resend-otp", { email }) as Promise<{ ok: boolean } & { devOtp?: string; message?: string; error?: string; code?: string }>;
}

export function login(payload: { email: string; password: string }) {
  return authRequest("login", payload);
}

const DB_NOT_READY = /mongodb is required|database unavailable|database.*not ready/i;

async function retryWhenDbCold(request: () => Promise<AuthResult>): Promise<AuthResult> {
  let result = await request();
  for (let attempt = 0; attempt < 2 && !result.ok && DB_NOT_READY.test(result.error || ""); attempt++) {
    await new Promise((r) => setTimeout(r, 1200 + attempt * 600));
    result = await request();
  }
  return result;
}

export function loginWithGoogle(credential: string) {
  return retryWhenDbCold(() => authRequest("google", { credential }));
}

export async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    // ignore — session will be cleared client-side regardless
  }
}

export type AccountMe =
  | { ok: true; user: { _id: string; email: string; firstName?: string; lastName?: string; phone?: string; provider?: string; role: string; addresses: unknown[]; emailVerifiedAt?: string } }
  | { ok: false; error?: string };

export async function fetchMe(): Promise<AccountMe> {
  try {
    const response = await fetch(`${API_URL}/account/me`, { credentials: "include" });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error };
    return { ok: true, user: body?.user };
  } catch {
    return { ok: false, error: "Could not reach the account service." };
  }
}