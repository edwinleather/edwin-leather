import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// A product only stores common information. All category-specific detail lives in
// `attributes[]` (product attributes) and `variantDimensions[]` (variant
// dimensions). Sellable items are standalone ProductVariant documents; images
// live in the Media collection. Legacy hardcoded spec columns were removed.
const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    subtitle: String,
    description: { type: String, required: true },
    seoTitle: String,
    seoDescription: String,
    category: { type: String, required: true, index: true },
    // Canonical category reference (category name stays as the display/search key).
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    collection: String,
    brand: String,
    hsn: String,
    gst: Number,
    deliveryBy: String,
    // Display pricing. Variant prices are the canonical sellable prices.
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: Number,
    salePrice: Number,
    // Product attribute values, each referencing the shared Attribute pool.
    attributes: [
      {
        attributeId: { type: Schema.Types.ObjectId, ref: "Attribute" },
        key: String,
        label: String,
        value: mongoose.Schema.Types.Mixed
      }
    ],
    // The dimensions that vary across this product\'s variants and the option
    // values chosen for each (e.g. Color: [Black, White], Size: [8, 9]).
    // The concrete ProductVariant docs are generated from these combinations.
    variantDimensions: [
      {
        attributeId: { type: Schema.Types.ObjectId, ref: "Attribute" },
        values: [String]
      }
    ],
    featured: { type: Boolean, default: false },
    codAvailable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "active", "inactive"], default: "active" }
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const Product = models.Product || model("Product", productSchema);