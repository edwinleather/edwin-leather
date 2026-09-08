import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const cartItemSchema = new Schema(
  {
    lineId: { type: String, required: true },
    productId: { type: String, required: true },
    variantId: { type: String, required: true },
    slug: String,
    name: String,
    image: String,
    price: Number,
    priceSnapshot: Number,
    variantLabel: String,
    variantSnapshot: String,
    quantity: { type: Number, required: true, min: 1, max: 50 }
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: [cartItemSchema]
  },
  { timestamps: true }
);

export const Cart = models.Cart || model("Cart", cartSchema);