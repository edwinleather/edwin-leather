import { SiteSetting } from "../models/SiteSetting.js";
import { env } from "../config/env.js";

export type PaymentMode = "test" | "live";

export type PaymentKeys = {
  mode: PaymentMode;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
};

let cached: { keys: PaymentKeys; expires: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

function resolveKeys(mode: PaymentMode): PaymentKeys {
  if (mode === "live") {
    return {
      mode: "live",
      keyId: env.razorpayLiveKeyId || env.razorpayKeyId,
      keySecret: env.razorpayLiveKeySecret || env.razorpayKeySecret,
      webhookSecret: env.razorpayLiveWebhookSecret || env.razorpayWebhookSecret
    };
  }
  return {
    mode: "test",
    keyId: env.razorpayTestKeyId || env.razorpayKeyId,
    keySecret: env.razorpayTestKeySecret || env.razorpayKeySecret,
    webhookSecret: env.razorpayTestWebhookSecret || env.razorpayWebhookSecret
  };
}

export async function getPaymentKeys(): Promise<PaymentKeys> {
  const now = Date.now();
  if (cached && now < cached.expires) return cached.keys;

  try {
    const doc = await SiteSetting.findOne({ key: "site" }).lean();
    const mode: PaymentMode = (doc as Record<string, unknown>)?.paymentMode === "live" ? "live" : "test";
    const keys = resolveKeys(mode);
    cached = { keys, expires: now + CACHE_TTL };
    return keys;
  } catch {
    // If DB is unavailable, fall back to env-based resolution (defaults to test)
    const keys = resolveKeys("test");
    cached = { keys, expires: now + CACHE_TTL };
    return keys;
  }
}

export function invalidatePaymentConfigCache() {
  cached = null;
}
