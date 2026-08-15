import { DeliveryConfig } from "../models/DeliveryConfig.js";

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

const DEFAULT_STATE_FEES: Record<string, number> = {
  "Uttar Pradesh": 80
};

const DEFAULT_THRESHOLD = 2499;
const DEFAULT_FEE = 120;

export type DeliveryConfigData = {
  defaultFee: number;
  stateFees: { state: string; fee: number }[];
  freeDeliveryThreshold: number;
};

let cached: DeliveryConfigData | null = null;

function toData(doc: { defaultFee: number; stateFees: { state: string; fee: number }[]; freeDeliveryThreshold: number }): DeliveryConfigData {
  return {
    defaultFee: doc.defaultFee,
    stateFees: doc.stateFees ?? [],
    freeDeliveryThreshold: doc.freeDeliveryThreshold
  };
}

export async function getDeliveryConfig(): Promise<DeliveryConfigData> {
  if (cached) return cached;
  const doc = await DeliveryConfig.findOne({ key: "default" }).lean();
  if (!doc) {
    await seedDeliveryConfig();
    const created = await DeliveryConfig.findOne({ key: "default" }).lean();
    if (created) cached = toData(created);
    return cached ?? defaultData();
  }
  cached = toData(doc);
  return cached;
}

function defaultData(): DeliveryConfigData {
  return {
    defaultFee: DEFAULT_FEE,
    stateFees: Object.entries(DEFAULT_STATE_FEES).map(([state, fee]) => ({ state, fee })),
    freeDeliveryThreshold: DEFAULT_THRESHOLD
  };
}

export async function seedDeliveryConfig() {
  const exists = await DeliveryConfig.findOne({ key: "default" }).lean();
  if (exists) return;
  const data = defaultData();
  await DeliveryConfig.create({ key: "default", ...data });
}

export function computeDeliveryFee(config: DeliveryConfigData, subtotal: number, state?: string): number {
  if (subtotal <= 0) return 0;
  if (subtotal >= config.freeDeliveryThreshold) return 0;
  const found = config.stateFees.find((entry) => entry.state.toLowerCase() === (state ?? "").trim().toLowerCase());
  return found ? found.fee : config.defaultFee;
}

export function invalidateDeliveryConfigCache() {
  cached = null;
}