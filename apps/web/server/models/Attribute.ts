import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

// A reusable attribute definition that lives in a shared pool and can be
// attached to many categories. Categories reference attributes rather than
// duplicating their definitions, so a single "Color" attribute is reused by
// Footwear, Clothing, Bags, etc. Per-category behaviour (required, visibility,
// filterable, display order) is stored on the Category's reference, not here.
const attributeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    type: {
      type: String,
      enum: ["text", "multi", "textarea", "select", "yesno", "number"],
      default: "text"
    },
    options: [String],
    description: String
  },
  { timestamps: true }
);

export const Attribute = models.Attribute || model("Attribute", attributeSchema);