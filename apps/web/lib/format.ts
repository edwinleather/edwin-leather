import { siteConfig } from "./site-config";

export function formatPrice(value: number) {
  return new Intl.NumberFormat(siteConfig.locale, {
    style: "currency",
    currency: siteConfig.currency,
    maximumFractionDigits: 0
  }).format(value);
}
