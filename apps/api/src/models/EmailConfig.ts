import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// Singleton document (key: "config") that controls which extra addresses get a
// CC copy of order emails and which email types are CC'd. Editable from the
// backoffice → Email notifications screen.
const emailConfigSchema = new Schema(
  {
    key: { type: String, default: "config", unique: true, index: true },
    ccEmails: { type: [String], default: ["shuzaurrehman786@gmail.com"] },
    ccTypes: {
      type: [String],
      default: [
        "order_confirmation",
        "payment_received",
        "order_packed",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "return_requested"
      ]
    }
  },
  { timestamps: true }
);

export const EmailConfig = models.EmailConfig || model("EmailConfig", emailConfigSchema);