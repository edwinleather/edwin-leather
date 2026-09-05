import { siteConfig } from "./site-config";

export function formatPrice(value: number) {
  if (!Number.isFinite(value)) return formatPrice(0);
  return new Intl.NumberFormat(siteConfig.locale, {
    style: "currency",
    currency: siteConfig.currency,
    maximumFractionDigits: 0
  }).format(value);
}
