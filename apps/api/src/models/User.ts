import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const addressSchema = new Schema(
  {
    label: String,
    fullName: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: "IN" },
    phone: String,
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: String,
    provider: { type: String, enum: ["email", "google"], default: "email", index: true },
    googleId: { type: String, index: true },
    firstName: String,
    lastName: String,
    phone: String,
    role: { type: String, enum: ["customer", "admin", "superadmin"], default: "customer", index: true },
    addresses: [addressSchema],
    emailVerifiedAt: Date,
    passwordResetTokenHash: String,
    passwordResetExpiresAt: Date
  },
  { timestamps: true }
);

export const User = models.User || model("User", userSchema);
