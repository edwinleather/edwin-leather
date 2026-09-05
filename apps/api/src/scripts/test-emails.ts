import "dotenv/config";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { EMAIL_TEMPLATE_DEFAULTS, EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SAMPLES } from "../services/email-templates/template-defaults.js";
import { baseLayout } from "../services/email-templates/base-layout.js";

const TEST_EMAIL = "1812adityaraj2@gmail.com";
const DELAY_MS = 3000;

const emailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    template: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId },
    subject: { type: String, required: true },
    status: { type: String, required: true },
    errorMessage: String
  },
  { timestamps: true }
);
const EmailLog = mongoose.model("EmailLog", emailLogSchema);

function substituteVars(html: string, vars: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, varName, content) => {
    return vars[varName] ? content : "";
  });
  return result;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const SUBJECTS: Record<string, string> = {
  order_confirmation: "Order #LEA26090001 Confirmed | Edwin Leathers",
  payment_received: "Payment Confirmed | Order #LEA26090002 | Edwin Leathers",
  order_packed: "Order #LEA26090003 Packed | Edwin Leathers",
  order_shipped: "Order #LEA26090004 Shipped | Edwin Leathers",
  order_delivered: "Order #LEA26090005 Delivered | Edwin Leathers",
  order_cancelled: "Order #LEA26090006 Cancelled | Edwin Leathers",
  feedback_received: "Thank You for Your Feedback | Edwin Leathers",
  return_requested: "Return Requested | Order #LEA26090007 | Edwin Leathers"
};

async function main() {
  // Connect to MongoDB for audit logging
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for audit logging");
  } else {
    console.warn("No MONGODB_URI — audit logs will not be saved");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER || "",
      pass: process.env.GMAIL_APP_PASSWORD || ""
    },
    secure: true
  });

  const results: { key: string; status: string; error?: string }[] = [];

  console.log(`\nSending ${EMAIL_TEMPLATE_KEYS.length} test emails to ${TEST_EMAIL}`);
  console.log(`${"─".repeat(50)}\n`);

  for (let i = 0; i < EMAIL_TEMPLATE_KEYS.length; i++) {
    const key = EMAIL_TEMPLATE_KEYS[i];
    const raw = EMAIL_TEMPLATE_DEFAULTS[key];
    const vars = EMAIL_TEMPLATE_SAMPLES[key];
    const inner = substituteVars(raw, vars);
    const html = baseLayout(inner);
    const subject = SUBJECTS[key] || key;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "Edwin Leathers <Support.edwinleather@gmail.com>",
        to: TEST_EMAIL,
        subject,
        html,
        text: html
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<\/div>/gi, "\n")
          .replace(/<[^>]*>/g, "")
          .replace(/&#8377;/g, "Rs.")
          .replace(/&times;/g, "x")
          .replace(/&amp;/g, "&")
          .replace(/&nbsp;/g, " ")
          .replace(/[\t ]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim(),
        headers: {
          "List-Unsubscribe": "<mailto:Support.edwinleather@gmail.com?subject=unsubscribe&body=Unsubscribe%20from%20Edwin%20Leathers%20emails>",
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "Precedence": "bulk",
          "X-Mailer": "Edwin-Leathers-Mailer/1.0",
          "Return-Path": process.env.GMAIL_USER || ""
        },
        replyTo: "Support.edwinleather@gmail.com"
      });
      console.log(`  ✓ [${i + 1}/${EMAIL_TEMPLATE_KEYS.length}] ${key}`);
      results.push({ key, status: "sent" });

      // Audit log
      if (mongoUri) {
        await EmailLog.create({ to: TEST_EMAIL, template: key, subject, status: "sent" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ [${i + 1}/${EMAIL_TEMPLATE_KEYS.length}] ${key}: ${msg}`);
      results.push({ key, status: "failed", error: msg });

      // Audit log
      if (mongoUri) {
        await EmailLog.create({ to: TEST_EMAIL, template: key, subject, status: "failed", errorMessage: msg });
      }
    }

    // Delay between sends to avoid Gmail rate limiting
    if (i < EMAIL_TEMPLATE_KEYS.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Summary
  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${sent} sent, ${failed} failed out of ${results.length}`);
  console.log(`Audit logs saved to MongoDB: ${sent + failed} entries`);
  console.log(`Check ${TEST_EMAIL} inbox.\n`);

  if (failed > 0) {
    console.log("Failed templates:");
    results.filter((r) => r.status === "failed").forEach((r) => console.log(`  - ${r.key}: ${r.error}`));
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
