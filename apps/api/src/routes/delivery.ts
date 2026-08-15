import { Router } from "express";
import { getDeliveryConfig } from "../services/delivery.js";

export const deliveryRouter = Router();

deliveryRouter.get("/config", async (_req, res, next) => {
  try {
    const config = await getDeliveryConfig();
    return res.json({ ok: true, data: config });
  } catch (error) {
    return next(error);
  }
});