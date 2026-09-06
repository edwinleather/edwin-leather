import { Router } from "express";
import { databaseReady } from "../config/db.js";
import { getDeliveryConfig } from "../services/delivery.js";

export const deliveryRouter = Router();

deliveryRouter.get("/config", async (_req, res, next) => {
  try {
    if (!databaseReady()) return res.json({ ok: true, data: { freeShippingThreshold: 5000, defaultShippingCost: 500, estimatedDays: "3-5" } });
    const config = await getDeliveryConfig();
    return res.json({ ok: true, data: config });
  } catch (error) {
    return next(error);
  }
});