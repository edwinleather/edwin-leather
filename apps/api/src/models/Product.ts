import { Schema, model, models } from "mongoose";

const variantSchema = new Schema(
  {
    label: { type: String, required: true },
    sku: { type: String, required: true, unique: true, index: true },
    color: { type: String, required: true },
    size: String,
    priceOverride: Number,
    inventoryAvailable: { type: Number, default: 0, min: 0 },
    inventoryReserved: { type: Number, default: 0, min: 0 },
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
