import { Router } from "express";
import { databaseReady } from "../config/db";
import { getTaxConfig } from "../services/tax";

export const taxRouter = Router();

taxRouter.get("/config", async (_req, res, next) => {
  try {
    if (!databaseReady()) return res.json({ ok: true, data: { gstRate: 0, includeGST: false } });
    const config = await getTaxConfig();
    return res.json({ ok: true, data: config });
  } catch (error) {
    return next(error);
  }
});