import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const pageContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    content: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

export const PageContent = models.PageContent || model("PageContent", pageContentSchema);