import { Router } from "express";
import { databaseReady } from "../config/db";
import { getCodConfig } from "../services/cod";

export const codRouter = Router();

codRouter.get("/config", async (_req, res, next) => {
  try {
    if (!databaseReady()) return res.json({ ok: true, data: { enabled: false, minOrderAmount: 0, maxOrderAmount: 10000 } });
    const config = await getCodConfig();
    return res.json({ ok: true, data: config });
  } catch (error) {
    return next(error);
  }
});