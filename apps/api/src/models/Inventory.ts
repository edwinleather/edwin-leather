import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// Per-SKU inventory for the ProductVariant system. `ProductVariant.stock` remains
// the live transactional counter used at purchase time; this document is the
// richer, admin-facing view that additionally tracks reserved and damaged units
// and a low-stock threshold. `available` mirrors ProductVariant.stock and is kept
// in sync on every movement so the two never drift.
const inventorySchema = new Schema(
  {
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true, unique: true, index: true },
    available: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    damaged: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 3, min: 0 },
    allowBackorder: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Inventory = models.Inventory || model("Inventory", inventorySchema);