"use client";

import { useEffect, useState } from "react";
import { getTaxConfig, type TaxConfig } from "./api";

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  gstRate: 0,
  gstFreeAbove: 0
};

let cached: TaxConfig | null = null;
let inflight: Promise<TaxConfig> | null = null;

export async function loadTaxConfig(): Promise<TaxConfig> {
  if (cached) return cached;
  if (!inflight) {
    inflight = getTaxConfig().then((config) => {
      const resolved = config ?? DEFAULT_TAX_CONFIG;
      cached = resolved;
      return resolved;
    }).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export function gstFor(config: TaxConfig, subtotal: number): number {
  if (subtotal <= 0 || config.gstRate <= 0) return 0;
  if (config.gstFreeAbove > 0 && subtotal >= config.gstFreeAbove) return 0;
  return Math.round((subtotal * config.gstRate) / 100);
}

export function useTaxConfig(): TaxConfig {
  const [config, setConfig] = useState<TaxConfig>(DEFAULT_TAX_CONFIG);
  useEffect(() => {
    let active = true;
    loadTaxConfig().then((value) => {
      if (active) setConfig(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return config;
}