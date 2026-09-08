import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

// A concrete, purchasable variant of a product, defined by a combination of
// attribute values (e.g. Color: Black + Size: UK 8). Attributes referenced here
// are those the product's category marks as `variant`. SKU/price/stock belong to
// the variant, not the parent product.
const productVariantSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: Number,
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ url: String, publicId: String, alt: String }],
    active: { type: Boolean, default: true },
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

productVariantSchema.index({ productId: 1, "attributes.attributeId": 1 });

export const ProductVariant = models.ProductVariant || model("ProductVariant", productVariantSchema);