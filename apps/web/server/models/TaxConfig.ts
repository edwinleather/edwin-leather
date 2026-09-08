import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const taxConfigSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true, index: true },
    gstRate: { type: Number, default: 0, min: 0, max: 100 },
    gstFreeAbove: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export const TaxConfig = models.TaxConfig || model("TaxConfig", taxConfigSchema);