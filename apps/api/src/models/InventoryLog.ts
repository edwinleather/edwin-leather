import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// Immutable log of every stock movement. Kept append-only so inventory changes
// are always auditable. `variantId`/`productId` are ObjectIds that may reference
// either the ProductVariant collection or a legacy embedded variant.
const inventoryLogSchema = new Schema(
  {
    variantId: { type: Schema.Types.ObjectId, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, index: true },
    type: {
      type: String,
      enum: ["purchase", "sale", "return", "adjustment", "cancellation"],
      required: true,
      index: true
    },
    quantity: { type: Number, required: true, min: 0 },
    referenceId: String,
    note: String,
    actorId: Schema.Types.ObjectId
  },
  { timestamps: true }
);

export const InventoryLog = models.InventoryLog || model("InventoryLog", inventoryLogSchema);