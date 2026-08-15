import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const reviewImageSchema = new Schema({ url: String, publicId: String, alt: String }, { _id: false });

const reviewSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    productName: String,
    customerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    authorName: { type: String, required: true },
    location: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    body: { type: String, required: true },
    images: { type: [reviewImageSchema], default: [] },
    verifiedPurchase: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true }
  },
  { timestamps: true }
);

export const Review = models.Review || model("Review", reviewSchema);