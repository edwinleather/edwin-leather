import { createRequire } from "node:module";
import type { RequestHandler } from "express";
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
app.use(cors({ origin: env.clientUrl, credentials: true, methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"] }));
app.use(rateLimit({ windowMs: 60_000, limit: env.nodeEnv === "production" ? 120 : 500, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(cookieParser());

// Razorpay webhook verification requires the exact raw request bytes.
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/delivery", deliveryRouter);
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
