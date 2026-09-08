import { Attribute } from "../models/Attribute.js";
import type { AttributeType } from "./attributes.js";

// A category's attached attribute reference (attributeId may be a populated
// object or a raw ObjectId/string).
export type CategoryAttrRef = {
  attributeId: { _id?: unknown; name: string; key: string; type: AttributeType; options?: string[] } | unknown;
  required?: boolean;
};

export type ProductAttr = { attributeId: string; value?: string | string[] };

export type AttributeValidationError = { attributeId: string; key: string; name: string; message: string };

function refId(ref: CategoryAttrRef): string {
  const raw = ref.attributeId as { _id?: unknown } | null | undefined;
  const id = raw && typeof raw === "object" && "_id" in raw ? raw._id : ref.attributeId;
  if (!id) return "";
  const s = String(id);
  return s === "null" || s === "undefined" ? "" : s;
}

function isMissing(value: string | string[] | undefined): boolean {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0 || value.every((x) => String(x).trim() === "");
  return String(value).trim() === "";
}

function validateValue(type: AttributeType, options: string[], value: string | string[]): string | null {
  const opts = options ?? [];

  if (type === "number") {
    const n = typeof value === "number" ? value : Number(String(Array.isArray(value) ? value[0] : value).trim());
    return typeof n === "number" && isFinite(n) ? null : "Must be a number";
  }

  if (type === "yesno") {
    const v = value as unknown;
    const ok = v === true || v === false || v === "Yes" || v === "No" || v === "yes" || v === "no";
    return ok ? null : "Must be Yes or No";
  }

  if (type === "select") {
    const s = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
    if (opts.length > 0 && !opts.includes(s)) return `Must be one of: ${opts.join(", ")}`;
    return null;
  }

  if (type === "multi") {
    const arr = Array.isArray(value) ? value.map((v) => String(v)) : [String(value ?? "")];
    if (opts.length > 0) {
      for (const v of arr) {
        if (!opts.includes(v)) return `Invalid option "${v}". Allowed: ${opts.join(", ")}`;
      }
    }
    return null;
  }

  // text / textarea
  return null;
}

// Validate a product's attribute values against the category's attribute schema.
// Returns a list of errors (empty means valid). Only attributes defined by the
// category are validated; required refs with no non-empty value produce an error.
export async function validateProductAttributes(categoryAttributes: CategoryAttrRef[], productAttrs: ProductAttr[]): Promise<AttributeValidationError[]> {
  const ids = categoryAttributes.map((c) => refId(c)).filter(Boolean);
  const defs = await Attribute.find({ _id: { $in: ids } }).lean();
  const defById = new Map(defs.map((d) => [String(d._id), d]));

  const errors: AttributeValidationError[] = [];
  const withValue = new Set<string>();

  for (const pa of productAttrs) {
    const id = String(pa.attributeId);
    if (!isMissing(pa.value)) withValue.add(id);
    const def = defById.get(id);
    if (!def) continue; // not part of the category schema; skip leniently
    const msg = validateValue(def.type, def.options ?? [], pa.value as string | string[]);
    if (msg) errors.push({ attributeId: id, key: def.key, name: def.name, message: msg });
  }

  for (const cr of categoryAttributes) {
    const id = refId(cr);
    if (!id) continue;
    if (cr.required && !withValue.has(id)) {
      const def = defById.get(id);
      errors.push({ attributeId: id, key: def?.key ?? id, name: def?.name ?? "Attribute", message: "is required" });
    }
  }

  return errors;
}