import { Schema, model, models } from "mongoose";

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "fixed", "free_shipping"], required: true },
    value: { type: Number, default: 0, min: 0 },
    minimumOrder: { type: Number, default: 0 },
    maximumDiscount: Number,
    usageLimit: Number,
    usagePerCustomer: Number,
    startsAt: Date,
    expiresAt: Date,
    applicableProductIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [String],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Coupon = models.Coupon || model("Coupon", couponSchema);
