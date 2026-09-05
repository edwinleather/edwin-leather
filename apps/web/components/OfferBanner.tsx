"use client";

import { useSiteSettings } from "@/lib/site-settings";
import { useDeliveryConfig } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";

export function OfferBanner() {
  const { settings } = useSiteSettings();
  const delivery = useDeliveryConfig();

  const message = settings?.announcement?.trim() || `Free delivery across India on orders above ${formatPrice(delivery.freeDeliveryThreshold)}`;

  return (
    <div className="announcement-bar" role="region" aria-label="Announcement">
      {message}
    </div>
  );
}
