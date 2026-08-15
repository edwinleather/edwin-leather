import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const variantSchema = new Schema(
  {
    label: { type: String, required: true },
    sku: { type: String, required: true, unique: true, index: true },
    color: { type: String, required: true },
    size: String,
    priceOverride: Number,
    inventoryTotal: { type: Number, default: 0, min: 0 },
    inventoryStoreAllocated: { type: Number, default: 0, min: 0 },
    inventoryAvailable: { type: Number, default: 0, min: 0 },
    inventoryReserved: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 3, min: 0 },
    allowBackorder: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
  },
  { _id: true }
);

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    subtitle: String,
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    collection: String,
    brand: String,
    hsn: String,
    gst: Number,
    deliveryBy: String,
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: Number,
    images: [{ url: String, publicId: String, alt: String }],
    variants: [variantSchema],
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Product = models.Product || model("Product", productSchema);
