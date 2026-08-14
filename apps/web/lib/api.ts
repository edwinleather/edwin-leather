<<<<<<< Updated upstream
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type SessionUser = {
=======
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

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

export type AuthUser = {
>>>>>>> Stashed changes
  id: string;
  email: string;
  role: string;
  firstName?: string;
<<<<<<< Updated upstream
  lastName?: string;
  phone?: string;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { message?: string }).message ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

export async function sendSignupOtp(payload: { email: string; password: string; firstName?: string; lastName?: string; phone?: string }) {
  return apiFetch<{ ok: boolean; message: string; masked: string }>("/auth/signup", { method: "POST", body: JSON.stringify(payload) });
}

export async function verifyOtp(payload: { email: string; code: string; profile?: { password?: string; firstName?: string; lastName?: string; phone?: string } }) {
  return apiFetch<{ ok: boolean; user: SessionUser }>("/auth/verify-otp", { method: "POST", body: JSON.stringify(payload) });
}

export async function resendOtp(payload: { email: string }) {
  return apiFetch<{ ok: boolean; message: string; masked: string }>("/auth/resend-otp", { method: "POST", body: JSON.stringify(payload) });
}

export async function login(payload: { email: string; password: string }) {
  return apiFetch<{ ok: boolean; user: SessionUser }>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export async function loginWithGoogle(credential: string) {
  return apiFetch<{ ok: boolean; user: SessionUser }>("/auth/google", { method: "POST", body: JSON.stringify({ credential }) });
}

export async function logout() {
  return apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export function safeRedirect(url: string) {
  // Defer so any in-flight View Transition (Next App Router) finishes first,
  // avoiding "Transition was aborted because of invalid state". A hard
  // navigation fully bypasses the SPA transition layer.
  window.setTimeout(() => {
    window.location.assign(url);
  }, 80);
}

export async function fetchMe() {
  return apiFetch<{ ok: boolean; user: SessionUser }>("/auth/me");
}

export type Address = {
  _id?: string;
  label?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export async function fetchAddresses() {
  return apiFetch<{ ok: boolean; addresses: Address[] }>("/account/addresses");
}

export async function addAddress(address: Omit<Address, "_id">) {
  return apiFetch<{ ok: boolean; addresses: Address[] }>("/account/addresses", { method: "POST", body: JSON.stringify(address) });
}

export async function deleteAddress(id: string) {
  return apiFetch<{ ok: boolean; addresses: Address[] }>(`/account/addresses/${id}`, { method: "DELETE" });
}

export async function updateProfile(payload: { firstName?: string; lastName?: string; phone?: string }) {
  return apiFetch<{ ok: boolean; user: SessionUser }>("/account/me", { method: "PATCH", body: JSON.stringify(payload) });
=======
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

export function loginWithGoogle(credential: string) {
  return authRequest("google", { credential });
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
>>>>>>> Stashed changes
}