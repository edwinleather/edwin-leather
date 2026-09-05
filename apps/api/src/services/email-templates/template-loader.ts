import { SiteSetting } from "../../models/SiteSetting.js";
import { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_DEFAULTS, type EmailTemplateKey } from "./template-defaults.js";

let cache: Record<string, string> | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadTemplates(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now < cacheExpiry) return cache;

  try {
    const doc = await SiteSetting.findOne({ key: "email-templates" }).lean();
    const custom = doc?.emailTemplates ?? {};
    const result: Record<string, string> = {};
    for (const key of EMAIL_TEMPLATE_KEYS) {
      result[key] = custom[key] ?? EMAIL_TEMPLATE_DEFAULTS[key];
    }
    cache = result;
    cacheExpiry = now + CACHE_TTL_MS;
    return result;
  } catch {
    return EMAIL_TEMPLATE_DEFAULTS;
  }
}

export async function getTemplate(key: EmailTemplateKey): Promise<string> {
  const templates = await loadTemplates();
  return templates[key] ?? EMAIL_TEMPLATE_DEFAULTS[key];
}

export function invalidateTemplateCache() {
  cache = null;
  cacheExpiry = 0;
}
