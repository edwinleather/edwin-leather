import { TaxConfig } from "../models/TaxConfig.js";

const DEFAULT_RATE = 0;
const DEFAULT_FREE_ABOVE = 0;

export type TaxConfigData = {
  gstRate: number;
  gstFreeAbove: number;
};

let cached: TaxConfigData | null = null;

function toData(doc: { gstRate: number; gstFreeAbove: number }): TaxConfigData {
  return {
    gstRate: doc.gstRate ?? DEFAULT_RATE,
    gstFreeAbove: doc.gstFreeAbove ?? DEFAULT_FREE_ABOVE
  };
}

export async function getTaxConfig(): Promise<TaxConfigData> {
  if (cached) return cached;
  const doc = await TaxConfig.findOne({ key: "default" }).lean();
  if (!doc) {
    await seedTaxConfig();
    const created = await TaxConfig.findOne({ key: "default" }).lean();
    if (created) cached = toData(created);
    return cached ?? defaultData();
  }
  cached = toData(doc);
  return cached;
}

function defaultData(): TaxConfigData {
  return { gstRate: DEFAULT_RATE, gstFreeAbove: DEFAULT_FREE_ABOVE };
}

export async function seedTaxConfig() {
  const exists = await TaxConfig.findOne({ key: "default" }).lean();
  if (exists) return;
  await TaxConfig.create({ key: "default", ...defaultData() });
}

// GST is charged at gstRate% of the subtotal, unless the subtotal reaches
// gstFreeAbove (0 disables the waiver), in which case no GST applies.
export function computeGst(config: TaxConfigData, subtotal: number): number {
  if (subtotal <= 0 || config.gstRate <= 0) return 0;
  if (config.gstFreeAbove > 0 && subtotal >= config.gstFreeAbove) return 0;
  return Math.round((subtotal * config.gstRate) / 100);
}

export function invalidateTaxConfigCache() {
  cached = null;
}