import { connectDatabase, databaseReady } from "../config/db.js";
import { Category } from "../models/Category.js";
import { findOrCreateAttribute } from "../services/attributes.js";

// One-time, idempotent migration that moves each category's legacy embedded
// `fields` into the shared, reusable Attribute pool and records them as category
// `attributes` references. Existing `fields` are preserved, existing products are
// untouched, and the pool is deduplicated by key so "Color" is shared by reuse.
//
// Run with: npm run migrate:attributes (workspace @edwin/api)
async function main() {
  await connectDatabase();
  if (!databaseReady()) {
    console.error("[migrate:attributes] MongoDB not available. Configure MONGODB_URI.");
    process.exit(1);
  }

  const categories = await Category.find();
  let migrated = 0;

  for (const category of categories) {
    const fields = category.fields ?? [];
    if (fields.length === 0) continue;

    const attributes = [];
    for (const field of fields) {
      const attr = await findOrCreateAttribute({ name: field.label, type: field.type, options: field.options });
      attributes.push({
        attributeId: attr._id,
        required: !!field.required,
        customerVisible: true,
        sellerVisible: true,
        filterable: false,
        searchable: true,
        displaySection: field.section === "listing" ? "listing" : "specifications",
        displayOrder: attributes.length
      });
    }

    category.attributes = attributes;
    await category.save();
    migrated += 1;
    console.info(`[migrate:attributes] "${category.name}" -> ${attributes.length} attribute refs`);
  }

  console.info(`[migrate:attributes] Done. Migrated ${migrated} category/categories.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("[migrate:attributes] Failed:", error);
  process.exit(1);
});