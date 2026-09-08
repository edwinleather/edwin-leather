import "dotenv/config";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { EMAIL_TEMPLATE_DEFAULTS, EMAIL_TEMPLATE_SAMPLES } from "../services/email-templates/template-defaults.js";
import { baseLayout } from "../services/email-templates/base-layout.js";
import type { EmailTemplateKey } from "../services/email-templates/template-defaults.js";

const key = process.argv[2] as EmailTemplateKey | undefined;
if (!key || !EMAIL_TEMPLATE_DEFAULTS[key]) {
  console.log(`Usage: npx tsx src/scripts/send-one.ts <template-key>`);
  console.log(`Keys: ${Object.keys(EMAIL_TEMPLATE_DEFAULTS).join(", ")}`);
  process.exit(1);
}

function subst(html: string, vars: Record<string, string>): string {
  let r = html;
  for (const [k, v] of Object.entries(vars)) r = r.replaceAll(`{{${k}}}`, v);
  r = r.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, v: string, c: string) => vars[v] ? c : "");
  return r;
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
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  await mongoose.connect(process.env.MONGODB_URI!);
  const EL = mongoose.model("EmailLog", new mongoose.Schema({ to: String, template: String, subject: String, status: String, errorMessage: String }, { timestamps: true }));
  const t = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER ?? "", pass: process.env.GMAIL_APP_PASSWORD ?? "" }, secure: true });

  const raw = EMAIL_TEMPLATE_DEFAULTS[key!];
  const vars = EMAIL_TEMPLATE_SAMPLES[key!];
  const html = baseLayout(subst(raw, vars));
  const plainText = htmlToPlainText(html);
  const subject = SUBJECTS[key!] || key!;

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM,
      to: "1812adityaraj2@gmail.com",
      subject,
      html,
      text: plainText,
      headers: {
        "List-Unsubscribe": "<mailto:Support.edwinleather@gmail.com?subject=unsubscribe&body=Unsubscribe%20from%20Edwin%20Leathers%20emails>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "Precedence": "bulk",
        "X-Mailer": "Edwin-Leathers-Mailer/1.0",
        "Return-Path": process.env.GMAIL_USER ?? ""
      },
      replyTo: "Support.edwinleather@gmail.com"
    });
    console.log(`Sent: ${key}`);
    await EL.create({ to: "1812adityaraj2@gmail.com", template: key, subject, status: "sent" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`Failed: ${msg}`);
    await EL.create({ to: "1812adityaraj2@gmail.com", template: key, subject, status: "failed", errorMessage: msg });
  }
  await mongoose.disconnect();
}

main();
