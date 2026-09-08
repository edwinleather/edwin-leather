import { connectDatabase, databaseReady } from "../config/db.js";
import { Product } from "../models/Product.js";
import { resolveAttribute } from "../services/attributes.js";

// One-time, idempotent migration that rewrites each product's legacy
// `{ key, label, value }` attribute entries into `{ attributeId, value }`
// references into the shared Attribute pool. Attributes are reused by key when
// they already exist (e.g. created from category migration); new ones are
// created only when nothing matches. Existing hardcoded product fields are
// untouched and the migration can be run repeatedly.
//
// Run with: npm run migrate:product-attributes (workspace @edwin/api)
async function main() {
  await connectDatabase();
  if (!databaseReady()) {
    console.error("[migrate:product-attributes] MongoDB not available. Configure MONGODB_URI.");
    process.exit(1);
  }

  const products = await Product.find();
  let migrated = 0;
  let rewritten = 0;

  for (const product of products) {
    const attributes = (product.attributes ?? []) as { attributeId?: unknown; key?: string; label?: string; value?: unknown }[];
    const hasLegacy = attributes.some((a) => !a.attributeId && (a.key || a.label));
    if (!hasLegacy) continue;

    const next = [];
    for (const a of attributes) {
      if (a.attributeId) {
        next.push({ attributeId: a.attributeId, value: a.value });
        continue;
      }
      if (a.key || a.label) {
        const attr = await resolveAttribute({ key: a.key, label: a.label });
        next.push({ attributeId: attr._id, value: a.value ?? "" });
        rewritten += 1;
        continue;
      }
      next.push({ attributeId: undefined, key: a.key, label: a.label, value: a.value });
    }

    product.attributes = next;
    await product.save();
    migrated += 1;
    console.info(`[migrate:product-attributes] "${product.slug}" -> ${next.length} attribute refs`);
  }

  console.info(`[migrate:product-attributes] Done. Migrated ${migrated} product(s), rewrote ${rewritten} attribute entries.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("[migrate:product-attributes] Failed:", error);
  process.exit(1);
});