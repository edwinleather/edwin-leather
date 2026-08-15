import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const errorLogSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    environment: { type: String, enum: ["development", "production", "test"], index: true },
    method: String,
    path: String,
    status: Number,
    code: String,
    message: String,
    stack: String,
    source: { type: String, default: "api" }
  },
  { timestamps: true }
);

export const ErrorLog = models.ErrorLog || model("ErrorLog", errorLogSchema);