import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    description: String,
    seoTitle: String,
    seoDescription: String,
    imageUrl: String,
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    fields: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, enum: ["text", "multi", "textarea", "select", "yesno", "number"], default: "text" },
        options: [String],
        required: { type: Boolean, default: false },
        section: { type: String, enum: ["specifications", "listing"], default: "specifications" }
      }
    ],
    // Reusable attributes attached from the shared Attribute pool. Per-category
    // behaviour lives here; the definition itself lives in the Attribute collection.
    attributes: [
      {
        attributeId: { type: Schema.Types.ObjectId, ref: "Attribute" },
        required: { type: Boolean, default: false },
        customerVisible: { type: Boolean, default: true },
        sellerVisible: { type: Boolean, default: true },
        filterable: { type: Boolean, default: false },
        searchable: { type: Boolean, default: true },
        variant: { type: Boolean, default: false },
        displaySection: { type: String, enum: ["specifications", "listing"], default: "specifications" },
        displayOrder: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

export const Category = models.Category || model("Category", categorySchema);
