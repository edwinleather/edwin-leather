import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const returnItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: Schema.Types.ObjectId,
    sku: String,
    nameSnapshot: String,
    quantity: { type: Number, required: true, min: 1 },
    issueType: String
  },
  { _id: true }
);

const returnSchema = new Schema(
  {
    returnNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    email: { type: String, required: true },
    items: [returnItemSchema],
    reason: { type: String, required: true },
    reasonCategory: String,
    condition: String,
    notes: String,
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "pickup_scheduled", "returned", "refund_pending", "refunded"],
      default: "requested",
      index: true
    },
    refundAmount: Number,
    refundId: String,
    adminNote: String,
    timeline: [{ type: { type: String }, message: String, at: { type: Date, default: Date.now }, actorId: Schema.Types.ObjectId }]
  },
  { timestamps: true }
);

export const Return = models.Return || model("Return", returnSchema);
