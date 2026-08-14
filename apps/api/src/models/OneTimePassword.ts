import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["signup", "password_reset"], default: "signup" },
    attempts: { type: Number, default: 0 },
    usedAt: Date,
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export const OneTimePassword = models.OneTimePassword || model("OneTimePassword", otpSchema);
