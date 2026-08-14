import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/error.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

export const accountRouter = Router();

const addressSchema = z.object({
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
  } catch (error) {
    return next(error);
  }
});

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
  } catch (error) {
    return next(error);
  }
});

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
    await user.save();
    return res.status(201).json({ ok: true, addresses: user.addresses });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid address input", error.flatten()));
    return next(error);
  }
});

accountRouter.delete("/addresses/:id", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await User.findById(req.auth?.sub);
    if (!user) return next(new ApiError(404, "Account not found"));
    const id = req.params.id;
    user.addresses = (user.addresses ?? []).filter((a: any) => String(a._id) !== id);
    await user.save();
    return res.json({ ok: true, addresses: user.addresses });
  } catch (error) {
    return next(error);
  }
});