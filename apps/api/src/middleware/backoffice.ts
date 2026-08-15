import type { NextFunction, Request, Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "./auth.js";
import { ApiError } from "./error.js";
import { getAllowedFeatures, getAdminUser } from "../services/backoffice.js";
import type { AdminRole } from "../models/backoffice.js";

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
      const admin = await getAdminUser(ar.auth.sub);
      if (!admin || !admin.active) return next(new ApiError(403, "Insufficient permissions"));
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