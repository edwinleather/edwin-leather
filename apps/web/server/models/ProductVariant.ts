import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

// A concrete, purchasable variant of a product, defined by a combination of
// attribute values (e.g. Color: Black + Size: UK 8). Attributes referenced here
// are those the product's category marks as `variant`. SKU/price/stock belong to
// the variant, not the parent product.
//
// Images are NOT stored on this document; the Media collection is the sole
// source of truth for product and variant images.
const productVariantSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    sku: { type: String, required: true },
    articleNumber: String,
    barcode: String,
    price: { type: Number, required: true, min: 0 },
    salePrice: Number,
    stock: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "active", "inactive"], default: "active" },
    allowBackorder: { type: Boolean, default: false },
    attributes: [
      {
        attributeId: { type: Schema.Types.ObjectId, ref: "Attribute", required: true },
        value: mongoose.Schema.Types.Mixed
      }
    ]
  },
  { timestamps: true }
);

// Enforce uniqueness of SKU within a product (added by migration script for
// legacy data safety; the model definition keeps it so new data is always clean).
productVariantSchema.index({ productId: 1, sku: 1 }, { unique: true });
productVariantSchema.index({ productId: 1, "attributes.attributeId": 1 });

export const ProductVariant = models.ProductVariant || model("ProductVariant", productVariantSchema);