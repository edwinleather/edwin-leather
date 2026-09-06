import { EmailConfig } from "../models/EmailConfig.js";
import { EMAIL_TEMPLATE_KEYS } from "./email-templates/template-defaults.js";

export const DEFAULT_CC_TYPES = [
  "order_confirmation",
  "payment_received",
  "order_packed",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
  "return_requested"
];

export const DEFAULT_CC_EMAILS = ["shuzaurrehman786@gmail.com"];

export type EmailConfigData = {
  ccEmails: string[];
  ccTypes: string[];
};

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { data: EmailConfigData; expires: number } | null = null;

function defaults(): EmailConfigData {
  return { ccEmails: [...DEFAULT_CC_EMAILS], ccTypes: [...DEFAULT_CC_TYPES] };
}

export async function getEmailConfig(): Promise<EmailConfigData> {
  const now = Date.now();
  if (cache && now < cache.expires) return cache.data;

  try {
    const doc = await EmailConfig.findOne({ key: "config" }).lean();
    if (!doc) {
      cache = { data: defaults(), expires: now + CACHE_TTL_MS };
      return cache.data;
    }
    const known = EMAIL_TEMPLATE_KEYS as readonly string[];
    const data: EmailConfigData = {
      ccEmails: (doc.ccEmails ?? []).filter((e: string) => typeof e === "string" && e.trim()).map((e: string) => e.trim().toLowerCase()),
      ccTypes: (doc.ccTypes?.length ? doc.ccTypes : DEFAULT_CC_TYPES).filter((t: string) => known.includes(t))
    };
    if (data.ccEmails.length === 0) data.ccEmails = [...DEFAULT_CC_EMAILS];
    if (data.ccTypes.length === 0) data.ccTypes = [...DEFAULT_CC_TYPES];
    cache = { data, expires: now + CACHE_TTL_MS };
    return data;
  } catch {
    return defaults();
  }
}

export async function saveEmailConfig(input: EmailConfigData): Promise<EmailConfigData> {
  const known = EMAIL_TEMPLATE_KEYS as readonly string[];
  const data: EmailConfigData = {
    ccEmails: input.ccEmails.filter((e) => typeof e === "string" && e.trim()).map((e) => e.trim().toLowerCase()),
    ccTypes: input.ccTypes.filter((t) => known.includes(t as string))
  };
  await EmailConfig.updateOne({ key: "config" }, { $set: { ...data } }, { upsert: true });
  cache = { data, expires: Date.now() + CACHE_TTL_MS };
  return data;
}

export function invalidateEmailConfigCache() {
  cache = null;
}