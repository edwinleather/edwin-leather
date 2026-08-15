import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../middleware/error.js";
import { requireBackofficeAdmin, requireBackofficeRole, type BackofficeRequest } from "../middleware/backoffice.js";
import { AdminUser, RolePermission, ADMIN_ROLES } from "../models/backoffice.js";
import { adminPublic, allFeatures, DEFAULT_FEATURES } from "../services/backoffice.js";
import { User } from "../models/User.js";
import { DeliveryConfig } from "../models/DeliveryConfig.js";
import { getDeliveryConfig, invalidateDeliveryConfigCache } from "../services/delivery.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { SiteSetting } from "../models/SiteSetting.js";
import { orderResponse } from "../services/orders.js";

export const backofficeRouter = Router();

const requireSuperadmin = requireBackofficeRole("superadmin");

const DEFAULT_HOMEPAGE = {
  marquee: { items: ["MADE TO AGE", "EDWIN LEATHERS", "SMALL BATCH", "FULL GRAIN"] },
  featured: { eyebrow: "Current selection", title: "Objects for the everyday.", linkLabel: "Shop all" },
  editorial: {
    image: "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1600&q=82",
    eyebrow: "Material first",
    title: "The surface should remember you.",
    paragraph:
      "We choose leather for how it will look after years of use—not for how flawless it looks under studio lights on day one. Grain, small marks, and tonal variation are part of the material, not defects to hide.",
    features: ["Full-grain hides", "Repair-minded construction", "Small-batch finishing"],
    buttonLabel: "How we make it"
  },
  stats: {
    eyebrow: "By the numbers",
    title: "Slow is the point.",
    note: "Small batches, deliberate choices, and a workshop that measures quality in decades rather than drops.",
    items: [
      { value: 8, label: "Objects in the collection" },
      { value: 60, label: "Hours of craft per piece" },
      { value: 100, mark: "%", label: "Full-grain leather, always" },
      { value: 4, mark: " days", label: "To reach your door" }
    ]
  },
  categories: {
    eyebrow: "Shop by ritual",
    title: "Where will it go with you?",
    cards: [
      { title: "Bags", copy: "Carry a little better.", image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1100&q=88" },
      { title: "Wallets", copy: "Small, useful, personal.", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1100&q=88" },
      { title: "Belts", copy: "One piece. No shortcuts.", image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1100&q=88" }
    ]
  },
  newArrivals: { eyebrow: "Recently cut", title: "New to the bench.", note: "From the workshop" },
  closing: { eyebrow: "A slower object", line1: "Not designed for next season.", line2: "Designed for your next decade." }
};

// Homepage / site content settings (announcement + hero + every section)
backofficeRouter.get("/settings", requireBackofficeAdmin, async (_req, res, next) => {
  try {
    const doc = await SiteSetting.findOne({ key: "site" }).lean();
    const defaults = {
      announcement: "Free delivery across India",
      heroBadge: "New season · The Everyday Edit",
      heroEyebrow: "Leather goods, made to gather stories",
      heroTitleLine1: "Objects for",
      heroTitleLine2: "your next decade.",
      heroImage:
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1920&q=80",
      heroSubtitle:
        "Full-grain leather. Considered proportions. Hardware that earns its patina. Objects for the everyday, without the disposable part.",
      homepage: DEFAULT_HOMEPAGE
    };
    return res.json({ ok: true, data: { ...defaults, ...doc, homepage: { ...DEFAULT_HOMEPAGE, ...(doc?.homepage ?? {}) } } });
  } catch (error) {
    return next(error);
  }
});

backofficeRouter.put("/settings", requireBackofficeAdmin, async (req, res, next) => {
  try {
    const input = z
      .object({
        announcement: z.string().max(160).optional(),
        heroBadge: z.string().max(80).optional(),
        heroEyebrow: z.string().max(120).optional(),
        heroTitleLine1: z.string().max(80).optional(),
        heroTitleLine2: z.string().max(80).optional(),
        heroImage: z.string().max(1000).optional(),
        heroSubtitle: z.string().max(500).optional(),
        homepage: z.record(z.string(), z.unknown()).optional()
      })
      .parse(req.body);
    await SiteSetting.updateOne({ key: "site" }, { $set: { ...input, updatedBy: (req as BackofficeRequest).admin!.id } }, { upsert: true });
    const doc = await SiteSetting.findOne({ key: "site" }).lean();
    return res.json({ ok: true, data: doc });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

// Live overview stats + recent orders for the backoffice dashboard.
backofficeRouter.get("/stats", requireBackofficeAdmin, async (_req, res, next) => {
  try {
    const [revenueAgg, orderCount, customerCount, lowStock, recent] = await Promise.all([
      Order.aggregate([
        { $match: { orderStatus: { $nin: ["cancelled", "refunded"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      Order.countDocuments(),
      User.countDocuments({ emailVerifiedAt: { $ne: null } }),
      Product.aggregate([
        { $unwind: "$variants" },
        { $match: { "variants.active": true, "variants.inventoryAvailable": { $lte: 3 } } },
        { $count: "count" }
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8)
    ]);

    const stats = {
      revenue: revenueAgg[0]?.total ?? 0,
      orders: orderCount,
      customers: customerCount,
      lowStockSkus: lowStock[0]?.count ?? 0
    };
    const recentOrders = recent.map((order) => {
      const mapped = orderResponse(order);
      const first = order.lines[0];
      const customer = order.customerId ? String(order.customerId) : order.email;
      return {
        id: mapped.id,
        orderNumber: mapped.orderNumber,
        customer,
        item: first ? `${first.nameSnapshot}${order.lines.length > 1 ? ` +${order.lines.length - 1}` : ""}` : "—",
        total: mapped.total,
        orderStatus: mapped.orderStatus
      };
    });
    return res.json({ ok: true, data: { stats, recentOrders } });
  } catch (error) {
    return next(error);
  }
});

// Delivery fee configuration (per-state fees + free-delivery threshold)
backofficeRouter.get("/delivery", requireBackofficeAdmin, async (_req, res, next) => {
  try {
    const data = await getDeliveryConfig();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

backofficeRouter.put("/delivery", requireBackofficeAdmin, async (req, res, next) => {
  try {
    const input = z
      .object({
        defaultFee: z.number().min(0).max(100000),
        freeDeliveryThreshold: z.number().min(0).max(1000000),
        stateFees: z.array(z.object({ state: z.string().min(1).max(80), fee: z.number().min(0).max(100000) }))
      })
      .parse(req.body);
    await DeliveryConfig.updateOne(
      { key: "default" },
      { $set: { defaultFee: input.defaultFee, freeDeliveryThreshold: input.freeDeliveryThreshold, stateFees: input.stateFees, updatedBy: (req as BackofficeRequest).admin!.id } },
      { upsert: true }
    );
    invalidateDeliveryConfigCache();
    const data = await getDeliveryConfig();
    return res.json({ ok: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

// Current session's backoffice profile + granted features
backofficeRouter.get("/me", requireBackofficeAdmin, async (req, res, next) => {
  try {
    const ar = req as BackofficeRequest;
    const admin = await AdminUser.findById(ar.admin!.id).lean();
    if (!admin) return next(new ApiError(403, "Insufficient permissions"));
    return res.json({ ok: true, data: { ...adminPublic(admin), features: ar.adminFeatures ?? [] } });
  } catch (error) {
    return next(error);
  }
});

// Superadmin: manage who can access the backoffice
backofficeRouter.get("/users", requireSuperadmin, async (_req, res, next) => {
  try {
    const users = await AdminUser.find().sort({ role: 1, createdAt: -1 }).lean();
    return res.json({ ok: true, data: users.map(adminPublic) });
  } catch (error) {
    return next(error);
  }
});

backofficeRouter.post("/users", requireSuperadmin, async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), role: z.enum(ADMIN_ROLES), name: z.string().optional() }).parse(req.body);
    const email = input.email.toLowerCase().trim();
    const appUser = await User.findOne({ email }).lean();
    if (!appUser) return next(new ApiError(400, "No store account exists for that email. The person must sign up first."));
    const existing = await AdminUser.findOne({ email });
    if (existing) return next(new ApiError(409, "This person is already a backoffice user"));
    const admin = await AdminUser.create({
      email,
      role: input.role,
      name: input.name ?? appUser.name ?? `${appUser.firstName ?? ""} ${appUser.lastName ?? ""}`.trim(),
      firstName: appUser.firstName,
      lastName: appUser.lastName,
      provider: appUser.provider,
      googleId: appUser.googleId,
      appUserId: appUser._id,
      addedBy: (req as BackofficeRequest).admin!.id
    });
    return res.status(201).json({ ok: true, data: adminPublic(admin.toObject()) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

backofficeRouter.patch("/users/:userId", requireSuperadmin, async (req, res, next) => {
  try {
    const input = z.object({ role: z.enum(ADMIN_ROLES).optional(), active: z.boolean().optional(), permissions: z.array(z.string()).optional() }).parse(req.body);
    const admin = await AdminUser.findById(req.params.userId);
    if (!admin) return next(new ApiError(404, "Backoffice user not found"));
    const me = (req as BackofficeRequest).admin!.id;
    if (String(admin._id) === me && (input.active === false || (input.role && input.role !== "superadmin"))) {
      return next(new ApiError(400, "You cannot deactivate or demote yourself"));
    }
    if (input.role) admin.role = input.role;
    if (input.active !== undefined) admin.active = input.active;
    if (input.permissions !== undefined) admin.permissions = input.permissions;
    await admin.save();
    return res.json({ ok: true, data: adminPublic(admin.toObject()) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

backofficeRouter.delete("/users/:userId", requireSuperadmin, async (req, res, next) => {
  try {
    const me = (req as BackofficeRequest).admin!.id;
    if (req.params.userId === me) return next(new ApiError(400, "You cannot remove yourself"));
    const admin = await AdminUser.findByIdAndDelete(req.params.userId);
    if (!admin) return next(new ApiError(404, "Backoffice user not found"));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

// Superadmin: decide which features each role can access
backofficeRouter.get("/roles", requireSuperadmin, async (_req, res, next) => {
  try {
    const rows = await RolePermission.find().lean();
    const map: Record<string, string[]> = {};
    for (const role of ADMIN_ROLES) map[role] = DEFAULT_FEATURES[role] ?? [];
    for (const row of rows) map[row.role] = row.features;
    return res.json({ ok: true, data: { features: allFeatures(), roles: map } });
  } catch (error) {
    return next(error);
  }
});

backofficeRouter.put("/roles/:role", requireSuperadmin, async (req, res, next) => {
  try {
    const role = z.enum(ADMIN_ROLES).parse(req.params.role);
    const input = z.object({ features: z.array(z.string()) }).parse(req.body);
    const normalized = [...new Set(input.features)];
    await RolePermission.updateOne({ role }, { $set: { features: normalized, updatedBy: (req as BackofficeRequest).admin!.id } }, { upsert: true });
    return res.json({ ok: true, data: { role, features: normalized } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});