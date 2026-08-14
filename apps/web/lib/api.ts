export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string;
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
}