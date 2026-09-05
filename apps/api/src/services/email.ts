import nodemailer from "nodemailer";
import { env, isConfigured } from "../config/env.js";
import {
  canSendGlobally,
  canSendToRecipient,
  incrementDailyCount,
  recordCircuitFailure,
  recordCircuitSuccess,
  logEmail
} from "./email-security.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!isConfigured(env.gmailAppPassword) || !env.gmailUser) return null;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.gmailUser,
      pass: env.gmailAppPassword
    },
    secure: true,
    pool: true,
    maxConnections: 2,
    rateDelta: 1000,
    rateLimit: 5
  });

  return transporter;
}

function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 500);
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 254);
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8377;/g, "Rs.")
    .replace(/&times;/g, "x")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  template: string;
  orderId?: string;
}): Promise<boolean> {
  const { to, subject, html, template, orderId } = params;
  const cleanTo = sanitizeEmail(to);

  if (!canSendGlobally()) {
    await logEmail({ to: cleanTo, template, orderId, subject, status: "skipped_quota" });
    return false;
  }

  if (!canSendToRecipient(cleanTo)) {
    await logEmail({ to: cleanTo, template, orderId, subject, status: "skipped_rate" });
    return false;
  }

  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] Gmail not configured — skipping send. Set GMAIL_USER and GMAIL_APP_PASSWORD.");
    return false;
  }

  const plainText = htmlToPlainText(html);

  try {
    await transport.sendMail({
      from: env.emailFrom,
      to: cleanTo,
      subject,
      html,
      text: plainText,
      headers: {
        "List-Unsubscribe": `<mailto:Support.edwinleather@gmail.com?subject=unsubscribe&body=Unsubscribe%20from%20Edwin%20Leathers%20emails>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "Precedence": "bulk",
        "X-Mailer": "Edwin-Leathers-Mailer/1.0",
        "Return-Path": env.gmailUser
      },
      replyTo: "Support.edwinleather@gmail.com"
    });

    incrementDailyCount();
    recordCircuitSuccess();
    await logEmail({ to: cleanTo, template, orderId, subject, status: "sent" });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] Failed to send "${template}" to ${cleanTo}:`, message);
    recordCircuitFailure();
    await logEmail({ to: cleanTo, template, orderId, subject, status: "failed", errorMessage: message });
    return false;
  }
}

export { sanitizeInput };
