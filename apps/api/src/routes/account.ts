import { Router } from "express";
import { z } from "zod";
<<<<<<< Updated upstream
import { User } from "../models/User.js";
import { ApiError } from "../middleware/error.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
=======
import { databaseReady } from "../config/db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { orderResponse } from "../services/orders.js";
>>>>>>> Stashed changes

export const accountRouter = Router();

const addressSchema = z.object({
<<<<<<< Updated upstream
  label: z.string().max(40).optional(),
  fullName: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().min(1).max(16),
  country: z.string().trim().min(2).max(2).default("IN"),
  phone: z.string().trim().min(1).max(20),
  isDefault: z.boolean().optional()
});

function publicUser(user: any) {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    addresses: user.addresses ?? []
  };
}

accountRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await User.findById(req.auth?.sub).select("-passwordHash -passwordResetTokenHash -passwordResetExpiresAt");
    if (!user) return next(new ApiError(404, "Account not found"));
    return res.json({ ok: true, user: publicUser(user) });
=======
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
    if (!databaseReady()) return next(new ApiError(503, "Database unavailable"));
    const user = await User.findById(req.auth!.sub).select("-passwordHash -passwordResetTokenHash").lean();
    if (!user) return next(new ApiError(404, "Account not found"));
    return res.json({ ok: true, user });
>>>>>>> Stashed changes
  } catch (error) {
    return next(error);
  }
});

<<<<<<< Updated upstream
accountRouter.patch("/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = z
      .object({
        firstName: z.string().trim().max(60).optional(),
        lastName: z.string().trim().max(60).optional(),
        phone: z.string().trim().max(20).optional()
      })
      .parse(req.body);
    const user = await User.findById(req.auth?.sub).select("-passwordHash -passwordResetTokenHash -passwordResetExpiresAt");
    if (!user) return next(new ApiError(404, "Account not found"));
    if (input.firstName !== undefined) user.firstName = input.firstName;
    if (input.lastName !== undefined) user.lastName = input.lastName;
    if (input.phone !== undefined) user.phone = input.phone;
    await user.save();
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid profile input", error.flatten()));
    return next(error);
  }
});

accountRouter.get("/addresses", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await User.findById(req.auth?.sub).select("addresses");
    if (!user) return next(new ApiError(404, "Account not found"));
    return res.json({ ok: true, addresses: user.addresses ?? [] });
=======
accountRouter.get("/addresses", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "Database unavailable"));
    const user = await User.findById(req.auth!.sub).select("addresses").lean();
    return res.json({ ok: true, addresses: user?.addresses ?? [] });
>>>>>>> Stashed changes
  } catch (error) {
    return next(error);
  }
});

<<<<<<< Updated upstream
accountRouter.post("/addresses", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = addressSchema.parse(req.body);
    const user = await User.findById(req.auth?.sub);
    if (!user) return next(new ApiError(404, "Account not found"));

    const address = { ...input, _id: undefined };
    user.addresses = user.addresses ?? [];
    user.addresses.push(address as any);
    if (input.isDefault) {
      user.addresses.forEach((a: any) => (a.isDefault = a === user.addresses![user.addresses!.length - 1]));
    }
    if (user.addresses.length === 1) {
      user.addresses[0].isDefault = true;
    }
=======
accountRouter.post("/addresses", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "Database unavailable"));
    const input = addressSchema.parse(req.body);
    const user = await User.findById(req.auth!.sub);
    if (!user) return next(new ApiError(404, "Account not found"));
    if (input.isDefault) user.addresses.forEach((address: { isDefault: boolean }) => (address.isDefault = false));
    user.addresses.push({ ...input } as never);
>>>>>>> Stashed changes
    await user.save();
    return res.status(201).json({ ok: true, addresses: user.addresses });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid address input", error.flatten()));
    return next(error);
  }
});

<<<<<<< Updated upstream
accountRouter.delete("/addresses/:id", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await User.findById(req.auth?.sub);
    if (!user) return next(new ApiError(404, "Account not found"));
    const id = req.params.id;
    user.addresses = (user.addresses ?? []).filter((a: any) => String(a._id) !== id);
=======
accountRouter.patch("/addresses/:addressId", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "Database unavailable"));
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
    if (!databaseReady()) return next(new ApiError(503, "Database unavailable"));
    const user = await User.findById(req.auth!.sub);
    if (!user) return next(new ApiError(404, "Account not found"));
    user.addresses.id(req.params.addressId)?.deleteOne();
>>>>>>> Stashed changes
    await user.save();
    return res.json({ ok: true, addresses: user.addresses });
  } catch (error) {
    return next(error);
  }
<<<<<<< Updated upstream
=======
});

accountRouter.get("/orders", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "Database unavailable"));
    const orders = await Order.find({ customerId: req.auth!.sub }).sort({ createdAt: -1 });
    return res.json({ ok: true, orders: orders.map(orderResponse) });
  } catch (error) {
    return next(error);
  }
>>>>>>> Stashed changes
});