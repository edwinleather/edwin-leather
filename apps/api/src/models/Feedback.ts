import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const feedbackSchema = new Schema(
  {
    name: String,
    email: String,
    topic: String,
    rating: { type: Number, min: 0, max: 5, default: 0 },
    message: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new", index: true }
  },
  { timestamps: true }
);

export const Feedback = models.Feedback || model("Feedback", feedbackSchema);