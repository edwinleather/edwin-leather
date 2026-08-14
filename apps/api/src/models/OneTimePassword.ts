import mongoose from "mongoose";
<<<<<<< Updated upstream

const { Schema, model, models } = mongoose;

const oneTimePasswordSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["signup", "password_reset", "login"], default: "signup" },
    attempts: { type: Number, default: 0 },
    consumedAt: Date,
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
=======
const { Schema, model, models } = mongoose;

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["signup", "password_reset"], default: "signup" },
    attempts: { type: Number, default: 0 },
    usedAt: Date,
    expiresAt: { type: Date, required: true }
>>>>>>> Stashed changes
  },
  { timestamps: true }
);

<<<<<<< Updated upstream
oneTimePasswordSchema.index({ email: 1, purpose: 1, consumedAt: 1 });

export const OneTimePassword = models.OneTimePassword || model("OneTimePassword", oneTimePasswordSchema);
=======
otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export const OneTimePassword = models.OneTimePassword || model("OneTimePassword", otpSchema);
>>>>>>> Stashed changes
