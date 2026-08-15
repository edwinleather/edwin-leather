import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const deliveryPartnerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // Template URL with {tracking_id} placeholder, e.g. https://www.dtdc.in/tracking.asp?trackid={tracking_id}
    trackingUrl: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const DeliveryPartner = models.DeliveryPartner || model("DeliveryPartner", deliveryPartnerSchema);