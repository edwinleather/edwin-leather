import { Router } from "express";
import { getTaxConfig } from "../services/tax.js";

export const taxRouter = Router();

taxRouter.get("/config", async (_req, res, next) => {
  try {
    const config = await getTaxConfig();
    return res.json({ ok: true, data: config });
  } catch (error) {
    return next(error);
  }
});