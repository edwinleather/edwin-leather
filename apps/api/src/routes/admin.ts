import { Router } from "express";
import { z } from "zod";
import { ensureDatabase } from "../config/db.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { requireBackofficeAdmin, requireBackofficeFeature, requireBackofficeRole } from "../middleware/backoffice.js";
import { Category } from "../models/Category.js";
import { Coupon } from "../models/Coupon.js";
import { Asset } from "../models/Asset.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Return } from "../models/Return.js";
import { Review } from "../models/Review.js";
import { Feedback } from "../models/Feedback.js";
import { SiteSetting } from "../models/SiteSetting.js";
import { DeliveryPartner } from "../models/DeliveryPartner.js";
import { User } from "../models/User.js";
import { ErrorLog } from "../models/ErrorLog.js";
import { PageContent } from "../models/PageContent.js";
import { commitStock, releaseStock, setVariantInventory, type StockLine } from "../services/inventory.js";
import { orderResponse } from "../services/orders.js";
import { getTaxConfig } from "../services/tax.js";
import { sendOrderEmail } from "../services/email.js";
import { cloudName, deleteAsset, isCloudinaryConfigured, uploadImage } from "../services/cloudinary.js";

export const adminRouter = Router();

const requireAdmin = requireBackofficeAdmin;
const requireFeature = requireBackofficeFeature;
const requireSuperadmin = requireBackofficeRole("superadmin");

async function requireDb() {
  if (!(await ensureDatabase())) throw new ApiError(503, "Database unavailable");
}

const productSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().min(2),
  category: z.string().min(2),
  collection: z.string().optional(),
  brand: z.string().optional(),
  hsn: z.string().optional(),
  gst: z.number().min(0).optional(),
  deliveryBy: z.string().optional(),
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
        inventoryAvailable: z.number().int().min(0).optional(),
        inventoryTotal: z.number().int().min(0).optional(),
        inventoryStoreAllocated: z.number().int().min(0).optional(),
        lowStockThreshold: z.number().int().min(0).optional(),
        allowBackorder: z.boolean().optional(),
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

function normalizeVariant(
  variant: { _id?: unknown; inventoryAvailable?: number; inventoryTotal?: number; inventoryStoreAllocated?: number; lowStockThreshold?: number; allowBackorder?: boolean; inventoryReserved?: number },
  existingReserved = 0
) {
  const total = Math.max(0, Math.round(variant.inventoryTotal ?? variant.inventoryAvailable ?? 0));
  const store = Math.min(total, Math.max(0, Math.round(variant.inventoryStoreAllocated ?? 0)));
  const reserved = Math.max(0, Math.round(variant.inventoryReserved ?? existingReserved));
  return {
    ...variant,
    inventoryTotal: total,
    inventoryStoreAllocated: store,
    inventoryReserved: reserved,
    inventoryAvailable: Math.max(0, total - store - reserved),
    lowStockThreshold: variant.lowStockThreshold ?? 3,
    allowBackorder: variant.allowBackorder ?? false
  };
}

// ---------------------------------------------------------------- Products

adminRouter.get("/products", requireAdmin, requireFeature("products"), async (_req, res, next) => {
  try {
    await requireDb();
    const data = await Product.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/products", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const input = productSchema.parse(req.body);
    const variants = input.variants.map((variant) => normalizeVariant(variant));
    const product = await Product.create({ ...input, variants });
    return res.status(201).json({ ok: true, data: product });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid product input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/products/:productId", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const input = productSchema.partial().parse(req.body);
    const product = await Product.findById(req.params.productId);
    if (!product) return next(new ApiError(404, "Product not found"));
    const update: Record<string, unknown> = { ...input };
    if (input.variants) {
      const existing = new Map<string, number>();
      for (const v of product.variants ?? []) existing.set(String(v._id), v.inventoryReserved ?? 0);
      update.variants = input.variants.map((variant) => {
        const withId = { ...variant, _id: (variant as { _id?: unknown })._id };
        return normalizeVariant(withId, existing.get(String((variant as { _id?: unknown })._id)) ?? 0);
      });
    }
    const updated = await Product.findByIdAndUpdate(req.params.productId, update, { new: true, runValidators: true });
    if (!updated) return next(new ApiError(404, "Product not found"));
    return res.json({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid product input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/products/:productId", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) return next(new ApiError(404, "Product not found"));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/products/:productId/variants", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
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
    await requireDb();
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
    await requireDb();
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

// ---------------------------------------------------------------- Inventory

adminRouter.get("/inventory", requireAdmin, requireFeature("inventory"), async (_req, res, next) => {
  try {
    await requireDb();
    const products = await Product.find({}, { name: 1, slug: 1, active: 1, category: 1, variants: 1 }).lean();
    const rows: { productId: string; productName: string; slug: string; active: boolean; variant: (typeof products)[number]["variants"][number] }[] = [];
    for (const product of products) {
      for (const variant of product.variants ?? []) {
        const v = variant as { inventoryTotal?: number; inventoryAvailable?: number; inventoryReserved?: number; inventoryStoreAllocated?: number } & (typeof products)[number]["variants"][number];
        if (v.inventoryTotal === undefined) {
          v.inventoryTotal = (v.inventoryAvailable ?? 0) + (v.inventoryReserved ?? 0);
        }
        if (v.inventoryStoreAllocated === undefined) v.inventoryStoreAllocated = 0;
        rows.push({ productId: String(product._id), productName: product.name, slug: product.slug, active: product.active, variant: v });
      }
    }
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

const inventorySetSchema = z.object({
  inventoryTotal: z.number().int().min(0),
  inventoryStoreAllocated: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  allowBackorder: z.boolean().optional()
});

adminRouter.patch("/inventory/:productId/:variantId", requireAdmin, requireFeature("inventory"), async (req, res, next) => {
  try {
    await requireDb();
    const input = inventorySetSchema.parse(req.body);
    const updated = await setVariantInventory(String(req.params.productId), String(req.params.variantId), input);
    if (!updated) return next(new ApiError(404, "Variant not found"));
    return res.json({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid inventory input", error.flatten()));
    return next(error);
  }
});

// ------------------------------------------------------------------ Orders

adminRouter.get("/orders", requireAdmin, requireFeature("orders"), async (req, res, next) => {
  try {
    await requireDb();
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const orders = await Order.find(status ? { orderStatus: status } : {}).sort({ createdAt: -1 });
    return res.json({ ok: true, data: orders.map(orderResponse) });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/orders/:orderId", requireAdmin, requireFeature("orders"), async (req, res, next) => {
  try {
    await requireDb();
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
    await requireDb();
    const input = z
      .object({
        orderStatus: z.enum(["pending_payment", "order_received", "confirmed", "processing", "packing", "shipping", "packed", "shipped", "delivered", "cancelled", "return_requested", "returned", "refunded"]),
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
      if (input.awb) {
        order.shipping.awb = input.awb;
        order.shipping.trackingId = order.shipping.trackingId || input.awb;
      }
      if (input.trackingUrl) order.shipping.trackingUrl = input.trackingUrl;
    }
    if (input.orderStatus === "processing" || input.orderStatus === "packed" || input.orderStatus === "packing" || input.orderStatus === "shipping") {
      order.shipping.status = "ready_to_ship";
    }
    if ((input.orderStatus === "confirmed" || input.orderStatus === "order_received") && previous === "pending_payment") {
      order.payment.status = order.payment.method === "cod" ? "cod_pending" : "paid";
    }

    order.orderStatus = input.orderStatus;
    order.timeline.push({ type: input.orderStatus, message: input.message ?? `Status changed to ${input.orderStatus}`, at: new Date(), actorId: req.auth!.sub as never });
    await order.save();

    if (input.orderStatus === "shipped" && previous !== "shipped") sendOrderEmail(order as never, "shipped").catch(() => undefined);
    else if (input.orderStatus === "cancelled" && previous !== "cancelled" && previous !== "delivered" && previous !== "refunded") sendOrderEmail(order as never, "cancelled").catch(() => undefined);

    return res.json({ ok: true, data: orderResponse(order) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid order status input", error.flatten()));
    return next(error);
  }
});

// ---------------------------------------------------------------- Invoice

const invoiceSettingsSchema = z.object({
  companyName: z.string().max(120).optional(),
  gstin: z.string().max(40).optional(),
  cin: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
  invoicePrefix: z.string().max(30).optional(),
  orderPrefix: z.string().max(12).optional(),
  note: z.string().max(500).optional()
});

adminRouter.get("/invoice-settings", requireAdmin, requireFeature("orders"), async (_req, res, next) => {
  try {
    await requireDb();
    const doc = await SiteSetting.findOne({ key: "invoice" }).lean();
    return res.json({ ok: true, data: doc?.invoice ?? {} });
  } catch (error) {
    return next(error);
  }
});

adminRouter.put("/invoice-settings", requireAdmin, requireFeature("orders"), async (req: AuthenticatedRequest, res, next) => {
  try {
    await requireDb();
    const input = invoiceSettingsSchema.parse(req.body);
    await SiteSetting.updateOne({ key: "invoice" }, { $set: { invoice: input, updatedBy: req.auth?.sub as never } }, { upsert: true });
    const doc = await SiteSetting.findOne({ key: "invoice" }).lean();
    return res.json({ ok: true, data: doc?.invoice ?? input });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid invoice settings", error.flatten()));
    return next(error);
  }
});

// Full Flipkart-style tax invoice for one order (admin can print / download).
adminRouter.get("/orders/:orderId/invoice", requireAdmin, requireFeature("orders"), async (req, res, next) => {
  try {
    await requireDb();
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new ApiError(404, "Order not found"));

    const products = await Product.find({ _id: { $in: order.lines.map((l: { productId: { toString(): string } }) => l.productId) } }).lean();
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const taxConfig = await getTaxConfig();
    const gstRate = taxConfig.gstRate;

    const lines = order.lines.map((line: { productId: { toString(): string }; sku: string; nameSnapshot: string; variantSnapshot?: string; quantity: number; unitPrice: number; lineTotal: number }) => {
      const product = productById.get(String(line.productId));
      const taxable = line.lineTotal;
      const gstAmount = Math.round((taxable * gstRate) / 100);
      return {
        productId: String(line.productId),
        sku: line.sku,
        name: line.nameSnapshot,
        variantLabel: line.variantSnapshot,
        brand: product?.brand,
        hsn: product?.hsn,
        gstRate,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxable,
        gstAmount,
        lineTotal: taxable + gstAmount
      };
    });

    const settings = await SiteSetting.findOne({ key: "invoice" }).lean();
    const inv = settings?.invoice ?? {};
    const seller = {
      companyName: inv.companyName || "Edwin Leathers",
      gstin: inv.gstin ?? "",
      cin: inv.cin ?? "",
      address: inv.address ?? "",
      city: inv.city ?? "",
      state: inv.state ?? "",
      postalCode: inv.postalCode ?? "",
      phone: inv.phone ?? "",
      email: inv.email ?? "",
      website: inv.website ?? ""
    };

    const addr = order.shippingAddress ?? {};
    const gstTotal = typeof order.gstAmount === "number" && order.gstAmount > 0 ? order.gstAmount : lines.reduce((sum: number, l: { gstAmount: number }) => sum + l.gstAmount, 0);
    const invoicePrefix = inv.invoicePrefix ?? "INV-";
    const note = inv.note || "This is a computer-generated tax invoice and does not require a physical signature.";

    return res.json({
      ok: true,
      data: {
        invoiceNumber: `${invoicePrefix}${order.orderNumber}`,
        invoiceDate: order.createdAt,
        seller,
        invoiceNote: note,
        order: {
          id: String(order._id),
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          orderStatus: order.orderStatus,
          paymentMethod: order.payment.method,
          paymentStatus: order.payment.status,
          subtotal: order.subtotal,
          shippingAmount: order.shippingAmount,
          discountAmount: order.discountAmount,
          total: order.total,
          gstTotal,
          tracking: order.shipping.trackingId
            ? {
                awb: order.shipping.awb,
                trackingId: order.shipping.trackingId,
                courier: order.shipping.deliveryPartnerName || order.shipping.courier,
                trackingUrl: order.shipping.trackingUrl
              }
            : undefined
        },
        customer: {
          name: addr.fullName ?? "",
          phone: addr.phone ?? "",
          email: order.email,
          address: [addr.line1, addr.line2].filter(Boolean).join(", "),
          city: addr.city ?? "",
          state: addr.state ?? "",
          postalCode: addr.postalCode ?? "",
          country: addr.country ?? "IN"
        },
        lines
      }
    });
  } catch (error) {
    return next(error);
  }
});

// ------------------------------------------ Delivery partners & fulfillment

const deliveryPartnerSchema = z.object({
  name: z.string().min(1).max(80),
  trackingUrl: z.string().min(1).max(500),
  active: z.boolean().default(true)
});

function composeTrackingLink(partner: { trackingUrl: string } | null, trackingId: string): string | undefined {
  if (!partner || !trackingId) return undefined;
  return partner.trackingUrl.replace("{tracking_id}", encodeURIComponent(trackingId));
}

adminRouter.get("/delivery-partners", requireAdmin, requireFeature("shipping"), async (_req, res, next) => {
  try {
    await requireDb();
    const data = await DeliveryPartner.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/delivery-partners", requireAdmin, requireFeature("shipping"), async (req, res, next) => {
  try {
    await requireDb();
    const input = deliveryPartnerSchema.parse(req.body);
    const partner = await DeliveryPartner.create(input);
    return res.status(201).json({ ok: true, data: partner });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid delivery partner input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/delivery-partners/:partnerId", requireAdmin, requireFeature("shipping"), async (req, res, next) => {
  try {
    await requireDb();
    const input = deliveryPartnerSchema.partial().parse(req.body);
    const partner = await DeliveryPartner.findByIdAndUpdate(req.params.partnerId, input, { new: true, runValidators: true });
    if (!partner) return next(new ApiError(404, "Delivery partner not found"));
    return res.json({ ok: true, data: partner });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid delivery partner input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/delivery-partners/:partnerId", requireAdmin, requireFeature("shipping"), async (req, res, next) => {
  try {
    await requireDb();
    const partner = await DeliveryPartner.findByIdAndDelete(req.params.partnerId);
    if (!partner) return next(new ApiError(404, "Delivery partner not found"));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

const fulfillmentStatuses = ["order_received", "packing", "shipping", "shipped", "delivered", "cancelled"] as const;

adminRouter.patch("/delivery/orders/:orderId", requireAdmin, requireFeature("shipping"), async (req: AuthenticatedRequest, res, next) => {
  try {
    await requireDb();
    const input = z
      .object({
        orderStatus: z.enum(fulfillmentStatuses),
        deliveryPartnerId: z.string().optional(),
        trackingId: z.string().optional(),
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
    if (input.orderStatus === "shipped" || input.orderStatus === "shipping") {
      order.shipping.status = "in_transit";
    }

    if (input.deliveryPartnerId) {
      const partner = await DeliveryPartner.findById(input.deliveryPartnerId);
      if (partner) {
        order.shipping.deliveryPartnerId = partner._id as never;
        order.shipping.deliveryPartnerName = partner.name;
        order.shipping.courier = partner.name;
        if (input.trackingId) {
          order.shipping.trackingId = input.trackingId;
          order.shipping.awb = input.trackingId;
          const link = composeTrackingLink(partner, input.trackingId);
          if (link) order.shipping.trackingUrl = link;
        }
      }
    }

    order.orderStatus = input.orderStatus;
    order.timeline.push({ type: input.orderStatus, message: input.message ?? `Status changed to ${input.orderStatus}`, at: new Date(), actorId: req.auth!.sub as never });
    await order.save();

    return res.json({ ok: true, data: orderResponse(order) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid fulfillment input", error.flatten()));
    return next(error);
  }
});

// ----------------------------------------------------------------- Coupons

adminRouter.get("/coupons", requireAdmin, requireFeature("coupons"), async (_req, res, next) => {
  try {
    await requireDb();
    const data = await Coupon.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/coupons", requireAdmin, requireFeature("coupons"), async (req, res, next) => {
  try {
    await requireDb();
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
    await requireDb();
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
    await requireDb();
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
    await requireDb();
    const data = await Category.find().sort({ displayOrder: 1, name: 1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/categories", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    await requireDb();
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
    await requireDb();
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
    await requireDb();
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
    await requireDb();
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

adminRouter.post("/media/upload", requireAdmin, requireFeature("media"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = z
      .object({
        dataUri: z.string().min(5),
        folder: z.string().optional(),
        category: z.enum(["asset", "page", "product", "review"]).optional(),
        referenceId: z.string().optional(),
        referenceLabel: z.string().max(160).optional(),
        alt: z.string().max(160).optional(),
        filename: z.string().max(200).optional(),
        mimeType: z.string().max(60).optional(),
        size: z.number().int().min(0).optional()
      })
      .parse(req.body);
    const category = input.category ?? "asset";
    const folder = input.folder || (category === "review" ? "edwin/reviews" : category === "page" ? "edwin/pages" : category === "product" ? "edwin/products" : "edwin/assets");
    const asset = await uploadImage(input.dataUri, folder);

    // Record the asset in MongoDB so images are catalogued by category.
    const doc = await Asset.create({
      category,
      url: asset.url,
      publicId: asset.publicId,
      alt: input.alt,
      referenceType: category === "product" ? "product" : category === "review" ? "review" : category === "page" ? "page" : null,
      referenceId: input.referenceId,
      referenceLabel: input.referenceLabel,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.size,
      uploaderId: req.auth?.sub as never
    });

    return res.status(201).json({ ok: true, url: asset.url, publicId: asset.publicId, asset: doc });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid upload input", error.flatten()));
    return next(error);
  }
});

adminRouter.post("/media/delete", requireAdmin, requireFeature("media"), async (req, res, next) => {
  try {
    const input = z.object({ publicId: z.string().min(1) }).parse(req.body);
    await deleteAsset(input.publicId);
    await Asset.deleteMany({ publicId: input.publicId });
    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid delete input", error.flatten()));
    return next(error);
  }
});

// Replace an existing asset's image with a new file. Every place that references the
// old publicId / url (products, reviews, categories, homepage, page content) is updated
// so nothing is left broken.
adminRouter.post("/media/replace", requireAdmin, requireFeature("media"), async (req, res, next) => {
  try {
    await requireDb();
    const input = z
      .object({
        assetId: z.string().min(1),
        dataUri: z.string().min(5),
        filename: z.string().max(200).optional(),
        mimeType: z.string().max(60).optional(),
        size: z.number().int().min(0).optional()
      })
      .parse(req.body);

    const asset = await Asset.findById(input.assetId);
    if (!asset) return next(new ApiError(404, "Asset not found"));

    const oldPublicId = asset.publicId;
    const oldUrl = asset.url;
    const folder = oldPublicId ? oldPublicId.split("/").slice(0, -1).join("/") || "edwin/assets" : "edwin/assets";

    const newImage = await uploadImage(input.dataUri, folder);
    const newUrl = newImage.url;
    const newPublicId = newImage.publicId;

    // 1. Products — swap url + publicId inside images array by old publicId or url.
    await Product.updateMany(
      { "images.publicId": oldPublicId },
      { $set: { "images.$[i].publicId": newPublicId, "images.$[i].url": newUrl } },
      { arrayFilters: [{ "i.publicId": oldPublicId }] }
    );
    await Product.updateMany(
      { "images.url": oldUrl },
      { $set: { "images.$[i].url": newUrl } },
      { arrayFilters: [{ "i.url": oldUrl }] }
    );

    // 2. Reviews — same shape.
    await Review.updateMany(
      { "images.publicId": oldPublicId },
      { $set: { "images.$[i].publicId": newPublicId, "images.$[i].url": newUrl } },
      { arrayFilters: [{ "i.publicId": oldPublicId }] }
    );
    await Review.updateMany(
      { "images.url": oldUrl },
      { $set: { "images.$[i].url": newUrl } },
      { arrayFilters: [{ "i.url": oldUrl }] }
    );

    // 3. Categories — single imageUrl string.
    await Category.updateMany({ imageUrl: oldUrl }, { $set: { imageUrl: newUrl } });

    // 4. Homepage / site settings — hero image, editorial image, category cards.
    await SiteSetting.updateMany({ heroImage: oldUrl }, { $set: { heroImage: newUrl } });
    await SiteSetting.updateMany({ "homepage.editorial.image": oldUrl }, { $set: { "homepage.editorial.image": newUrl } });
    await SiteSetting.updateMany(
      { "homepage.categories.cards.image": oldUrl },
      { $set: { "homepage.categories.cards.$[c].image": newUrl } },
      { arrayFilters: [{ "c.image": oldUrl }] }
    );

    // 5. Page content — hero image, block images, block item images.
    await PageContent.updateMany({ "hero.image": oldUrl }, { $set: { "hero.image": newUrl } });
    await PageContent.updateMany(
      { "blocks.image": oldUrl },
      { $set: { "blocks.$[b].image": newUrl } },
      { arrayFilters: [{ "b.image": oldUrl }] }
    );
    await PageContent.updateMany(
      { "blocks.items.image": oldUrl },
      { $set: { "blocks.$[b].items.$[i].image": newUrl } },
      { arrayFilters: [{ "b.image": oldUrl }, { "i.image": oldUrl }] }
    );

    // 6. Update the asset record and remove the old file from Cloudinary.
    asset.url = newUrl;
    asset.publicId = newPublicId;
    if (input.filename) asset.filename = input.filename;
    if (input.mimeType) asset.mimeType = input.mimeType;
    if (typeof input.size === "number") asset.size = input.size;
    await asset.save();

    if (oldPublicId && oldPublicId !== newPublicId) {
      await deleteAsset(oldPublicId).catch(() => {});
    }

    return res.json({ ok: true, url: newUrl, publicId: newPublicId, message: "Asset replaced everywhere it is used." });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid replace input", error.flatten()));
    return next(error);
  }
});

// List the image catalogue, optionally filtered by category.
adminRouter.get("/assets", requireAdmin, requireFeature("media"), async (req, res, next) => {
  try {
    await requireDb();
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const filter: Record<string, unknown> = {};
    if (category && category !== "all") filter.category = category;
    const data = await Asset.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/assets/:assetId", requireAdmin, requireFeature("media"), async (req, res, next) => {
  try {
    await requireDb();
    const asset = await Asset.findById(req.params.assetId);
    if (!asset) return next(new ApiError(404, "Asset not found"));
    await deleteAsset(asset.publicId).catch(() => {});
    await asset.deleteOne();
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/assets/:assetId", requireAdmin, requireFeature("media"), async (req, res, next) => {
  try {
    await requireDb();
    const input = z
      .object({
        alt: z.string().max(160).optional(),
        referenceLabel: z.string().max(160).optional(),
        category: z.enum(["asset", "page", "product", "review"]).optional()
      })
      .parse(req.body);
    const asset = await Asset.findByIdAndUpdate(req.params.assetId, { $set: input }, { new: true, runValidators: true });
    if (!asset) return next(new ApiError(404, "Asset not found"));
    return res.json({ ok: true, data: asset });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid asset update", error.flatten()));
    return next(error);
  }
});

// ----------------------------------------------------------------- Feedback

adminRouter.get("/feedback", requireAdmin, requireFeature("returns"), async (req, res, next) => {
  try {
    await requireDb();
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    const data = await Feedback.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/feedback/:feedbackId", requireAdmin, requireFeature("returns"), async (req, res, next) => {
  try {
    await requireDb();
    const input = z.object({ status: z.enum(["new", "read", "resolved"]) }).parse(req.body);
    const item = await Feedback.findByIdAndUpdate(req.params.feedbackId, { $set: input }, { new: true, runValidators: true });
    if (!item) return next(new ApiError(404, "Feedback not found"));
    return res.json({ ok: true, data: item });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid feedback status", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/feedback/:feedbackId", requireAdmin, requireFeature("returns"), async (req, res, next) => {
  try {
    await requireDb();
    await Feedback.findByIdAndDelete(req.params.feedbackId);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

// ----------------------------------------------------------------- Returns

adminRouter.get("/returns", requireAdmin, requireFeature("returns"), async (_req, res, next) => {
  try {
    await requireDb();
    const data = await Return.find().sort({ createdAt: -1 });
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/returns/:returnId", requireAdmin, requireFeature("returns"), async (req: AuthenticatedRequest, res, next) => {
  try {
    await requireDb();
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

    if (input.action === "refunded") {
      const order = await Order.findById(record.orderId);
      if (order) sendOrderEmail(order as never, "refunded").catch(() => undefined);
    }

    return res.json({ ok: true, data: record });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid return input", error.flatten()));
    return next(error);
  }
});

// -------------------------------------------------------------- Error logs

adminRouter.get("/error-logs", requireAdmin, requireFeature("error-logs"), async (req, res, next) => {
  try {
    await requireDb();
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const data = await ErrorLog.find().sort({ timestamp: -1 }).limit(limit).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

// ----------------------------------------------------------------- Reviews

const reviewSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().optional(),
  authorName: z.string().min(1).max(80),
  location: z.string().max(80).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(2),
  images: z.array(z.object({ url: z.string(), publicId: z.string().optional(), alt: z.string().optional() })).default([]),
  verifiedPurchase: z.boolean().default(false),
  featured: z.boolean().default(false),
  status: z.enum(["pending", "approved", "rejected"]).default("approved")
});

adminRouter.get("/reviews", requireAdmin, requireFeature("reviews"), async (_req, res, next) => {
  try {
    await requireDb();
    const data = await Review.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/reviews", requireAdmin, requireFeature("reviews"), async (req, res, next) => {
  try {
    await requireDb();
    const input = reviewSchema.parse(req.body);
    const review = await Review.create(input);
    return res.status(201).json({ ok: true, data: review });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid review input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/reviews/:reviewId", requireAdmin, requireFeature("reviews"), async (req, res, next) => {
  try {
    await requireDb();
    const input = reviewSchema.partial().parse(req.body);
    const review = await Review.findByIdAndUpdate(req.params.reviewId, input, { new: true, runValidators: true });
    if (!review) return next(new ApiError(404, "Review not found"));
    return res.json({ ok: true, data: review });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid review input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/reviews/:reviewId", requireAdmin, requireFeature("reviews"), async (req, res, next) => {
  try {
    await requireDb();
    const review = await Review.findByIdAndDelete(req.params.reviewId);
    if (!review) return next(new ApiError(404, "Review not found"));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});