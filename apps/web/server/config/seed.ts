import { Attribute } from "../models/Attribute.js";
import { Category } from "../models/Category.js";
import { Coupon } from "../models/Coupon.js";
import { Product } from "../models/Product.js";
import { EmailConfig } from "../models/EmailConfig.js";
import { RolePermission, ADMIN_ROLES } from "../models/backoffice.js";
import { DEFAULT_FEATURES } from "../services/backoffice.js";
import { seedCategories, seedCoupons, seedProducts } from "../data/seed.js";

export async function seedDatabase() {
  try {
    for (const category of seedCategories) {
      await Category.updateOne({ slug: category.slug }, { $setOnInsert: { ...category, active: true } }, { upsert: true });
    }

    // ── Shared attribute pool ──────────────────────────────────────────
    const attributeDefs: { name: string; type: "text" | "select" | "multi" | "yesno" | "number" | "textarea"; options?: string[]; description?: string }[] = [
      { name: "Color", type: "select", options: ["Black", "Brown", "Tan", "Cognac", "Espresso", "Chestnut", "Mahogany", "Olive", "Saddle", "Burgundy", "Navy"], description: "Primary colour of the leather" },
      { name: "Size", type: "select", options: ["XS", "S", "M", "L", "XL", "28", "30", "32", "34", "36", "38", "40"], description: "Size label" },
      { name: "Leather type", type: "select", options: ["Full-grain", "Top-grain", "Vegetable-tanned", "Chrome-tanned", "Bridle", "Shell cordovan", "Suede"], description: "Type of leather used" },
      { name: "Hardware", type: "select", options: ["Solid brass", "Brushed nickel", "Antique brass", "Matte black", "Stainless steel"], description: "Buckle, zip and fitting material" },
      { name: "Lining", type: "select", options: ["Unlined", "Cotton canvas", "Cotton twill", "Suede", "Nylon"], description: "Interior lining material" },
      { name: "Closure", type: "select", options: ["Open top", "Zipper", "Magnetic snap", "Button", "Buckle", "Drawstring", "Flip-lock"], description: "How the item closes" },
      { name: "Dimensions", type: "text", description: "L × W × H in cm" },
      { name: "Weight", type: "number", description: "Weight in grams" },
      { name: "Water resistant", type: "yesno", description: "Whether the leather has a water-resistant finish" },
      { name: "Handcrafted", type: "yesno", description: "Made by hand rather than mass-produced" },
      { name: "Padfolio compatible", type: "yesno", description: "Fits a standard A4 padfolio or laptop sleeve" },
      { name: "Strap drop", type: "text", description: "Shoulder/crossbody strap drop in cm" },
      { name: "Capacity", type: "text", description: "Volume or card/slot capacity" },
      { name: "Belt width", type: "select", options: ["25mm", "30mm", "35mm", "40mm"], description: "Width of the belt strap" },
      { name: "Gender", type: "select", options: ["Unisex", "Men", "Women"], description: "Target audience" },
      { name: "Occasion", type: "multi", options: ["Everyday", "Formal", "Travel", "Work", "Weekend"], description: "When to use this product" }
    ];

    const attrDocs: Record<string, { _id: unknown }> = {};
    for (const def of attributeDefs) {
      const key = def.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const doc = await Attribute.findOneAndUpdate(
        { key },
        { $setOnInsert: { name: def.name, key, type: def.type, options: def.options ?? [], description: def.description } },
        { upsert: true, new: true, returnDocument: "after" as const }
      ).lean();
      attrDocs[key] = doc as { _id: unknown };
    }

    // ── Attach attributes to categories ────────────────────────────────
    // Each category gets a curated set of attributes.  `variant: true` means
    // the attribute drives SKU generation on the product form.
    const categoryAttributes: Record<string, { key: string; required?: boolean; filterable?: boolean; variant?: boolean; displayOrder?: number; displaySection?: "specifications" | "listing" }[]> = {
      bags: [
        { key: "color", required: true, filterable: true, variant: true, displayOrder: 0, displaySection: "listing" },
        { key: "leather-type", required: true, filterable: true, displayOrder: 1 },
        { key: "hardware", displayOrder: 2 },
        { key: "lining", displayOrder: 3 },
        { key: "closure", displayOrder: 4 },
        { key: "dimensions", displayOrder: 5 },
        { key: "weight", displayOrder: 6 },
        { key: "water-resistant", displayOrder: 7 },
        { key: "handcrafted", displayOrder: 8 },
        { key: "strap-drop", displayOrder: 9 },
        { key: "capacity", displayOrder: 10 },
        { key: "gender", filterable: true, displayOrder: 11 },
        { key: "occasion", filterable: true, displayOrder: 12 }
      ],
      wallets: [
        { key: "color", required: true, filterable: true, variant: true, displayOrder: 0, displaySection: "listing" },
        { key: "leather-type", required: true, filterable: true, displayOrder: 1 },
        { key: "closure", displayOrder: 2 },
        { key: "dimensions", displayOrder: 3 },
        { key: "weight", displayOrder: 4 },
        { key: "handcrafted", displayOrder: 5 },
        { key: "capacity", displayOrder: 6 },
        { key: "gender", filterable: true, displayOrder: 7 }
      ],
      belts: [
        { key: "color", required: true, filterable: true, variant: true, displayOrder: 0, displaySection: "listing" },
        { key: "size", required: true, filterable: true, variant: true, displayOrder: 1 },
        { key: "leather-type", required: true, filterable: true, displayOrder: 2 },
        { key: "hardware", displayOrder: 3 },
        { key: "belt-width", displayOrder: 4 },
        { key: "dimensions", displayOrder: 5 },
        { key: "handcrafted", displayOrder: 6 },
        { key: "gender", filterable: true, displayOrder: 7 }
      ],
      travel: [
        { key: "color", required: true, filterable: true, variant: true, displayOrder: 0, displaySection: "listing" },
        { key: "leather-type", required: true, filterable: true, displayOrder: 1 },
        { key: "hardware", displayOrder: 2 },
        { key: "lining", displayOrder: 3 },
        { key: "closure", displayOrder: 4 },
        { key: "dimensions", displayOrder: 5 },
        { key: "weight", displayOrder: 6 },
        { key: "water-resistant", displayOrder: 7 },
        { key: "handcrafted", displayOrder: 8 },
        { key: "capacity", displayOrder: 9 },
        { key: "gender", filterable: true, displayOrder: 10 },
        { key: "occasion", filterable: true, displayOrder: 11 }
      ],
      accessories: [
        { key: "color", required: true, filterable: true, variant: true, displayOrder: 0, displaySection: "listing" },
        { key: "leather-type", filterable: true, displayOrder: 1 },
        { key: "hardware", displayOrder: 2 },
        { key: "dimensions", displayOrder: 3 },
        { key: "weight", displayOrder: 4 },
        { key: "handcrafted", displayOrder: 5 },
        { key: "gender", filterable: true, displayOrder: 6 },
        { key: "occasion", filterable: true, displayOrder: 7 }
      ],
      work: [
        { key: "color", required: true, filterable: true, variant: true, displayOrder: 0, displaySection: "listing" },
        { key: "leather-type", required: true, filterable: true, displayOrder: 1 },
        { key: "hardware", displayOrder: 2 },
        { key: "lining", displayOrder: 3 },
        { key: "closure", displayOrder: 4 },
        { key: "dimensions", displayOrder: 5 },
        { key: "weight", displayOrder: 6 },
        { key: "handcrafted", displayOrder: 7 },
        { key: "padfolio-compatible", displayOrder: 8 },
        { key: "capacity", displayOrder: 9 },
        { key: "gender", filterable: true, displayOrder: 10 },
        { key: "occasion", filterable: true, displayOrder: 11 }
      ]
    };

    for (const [slug, attrs] of Object.entries(categoryAttributes)) {
      const category = await Category.findOne({ slug }).lean();
      if (!category) continue;
      const refs = attrs
        .map((a) => {
          const doc = attrDocs[a.key];
          if (!doc) return null;
          return {
            attributeId: doc._id,
            required: a.required ?? false,
            customerVisible: true,
            sellerVisible: true,
            filterable: a.filterable ?? false,
            searchable: true,
            variant: a.variant ?? false,
            displaySection: a.displaySection ?? "specifications",
            displayOrder: a.displayOrder ?? 0
          };
        })
        .filter(Boolean);
      await Category.updateOne({ slug }, { $set: { attributes: refs } });
    }

    for (const coupon of seedCoupons) {
      await Coupon.updateOne({ code: coupon.code }, { $setOnInsert: { ...coupon, active: true } }, { upsert: true });
    }

    for (const product of seedProducts) {
      const { name: _seedName, ...productFields } = product;
      await Product.updateOne(
        { slug: product.slug },
        {
          $setOnInsert: {
            name: product.name,
            ...productFields,
            variants: product.variants.map((variant) => ({
              label: variant.label,
              sku: variant.sku,
              color: variant.color,
              size: variant.size,
              inventoryAvailable: variant.inventory,
              inventoryReserved: 0,
              active: true
            })),
            active: true
          }
        },
        { upsert: true }
      );
    }

    console.info(`[seed] Catalog ready: ${(await Product.countDocuments()).toString()} products, ${(await Category.countDocuments()).toString()} categories, ${(await Coupon.countDocuments()).toString()} coupons.`);

    // Default email-notification settings: CC the store inbox on every order
    // email type unless the admin changes it in the backoffice.
    await EmailConfig.updateOne(
      { key: "config" },
      {
        $setOnInsert: {
          ccEmails: ["shuzaurrehman786@gmail.com"],
          ccTypes: [
            "order_confirmation",
            "payment_received",
            "order_packed",
            "order_shipped",
            "order_delivered",
            "order_cancelled",
            "return_requested"
          ]
        }
      },
      { upsert: true }
    );

    for (const role of ADMIN_ROLES) {
      await RolePermission.updateOne(
        { role },
        { $setOnInsert: { features: DEFAULT_FEATURES[role] } },
        { upsert: true }
      );
    }

    // Merge newly-added features (inventory, reviews, shipping, homepage, …) into
    // roles that were saved before those features existed, so existing admins get
    // them without needing a manual re-save.
    for (const role of ADMIN_ROLES) {
      await RolePermission.updateOne(
        { role },
        { $addToSet: { features: { $each: DEFAULT_FEATURES[role] } } }
      );
    }

    // Backoffice access is managed purely in the database: the first superadmin
    // is created by inserting a document into the backoffice "users" collection
    // (email + role + active + appUserId pointing at the customer User record).
    // Further admins are managed from the backoffice → Admins screen.
  } catch (error) {
    console.error("[seed] Catalog seeding skipped:", error);
  }
}