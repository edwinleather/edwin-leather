import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const ASSET_CATEGORIES = ["asset", "page", "product", "review"] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

const assetSchema = new Schema(
  {
    category: { type: String, enum: ASSET_CATEGORIES, default: "asset", index: true },
    url: { type: String, required: true },
    publicId: { type: String, index: true },
    alt: String,
    // For product / page / review assets, keep a pointer back to the owner.
    referenceType: { type: String, enum: ["product", "page", "review", null], default: null },
    referenceId: { type: String, index: true },
    referenceLabel: String,
    filename: String,
    mimeType: String,
    size: Number,
    uploaderId: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

export const Asset = models.Asset || model("Asset", assetSchema);