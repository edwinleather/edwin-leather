import "dotenv/config";

function value(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export const env = {
  port: Number(value("PORT", "4000")),
  nodeEnv: value("NODE_ENV") || value("APP_ENV", "development"),
  demoMode: value("DEMO_MODE", "false") === "true",
  clientUrl: value("CLIENT_URL", "http://localhost:3000"),
  clientOrigins: value("CLIENT_URL", "http://localhost:3000").split(",").map((s) => s.trim()).filter(Boolean),
  mongoUri: value("MONGODB_URI"),
  backofficeDbName: value("BACKOFFICE_DB_NAME", "edwin-backoffice"),
  jwtSecret: value("JWT_SECRET"),
  jwtExpiresIn: value("JWT_EXPIRES_IN", "7d"),
  cookieName: value("COOKIE_NAME", "edwin_session"),
  razorpayKeyId: value("RAZORPAY_KEY_ID"),
  razorpayKeySecret: value("RAZORPAY_KEY_SECRET"),
  razorpayWebhookSecret: value("RAZORPAY_WEBHOOK_SECRET"),
  cloudinaryCloudName: value("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: value("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: value("CLOUDINARY_API_SECRET"),
  sentryDsn: value("SENTRY_DSN"),
  errorReportRepo: value("ERROR_REPORT_REPO", "edwinleather/edwin-leather"),
  errorReportToken: value("ERROR_REPORT_TOKEN"),
  errorReportMinIntervalMs: Number(value("ERROR_REPORT_MIN_INTERVAL_MS", "60000")),
  gmailUser: value("GMAIL_USER"),
  gmailAppPassword: value("GMAIL_APP_PASSWORD"),
  emailFrom: value("EMAIL_FROM", "Edwin Leathers <Support.edwinleather@gmail.com>"),
  googleClientId: value("GOOGLE_CLIENT_ID")
};

// A value counts as configured only if it is a real secret: non-empty, long
// enough, and not a placeholder/obvious default. This is used to fail closed
// for security-critical values like JWT_SECRET.  Razorpay test keys are
// shorter, so we use a lower threshold for them.
const isPlaceholder = (input: string) =>
  !input ||
  /^(DEMO_|REPLACE|xxx|CHANGE|your-)/i.test(input) ||
  /^[A-Za-z0-9_-]{8,12}$/.test(input);

export const isConfigured = (input: string) =>
  Boolean(input && input.length >= 20 && !isPlaceholder(input));

// Razorpay test keys can be short (e.g. 24 chars).  Use a dedicated check
// that only rejects obvious placeholders.
export const isRazorpayConfigured = (input: string) =>
  Boolean(input && input.length >= 10 && !isPlaceholder(input));
