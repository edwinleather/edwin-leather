import { createRequire } from "node:module";
import type { Request, RequestHandler } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { accountRouter } from "./routes/account.js";
import { adminRouter } from "./routes/admin.js";
import { backofficeRouter } from "./routes/backoffice.js";
import { authRouter } from "./routes/auth.js";
import { cartRouter } from "./routes/cart.js";
import { categoriesRouter } from "./routes/categories.js";
import { deliveryRouter } from "./routes/delivery.js";
import { taxRouter } from "./routes/tax.js";
import { codRouter } from "./routes/cod.js";
import { healthRouter } from "./routes/health.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { productsRouter } from "./routes/products.js";
import { returnsRouter } from "./routes/returns.js";
import { reviewsRouter } from "./routes/reviews.js";
import { feedbackRouter } from "./routes/feedback.js";
import { siteRouter } from "./routes/site.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { initSentry } from "./services/sentry.js";

// helmet@8 and express-rate-limit@8 are dual ESM/CJS packages whose types do
// not resolve to a callable under NodeNext (the default import lands on the
// module namespace). Load them via require() and type them explicitly instead.
const require = createRequire(import.meta.url);
const helmet = require("helmet") as (options?: Record<string, unknown>) => RequestHandler;
const rateLimit = require("express-rate-limit") as (options?: Record<string, unknown>) => RequestHandler;

initSentry();

export const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: (req, callback) => {
      const origin = req.headers.origin;
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (env.clientOrigins.includes(origin)) return callback(null, origin);
      // In development, also allow any localhost
      if (env.nodeEnv !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, origin);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
  })
);
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: env.nodeEnv === "production" ? 120 : 500,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: rateLimitKey
  })
);
app.use(cookieParser());

// Razorpay webhook verification requires the exact raw request bytes.
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }));
// Review image uploads send a base64 data URI, which can exceed the default 1mb body limit.
app.use("/api/v1/reviews/media/upload", express.json({ limit: "14mb" }));
// Superadmin database import can be large; allow a generous payload.
app.use("/api/v1/admin/import/database", express.json({ limit: "100mb" }));
app.use(express.json({ limit: "1mb" }));

// Derive a consistent, non-spoofable client IP for rate-limiting.  When behind a
// trusted proxy we prefer the first hop of x-forwarded-for (if it looks like an
// IP); otherwise fall back to the socket address.
function rateLimitKey(req: Request): string {
  const socketIp = (req.socket?.remoteAddress ?? "").replace(/^::ffff:/, "");
  const xff = req.headers["x-forwarded-for"];
  const first = (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() ?? "";
  const ip = /^[\d.]+$/.test(first) && first.length <= 45 ? first : socketIp;
  return ip || "unknown";
}

// Per-endpoint rate limits to stop abuse (brute force, spam, order floods).
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false, keyGenerator: rateLimitKey });
const orderLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, keyGenerator: rateLimitKey });
const reviewLimit = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false, keyGenerator: rateLimitKey });
const feedbackLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, keyGenerator: rateLimitKey });
const paymentLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, keyGenerator: rateLimitKey });
const cartLimit = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false, keyGenerator: rateLimitKey });

app.use("/api/v1/auth", authLimit);
app.use("/api/v1/orders", orderLimit);
app.use("/api/v1/reviews", reviewLimit);
app.use("/api/v1/feedback", feedbackLimit);
app.use("/api/v1/payments", paymentLimit);
app.use("/api/v1/cart", cartLimit);

app.use("/api/v1/health", healthRouter);

// Cache public catalog reads for 60s (stale-while-revalidate for 5 min)
app.use("/api/v1/products", (req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }
  next();
});
app.use("/api/v1/categories", (req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  }
  next();
});
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/delivery", deliveryRouter);
app.use("/api/v1/tax", taxRouter);
app.use("/api/v1/cod", codRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/returns", returnsRouter);
app.use("/api/v1/reviews", reviewsRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/site", siteRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/admin", backofficeRouter);

app.use(notFound);
app.use(errorHandler);
