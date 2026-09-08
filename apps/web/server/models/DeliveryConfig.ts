import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const stateFeeSchema = new Schema(
  {
    state: { type: String, required: true },
    fee: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const deliveryConfigSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true, index: true },
    defaultFee: { type: Number, default: 120, min: 0 },
    stateFees: { type: [stateFeeSchema], default: [] },
    freeDeliveryThreshold: { type: Number, default: 2499, min: 0 }
  },
  { timestamps: true }
);

export const DeliveryConfig = models.DeliveryConfig || model("DeliveryConfig", deliveryConfigSchema);