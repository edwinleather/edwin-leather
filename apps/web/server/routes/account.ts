import { Router } from "express";
import { z } from "zod";
import { ensureDatabase } from "../config/db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { hashPassword, verifyPassword } from "../config/passwords.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { orderResponse } from "../services/orders.js";

export const accountRouter = Router();

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  line1: z.string().min(4),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(5),
  country: z.string().default("IN"),
  phone: z.string().min(8),
  isDefault: z.boolean().default(false)
});

accountRouter.use(requireAuth);

accountRouter.get("/me", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Database unavailable"));
    const user = await User.findById(req.auth!.sub).select("-passwordHash -passwordResetTokenHash").lean();
    if (!user) return next(new ApiError(404, "Account not found"));
    return res.json({ ok: true, user });
  } catch (error) {
    return next(error);
  }
});

accountRouter.get("/addresses", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Database unavailable"));
    const user = await User.findById(req.auth!.sub).select("addresses").lean();
    return res.json({ ok: true, addresses: user?.addresses ?? [] });
  } catch (error) {
    return next(error);
  }
});

accountRouter.post("/addresses", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Database unavailable"));
    const input = addressSchema.parse(req.body);
    const user = await User.findById(req.auth!.sub);
    if (!user) return next(new ApiError(404, "Account not found"));
    if (input.isDefault) user.addresses.forEach((address: { isDefault: boolean }) => (address.isDefault = false));
    user.addresses.push({ ...input } as never);
    await user.save();
    return res.status(201).json({ ok: true, addresses: user.addresses });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid address input", error.flatten()));
    return next(error);
  }
});

accountRouter.patch("/addresses/:addressId", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Database unavailable"));
    const input = addressSchema.partial().parse(req.body);
    const user = await User.findById(req.auth!.sub);
    if (!user) return next(new ApiError(404, "Account not found"));
    const address = user.addresses.id(req.params.addressId);
    if (!address) return next(new ApiError(404, "Address not found"));
    if (input.isDefault) user.addresses.forEach((item: { isDefault: boolean }) => (item.isDefault = false));
    Object.assign(address, input);
    await user.save();
    return res.json({ ok: true, addresses: user.addresses });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid address input", error.flatten()));
    return next(error);
  }
});

accountRouter.delete("/addresses/:addressId", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Database unavailable"));
    const user = await User.findById(req.auth!.sub);
    if (!user) return next(new ApiError(404, "Account not found"));
    user.addresses.id(req.params.addressId)?.deleteOne();
    await user.save();
    return res.json({ ok: true, addresses: user.addresses });
  } catch (error) {
    return next(error);
  }
});

accountRouter.get("/orders", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Database unavailable"));
    // Hide stale unpaid orders (payment pending for more than 2 days) from the
    // customer's view. They remain visible in the backoffice. COD/paid orders
    // with an "order_received" status are unaffected.
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const orders = await Order.find({
      customerId: req.auth!.sub,
      $or: [
        { "payment.status": { $ne: "pending" } },
        { createdAt: { $gte: cutoff } }
      ]
    }).sort({ createdAt: -1 });
    return res.json({ ok: true, orders: orders.map(orderResponse) });
  } catch (error) {
    return next(error);
  }
});

accountRouter.get("/orders/:orderId", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Database unavailable"));
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const order = await Order.findOne({
      _id: req.params.orderId,
      customerId: req.auth!.sub,
      $or: [
        { "payment.status": { $ne: "pending" } },
        { createdAt: { $gte: cutoff } }
      ]
    });
    if (!order) return next(new ApiError(404, "Order not found"));
    return res.json({ ok: true, order: orderResponse(order) });
  } catch (error) {
    return next(error);
  }
});

accountRouter.patch("/me", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Database unavailable"));
    const input = z.object({ firstName: z.string().min(2).max(60).optional(), lastName: z.string().max(60).optional(), phone: z.string().min(8).max(16).optional() }).parse(req.body);
    const user = await User.findByIdAndUpdate(req.auth!.sub, { $set: input }, { returnDocument: "after", runValidators: true }).select("-passwordHash -passwordResetTokenHash");
    if (!user) return next(new ApiError(404, "Account not found"));
    return res.json({ ok: true, user });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid profile input", error.flatten()));
    return next(error);
  }
});

accountRouter.post("/change-password", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Database unavailable"));
    const input = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(8).max(128) }).parse(req.body);
    const user = await User.findById(req.auth!.sub);
    if (!user) return next(new ApiError(404, "Account not found"));
    if (!user.passwordHash) return next(new ApiError(400, "This account has no password set. Set one by requesting a password reset."));
    if (!verifyPassword(input.currentPassword, user.passwordHash)) return next(new ApiError(400, "Your current password is incorrect."));
    user.passwordHash = hashPassword(input.newPassword);
    await user.save();
    return res.json({ ok: true, message: "Password updated." });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid password input", error.flatten()));
    return next(error);
  }
});