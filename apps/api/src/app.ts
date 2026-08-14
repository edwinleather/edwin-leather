import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { accountRouter } from "./routes/account.js";
<<<<<<< Updated upstream
=======
import { adminRouter } from "./routes/admin.js";
>>>>>>> Stashed changes
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { healthRouter } from "./routes/health.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { productsRouter } from "./routes/products.js";
import { returnsRouter } from "./routes/returns.js";
import { shippingRouter } from "./routes/shipping.js";
import { errorHandler, notFound } from "./middleware/error.js";

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
<<<<<<< Updated upstream
app.use("/api/v1/account", accountRouter);
=======
app.use("/api/v1/categories", categoriesRouter);
>>>>>>> Stashed changes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/shipping", shippingRouter);
app.use("/api/v1/returns", returnsRouter);
app.use("/api/v1/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);
