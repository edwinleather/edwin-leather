import { CodConfig } from "../models/CodConfig.js";

export type CodConfigData = {
  enabled: boolean;
};

let cached: CodConfigData | null = null;

function toData(doc: { enabled: boolean }): CodConfigData {
  return { enabled: Boolean(doc.enabled) };
}

export async function getCodConfig(): Promise<CodConfigData> {
  if (cached) return cached;
  const doc = await CodConfig.findOne({ key: "default" }).lean();
  if (!doc) {
    await seedCodConfig();
    const created = await CodConfig.findOne({ key: "default" }).lean();
    if (created) cached = toData(created);
    return cached ?? { enabled: true };
  }
  cached = toData(doc);
  return cached;
}

export async function seedCodConfig() {
  const exists = await CodConfig.findOne({ key: "default" }).lean();
  if (exists) return;
  await CodConfig.create({ key: "default", enabled: true });
}

export function invalidateCodConfigCache() {
  cached = null;
}
