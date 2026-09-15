import type { NextFunction, Request, Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "./auth";
import { ApiError } from "./error";
import { ensureBackoffice } from "../config/backofficeDb";
import { getAllowedFeatures, getAdminUser } from "../services/backoffice";
import type { AdminRole } from "../models/backoffice";

export type BackofficeRequest = AuthenticatedRequest & {
  admin?: { id: string; role: AdminRole; permissions?: string[] };
  adminFeatures?: string[];
};

async function resolveAdmin(req: Request, _res: Response, next: NextFunction) {
  const ar = req as BackofficeRequest;
  requireAuth(ar, _res, async (error?: unknown) => {
    if (error) return next(error);
    try {
      if (!ar.auth?.sub) return next(new ApiError(401, "Authentication required"));
      if (!(await ensureBackoffice())) return next(new ApiError(503, "Database unavailable"));
      const admin = await getAdminUser(ar.auth.sub);
      if (!admin || admin.active === false) {
        // Auto-provision a backoffice AdminUser for superadmins who were
        // migrated before the backoffice DB existed. Only the main app's
        // superadmin role is granted this automatic provisioning so that
        // every newly-migrated superadmin can reach the backoffice without a
        // separate manual seed step.
        if (ar.auth.role === "superadmin") {
          const conn = (await import("../config/backofficeDb")).backofficeDb();
          const db = await import("../config/db");
          const MainUser = db.mongoose.model("User");
          const mainUser = await MainUser.findById(ar.auth.sub).select("email firstName lastName name role").lean();
          if (mainUser?.role === "superadmin") {
            admin = await conn.model("BackofficeUser").create({
              email: mainUser.email,
              role: "superadmin",
              name: mainUser.name ?? `${mainUser.firstName ?? ""} ${mainUser.lastName ?? ""}`.trim(),
              firstName: mainUser.firstName,
              lastName: mainUser.lastName,
              appUserId: mainUser._id,
              active: true,
            });
          }
        }
        if (!admin || admin.active === false) return next(new ApiError(403, "Insufficient permissions"));
      }
      ar.admin = {
        id: String(admin._id),
        role: admin.role,
        permissions: admin.permissions ?? []
      };
      ar.adminFeatures = await getAllowedFeatures(ar.admin);
      return next();
    } catch (err) {
      return next(err);
    }
  });
}

export function requireBackofficeAdmin(req: Request, res: Response, next: NextFunction) {
  resolveAdmin(req, res, next);
}

export function requireBackofficeRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    resolveAdmin(req, res, (error?: unknown) => {
      if (error) return next(error);
      const ar = req as BackofficeRequest;
      if (!ar.admin || !roles.includes(ar.admin.role)) return next(new ApiError(403, "Insufficient permissions"));
      return next();
    });
  };
}

export function requireBackofficeFeature(feature: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const ar = req as BackofficeRequest;
    if (!ar.adminFeatures?.includes(feature)) return next(new ApiError(403, "Feature not enabled for your role"));
    return next();
  };
}