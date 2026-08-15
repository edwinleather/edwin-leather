import { env } from "./env.js";
import { Category } from "../models/Category.js";
import { Coupon } from "../models/Coupon.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { AdminUser, RolePermission, ADMIN_ROLES } from "../models/backoffice.js";
import { DEFAULT_FEATURES } from "../services/backoffice.js";
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

    for (const [email, role] of [
      ...env.superadminEmails.map((e) => [e, "superadmin"] as const),
      ...env.adminEmails.map((e) => [e, "admin"] as const)
    ]) {
      const user = await User.findOne({ email }).lean();
      if (!user) continue;
      await AdminUser.updateOne(
        { appUserId: user._id },
        {
          $setOnInsert: {
            email,
            role,
            name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            provider: user.provider,
            googleId: user.googleId,
            appUserId: user._id,
            active: true
          }
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error("[seed] Catalog seeding skipped:", error);
  }
}