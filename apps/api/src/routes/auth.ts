import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import { env, isConfigured } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/error.js";

export const authRouter = Router();

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });

function issueSession(res: import("express").Response, payload: { sub: string; role: string; email: string }) {
  if (!isConfigured(env.jwtSecret)) throw new ApiError(503, "JWT_SECRET is not configured");
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] });
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for registration. Configure MONGODB_URI first."));
    const input = credentialsSchema.parse(req.body);
    const existing = await User.findOne({ email: input.email });
    if (existing) return next(new ApiError(409, "An account with that email already exists"));
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({ email: input.email, passwordHash, role: "customer" });
    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.status(201).json({ ok: true, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid registration input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for login. Configure MONGODB_URI first."));
    const input = credentialsSchema.parse(req.body);
    const user = await User.findOne({ email: input.email });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return next(new ApiError(401, "Invalid email or password"));
    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.json({ ok: true, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid login input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(env.cookieName, { path: "/" });
  res.json({ ok: true });
});
