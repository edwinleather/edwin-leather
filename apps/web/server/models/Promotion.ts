import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// A time-boxed, automatic discount applied to a single product or a whole
// category (distinct from coupon codes, which shoppers type in at checkout).
// Promotions lower the unit price before coupons are applied.
const promotionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    target: { type: String, enum: ["product", "category"], required: true },
    targetProductId: { type: Schema.Types.ObjectId, ref: "Product" },
    targetCategory: String,
    startsAt: Date,
    expiresAt: Date,
    priority: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

promotionSchema.index({ active: 1, target: 1, targetProductId: 1 });
promotionSchema.index({ active: 1, target: 1, targetCategory: 1 });

export const Promotion = models.Promotion || model("Promotion", promotionSchema);