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
    articleNumber: String,
    barcode: String,
    price: { type: Number, required: true, min: 0 },
    salePrice: Number,
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ url: String, publicId: String, alt: String }],
    // Legacy fallback images; new uploads go through the Media collection. Kept
    // so pre-migration data and the admin UI can fall back to embedded images.
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

// Note: a unique (productId, sku) index is intentionally NOT added yet; legacy
// data may contain duplicate SKUs and an auto-created unique index would fail
// to build. Uniqueness is enforced at the application layer and the index will
// be added by the migration phase.
productVariantSchema.index({ productId: 1, "attributes.attributeId": 1 });

export const ProductVariant = models.ProductVariant || model("ProductVariant", productVariantSchema);