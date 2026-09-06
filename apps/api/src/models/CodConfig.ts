import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const codConfigSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true, index: true },
    enabled: { type: Boolean, default: true },
    depositPercent: { type: Number, default: 10, min: 0, max: 100 }
  },
  { timestamps: true }
);

export const CodConfig = models.CodConfig || model("CodConfig", codConfigSchema);
