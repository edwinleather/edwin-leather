import "dotenv/config";

function value(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

function list(name: string): string[] {
  return value(name)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const env = {
  port: Number(value("PORT", "4000")),
  nodeEnv: value("NODE_ENV") || value("APP_ENV", "development"),
  demoMode: value("DEMO_MODE", "true") === "true",
  clientUrl: value("CLIENT_URL", "http://localhost:3000"),
  mongoUri: value("MONGODB_URI"),
  backofficeDbName: value("BACKOFFICE_DB_NAME", "edwin-backoffice"),
  jwtSecret: value("JWT_SECRET", "DEMO_REPLACE_ME"),
  jwtExpiresIn: value("JWT_EXPIRES_IN", "7d"),
  cookieName: value("COOKIE_NAME", "edwin_session"),
  googleClientId: value("GOOGLE_CLIENT_ID"),
  emailApiKey: value("EMAIL_API_KEY"),
  emailFrom: value("EMAIL_FROM", "Edwin Leathers <onboarding@resend.dev>"),
  razorpayKeyId: value("RAZORPAY_KEY_ID"),
  razorpayKeySecret: value("RAZORPAY_KEY_SECRET"),
  razorpayWebhookSecret: value("RAZORPAY_WEBHOOK_SECRET"),
  cloudinaryCloudName: value("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: value("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: value("CLOUDINARY_API_SECRET"),
  superadminEmails: list("SUPERADMIN_EMAIL"),
  adminEmails: list("ADMIN_EMAILS"),
  shiprocketTrackingBaseUrl: value("SHIPROCKET_TRACKING_BASE_URL", "https://shiprocket.co/tracking/")
};

export const isConfigured = (input: string) => Boolean(input && !input.includes("DEMO") && !input.includes("demo"));
