import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { ensureDatabase } from "../config/db.js";
import { env, isConfigured } from "../config/env.js";
import { googleReady, verifyGoogleIdToken } from "../config/google.js";
import { hashPassword, verifyPassword } from "../config/passwords.js";
import { User } from "../models/User.js";
import { SiteSetting } from "../models/SiteSetting.js";
import { ApiError } from "../middleware/error.js";
import { sendEmail } from "../services/email.js";
import { baseLayout, ctaButton, type BaseLayoutOptions } from "../services/email-templates/base-layout.js";

export const authRouter = Router();

// ────────────────────────────────────────────────────────────────────────────
// Local (database) authentication. Passwords are hashed with scrypt and stored
// on the User document. Verification & reset tokens are one-time hashed tokens;
// every email goes out through the store's Gmail account (nodemailer).
// ────────────────────────────────────────────────────────────────────────────

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(2).max(60),
  lastName: z.string().max(60).optional(),
  phone: z.string().min(8).max(16).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128)
});

const tokenSchema = z.object({
  token: z.string().min(16)
});

const resetSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128)
});

const emailSchema = z.object({
  email: z.string().email()
});

const googleSchema = z.object({
  credential: z.string().min(10)
});

const VERIFICATION_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

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

let authLayoutCache: { options: BaseLayoutOptions; expires: number } | null = null;
const LAYOUT_CACHE_TTL = 5 * 60 * 1000;

async function getAuthLayoutOptions(): Promise<BaseLayoutOptions> {
  const now = Date.now();
  if (authLayoutCache && now < authLayoutCache.expires) return authLayoutCache.options;
  try {
    const doc = await SiteSetting.findOne({ key: "site" }).lean();
    const inv = (doc as Record<string, unknown>)?.invoice as Record<string, string> | undefined;
    const options: BaseLayoutOptions = {};
    if (inv?.email) options.email = inv.email;
    if (inv?.phone) options.phone = inv.phone;
    const addrParts = [inv?.address, inv?.city, inv?.state, inv?.postalCode].filter(Boolean);
    if (addrParts.length > 0) options.address = addrParts.join(", ");
    authLayoutCache = { options, expires: now + LAYOUT_CACHE_TTL };
    return options;
  } catch {
    return {};
  }
}

async function sendVerificationEmail(user: {
  email: string;
  firstName?: string;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpiresAt?: Date | null;
}) {
  const token = randomBytes(32).toString("hex");
  user.emailVerificationTokenHash = tokenHash(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  const name = (user.firstName || "").trim() || "there";
  const link = `${env.clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const content = `
    <h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Confirm your email</h2>
    <p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi ${name}, welcome to Edwin Leathers. Tap the button below to verify your email address and activate your account.</p>
    <div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-bottom:24px;">
      <p style="margin:0;color:#8b7355;font-size:13px;">This link works for the next 48 hours. If you didn't create an Edwin Leathers account, you can safely ignore this email.</p>
    </div>
    ${ctaButton(link, "Verify Email")}
    <p style="color:#8b7355;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${link}" style="color:#3c2415;">${link}</a></p>
  `;

  const opts = await getAuthLayoutOptions();
  await sendEmail({
    to: user.email,
    subject: "Verify your email | Edwin Leathers",
    html: baseLayout(content, opts),
    template: "email_verification",
    orderId: undefined
  });
}

async function sendResetEmail(user: {
  email: string;
  firstName?: string;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
}) {
  const token = randomBytes(32).toString("hex");
  user.passwordResetTokenHash = tokenHash(token);
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS);

  const name = (user.firstName || "").trim() || "there";
  const link = `${env.clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const content = `
    <h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Reset your password</h2>
    <p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi ${name}, we received a request to reset the password for your Edwin Leathers account.</p>
    <div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-bottom:24px;">
      <p style="margin:0;color:#8b7355;font-size:13px;">This link is valid for the next hour. If you didn't request a reset, you can ignore this email and your password will stay the same.</p>
    </div>
    ${ctaButton(link, "Reset Password")}
    <p style="color:#8b7355;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${link}" style="color:#3c2415;">${link}</a></p>
  `;

  const opts = await getAuthLayoutOptions();
  await sendEmail({
    to: user.email,
    subject: "Reset your password | Edwin Leathers",
    html: baseLayout(content, opts),
    template: "password_reset",
    orderId: undefined
  });
}

// POST /api/v1/auth/signup — create a database account and email a verification link.
authRouter.post("/signup", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "MongoDB is required for authentication. Configure MONGODB_URI first."));
    const input = signupSchema.parse(req.body);
    const email = input.email.toLowerCase().trim();

    let user = await User.findOne({ email });
    if (user) {
      if (user.passwordHash) {
        return next(new ApiError(409, "An account with that email already exists. Try signing in instead."));
      }
      // Social-only account (Google/Firebase sign-in from before) gains a local
      // password without touching the rest of the profile.
      user.passwordHash = hashPassword(input.password);
      user.provider = "local";
      user.firstName = user.firstName || input.firstName;
      user.lastName = user.lastName || input.lastName;
      user.phone = user.phone || input.phone;
      user.emailVerifiedAt = user.emailVerifiedAt ?? null;
      user.emailVerificationTokenHash = undefined;
      user.emailVerificationExpiresAt = undefined;
    } else {
      user = new User({
        email,
        passwordHash: hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        provider: "local",
        role: "customer",
        emailVerifiedAt: null
      });
    }

    await sendVerificationEmail(user);
    await user.save();

    return res.status(201).json({
      ok: true,
      message: "Account created. Check your inbox for a verification link.",
      user: publicUser(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid sign-up input", error.flatten()));
    return next(error);
  }
});

// POST /api/v1/auth/login — verify the stored password and start a session cookie.
authRouter.post("/login", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "MongoDB is required for authentication. Configure MONGODB_URI first."));
    const input = loginSchema.parse(req.body);
    const email = input.email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      return next(new ApiError(401, "Invalid email or password."));
    }

    if (!user.emailVerifiedAt) {
      try {
        await sendVerificationEmail(user);
        await user.save();
      } catch {
        // email failure is non-fatal; the user can still request a resend
      }
      return next(
        new ApiError(403, "Please verify your email before continuing.", {
          code: "EMAIL_NOT_VERIFIED",
          resend: true
        })
      );
    }

    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid sign-in input", error.flatten()));
    return next(error);
  }
});
// POST /api/v1/auth/google — verify a Google ID token (from the Identity
// Services button), find or create the matching database user, and start a
// session. Google has already verified the email, so no verification email is
// needed and the account is trusted immediately.
authRouter.post("/google", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "MongoDB is required for authentication. Configure MONGODB_URI first."));
    if (!googleReady()) return next(new ApiError(503, "Google sign-in is not configured. Add GOOGLE_CLIENT_ID to the API environment."));
    const { credential } = googleSchema.parse(req.body);

    const claims = await verifyGoogleIdToken(credential);
    if (!claims?.sub || !claims.email) {
      return next(new ApiError(401, "Google sign-in could not be verified. Please try again."));
    }
    if (!claims.email_verified) {
      return next(new ApiError(403, "Your Google account email is not verified.", { code: "EMAIL_NOT_VERIFIED" }));
    }

    const email = claims.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        googleId: claims.sub,
        provider: "google",
        role: "customer",
        firstName: claims.given_name ?? claims.name?.split(" ")[0],
        lastName: claims.family_name,
        emailVerifiedAt: new Date()
      });
      await user.save();
    } else {
      // Existing account (password or legacy Google/Firebase): link the Google
      // identity so future sign-ins match, and trust Google's email check.
      if (!user.googleId) user.googleId = claims.sub;
      if (!user.passwordHash) user.provider = "google";
      user.emailVerifiedAt = user.emailVerifiedAt ?? new Date();
      if (claims.given_name && !user.firstName) user.firstName = claims.given_name;
      if (claims.family_name && !user.lastName) user.lastName = claims.family_name;
      await user.save();
    }

    issueSession(res, { sub: String(user._id), role: user.role, email: user.email });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid Google sign-in input", error.flatten()));
    return next(error);
  }
});

// POST /api/v1/auth/verify-email — confirm the one-time token from the email link.
authRouter.post("/verify-email", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "MongoDB is required for authentication. Configure MONGODB_URI first."));
    const { token } = tokenSchema.parse(req.body);

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash(token),
      emailVerificationExpiresAt: { $gt: new Date() }
    });
    if (!user) return next(new ApiError(400, "This verification link is invalid or has expired. Sign in to request a new one.", { code: "TOKEN_INVALID" }));

    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    return res.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid verification input", error.flatten()));
    return next(error);
  }
});

// POST /api/v1/auth/resend-verification — send a fresh verification link.
authRouter.post("/resend-verification", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "MongoDB is required for authentication. Configure MONGODB_URI first."));
    const { email } = emailSchema.parse(req.body);
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (user && !user.emailVerifiedAt) {
      await sendVerificationEmail(user);
      await user.save();
    }
    // Always return ok to avoid leaking which addresses have accounts.
    return res.json({ ok: true, message: "If the account exists, a fresh verification link is on its way." });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

// POST /api/v1/auth/forgot-password — email a password-reset link.
authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "MongoDB is required for authentication. Configure MONGODB_URI first."));
    const { email } = emailSchema.parse(req.body);
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (user && user.passwordHash) {
      await sendResetEmail(user);
      await user.save();
    }
    // Always return ok to avoid leaking which addresses have accounts.
    return res.json({ ok: true, message: "If an account exists for that email, a password reset link is on its way." });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid input", error.flatten()));
    return next(error);
  }
});

// POST /api/v1/auth/reset-password — set a new password with a valid reset token.
authRouter.post("/reset-password", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "MongoDB is required for authentication. Configure MONGODB_URI first."));
    const input = resetSchema.parse(req.body);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash(input.token),
      passwordResetExpiresAt: { $gt: new Date() }
    });
    if (!user) return next(new ApiError(400, "This reset link is invalid or has expired. Request a new one from the sign-in page.", { code: "TOKEN_INVALID" }));

    user.passwordHash = hashPassword(input.password);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.emailVerifiedAt = user.emailVerifiedAt ?? new Date(); // resetting requires mailbox access → treat as verified
    await user.save();

    return res.json({ ok: true, message: "Password updated. Sign in with your new password." });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid reset input", error.flatten()));
    return next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(env.cookieName, { path: "/" });
  res.json({ ok: true });
});
