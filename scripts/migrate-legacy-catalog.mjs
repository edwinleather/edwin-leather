/**
 * Migrate pre-catalogue products into the new catalog model.
 *
 * Products created before the ProductVariant / Media catalogue carry embedded
 * `variants[]` and `images[]` arrays. The new admin panel and checkout only work
 * with standalone ProductVariant documents and Media records, so this script
 * converts the legacy shape into the new one:
 *
 *   - ensures the category exists and adopts the variant attributes
 *   - ensures shared "Color" / "Size" attributes exist in the attribute pool
 *   - sets product.variantDimensions + product.categoryId
 *   - creates one ProductVariant per embedded variant (SKU, price, stock)
 *   - creates Media records for the product gallery (and per-variant images)
 *
 * It is additive and idempotent: products that already have ProductVariant
 * documents, Media records, or variantDimensions are skipped. Nothing is ever
 * deleted.
 *
 * Usage (dry run - prints what it would do, writes nothing):
 *   node scripts/migrate-legacy-catalog.mjs
 * Usage (apply):
 *   node scripts/migrate-legacy-catalog.mjs --apply
 */

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");
const ROOT = path.resolve(import.meta.dirname, "..");

function readLocalEnv() {
  const file = path.join(ROOT, "apps", "web", ".env.local");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

const localEnv = readLocalEnv();
const URI = process.env.MONGODB_URI || localEnv.MONGODB_URI;
if (!URI) {
  console.error("MONGODB_URI not found (env or apps/web/.env.local)");
  process.exit(1);
}

function slugify(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  console.log(`connected to database "${db.databaseName}"`);
  console.log(APPLY ? "MODE: APPLY (writes changes)\n" : "MODE: DRY RUN (no writes)\n");

  const products = db.collection("products");
  const variantsCol = db.collection("productvariants");
  const mediaCol = db.collection("media");
  const attrsCol = db.collection("attributes");
  const catsCol = db.collection("categories");

  const all = await products.find({}).toArray();
  console.log(`scanned ${all.length} product(s)\n`);

  const report = { migrated: [], alreadyDone: [], noLegacy: [] };
  const attrCache = new Map();

  // Ensure a shared attribute exists in the pool (key is unique).
  async function ensureAttribute(name, key, options) {
    if (attrCache.has(key)) {
      const id = attrCache.get(key);
      if (APPLY && options.length > 0) {
        await attrsCol.updateOne({ _id: id }, { $addToSet: { options: { $each: options } } });
      }
      return id;
    }
    const existing = await attrsCol.findOne({ key });
    if (existing) {
      if (APPLY && options.length > 0) {
        await attrsCol.updateOne({ _id: existing._id }, { $addToSet: { options: { $each: options } } });
      }
      attrCache.set(key, existing._id);
      return existing._id;
    }
    if (!APPLY) {
      const placeholder = new mongoose.Types.ObjectId();
      attrCache.set(key, placeholder);
      return placeholder;
    }
    const now = new Date();
    const res = await attrsCol.insertOne({
      name,
      key,
      type: "dropdown",
      options,
      description: `Auto-created while migrating the legacy catalog (${name}).`,
      createdAt: now,
      updatedAt: now
    });
    attrCache.set(key, res.insertedId);
    return res.insertedId;
  }

  // Ensure the product's category exists and adopts the variant attributes.
  async function ensureCategory(name, refs) {
    const cat = await catsCol.findOne({ name });
    const buildRef = (ref, order) => ({
      attributeId: ref.attributeId,
      required: false,
      customerVisible: true,
      sellerVisible: true,
      filterable: true,
      searchable: true,
      variant: true,
      displaySection: "specifications",
      displayOrder: order
    });
    if (!cat) {
      if (!APPLY) return { created: true, id: new mongoose.Types.ObjectId() };
      const now = new Date();
      const res = await catsCol.insertOne({
        name,
        slug: slugify(name),
        displayOrder: 0,
        active: true,
        fields: [],
        attributes: refs.map((ref, i) => buildRef(ref, i)),
        createdAt: now,
        updatedAt: now
      });
      return { created: true, id: res.insertedId };
    }
    const have = new Set(asArray(cat.attributes).map((a) => String(a.attributeId)));
    const missing = refs.filter((ref) => !have.has(String(ref.attributeId)));
    if (APPLY && missing.length > 0) {
      const start = asArray(cat.attributes).length;
      await catsCol.updateOne(
        { _id: cat._id },
        { $push: { attributes: { $each: missing.map((ref, i) => buildRef(ref, start + i)) } } }
      );
    }
    return { created: false, id: cat._id, attached: missing.length };
  }

  for (const product of all) {
    const label = `${product.name ?? "(unnamed)"} [${String(product._id)}]`;
    const legacyVariantList = asArray(product.variants).filter((v) => v && (v.color || v.size || v.sku));

    if (legacyVariantList.length === 0) {
      report.noLegacy.push(label);
      continue;
    }

    const existingPv = await variantsCol.countDocuments({ productId: product._id });
    const existingMedia = await mediaCol.countDocuments({ productId: product._id });
    const hasDims = asArray(product.variantDimensions).length > 0;

    if (existingPv > 0 || (hasDims && existingMedia > 0)) {
      report.alreadyDone.push(`${label} (variants=${existingPv}, media=${existingMedia}, dims=${hasDims})`);
      continue;
    }

    // Collect the dimension values actually present on the embedded variants.
    const colors = [...new Set(legacyVariantList.map((v) => String(v.color ?? "").trim()).filter(Boolean))];
    const sizes = [...new Set(legacyVariantList.map((v) => String(v.size ?? "").trim()).filter(Boolean))];

    const colorId = colors.length > 0 ? await ensureAttribute("Color", "color", colors) : null;
    const sizeId = sizes.length > 0 ? await ensureAttribute("Size", "size", sizes) : null;

    const dimensions = [];
    if (colorId) dimensions.push({ attributeId: colorId, values: colors });
    if (sizeId) dimensions.push({ attributeId: sizeId, values: sizes });

    const categoryName = String(product.category ?? "").trim();
    const refs = [];
    if (colorId) refs.push({ attributeId: colorId });
    if (sizeId) refs.push({ attributeId: sizeId });
    const categoryResult = categoryName ? await ensureCategory(categoryName, refs) : { created: false, id: null };

    // One ProductVariant per embedded variant, preserving SKU / price / stock.
    const usedSkus = new Set();
    const newVariants = legacyVariantList.map((v, index) => {
      const color = String(v.color ?? "").trim();
      const size = String(v.size ?? "").trim();
      const attributes = [];
      if (color && colorId) attributes.push({ attributeId: colorId, value: color });
      if (size && sizeId) attributes.push({ attributeId: sizeId, value: size });

      let sku = String(v.sku ?? "").trim();
      if (!sku) {
        sku = `${slugify(product.slug ?? product.name ?? "item")}-${slugify(color || size || String(index + 1))}`.toUpperCase();
      }
      let candidate = sku;
      let n = 2;
      while (usedSkus.has(candidate)) candidate = `${sku}-${n++}`;
      usedSkus.add(candidate);

      const stock = numberOr(v.inventoryTotal ?? v.inventory ?? v.inventoryAvailable, 0);
      const price = numberOr(v.priceOverride ?? product.price, 0);

      const doc = {
        productId: product._id,
        sku: candidate,
        price,
        stock: Math.max(0, Math.round(stock)),
        active: v.active !== false,
        status: v.active === false ? "inactive" : "active",
        allowBackorder: Boolean(v.allowBackorder),
        attributes,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      if (v.articleNumber) doc.articleNumber = String(v.articleNumber);
      if (v.barcode) doc.barcode = String(v.barcode);
      if (v.salePrice !== undefined && v.salePrice !== null) doc.salePrice = numberOr(v.salePrice, undefined);
      return doc;
    });

    // Media records for the product gallery.
    const newMedia = [];
    asArray(product.images).forEach((img, position) => {
      const url = typeof img === "string" ? img : img && img.url;
      if (!url) return;
      newMedia.push({
        type: "PRODUCT_IMAGE",
        productId: product._id,
        variantId: null,
        url,
        publicId: typeof img === "string" ? undefined : img.publicId,
        alt: (typeof img === "string" ? undefined : img.alt) ?? product.name,
        position,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    console.log(`- ${label}`);
    console.log(`    category: ${categoryName || "(none)"}${categoryResult.created ? " -> will be created" : ""}`);
    console.log(`    dimensions: ${dimensions.map((d) => `${d.values.length} value(s)`).join(", ") || "(none)"}`);
    console.log(`    variants: ${newVariants.length} -> ${newVariants.map((v) => `${v.sku}(${v.stock})`).join(", ")}`);
    console.log(`    media: ${newMedia.length} product image(s)`);

    if (!APPLY) {
      report.migrated.push(`${label} (dry run)`);
      console.log("    dry run, nothing written\n");
      continue;
    }

    const update = { variantDimensions: dimensions };
    if (categoryResult.id) update.categoryId = categoryResult.id;
    await products.updateOne({ _id: product._id }, { $set: update });

    if (newVariants.length > 0) await variantsCol.insertMany(newVariants, { ordered: false });
    if (newMedia.length > 0) await mediaCol.insertMany(newMedia, { ordered: false });

    report.migrated.push(`${label} (${newVariants.length} variants, ${newMedia.length} media)`);
    console.log("    migrated\n");
  }
  console.log("\n--- summary ---");
  console.log(`migrated:       ${report.migrated.length}`);
  report.migrated.forEach((m) => console.log(`   + ${m}`));
  console.log(`already done:   ${report.alreadyDone.length}`);
  report.alreadyDone.forEach((m) => console.log(`   - ${m}`));
  console.log(`no legacy data: ${report.noLegacy.length}`);
  report.noLegacy.forEach((m) => console.log(`   - ${m}`));
  console.log(APPLY ? "\nMigration applied." : "\nThis was a DRY RUN. Re-run with --apply to write the changes.");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("migration failed:", error);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});

