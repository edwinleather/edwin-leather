import crypto from "node:crypto";
import { env } from "../config/env.js";
import { OneTimePassword } from "../models/OneTimePassword.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${env.jwtSecret}`).digest("hex");
}

function generateCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

async function sendOtpEmail(email: string, code: string) {
  const apiKey = env.emailApiKey;
  if (!apiKey) {
    console.info(`[otp] No EMAIL_API_KEY configured. OTP for ${email} is ${code}`);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [email],
        subject: "Your Edwin Leathers verification code",
        text: `Your Edwin Leathers verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`
      })
    });
    if (!response.ok) {
      console.warn(`[otp] Email send failed (${response.status}). OTP for ${email} is ${code}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`[otp] Email send error. OTP for ${email} is ${code}`, error);
    return false;
  }
}

export async function createAndSendOtp(email: string, purpose: "signup" | "password_reset" = "signup") {
  const recent = await OneTimePassword.findOne({ email, purpose, usedAt: null }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return { sent: false, devCode: null, cooldownMs: OTP_RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime()) };
  }

  const code = generateCode();
  await OneTimePassword.create({ email, purpose, codeHash: hashCode(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) });
  const emailed = await sendOtpEmail(email, code);
  return { sent: emailed, devCode: emailed ? null : code, cooldownMs: 0 };
}

export async function verifyOtp(email: string, code: string, purpose: "signup" | "password_reset" = "signup") {
  const record = await OneTimePassword.findOne({ email, purpose, usedAt: null }).sort({ createdAt: -1 });
  if (!record) return { ok: false, error: "No active verification code found. Request a new one." };
  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    return { ok: false, error: "Too many attempts. Request a new code." };
  }
  if (Date.now() > record.expiresAt.getTime()) {
    await record.deleteOne();
    return { ok: false, error: "This code has expired. Request a new one." };
  }
  record.attempts += 1;
  if (crypto.timingSafeEqual(Buffer.from(record.codeHash), Buffer.from(hashCode(code)))) {
    record.usedAt = new Date();
    await record.save();
    return { ok: true as const };
  }
  await record.save();
  return { ok: false, error: "Incorrect code. Please try again." };
}