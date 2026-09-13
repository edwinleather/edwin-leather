import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// Variant-aware media registry. Every image belongs to a product; images that
// are specific to one sellable variant additionally carry `variantId`.
// `position` defines gallery ordering within its scope.
export const MEDIA_TYPES = ["PRODUCT_IMAGE", "VARIANT_IMAGE"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

const mediaSchema = new Schema(
  {
    type: { type: String, enum: MEDIA_TYPES, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", default: null, index: true },
    url: { type: String, required: true },
    publicId: String,
    alt: String,
    position: { type: Number, default: 0 }
  },
  { timestamps: true }
);

mediaSchema.index({ variantId: 1, position: 1 });
mediaSchema.index({ productId: 1, position: 1 });

export const Media = models.Media || model("Media", mediaSchema);