import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { databaseReady } from "../config/db.js";
import { env, isConfigured } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/error.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { sendOtp, verifyOtp } from "../services/otp.js";

export const authRouter = Router();

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
const profileSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  phone: z.string().trim().max(20).optional()
});
const otpSchema = z.object({ email: z.string().email(), code: z.string().trim().min(1).max(10) });
const googleSchema = z.object({ credential: z.string().min(1) });

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

function publicUser(user: { _id: unknown; email: string; role: string; firstName?: string; lastName?: string; phone?: string }) {
  return { id: String(user._id), email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, phone: user.phone };
}

authRouter.post("/signup", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for signup. Configure MONGODB_URI first."));
    const input = profileSchema.parse(req.body);
    const existing = await User.findOne({ email: input.email });
    if (existing) return next(new ApiError(409, "An account with that email already exists"));
    const masked = await sendOtp(input.email, "signup");
    return res.status(202).json({ ok: true, message: "Verification code sent", masked });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid signup input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required. Configure MONGODB_URI first."));
    const input = otpSchema.parse(req.body);
    await verifyOtp(input.email, input.code, "signup");

    const pending = (req.body as { profile?: Record<string, string> }).profile;
    let user = await User.findOne({ email: input.email });
    if (user) {
      if (user.emailVerifiedAt) return next(new ApiError(409, "An account with that email already exists"));
      user.emailVerifiedAt = new Date();
      if (pending?.password) {
        user.passwordHash = await bcrypt.hash(pending.password, 12);
        if (pending.firstName) user.firstName = pending.firstName;
        if (pending.lastName) user.lastName = pending.lastName;
        if (pending.phone) user.phone = pending.phone;
      }
      await user.save();
    } else {
      const password = pending?.password ?? crypto.randomUUID();
      user = await User.create({
        email: input.email,
        passwordHash: await bcrypt.hash(password, 12),
        provider: "email",
        firstName: pending?.firstName,
        lastName: pending?.lastName,
        phone: pending?.phone,
        emailVerifiedAt: new Date(),
        role: "customer"
      });
    }

    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.status(201).json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid verification input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/resend-otp", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required. Configure MONGODB_URI first."));
    const input = z.object({ email: z.string().email() }).parse(req.body);
    const masked = await sendOtp(input.email, "signup");
    return res.json({ ok: true, message: "A new code was sent", masked });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid email", error.flatten()));
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for login. Configure MONGODB_URI first."));
    const input = credentialsSchema.parse(req.body);
    const user = await User.findOne({ email: input.email });
    if (!user?.passwordHash) return next(new ApiError(401, "Invalid email or password"));
    if (!(await bcrypt.compare(input.password, user.passwordHash))) return next(new ApiError(401, "Invalid email or password"));
    if (!user.emailVerifiedAt && user.provider === "email") return next(new ApiError(403, "Please verify your email first"));
    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid login input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/google", async (req, res, next) => {
  try {
    if (!isConfigured(env.googleClientId)) return next(new ApiError(503, "Google sign-in is not configured"));
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for sign-in. Configure MONGODB_URI first."));

    const { credential } = googleSchema.parse(req.body);
    const client = new OAuth2Client(env.googleClientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: env.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email) return next(new ApiError(400, "Google did not return an email"));

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        email: payload.email,
        provider: "google",
        googleId: payload.sub,
        firstName: payload.given_name,
        lastName: payload.family_name,
        emailVerifiedAt: new Date(),
        role: "customer"
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.provider = "google";
      if (!user.firstName && payload.given_name) user.firstName = payload.given_name;
      if (!user.lastName && payload.family_name) user.lastName = payload.family_name;
      user.emailVerifiedAt = user.emailVerifiedAt ?? new Date();
      await user.save();
    }

    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid Google credential", error.flatten()));
    return next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(env.cookieName, { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await User.findById(req.auth?.sub).select("-passwordHash -passwordResetTokenHash -passwordResetExpiresAt");
    if (!user) return next(new ApiError(404, "Account not found"));
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});