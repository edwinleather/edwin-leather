import { siteConfig } from "./site-config";

// International format without the leading "+" and without spaces - what the
// WhatsApp deep link expects.
export function whatsappNumber(): string {
  return siteConfig.phone.replace(/[^\d]/g, "");
}

// Builds a wa.me-style deep link to api.whatsapp.com with a personalized
// pre-filled message. `window.location.href` is read lazily so this stays safe
// in both server and client rendering contexts.
export function whatsappLink(opts?: { message?: string; path?: string }): string {
  const number = whatsappNumber();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = opts?.path || (typeof window !== "undefined" ? window.location.pathname : "");
  const context = path && path !== "/" ? ` I'd like to know more from ${origin}${path}.` : "";
  const body = opts?.message?.trim() || `Hi - I'd like to know more about Edwin Leathers.${context}`;
  const text = encodeURIComponent(body);
  return `https://api.whatsapp.com/send/?phone=${number}&text=${text}&type=phone_number&app_absent=0`;
}