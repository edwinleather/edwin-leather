import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const emailLogSchema = new Schema(
  {
    to: { type: String, required: true, index: true },
    template: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed", "skipped_quota", "skipped_rate", "skipped_circuit", "skipped_dedup"], required: true },
    errorMessage: String
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });

export const EmailLog = models.EmailLog || model("EmailLog", emailLogSchema);
