import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import { env, isConfigured } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/error.js";
import { createAndSendOtp, verifyOtp } from "../services/otp.js";

export const authRouter = Router();

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });

const signupSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().max(60).optional(),
  email: z.string().email(),
  phone: z.string().min(8).max(16),
  password: z.string().min(8).max(128)
});

const otpSchema = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) });
const resendSchema = z.object({ email: z.string().email() });
const googleSchema = z.object({ credential: z.string().min(10) });

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

function publicUser(user: { _id: unknown; email: string; role: string; firstName?: string; phone?: string; emailVerifiedAt?: Date | null }) {
  return { id: user._id, email: user.email, role: user.role, firstName: user.firstName, phone: user.phone, emailVerified: Boolean(user.emailVerifiedAt) };
}

async function googleClient() {
  if (!isConfigured(env.googleClientId)) throw new ApiError(503, "Google sign-in is not configured. Add GOOGLE_CLIENT_ID.");
  return new OAuth2Client(env.googleClientId);
}

authRouter.post("/signup", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for signup. Configure MONGODB_URI first."));
    const input = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: input.email });
    if (existing) return next(new ApiError(409, "An account with that email already exists"));

    const passwordHash = await bcrypt.hash(input.password, 12);
    await User.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      provider: "local",
      role: "customer"
    });

    const otp = await createAndSendOtp(input.email, "signup");
    return res.status(201).json({
      ok: true,
      message: "Verification code sent to your email",
      devOtp: otp.devCode,
      cooldownMs: otp.cooldownMs
    });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid signup input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for verification. Configure MONGODB_URI first."));
    const input = otpSchema.parse(req.body);
    const result = await verifyOtp(input.email, input.code, "signup");
    if (!result.ok) return next(new ApiError(400, result.error));

    const user = await User.findOne({ email: input.email });
    if (!user) return next(new ApiError(404, "No account found for that email"));
    if (user.provider === "google") return next(new ApiError(400, "This account uses Google sign-in"));

    user.emailVerifiedAt = new Date();
    await user.save();
    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid verification input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/resend-otp", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for verification. Configure MONGODB_URI first."));
    const input = resendSchema.parse(req.body);
    const otp = await createAndSendOtp(input.email, "signup");
    if (otp.cooldownMs > 0) return next(new ApiError(429, "Please wait before requesting another code", { cooldownMs: otp.cooldownMs }));
    return res.json({ ok: true, message: "Verification code sent", devOtp: otp.devCode });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for login. Configure MONGODB_URI first."));
    const input = credentialsSchema.parse(req.body);
    const user = await User.findOne({ email: input.email });
    if (!user || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return next(new ApiError(401, "Invalid email or password"));
    }
    if (!user.emailVerifiedAt) return next(new ApiError(403, "Please verify your email first", { code: "EMAIL_NOT_VERIFIED" }));
    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid login input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/google", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for Google sign-in. Configure MONGODB_URI first."));
    const input = googleSchema.parse(req.body);
    const client = await googleClient();
    const ticket = await client.verifyIdToken({ idToken: input.credential, audience: env.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email) return next(new ApiError(400, "Google did not return an email address"));

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        provider: "google",
        googleId: payload.sub,
        role: "customer",
        emailVerifiedAt: new Date()
      });
    } else {
      if (!user.googleId) {
        user.googleId = payload.sub;
        if (user.provider === "local" && payload.email_verified) user.emailVerifiedAt = user.emailVerifiedAt ?? new Date();
      }
      user.firstName = user.firstName ?? payload.given_name;
      await user.save();
    }

    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(env.cookieName, { path: "/" });
  res.json({ ok: true });
});