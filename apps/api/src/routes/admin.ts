import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { ensureDatabase } from "../config/db.js";
import AnalyticEvent from "../models/AnalyticEvent.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { requireBackofficeAdmin, requireBackofficeFeature, requireBackofficeRole } from "../middleware/backoffice.js";
import { Attribute } from "../models/Attribute.js";
import { Category } from "../models/Category.js";
import { Coupon } from "../models/Coupon.js";
import { Promotion } from "../models/Promotion.js";
import { Asset } from "../models/Asset.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ProductVariant } from "../models/ProductVariant.js";
import { Inventory } from "../models/Inventory.js";
import { InventoryLog } from "../models/InventoryLog.js";
import { Return } from "../models/Return.js";
import { Review } from "../models/Review.js";
import { Feedback } from "../models/Feedback.js";
import { SiteSetting } from "../models/SiteSetting.js";
import { DeliveryPartner } from "../models/DeliveryPartner.js";
import { User } from "../models/User.js";
import { ErrorLog } from "../models/ErrorLog.js";
import { EmailLog } from "../models/EmailLog.js";
import { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_DEFAULTS } from "../services/email-templates/template-defaults.js";
import { PageContent } from "../models/PageContent.js";
import { commitStock, releaseStock, setVariantInventory, adjustVariantInventory, type StockLine } from "../services/inventory.js";
import { orderResponse } from "../services/orders.js";
import { getTaxConfig } from "../services/tax.js";
import { cloudName, deleteAsset, isCloudinaryConfigured, uploadImage } from "../services/cloudinary.js";
import { attributeKey, FIELD_TYPES, findOrCreateAttribute, getAttributeById, searchAttributes, deleteAttribute, normalizeProductAttributes } from "../services/attributes.js";
import { validateProductAttributes } from "../services/attributeValidation.js";
import { reconcileProductVariants, productVariantLabel } from "../services/variants.js";
import {
  sendOrderPackedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendReturnRequestedEmail
} from "../services/send-order-email.js";

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
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  category: z.string().min(2),
  collection: z.string().optional(),
  brand: z.string().optional(),
  hsn: z.string().optional(),
  gst: z.number().min(0).optional(),
  deliveryBy: z.string().optional(),
  articleNumber: z.array(z.string()).default([]),
  styleCode: z.string().optional(),
  brandColor: z.string().optional(),
  brandSize: z.string().optional(),
  ukIndiaSize: z.string().optional(),
  euroSize: z.string().optional(),
  womenSandalType: z.string().optional(),
  color: z.array(z.string()).default([]),
  typeForFlats: z.string().optional(),
  typeForHeels: z.string().optional(),
  occasion: z.array(z.string()).default([]),
  outerMaterial: z.array(z.string()).default([]),
  heelHeight: z.string().optional(),
  idealFor: z.string().optional(),
  ornamentationType: z.string().optional(),
  insoleMaterial: z.array(z.string()).default([]),
  packOf: z.string().optional(),
  closure: z.array(z.string()).default([]),
  heelPattern: z.string().optional(),
  soleMaterial: z.array(z.string()).default([]),
  innerMaterial: z.array(z.string()).default([]),
  upperPattern: z.string().optional(),
  careInstructions: z.array(z.string()).default([]),
  removableInsole: z.string().optional(),
  searchKeywords: z.array(z.string()).default([]),
  keyFeatures: z.array(z.string()).default([]),
  videoUrl: z.string().optional(),
  eanUpc: z.array(z.string()).default([]),
  cushioningLevel: z.string().optional(),
  otherDetails: z.string().optional(),
  includedInBox: z.array(z.string()).default([]),
  returnReplacement: z.string().optional(),
  cashDelivery: z.string().optional(),
  customerSupport: z.string().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional(), alt: z.string().optional() })).max(4).default([]),
  attributes: z
    .array(
      z.object({
        attributeId: z.string().min(1).optional(),
        key: z.string().min(1).optional(),
        label: z.string().min(1).optional(),
        value: z.union([z.string(), z.array(z.string())]).optional()
      })
    )
    .default([]),
  variantDimensions: z
    .array(
      z.object({
        attributeId: z.string().min(1),
        values: z.array(z.string()).default([])
      })
    )
    .default([]),
  productVariants: z
    .array(
      z.object({
        attributes: z.array(
          z.object({
            attributeId: z.string().min(1),
            value: z.union([z.string(), z.array(z.string())])
          })
        ),
        sku: z.string().min(1),
        price: z.number().min(0),
        salePrice: z.number().min(0).optional(),
        stock: z.number().int().min(0).default(0),
        images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional(), alt: z.string().optional() })).max(4).default([]),
        active: z.boolean().default(true),
        allowBackorder: z.boolean().default(false)
      })
    )
    .default([]),
  featured: z.boolean().default(false),
  codAvailable: z.boolean().default(true),
  active: z.boolean().default(true),
  status: z.enum(["draft", "active", "inactive"]).default("active"),
  variants: z
    .array(
      z.object({
        label: z.string().min(1),
        sku: z.string().min(1),
        color: z.string().min(1),
        size: z.string().optional(),
        priceOverride: z.number().min(0).optional(),
        salePrice: z.number().min(0).optional(),
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
}).refine(
  (data) => {
    if (data.startsAt && data.expiresAt) {
      return new Date(data.expiresAt) > new Date(data.startsAt);
    }
    return true;
  },
  { message: "expiresAt must be after startsAt", path: ["expiresAt"] }
);

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  fields: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        type: z.enum(["text", "multi", "textarea", "select", "yesno", "number"]).default("text"),
        options: z.array(z.string()).default([]),
        required: z.boolean().default(false),
        section: z.enum(["specifications", "listing"]).default("specifications")
      })
    )
    .optional(),
  attributes: z
    .array(
      z.object({
        attributeId: z.string().min(1),
        required: z.boolean().default(false),
        customerVisible: z.boolean().default(true),
        sellerVisible: z.boolean().default(true),
        filterable: z.boolean().default(false),
        searchable: z.boolean().default(true),
        variant: z.boolean().default(false),
        displaySection: z.enum(["specifications", "listing"]).default("specifications"),
        displayOrder: z.number().int().min(0).default(0)
      })
    )
    .optional()
});

// Convert the admin-provided category structure (new `attributes` refs OR legacy
// `fields`) into the `{ attributes, fields }` pair we persist. `attributes` is the
// source of truth; `fields` is derived and kept so older code keeps working.
async function resolveCategoryStructure(input: { attributes?: { attributeId: string; required?: boolean; customerVisible?: boolean; sellerVisible?: boolean; filterable?: boolean; searchable?: boolean; variant?: boolean; displaySection?: "specifications" | "listing"; displayOrder?: number }[]; fields?: { key: string; label: string; type?: string; options?: string[]; required?: boolean; section?: "specifications" | "listing" }[] }) {
  if (input.attributes && input.attributes.length > 0) {
    const ids = input.attributes.map((a) => a.attributeId);
    const attrs = await Attribute.find({ _id: { $in: ids } }).lean();
    const byId = new Map(attrs.map((a) => [String(a._id), a]));
    const attributes = input.attributes.map((a) => ({
      attributeId: a.attributeId,
      required: a.required ?? false,
      customerVisible: a.customerVisible ?? true,
      sellerVisible: a.sellerVisible ?? true,
      filterable: a.filterable ?? false,
      searchable: a.searchable ?? true,
      variant: a.variant ?? false,
      displaySection: a.displaySection ?? "specifications",
      displayOrder: a.displayOrder ?? 0
    }));
    const fields = attributes
      .map((a, index) => {
        const attr = byId.get(String(a.attributeId));
        if (!attr) return null;
        return {
          key: attr.key,
          label: attr.name,
          type: attr.type,
          options: attr.options ?? [],
          required: a.required,
          section: a.displaySection
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);
    return { attributes, fields };
  }

  if (input.fields && input.fields.length > 0) {
    const attributes = [];
    for (const f of input.fields) {
      const attr = await findOrCreateAttribute({ name: f.label, type: f.type as never, options: f.options });
      attributes.push({
        attributeId: String(attr._id),
        required: !!f.required,
        customerVisible: true,
        sellerVisible: true,
        filterable: false,
        searchable: true,
        displaySection: f.section === "listing" ? "listing" : "specifications",
        displayOrder: attributes.length
      });
    }
    return { attributes, fields: input.fields };
  }

  return { attributes: [], fields: [] };
}

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
    const data = await Product.find().sort({ createdAt: -1 }).populate("attributes.attributeId").populate("variantDimensions.attributeId").lean();
    const variants = await ProductVariant.find({ productId: { $in: data.map((p) => String(p._id)) } }).populate("attributes.attributeId").lean();
    const byProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      const pid = String(v.productId);
      const list = byProduct.get(pid) ?? [];
      list.push(v);
      byProduct.set(pid, list);
    }
    for (const p of data) {
      (p as { productVariants?: unknown }).productVariants = byProduct.get(String(p._id)) ?? [];
    }
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
    const attributes = await normalizeProductAttributes(input.attributes ?? []);
    const category = input.category ? await Category.findOne({ name: input.category }).lean() : null;
    if (category) {
      const errors = await validateProductAttributes(category.attributes ?? [], attributes);
      if (errors.length) return next(new ApiError(400, "Invalid attribute values", errors));
    }
    const product = await Product.create({ ...input, attributes, variants });
    if (product.variantDimensions && product.variantDimensions.length > 0) {
      await reconcileProductVariants(String(product._id), input.variantDimensions ?? [], input.productVariants ?? []);
    }
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
    delete update.productVariants;
    if (input.attributes) {
      update.attributes = await normalizeProductAttributes(input.attributes);
      const categoryName = input.category ?? product.category;
      const category = categoryName ? await Category.findOne({ name: categoryName }).lean() : null;
      if (category) {
        const errors = await validateProductAttributes(category.attributes ?? [], update.attributes as { attributeId: string; value?: string | string[] }[]);
        if (errors.length) return next(new ApiError(400, "Invalid attribute values", errors));
      }
    }
    if (input.variants) {
      const existing = new Map<string, number>();
      for (const v of product.variants ?? []) existing.set(String(v._id), v.inventoryReserved ?? 0);
      update.variants = input.variants.map((variant) => {
        const withId = { ...variant, _id: (variant as { _id?: unknown })._id };
        return normalizeVariant(withId, existing.get(String((variant as { _id?: unknown })._id)) ?? 0);
      });
    }
    const updated = await Product.findByIdAndUpdate(req.params.productId, update, { returnDocument: "after", runValidators: true });
    if (!updated) return next(new ApiError(404, "Product not found"));
    if (input.variantDimensions || input.productVariants) {
      await reconcileProductVariants(String(updated._id), input.variantDimensions ?? [], input.productVariants ?? []);
    }
    return res.json({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid product input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/products/:productId/images/reorder", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const input = z.object({ orderedIds: z.array(z.string()).min(1) }).parse(req.body);
    const product = await Product.findById(req.params.productId);
    if (!product) return next(new ApiError(404, "Product not found"));
    const orderMap = new Map(input.orderedIds.map((id, idx) => [id, idx]));
    const reordered = [...product.images].sort((a, b) => {
      const aIdx = orderMap.get(String(a._id));
      const bIdx = orderMap.get(String(b._id));
      if (aIdx === undefined && bIdx === undefined) return 0;
      if (aIdx === undefined) return 1;
      if (bIdx === undefined) return -1;
      return aIdx - bIdx;
    });
    product.images = reordered;
    await product.save();
    return res.json({ ok: true, data: product.images });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid reorder input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/products/:productId/images/:imageId", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const input = z.object({ alt: z.string().max(120).optional() }).parse(req.body);
    const product = await Product.findById(req.params.productId);
    if (!product) return next(new ApiError(404, "Product not found"));
    const image = product.images.id(req.params.imageId);
    if (!image) return next(new ApiError(404, "Image not found"));
    if (input.alt !== undefined) image.alt = input.alt;
    await product.save();
    return res.json({ ok: true, data: product.images });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid image input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/products/:productId/images/:imageId", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const product = await Product.findById(req.params.productId);
    if (!product) return next(new ApiError(404, "Product not found"));
    const img = product.images.id(req.params.imageId);
    if (!img) return next(new ApiError(404, "Image not found"));
    img.deleteOne();
    await product.save();
    return res.json({ ok: true, data: product.images });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/products/:productId", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) return next(new ApiError(404, "Product not found"));
    await ProductVariant.deleteMany({ productId: product._id });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/products/:productId/duplicate", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const original = await Product.findById(req.params.productId).lean();
    if (!original) return next(new ApiError(404, "Product not found"));
    const { _id, slug, createdAt, updatedAt, ...rest } = original;
    const newSlug = `${slug}-copy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const duplicated = await Product.create({ ...rest, slug: newSlug, name: `${rest.name} (Copy)`, status: "draft" });
    const variants = await ProductVariant.find({ productId: _id }).lean();
    if (variants.length > 0) {
      const newVariants = variants.map((v) => {
        const { _id: vid, ...variantRest } = v;
        return { ...variantRest, productId: duplicated._id };
      });
      await ProductVariant.insertMany(newVariants);
    }
    return res.status(201).json({ ok: true, data: duplicated });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/products/bulk/status", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const input = z.object({ ids: z.array(z.string()).min(1), status: z.enum(["draft", "active", "inactive"]) }).parse(req.body);
    const validIds = input.ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) return next(new ApiError(400, "No valid product IDs provided"));
    const objectIds = validIds.map((id) => new Types.ObjectId(id));
    const isActive = input.status === "active";
    await Product.updateMany({ _id: { $in: objectIds } }, { $set: { status: input.status, active: isActive } });
    return res.json({ ok: true, updated: input.ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid bulk status input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/products/bulk", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const input = z.object({
      ids: z.array(z.string()).min(1),
      patch: z.object({
        category: z.string().optional(),
        featured: z.boolean().optional(),
        active: z.boolean().optional(),
        status: z.enum(["draft", "active", "inactive"]).optional(),
        codAvailable: z.boolean().optional()
      }).refine((p) => Object.keys(p).length > 0, "At least one field to update")
    }).parse(req.body);
    const objectIds = input.ids.map((id) => new Types.ObjectId(id));
    await Product.updateMany({ _id: { $in: objectIds } }, { $set: input.patch });
    return res.json({ ok: true, updated: input.ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid bulk input", error.flatten()));
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
        salePrice: z.number().min(0).optional(),
        inventoryAvailable: z.number().int().min(0).default(0)
      })
      .parse(req.body);
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { $push: { variants: { ...input, inventoryReserved: 0, active: true } } },
      { returnDocument: "after", runValidators: true }
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
        salePrice: z.number().min(0).nullable().optional(),
        inventoryAvailable: z.number().int().min(0).optional(),
        active: z.boolean().optional()
      })
      .parse(req.body);
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) updates[`variants.$.${key}`] = value;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.productId, "variants._id": req.params.variantId },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
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
      { returnDocument: "after" }
    );
    if (!product) return next(new ApiError(404, "Variant not found"));
    return res.json({ ok: true, data: product });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------- Inventory

adminRouter.get("/inventory", requireAdmin, requireFeature("inventory"), async (req, res, next) => {
  try {
    await requireDb();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const products = await Product.find({}, { name: 1, slug: 1, active: 1, category: 1, variants: 1 }).lean();
    const rows: unknown[] = [];
    const productById: Record<string, { name: string; slug: string; active: boolean }> = {};

    for (const product of products) {
      productById[String(product._id)] = { name: product.name, slug: product.slug, active: product.active };
      for (const variant of product.variants ?? []) {
        const v = variant as { inventoryTotal?: number; inventoryAvailable?: number; inventoryReserved?: number; inventoryStoreAllocated?: number } & (typeof products)[number]["variants"][number];
        if (v.inventoryTotal === undefined) {
          v.inventoryTotal = (v.inventoryAvailable ?? 0) + (v.inventoryReserved ?? 0);
        }
        if (v.inventoryStoreAllocated === undefined) v.inventoryStoreAllocated = 0;
        rows.push({
          kind: "legacy",
          variantId: String((v as { _id: unknown })._id),
          productId: String(product._id),
          productName: product.name,
          slug: product.slug,
          active: product.active,
          sku: v.sku,
          label: v.label,
          color: v.color,
          size: v.size,
          available: v.inventoryAvailable ?? 0,
          reserved: v.inventoryReserved ?? 0,
          damaged: 0,
          store: v.inventoryStoreAllocated ?? 0,
          lowStockThreshold: v.lowStockThreshold ?? 3,
          allowBackorder: v.allowBackorder ?? false
        });
      }
    }

    // ProductVariant-backed SKUs
    const productVariants = await ProductVariant.find({}).lean();
    const variantIds = productVariants.map((pv) => pv._id);
    const inventories = await Inventory.find({ variantId: { $in: variantIds } }).lean();
    const invByVariant = new Map(inventories.map((inv) => [String(inv.variantId), inv]));

    for (const pv of productVariants) {
      const inv = invByVariant.get(String(pv._id));
      const product = productById[String(pv.productId)];
      rows.push({
        kind: "variant",
        variantId: String(pv._id),
        productId: String(pv.productId),
        productName: product?.name ?? "-",
        slug: product?.slug ?? "",
        active: pv.active,
        sku: pv.sku,
        label: productVariantLabel(pv),
        color: "",
        size: "",
        available: inv?.available ?? pv.stock ?? 0,
        reserved: inv?.reserved ?? 0,
        damaged: inv?.damaged ?? 0,
        store: 0,
        lowStockThreshold: inv?.lowStockThreshold ?? 3,
        allowBackorder: pv.allowBackorder ?? false
      });
    }

    return res.json({ ok: true, data: rows, total: rows.length, page, limit });
  } catch (error) {
    return next(error);
  }
});

const inventorySetSchema = z.object({
  kind: z.enum(["variant", "legacy"]).optional(),
  inventoryTotal: z.number().int().min(0),
  inventoryStoreAllocated: z.number().int().min(0).optional().default(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  allowBackorder: z.boolean().optional(),
  damaged: z.number().int().min(0).optional()
});

adminRouter.patch("/inventory/:productId/:variantId", requireAdmin, requireFeature("inventory"), async (req: AuthenticatedRequest, res, next) => {
  try {
    await requireDb();
    const input = inventorySetSchema.parse(req.body);
    const productId = String(req.params.productId);
    const variantId = String(req.params.variantId);

    if (input.kind === "variant") {
      const updated = await adjustVariantInventory(
        variantId,
        productId,
        {
          total: input.inventoryTotal,
          damaged: input.damaged ?? 0,
          lowStockThreshold: input.lowStockThreshold,
          allowBackorder: input.allowBackorder
        },
        String((req as AuthenticatedRequest & { admin?: { id?: string } }).admin?.id ?? "")
      );
      if (!updated) return next(new ApiError(404, "Variant not found"));
      return res.json({ ok: true, data: updated });
    }

    const updated = await setVariantInventory(productId, variantId, input);
    if (!updated) return next(new ApiError(404, "Variant not found"));
    return res.json({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid inventory input", error.flatten()));
    return next(error);
  }
});

adminRouter.get("/inventory/:variantId/logs", requireAdmin, requireFeature("inventory"), async (req, res, next) => {
  try {
    await requireDb();
    const logs = await InventoryLog.find({ variantId: req.params.variantId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({
      ok: true,
      data: logs.map((log) => ({
        id: String(log._id),
        type: log.type,
        quantity: log.quantity,
        note: log.note ?? "",
        referenceId: log.referenceId ?? "",
        createdAt: log.createdAt
      }))
    });
  } catch (error) {
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

    const previousOrder = await Order.findById(req.params.orderId);
    if (!previousOrder) return next(new ApiError(404, "Order not found"));

    const previous = previousOrder.orderStatus;

    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, orderStatus: previous },
      { $set: { orderStatus: input.orderStatus } },
      { new: true }
    );
    if (!order) return next(new ApiError(409, "Order status changed concurrently, please retry"));

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

    order.timeline.push({ type: input.orderStatus, message: input.message ?? `Status changed to ${input.orderStatus}`, at: new Date(), actorId: req.auth!.sub as never });
    await order.save();

    // Send transactional email based on new status (fire-and-forget)
    if (input.orderStatus === "packed" || input.orderStatus === "packing") sendOrderPackedEmail(order).catch(() => {});
    else if (input.orderStatus === "shipped") sendOrderShippedEmail(order).catch(() => {});
    else if (input.orderStatus === "delivered") sendOrderDeliveredEmail(order).catch(() => {});
    else if (input.orderStatus === "cancelled") sendOrderCancelledEmail(order, input.message).catch(() => {});
    else if (input.orderStatus === "return_requested") sendReturnRequestedEmail(order).catch(() => {});

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
    const partner = await DeliveryPartner.findByIdAndUpdate(req.params.partnerId, input, { returnDocument: "after", runValidators: true });
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

    // Send transactional email based on new status (fire-and-forget)
    if (input.orderStatus === "packing") sendOrderPackedEmail(order).catch(() => {});
    else if (input.orderStatus === "shipped" || input.orderStatus === "shipping") sendOrderShippedEmail(order).catch(() => {});
    else if (input.orderStatus === "delivered") sendOrderDeliveredEmail(order).catch(() => {});
    else if (input.orderStatus === "cancelled") sendOrderCancelledEmail(order, input.message).catch(() => {});

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
    const raw = couponSchema.partial().parse(req.body);
    const input = raw.code ? { ...raw, code: raw.code.toUpperCase().trim() } : raw;
    const coupon = await Coupon.findByIdAndUpdate(req.params.couponId, input, { returnDocument: "after", runValidators: true });
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

// -------------------------------------------------------------- Promotions

const promotionSchema = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(0),
  target: z.enum(["product", "category"]),
  targetProductId: z.string().optional(),
  targetCategory: z.string().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  priority: z.number().int().default(0),
  active: z.boolean().default(true)
});

adminRouter.get("/promotions", requireAdmin, requireFeature("coupons"), async (_req, res, next) => {
  try {
    await requireDb();
    const data = await Promotion.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/promotions", requireAdmin, requireFeature("coupons"), async (req, res, next) => {
  try {
    await requireDb();
    const input = promotionSchema.parse(req.body);
    if (input.target === "product" && !input.targetProductId) return next(new ApiError(400, "A product promotion needs a target product"));
    if (input.target === "category" && !input.targetCategory) return next(new ApiError(400, "A category promotion needs a target category"));
    const promo = await Promotion.create({
      ...input,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      targetProductId: input.targetProductId ?? undefined,
      targetCategory: input.targetCategory ?? undefined
    });
    return res.status(201).json({ ok: true, data: promo });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid promotion input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/promotions/:promotionId", requireAdmin, requireFeature("coupons"), async (req, res, next) => {
  try {
    await requireDb();
    const input = promotionSchema.partial().parse(req.body);
    const updates: Record<string, unknown> = { ...input };
    if (input.startsAt !== undefined) updates.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.expiresAt !== undefined) updates.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    const promo = await Promotion.findByIdAndUpdate(req.params.promotionId, updates, { returnDocument: "after", runValidators: true });
    if (!promo) return next(new ApiError(404, "Promotion not found"));
    return res.json({ ok: true, data: promo });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid promotion input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/promotions/:promotionId", requireAdmin, requireFeature("coupons"), async (req, res, next) => {
  try {
    await requireDb();
    const promo = await Promotion.findByIdAndDelete(req.params.promotionId);
    if (!promo) return next(new ApiError(404, "Promotion not found"));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

// -------------------------------------------------------------- Categories

adminRouter.get("/categories", requireAdmin, requireFeature("categories"), async (_req, res, next) => {
  try {
    await requireDb();
    const data = await Category.find().sort({ displayOrder: 1, name: 1 }).populate("attributes.attributeId").lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/categories", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    await requireDb();
    const input = categorySchema.parse(req.body);
    const { attributes, fields } = await resolveCategoryStructure(input);
    const category = await Category.create({ ...input, attributes, fields });
    return res.status(201).json({ ok: true, data: category });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid category input", error.flatten()));
    if ((error as { code?: string }).code === "11000") {
      const field = String((error as { keyPattern?: Record<string, unknown> }).keyPattern ?? "").replace("1.", "");
      return next(new ApiError(409, `A category with this ${field || "name/slug"} already exists`));
    }
    return next(error);
  }
});

adminRouter.patch("/categories/:categoryId", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    await requireDb();
    const input = categorySchema.partial().parse(req.body);
    let structure: { attributes?: unknown[]; fields?: unknown[] } | undefined;
    if (input.attributes || input.fields) {
      structure = await resolveCategoryStructure({ attributes: input.attributes, fields: input.fields });
    }
    const update: Record<string, unknown> = { ...input };
    delete update.attributes;
    delete update.fields;
    if (structure) {
      update.attributes = structure.attributes;
      update.fields = structure.fields;
    }
    const category = await Category.findByIdAndUpdate(req.params.categoryId, update, { returnDocument: "after", runValidators: true });
    if (!category) return next(new ApiError(404, "Category not found"));
    return res.json({ ok: true, data: category });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid category input", error.flatten()));
    if ((error as { code?: string }).code === "11000") {
      const field = String((error as { keyPattern?: Record<string, unknown> }).keyPattern ?? "").replace("1.", "");
      return next(new ApiError(409, `A category with this ${field || "name/slug"} already exists`));
    }
    return next(error);
  }
});

adminRouter.delete("/categories/:categoryId", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    await requireDb();
    const category = await Category.findByIdAndDelete(req.params.categoryId);
    if (!category) return next(new ApiError(404, "Category not found"));
    const affectedProducts = await Product.countDocuments({ category: category.name });
    return res.json({ ok: true, affectedProducts });
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------------- Attribute pool
// A shared, reusable pool of attribute definitions. Categories reference these
// rather than duplicating them, so a single "Color" attribute is shared across
// Footwear, Clothing, Bags, etc.

const attributeCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(FIELD_TYPES).default("text"),
  options: z.array(z.string()).default([]),
  description: z.string().optional()
});

adminRouter.get("/attributes", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    await requireDb();
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const data = await searchAttributes(q);
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/attributes", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    await requireDb();
    const input = attributeCreateSchema.parse(req.body);
    const attr = await findOrCreateAttribute({ name: input.name, type: input.type, options: input.options });
    if (input.description && !attr.description) {
      attr.description = input.description;
      await attr.save();
    }
    return res.status(201).json({ ok: true, data: attr });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid attribute input", error.flatten()));
    return next(error);
  }
});

adminRouter.patch("/attributes/:attributeId", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    await requireDb();
    const input = z.object({ name: z.string().min(1).optional(), type: z.enum(FIELD_TYPES).optional(), options: z.array(z.string()).optional(), description: z.string().optional() }).parse(req.body);
    const attr = await Attribute.findById(req.params.attributeId);
    if (!attr) return next(new ApiError(404, "Attribute not found"));
    if (input.name && input.name.trim() && input.name.trim() !== attr.name) {
      const newKey = attributeKey(input.name.trim());
      const existing = await Attribute.findOne({ key: newKey, _id: { $ne: attr._id } }).lean();
      if (existing) return next(new ApiError(409, `An attribute named "${existing.name}" already exists`));
      attr.name = input.name.trim();
      attr.key = newKey;
    }
    if (input.type) attr.type = input.type;
    if (input.options) attr.options = input.options;
    if (input.description !== undefined) attr.description = input.description;
    await attr.save();
    return res.json({ ok: true, data: attr });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid attribute input", error.flatten()));
    return next(error);
  }
});

adminRouter.delete("/attributes/:attributeId", requireAdmin, requireFeature("categories"), async (req, res, next) => {
  try {
    await requireDb();
    const attr = await getAttributeById(String(req.params.attributeId));
    if (!attr) return next(new ApiError(404, "Attribute not found"));
    await deleteAttribute(String(req.params.attributeId));
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
        dataUri: z.string().min(5).max(15_000_000),
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

    // 1. Products - swap url + publicId inside images array by old publicId or url.
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

    // 2. Reviews - same shape.
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

    // 3. Categories - single imageUrl string.
    await Category.updateMany({ imageUrl: oldUrl }, { $set: { imageUrl: newUrl } });

    // 4. Homepage / site settings - hero image, editorial image, category cards.
    await SiteSetting.updateMany({ heroImage: oldUrl }, { $set: { heroImage: newUrl } });
    await SiteSetting.updateMany({ "homepage.editorial.image": oldUrl }, { $set: { "homepage.editorial.image": newUrl } });
    await SiteSetting.updateMany(
      { "homepage.categories.cards.image": oldUrl },
      { $set: { "homepage.categories.cards.$[c].image": newUrl } },
      { arrayFilters: [{ "c.image": oldUrl }] }
    );

    // 5. Page content - hero image, block images, block item images.
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

    const { publicId, url } = asset;

    // Remove every reference to this image across the database so nothing is
    // left pointing at a deleted file.
    // 1. Products - pull matching image objects from the images array.
    await Product.updateMany({ "images.publicId": publicId }, { $pull: { images: { publicId } } });
    if (url) await Product.updateMany({ "images.url": url }, { $pull: { images: { url } } });

    // 2. Reviews - same shape.
    await Review.updateMany({ "images.publicId": publicId }, { $pull: { images: { publicId } } });
    if (url) await Review.updateMany({ "images.url": url }, { $pull: { images: { url } } });

    // 3. Categories - single imageUrl string.
    if (url) await Category.updateMany({ imageUrl: url }, { $unset: { imageUrl: 1 } });

    // 4. Homepage / site settings.
    if (url) {
      await SiteSetting.updateMany({ heroImage: url }, { $unset: { heroImage: 1 } });
      await SiteSetting.updateMany({ "homepage.editorial.image": url }, { $unset: { "homepage.editorial.image": 1 } });
      await SiteSetting.updateMany(
        { "homepage.categories.cards.image": url },
        { $pull: { "homepage.categories.cards": { image: url } } }
      );
    }

    // 5. Page content - hero image, block images, block item images.
    if (url) {
      await PageContent.updateMany({ "hero.image": url }, { $unset: { "hero.image": 1 } });
      await PageContent.updateMany(
        { "blocks.image": url },
        { $set: { "blocks.$[b].image": "" } },
        { arrayFilters: [{ "b.image": url }] }
      );
      await PageContent.updateMany(
        { "blocks.items.image": url },
        { $set: { "blocks.$[b].items.$[i].image": "" } },
        { arrayFilters: [{ "b.image": url }, { "i.image": url }] }
      );
    }

    await deleteAsset(publicId).catch(() => {});
    await asset.deleteOne();
    return res.json({ ok: true, message: "Image removed and references cleaned from products, reviews, categories, pages and site settings." });
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
    const asset = await Asset.findByIdAndUpdate(req.params.assetId, { $set: input }, { returnDocument: "after", runValidators: true });
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
    const item = await Feedback.findByIdAndUpdate(req.params.feedbackId, { $set: input }, { returnDocument: "after", runValidators: true });
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
    const review = await Review.findByIdAndUpdate(req.params.reviewId, input, { returnDocument: "after", runValidators: true });
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

adminRouter.get("/analytics/dashboard", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 86400000);
    const [revenueResult, orderCount, topProducts, eventCounts, lowStock] = await Promise.all([
      AnalyticEvent.aggregate([
        { $match: { type: "order_placed", createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
      ]),
      AnalyticEvent.countDocuments({ type: "order_placed", createdAt: { $gte: since } }),
      AnalyticEvent.aggregate([
        { $match: { type: "order_placed", createdAt: { $gte: since } } },
        { $group: { _id: "$productId", revenue: { $sum: "$amount" }, orders: { $sum: 1 }, qty: { $sum: "$quantity" } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, revenue: 1, orders: 1, qty: 1, name: "$product.name", slug: "$product.slug" } }
      ]),
      AnalyticEvent.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]),
      (async () => {
        const inv = await Inventory.find({}).lean();
        const items = inv.filter((i: any) => i.available <= (i.lowStockThreshold ?? 5) && i.available > 0);
        const outOfStock = inv.filter((i: any) => i.available === 0);
        return { low: items.length, outOfStock: outOfStock.length, thresholdItems: items.slice(0, 10) };
      })()
    ]);
    const revenue = revenueResult[0]?.total ?? 0;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;
    const views = eventCounts.find((e) => e._id === "product_view")?.count ?? 0;
    const checkouts = eventCounts.find((e) => e._id === "checkout_complete")?.count ?? 0;
    const conversionRate = views > 0 ? (checkouts / views) * 100 : 0;
    return res.json({
      ok: true,
      data: {
        period: days,
        revenue,
        orders: orderCount,
        avgOrderValue,
        productViews: views,
        checkouts,
        conversionRate,
        topProducts,
        lowStock
      }
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/analytics/events", requireAdmin, requireFeature("products"), async (req, res, next) => {
  try {
    await requireDb();
    const type = req.query.type as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    const events = await AnalyticEvent.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ ok: true, data: events });
  } catch (error) {
    return next(error);
  }
});

// ----------------------------------------------------------------- Email logs

adminRouter.get("/email-logs", requireAdmin, requireFeature("error-logs"), async (req, res, next) => {
  try {
    await requireDb();
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const template = typeof req.query.template === "string" ? req.query.template : undefined;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (template) query.template = template;
    const data = await EmailLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------- Email templates

adminRouter.get("/email-templates", requireAdmin, requireFeature("error-logs"), async (_req, res, next) => {
  try {
    await requireDb();
    const doc = await SiteSetting.findOne({ key: "email-templates" }).lean();
    const custom = doc?.emailTemplates ?? {};
    const data: Record<string, string> = {};
    for (const key of EMAIL_TEMPLATE_KEYS) {
      data[key] = custom[key] ?? EMAIL_TEMPLATE_DEFAULTS[key];
    }
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

adminRouter.put("/email-templates", requireAdmin, requireFeature("error-logs"), async (req: AuthenticatedRequest, res, next) => {
  try {
    await requireDb();
    const input = z.object(
      Object.fromEntries(EMAIL_TEMPLATE_KEYS.map((k) => [k, z.string().max(50000).optional()])) as Record<string, z.ZodOptional<z.ZodString>>
    ).parse(req.body);

    const update: Record<string, string> = {};
    for (const key of EMAIL_TEMPLATE_KEYS) {
      if (input[key] !== undefined) update[key] = input[key]!;
    }

    await SiteSetting.updateOne(
      { key: "email-templates" },
      { $set: { emailTemplates: update, updatedBy: req.auth?.sub as never } },
      { upsert: true }
    );

    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid template input", error.flatten()));
    return next(error);
  }
});

adminRouter.post("/email-templates/reset", requireAdmin, requireFeature("error-logs"), async (req, res, next) => {
  try {
    await requireDb();
    const input = z.object({ key: z.enum(EMAIL_TEMPLATE_KEYS as unknown as [string, ...string[]]) }).parse(req.body);
    await SiteSetting.updateOne(
      { key: "email-templates" },
      { $unset: { [`emailTemplates.${input.key}`]: "" } }
    );
    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});