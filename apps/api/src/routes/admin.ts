import { Router } from "express";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { requireBackofficeAdmin, requireBackofficeFeature, requireBackofficeRole } from "../middleware/backoffice.js";
import { Category } from "../models/Category.js";
import { Coupon } from "../models/Coupon.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Return } from "../models/Return.js";
import { User } from "../models/User.js";
import { commitStock, releaseStock, type StockLine } from "../services/inventory.js";
import { orderResponse } from "../services/orders.js";
import { cloudName, deleteAsset, isCloudinaryConfigured, uploadImage } from "../services/cloudinary.js";

export const adminRouter = Router();

const requireAdmin = requireBackofficeAdmin;
const requireFeature = requireBackofficeFeature;
const requireSuperadmin = requireBackofficeRole("superadmin");

function requireDb() {
  if (!databaseReady()) throw new ApiError(503, "Database unavailable");
}

const productSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().min(2),
  category: z.string().min(2),
  collection: z.string().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional(), alt: z.string().optional() })).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  variants: z
    .array(
      z.object({
        label: z.string().min(1),
        sku: z.string().min(1),
        color: z.string().min(1),
        size: z.string().optional(),
        priceOverride: z.number().min(0).optional(),
        inventoryAvailable: z.number().int().min(0).default(0),
        active: z.boolean().default(true)
      })
    )
    .default([])
});

const couponSchema = z.object({
  code: z.string().min(1).max(30),
  discountType: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.number().min(0),
  minimumOrder: z.number().min(0).default(0),
  maximumDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  usagePerCustomer: z.number().int().min(1).optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  applicableProductIds: z.array(z.string()).default([]),
  applicableCategories: z.array(z.string()).default([]),
  active: z.boolean().default(true)
});

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true)
});

// ---------------------------------------------------------------- Products

adminRouter.get("/products", requireAdmin, requireFeature("products"), async (_req, res, next) => {
  try {
    requireDb();
    const data = await Product.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/products", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    requireDb();
    const input = productSchema.parse(req.body);
    const product = await Product.create({
      ...input,
      variants: input.variants.map((variant) => ({ ...variant, inventoryReserved: 0 }))
    });
    return res.status(201).json({ ok: true, data: product });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid product input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/products/:productId", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    requireDb();
    const input = productSchema.partial().parse(req.body);
    const product = await Product.findByIdAndUpdate(req.params.productId, input, { new: true, runValidators: true });
    if (!product) return next(new ApiError(404, "Product not found"));
    return res.json({ ok: true, data: product });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid product input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/products/:productId", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    requireDb();
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) return next(new ApiError(404, "Product not found"));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/products/:productId/variants", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    requireDb();
    const input = z
      .object({
        label: z.string().min(1),
        sku: z.string().min(1),
        color: z.string().min(1),
        size: z.string().optional(),
        priceOverride: z.number().min(0).optional(),
        inventoryAvailable: z.number().int().min(0).default(0)
      })
      .parse(req.body);
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { $push: { variants: { ...input, inventoryReserved: 0, active: true } } },
      { new: true, runValidators: true }
    );
    if (!product) return next(new ApiError(404, "Product not found"));
    return res.status(201).json({ ok: true, data: product });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid variant input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/products/:productId/variants/:variantId", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    requireDb();
    const input = z
      .object({
        label: z.string().min(1).optional(),
        size: z.string().optional(),
        priceOverride: z.number().min(0).nullable().optional(),
        inventoryAvailable: z.number().int().min(0).optional(),
        active: z.boolean().optional()
      })
      .parse(req.body);
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) updates[`variants.$.${key}`] = value;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.productId, "variants._id": req.params.variantId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!product) return next(new ApiError(404, "Variant not found"));
    return res.json({ ok: true, data: product });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid variant input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/products/:productId/variants/:variantId", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    requireDb();
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { $pull: { variants: { _id: req.params.variantId } } },
      { new: true }
    );
    if (!product) return next(new ApiError(404, "Variant not found"));
    return res.json({ ok: true, data: product });
  } catch (error) {
    return next(error);
  }
});

// ------------------------------------------------------------------ Orders

adminRouter.get("/orders", requireAdmin, requireFeature("orders"), async (req, res, next) => {
  try {
    requireDb();
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const orders = await Order.find(status ? { orderStatus: status } : {}).sort({ createdAt: -1 });
    return res.json({ ok: true, data: orders.map(orderResponse) });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/orders/:orderId", requireAdmin, requireFeature("orders"), async (req, res, next) => {
  try {
    requireDb();
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new ApiError(404, "Order not found"));
    return res.json({ ok: true, data: orderResponse(order) });
  } catch (error) {
    return next(error);
  }
});

function orderStockLines(order: InstanceType<typeof Order>): StockLine[] {
  return order.lines.map((line: { productId: { toString(): string }; variantId: { toString(): string }; sku: string; quantity: number }) => ({
    productId: String(line.productId),
    variantId: String(line.variantId),
    sku: line.sku,
    quantity: line.quantity
  }));
}

adminRouter.patch("/orders/:orderId/status", requireAdmin, requireFeature("orders"), async (req: AuthenticatedRequest, res, next) => {
  try {
    requireDb();
    const input = z
      .object({
        orderStatus: z.enum(["pending_payment", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled", "return_requested", "returned", "refunded"]),
        courier: z.string().optional(),
        awb: z.string().optional(),
        trackingUrl: z.string().optional(),
        message: z.string().optional()
      })
      .parse(req.body);

    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new ApiError(404, "Order not found"));

    const previous = order.orderStatus;

    if (input.orderStatus === "cancelled" && previous !== "cancelled" && previous !== "delivered" && previous !== "refunded") {
      await releaseStock(orderStockLines(order));
    }
    if (input.orderStatus === "delivered" && previous !== "delivered") {
      await commitStock(orderStockLines(order));
      order.shipping.status = "delivered";
    }
    if (input.orderStatus === "returned" && previous === "return_requested") {
      await releaseStock(orderStockLines(order));
    }
    if (input.orderStatus === "shipped") {
      order.shipping.status = "in_transit";
      if (input.courier) order.shipping.courier = input.courier;
      if (input.awb) order.shipping.awb = input.awb;
      if (input.trackingUrl) order.shipping.trackingUrl = input.trackingUrl;
    }
    if (input.orderStatus === "processing" || input.orderStatus === "packed") {
      order.shipping.status = "ready_to_ship";
    }
    if (input.orderStatus === "confirmed" && previous === "pending_payment") {
      order.payment.status = order.payment.method === "cod" ? "cod_pending" : "paid";
    }

    order.orderStatus = input.orderStatus;
    order.timeline.push({ type: input.orderStatus, message: input.message ?? `Status changed to ${input.orderStatus}`, at: new Date(), actorId: req.auth!.sub as never });
    await order.save();

    return res.json({ ok: true, data: orderResponse(order) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid order status input", error.flatten()));
    return next(error);
  }
});

// ----------------------------------------------------------------- Coupons

adminRouter.get("/coupons", requireAdmin, requireFeature("coupons"), async (_req, res, next) => {
  try {
    requireDb();
    const data = await Coupon.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/coupons", requireAdmin, requireFeature("coupons"), async (req, res, next) => {
  try {
    requireDb();
    const input = couponSchema.parse(req.body);
    const coupon = await Coupon.create({ ...input, code: input.code.toUpperCase().trim() });
    return res.status(201).json({ ok: true, data: coupon });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid coupon input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/coupons/:couponId", requireAdmin, requireFeature("coupons"), async (req, res, next) => {
  try {
    requireDb();
    const input = couponSchema.partial().parse(req.body);
    const coupon = await Coupon.findByIdAndUpdate(req.params.couponId, input, { new: true, runValidators: true });
    if (!coupon) return next(new ApiError(404, "Coupon not found"));
    return res.json({ ok: true, data: coupon });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid coupon input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/coupons/:couponId", requireAdmin, requireFeature("coupons"), async (req, res, next) => {
  try {
    requireDb();
    const coupon = await Coupon.findByIdAndDelete(req.params.couponId);
    if (!coupon) return next(new ApiError(404, "Coupon not found"));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

// -------------------------------------------------------------- Categories

adminRouter.get("/categories", requireAdmin, requireFeature("categories"), async (_req, res, next) => {
  try {
    requireDb();
    const data = await Category.find().sort({ displayOrder: 1, name: 1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/categories", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    requireDb();
    const input = categorySchema.parse(req.body);
    const category = await Category.create(input);
    return res.status(201).json({ ok: true, data: category });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid category input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/categories/:categoryId", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    requireDb();
    const input = categorySchema.partial().parse(req.body);
    const category = await Category.findByIdAndUpdate(req.params.categoryId, input, { new: true, runValidators: true });
    if (!category) return next(new ApiError(404, "Category not found"));
    return res.json({ ok: true, data: category });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid category input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/categories/:categoryId", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    requireDb();
    const category = await Category.findByIdAndDelete(req.params.categoryId);
    if (!category) return next(new ApiError(404, "Category not found"));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------------------- Customers

adminRouter.get("/customers", requireAdmin, requireFeature("customers"), async (_req, res, next) => {
  try {
    requireDb();
    const users = await User.find({}, "-passwordHash -passwordResetTokenHash").sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data: users });
  } catch (error) {
    return next(error);
  }
});

// ------------------------------------------------------------------ Media

adminRouter.get("/media/config", requireAdmin, requireFeature("media"), (_req, res) => {
  return res.json({ ok: true, configured: isCloudinaryConfigured(), cloudName: cloudName() });
});

adminRouter.post("/media/upload", requireAdmin, requireFeature("media"), async (req, res, next) => {
  try {
    const input = z.object({ dataUri: z.string().min(5), folder: z.string().optional() }).parse(req.body);
    const asset = await uploadImage(input.dataUri, input.folder || "edwin/products");
    return res.status(201).json({ ok: true, url: asset.url, publicId: asset.publicId });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid upload input", error.flatten()));
    return next(error);
  }
});

adminRouter.post("/media/delete", requireAdmin, requireFeature("media"), async (req, res, next) => {
  try {
    const input = z.object({ publicId: z.string().min(1) }).parse(req.body);
    await deleteAsset(input.publicId);
    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid delete input", error.flatten()));
    return next(error);
  }
});

// ----------------------------------------------------------------- Returns

adminRouter.get("/returns", requireAdmin, requireFeature("returns"), async (_req, res, next) => {
  try {
    requireDb();
    const data = await Return.find().sort({ createdAt: -1 });
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/returns/:returnId", requireAdmin, requireFeature("returns"), async (req: AuthenticatedRequest, res, next) => {
  try {
    requireDb();
    const input = z
      .object({
        action: z.enum(["approve", "reject", "returned", "refund_pending", "refunded"]),
        refundAmount: z.number().min(0).optional(),
        refundId: z.string().optional(),
        adminNote: z.string().optional()
      })
      .parse(req.body);

    const record = await Return.findById(req.params.returnId);
    if (!record) return next(new ApiError(404, "Return request not found"));

    const statusMap = { approve: "approved", reject: "rejected", returned: "returned", refund_pending: "refund_pending", refunded: "refunded" } as const;
    record.status = statusMap[input.action];
    if (input.refundAmount !== undefined) record.refundAmount = input.refundAmount;
    if (input.refundId) record.refundId = input.refundId;
    if (input.adminNote) record.adminNote = input.adminNote;

    if (input.action === "returned") {
      const order = await Order.findById(record.orderId);
      if (order) {
        await releaseStock(
          record.items.map((item: { productId: { toString(): string }; variantId?: { toString(): string }; sku?: string; quantity: number }) => ({
            productId: String(item.productId),
            variantId: String(item.variantId ?? item.productId),
            sku: item.sku ?? "",
            quantity: item.quantity
          }))
        );
        order.timeline.push({ type: "returned", message: `Return ${record.returnNumber} received`, at: new Date(), actorId: req.auth!.sub as never });
        await order.save();
      }
    }

    record.timeline.push({ type: record.status, message: `Return marked as ${record.status}`, at: new Date(), actorId: req.auth!.sub as never });
    await record.save();
    return res.json({ ok: true, data: record });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid return input", error.flatten()));
    return next(error);
  }
});