import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const variantSchema = new Schema(
  {
    label: { type: String, required: true },
    sku: { type: String, required: true, unique: true, index: true },
    color: { type: String, required: true },
    size: String,
    priceOverride: Number,
    salePrice: Number,
    inventoryTotal: { type: Number, default: 0, min: 0 },
    inventoryStoreAllocated: { type: Number, default: 0, min: 0 },
    inventoryAvailable: { type: Number, default: 0, min: 0 },
    inventoryReserved: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 3, min: 0 },
    allowBackorder: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
  },
  { _id: true }
);

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    subtitle: String,
    description: { type: String, required: true },
    seoTitle: String,
    seoDescription: String,
    category: { type: String, required: true, index: true },
    collection: String,
    brand: String,
    hsn: String,
    gst: Number,
    deliveryBy: String,
    articleNumber: [String],
    styleCode: String,
    brandColor: String,
    brandSize: String,
    ukIndiaSize: String,
    euroSize: String,
    womenSandalType: String,
    color: [String],
    typeForFlats: String,
    typeForHeels: String,
    occasion: [String],
    outerMaterial: [String],
    heelHeight: String,
    idealFor: String,
    ornamentationType: String,
    insoleMaterial: [String],
    packOf: String,
    closure: [String],
    heelPattern: String,
    soleMaterial: [String],
    innerMaterial: [String],
    upperPattern: String,
    careInstructions: [String],
    removableInsole: String,
    searchKeywords: [String],
    keyFeatures: [String],
    videoUrl: String,
    eanUpc: [String],
    cushioningLevel: String,
    otherDetails: String,
    includedInBox: [String],
    returnReplacement: String,
    cashDelivery: String,
    customerSupport: String,
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: Number,
    salePrice: Number,
    images: [{ url: String, publicId: String, alt: String }],
    // Attribute values reference the shared Attribute pool. `key`/`label` are
    // legacy fields kept so older products remain readable and savable until
    // they are migrated to attributeId references.
    attributes: [
      {
        attributeId: { type: Schema.Types.ObjectId, ref: "Attribute" },
        key: String,
        label: String,
        value: mongoose.Schema.Types.Mixed
      }
    ],
    // The dimensions that vary across this product's variants and the option
    // values chosen for each (e.g. Color: [Black, White], Size: [8, 9]). The
    // concrete ProductVariant docs are generated from these combinations.
    variantDimensions: [
      {
        attributeId: { type: Schema.Types.ObjectId, ref: "Attribute" },
        values: [String]
      }
    ],
    variants: [variantSchema],
    featured: { type: Boolean, default: false },
    codAvailable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "active", "inactive"], default: "active" }
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const Product = models.Product || model("Product", productSchema);
