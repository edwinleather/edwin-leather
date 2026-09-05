import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const analyticEventSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["page_view", "product_view", "add_to_cart", "remove_from_cart", "checkout_start", "checkout_complete", "order_placed"],
      index: true
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    sessionId: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, index: true },
    meta: { type: Schema.Types.Mixed },
    amount: { type: Number },
    quantity: { type: Number }
  },
  { timestamps: true }
);

analyticEventSchema.index({ type: 1, createdAt: -1 });
analyticEventSchema.index({ productId: 1, createdAt: -1 });
analyticEventSchema.index({ createdAt: -1 }, { expireAfterSeconds: 90 * 86400 }); // 90-day TTL

export type AnalyticEventDocument = InferSchemaType<typeof analyticEventSchema> & { _id: mongoose.Types.ObjectId };

const AnalyticEvent: Model<AnalyticEventDocument> =
  mongoose.models.AnalyticEvent || mongoose.model("AnalyticEvent", analyticEventSchema, "analyticEvents");

export default AnalyticEvent;
