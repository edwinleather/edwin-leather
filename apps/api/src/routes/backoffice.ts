import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../middleware/error.js";
import { requireBackofficeAdmin, requireBackofficeRole, type BackofficeRequest } from "../middleware/backoffice.js";
import { AdminUser, RolePermission, ADMIN_ROLES } from "../models/backoffice.js";
import { adminPublic, allFeatures, DEFAULT_FEATURES } from "../services/backoffice.js";
import { User } from "../models/User.js";

export const backofficeRouter = Router();

const requireSuperadmin = requireBackofficeRole("superadmin");

// Current session's backoffice profile + granted features
backofficeRouter.get("/me", requireBackofficeAdmin, async (req, res, next) => {
  try {
    const ar = req as BackofficeRequest;
    const admin = await AdminUser.findById(ar.admin!.id).lean();
    if (!admin) return next(new ApiError(403, "Insufficient permissions"));
    return res.json({ ok: true, data: { ...adminPublic(admin), features: ar.adminFeatures ?? [] } });
  } catch (error) {
    return next(error);
  }
});

// Superadmin: manage who can access the backoffice
backofficeRouter.get("/users", requireSuperadmin, async (_req, res, next) => {
  try {
    const users = await AdminUser.find().sort({ role: 1, createdAt: -1 }).lean();
    return res.json({ ok: true, data: users.map(adminPublic) });
  } catch (error) {
    return next(error);
  }
});

backofficeRouter.post("/users", requireSuperadmin, async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), role: z.enum(ADMIN_ROLES), name: z.string().optional() }).parse(req.body);
    const email = input.email.toLowerCase().trim();
    const appUser = await User.findOne({ email }).lean();
    if (!appUser) return next(new ApiError(400, "No store account exists for that email. The person must sign up first."));
    const existing = await AdminUser.findOne({ email });
    if (existing) return next(new ApiError(409, "This person is already a backoffice user"));
    const admin = await AdminUser.create({
      email,
      role: input.role,
      name: input.name ?? appUser.name ?? `${appUser.firstName ?? ""} ${appUser.lastName ?? ""}`.trim(),
      firstName: appUser.firstName,
      lastName: appUser.lastName,
      provider: appUser.provider,
      googleId: appUser.googleId,
      appUserId: appUser._id,
      addedBy: (req as BackofficeRequest).admin!.id
    });
    return res.status(201).json({ ok: true, data: adminPublic(admin.toObject()) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

backofficeRouter.patch("/users/:userId", requireSuperadmin, async (req, res, next) => {
  try {
    const input = z.object({ role: z.enum(ADMIN_ROLES).optional(), active: z.boolean().optional(), permissions: z.array(z.string()).optional() }).parse(req.body);
    const admin = await AdminUser.findById(req.params.userId);
    if (!admin) return next(new ApiError(404, "Backoffice user not found"));
    const me = (req as BackofficeRequest).admin!.id;
    if (String(admin._id) === me && (input.active === false || (input.role && input.role !== "superadmin"))) {
      return next(new ApiError(400, "You cannot deactivate or demote yourself"));
    }
    if (input.role) admin.role = input.role;
    if (input.active !== undefined) admin.active = input.active;
    if (input.permissions !== undefined) admin.permissions = input.permissions;
    await admin.save();
    return res.json({ ok: true, data: adminPublic(admin.toObject()) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

backofficeRouter.delete("/users/:userId", requireSuperadmin, async (req, res, next) => {
  try {
    const me = (req as BackofficeRequest).admin!.id;
    if (req.params.userId === me) return next(new ApiError(400, "You cannot remove yourself"));
    const admin = await AdminUser.findByIdAndDelete(req.params.userId);
    if (!admin) return next(new ApiError(404, "Backoffice user not found"));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

// Superadmin: decide which features each role can access
backofficeRouter.get("/roles", requireSuperadmin, async (_req, res, next) => {
  try {
    const rows = await RolePermission.find().lean();
    const map: Record<string, string[]> = {};
    for (const role of ADMIN_ROLES) map[role] = DEFAULT_FEATURES[role] ?? [];
    for (const row of rows) map[row.role] = row.features;
    return res.json({ ok: true, data: { features: allFeatures(), roles: map } });
  } catch (error) {
    return next(error);
  }
});

backofficeRouter.put("/roles/:role", requireSuperadmin, async (req, res, next) => {
  try {
    const role = z.enum(ADMIN_ROLES).parse(req.params.role);
    const input = z.object({ features: z.array(z.string()) }).parse(req.body);
    const normalized = [...new Set(input.features)];
    await RolePermission.updateOne({ role }, { $set: { features: normalized, updatedBy: (req as BackofficeRequest).admin!.id } }, { upsert: true });
    return res.json({ ok: true, data: { role, features: normalized } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});