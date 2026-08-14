import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/error.js";

export const shippingRouter = Router();

shippingRouter.get("/track/:awb", (req, res) => {
  const awb = encodeURIComponent(req.params.awb);
  res.json({ ok: true, awb: req.params.awb, trackingUrl: `${env.shiprocketTrackingBaseUrl}${awb}`, demo: true });
});

shippingRouter.post("/create-shipment", (req, res, next) => {
  try {
    const input = z.object({ orderId: z.string().min(1) }).parse(req.body);
    return res.status(503).json({ ok: false, demo: true, orderId: input.orderId, error: "Shiprocket is not configured. Add credentials and implement authenticated shipment creation in this route." });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid shipment input", error.flatten()));
    return next(error);
  }
});
