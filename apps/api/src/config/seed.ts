import { Category } from "../models/Category.js";
import { Coupon } from "../models/Coupon.js";
import { Product } from "../models/Product.js";
import { seedCategories, seedCoupons, seedProducts } from "../data/seed.js";

export async function seedDatabase() {
  try {
    for (const category of seedCategories) {
      await Category.updateOne({ slug: category.slug }, { $setOnInsert: { ...category, active: true } }, { upsert: true });
    }

    for (const coupon of seedCoupons) {
      await Coupon.updateOne({ code: coupon.code }, { $setOnInsert: { ...coupon, active: true } }, { upsert: true });
    }

    for (const product of seedProducts) {
      const { name: _seedName, ...productFields } = product;
      const demoName = `demo_${product.name}`;
      await Product.updateOne(
        { slug: product.slug },
        {
          $set: { name: demoName },
          $setOnInsert: {
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
  } catch (error) {
    console.error("[seed] Catalog seeding skipped:", error);
  }
}