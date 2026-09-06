import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const lineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true },
    nameSnapshot: { type: String, required: true },
    variantSnapshot: String,
    productName: String,
    variantName: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    originalUnitPrice: Number,
    lineDiscount: { type: Number, default: 0 },
    promotion: { name: String, amount: Number },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    email: { type: String, required: true },
    lines: [lineSchema],
    subtotal: { type: Number, required: true },
    shippingAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    promotionDiscount: { type: Number, default: 0 },
    coupon: {
      couponId: { type: Schema.Types.ObjectId, ref: "Coupon" },
      code: String,
      discountType: { type: String, enum: ["percentage", "fixed", "free_shipping"] }
    },
    total: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    orderStatus: {
      type: String,
      enum: ["pending_payment", "order_received", "confirmed", "processing", "packing", "shipping", "packed", "shipped", "delivered", "cancelled", "return_requested", "returned", "refunded"],
      default: "pending_payment",
      index: true
    },
    payment: {
      method: { type: String, enum: ["razorpay", "cod"], required: true },
      status: { type: String, enum: ["pending", "paid", "failed", "refunded", "partially_refunded", "cod_pending", "cod_collected"], default: "pending" },
      gatewayOrderId: String,
      gatewayPaymentId: String,
      refundId: String
    },
    codDeposit: {
      percent: { type: Number, default: 0 },
      depositAmount: { type: Number, default: 0 },
      balanceAmount: { type: Number, default: 0 }
    },
    shipping: {
      status: { type: String, enum: ["not_created", "ready_to_ship", "picked_up", "in_transit", "out_for_delivery", "delivered", "rto"], default: "not_created" },
      courier: String,
      awb: String,
      trackingUrl: String,
      deliveryPartnerId: { type: Schema.Types.ObjectId, ref: "DeliveryPartner" },
      deliveryPartnerName: String,
      trackingId: String
    },
    shippingAddress: {
      fullName: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: "IN" },
      phone: String
    },
    timeline: [{ type: { type: String }, message: String, at: { type: Date, default: Date.now }, actorId: Schema.Types.ObjectId }],
    emailsSent: { type: Map, of: Date, default: {} }
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

export const Order = models.Order || model("Order", orderSchema);
