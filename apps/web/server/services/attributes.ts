import { Attribute } from "../models/Attribute.js";
import { Category } from "../models/Category.js";

export const FIELD_TYPES = ["text", "multi", "textarea", "select", "yesno", "number"] as const;
export type AttributeType = (typeof FIELD_TYPES)[number];

export type AttributeInput = { name: string; type?: AttributeType; options?: string[] };

// Normalise a human-readable name into a stable, reusable key. "Sole Type",
// "Sole type" and "SOLE TYPE" all map to "sole_type" so attributes are reused.
export function attributeKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Find an existing attribute by key, or create it. This is what guarantees the
// pool stays deduplicated across categories.
export async function findOrCreateAttribute(input: AttributeInput) {
  const name = input.name.trim();
  const key = attributeKey(name);
  if (!key) throw new Error("Invalid attribute name");
  const existing = await Attribute.findOne({ key });
  if (existing) return existing;
  return Attribute.create({
    name,
    key,
    type: input.type ?? "text",
    options: input.options ?? []
  });
}

export function getAttributeById(id: string) {
  return Attribute.findById(id).lean();
}

// Resolve a legacy key/label to a pooled Attribute, reusing by key where
// possible and creating one only when nothing matches.
export async function resolveAttribute(input: { key?: string; label?: string; type?: AttributeType; options?: string[] }) {
  const candidates = [input.key, input.label].filter(Boolean).map((s) => attributeKey(s ?? ""));
  for (const key of new Set(candidates)) {
    if (!key) continue;
    const existing = await Attribute.findOne({ key });
    if (existing) return existing;
  }
  const name = input.label?.trim() || input.key?.trim() || "attribute";
  return findOrCreateAttribute({ name, type: input.type, options: input.options });
}

export type ProductAttributeInput = { attributeId?: string; key?: string; label?: string; value?: string | string[] };

// Normalize admin-provided product attributes into `{ attributeId, value }`
// references. Accepts both the new ref shape and the legacy `{key,label,value}`
// shape, so older clients keep working.
export async function normalizeProductAttributes(attrs: ProductAttributeInput[]): Promise<{ attributeId: string; value: string | string[] }[]> {
  const out: { attributeId: string; value: string | string[] }[] = [];
  for (const a of attrs) {
    if (a.attributeId) {
      out.push({ attributeId: a.attributeId, value: a.value ?? "" });
      continue;
    }
    if (a.key || a.label) {
      const attr = await resolveAttribute({ key: a.key, label: a.label });
      out.push({ attributeId: String(attr._id), value: a.value ?? "" });
      continue;
    }
  }
  return out;
}

export async function searchAttributes(q?: string) {
  if (q && q.trim()) {
    const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return Attribute.find({ $or: [{ name: re }, { key: re }] }).sort({ name: 1 }).lean();
  }
  return Attribute.find().sort({ name: 1 }).lean();
}

export async function deleteAttribute(id: string) {
  const attr = await Attribute.findByIdAndDelete(id);
  if (attr) {
    // Remove the attribute from every category that references it.
    await Category.updateMany({}, { $pull: { attributes: { attributeId: attr._id } } });
  }
  return attr;
}