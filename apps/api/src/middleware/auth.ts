import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./error.js";

type SessionPayload = { sub: string; role: "customer" | "admin" | "superadmin"; email: string };

export type AuthenticatedRequest = Request & { auth?: SessionPayload };

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.cookieName];
  if (!token) return next(new ApiError(401, "Authentication required"));

  try {
    req.auth = jwt.verify(token, env.jwtSecret) as SessionPayload;
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired session"));
  }
}

export function requireRole(...roles: SessionPayload["role"][]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) return next(new ApiError(403, "Insufficient permissions"));
    return next();
  };
}
