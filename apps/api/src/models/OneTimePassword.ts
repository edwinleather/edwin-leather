import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const oneTimePasswordSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["signup", "password_reset", "login"], default: "signup" },
    attempts: { type: Number, default: 0 },
    consumedAt: Date,
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true }
);

oneTimePasswordSchema.index({ email: 1, purpose: 1, consumedAt: 1 });

export const OneTimePassword = models.OneTimePassword || model("OneTimePassword", oneTimePasswordSchema);
