import { Router } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import { env, isConfigured } from "../config/env.js";
import { verifyFirebaseToken } from "../config/firebase.js";
import { User } from "../models/User.js";
import { AdminUser } from "../models/backoffice.js";
import { ApiError } from "../middleware/error.js";

export const authRouter = Router();

const firebaseSchema = z.object({
  idToken: z.string().min(10),
  firstName: z.string().min(2).max(60).optional(),
  lastName: z.string().max(60).optional(),
  phone: z.string().min(8).max(16).optional()
});

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

// Every Firebase sign-in (email/password, Google, magic link) lands here with an
// ID token. The backend verifies it, links a MongoDB user by Firebase UID, and
// issues the same httpOnly session cookie used by every protected route.
authRouter.post("/firebase", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "MongoDB is required for authentication. Configure MONGODB_URI first."));
    const input = firebaseSchema.parse(req.body);
    const payload = await verifyFirebaseToken(input.idToken);
    if (!payload?.uid || !payload.email) return next(new ApiError(401, "Invalid or expired session token"));

    if (!payload.email_verified) {
      return next(new ApiError(403, "Please verify your email before continuing.", { code: "EMAIL_NOT_VERIFIED" }));
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        firebaseUid: payload.uid,
        provider: "firebase",
        role: "customer",
        firstName: input.firstName ?? payload.name?.split(" ")[0],
        lastName: input.lastName,
        phone: input.phone,
        emailVerifiedAt: new Date()
      });
    } else {
      if (!user.firebaseUid) user.firebaseUid = payload.uid;
      user.provider = "firebase";
      user.emailVerifiedAt = user.emailVerifiedAt ?? new Date();
      if (input.firstName && !user.firstName) user.firstName = input.firstName;
      if (input.lastName && !user.lastName) user.lastName = input.lastName;
      if (input.phone && !user.phone) user.phone = input.phone;
      await user.save();
    }

    // Bootstrap / re-link the superadmin backoffice user.
    if (env.firebaseSuperadminEmail && email === env.firebaseSuperadminEmail) {
      const existingAdmin = await AdminUser.findOne({ email });
      if (existingAdmin) {
        if (String(existingAdmin.appUserId) !== String(user._id)) {
          existingAdmin.appUserId = user._id;
          existingAdmin.role = "superadmin";
          existingAdmin.active = true;
          await existingAdmin.save();
        }
      } else {
        await AdminUser.create({
          email,
          role: "superadmin",
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || email,
          firstName: user.firstName,
          lastName: user.lastName,
          appUserId: user._id,
          active: true,
          permissions: []
        });
      }
    }

    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid sign-in input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(env.cookieName, { path: "/" });
  res.json({ ok: true });
});
