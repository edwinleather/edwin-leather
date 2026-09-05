"use client";

import { useEffect, useState } from "react";
import { getDeliveryConfig, type DeliveryConfig } from "./api";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar",
  "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  defaultFee: 120,
  stateFees: [{ state: "Uttar Pradesh", fee: 80 }],
  freeDeliveryThreshold: 2499
};

let cached: { data: DeliveryConfig; ts: number } | null = null;
let inflight: Promise<DeliveryConfig | null> | null = null;

export function deliveryFeeFor(config: DeliveryConfig, state?: string): number {
  const found = config.stateFees.find((entry) => entry.state.toLowerCase() === (state ?? "").trim().toLowerCase());
  return found ? found.fee : config.defaultFee;
}

// Fetches the delivery config once (module-level cache shared across the app).
export async function loadDeliveryConfig(): Promise<DeliveryConfig> {
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) return cached.data;
  cached = null;
  if (!inflight) {
    inflight = getDeliveryConfig().then((config) => {
      const resolved = config ?? DEFAULT_DELIVERY_CONFIG;
      cached = { data: resolved, ts: Date.now() };
      return resolved;
    }).finally(() => {
      inflight = null;
    });
  }
  return inflight as Promise<DeliveryConfig>;
}

export function useDeliveryConfig(): DeliveryConfig {
  const [config, setConfig] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG);
  useEffect(() => {
    let active = true;
    loadDeliveryConfig().then((value) => {
      if (active) setConfig(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return config;
}