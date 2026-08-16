import { Router } from "express";
import { getCodConfig } from "../services/cod.js";

export const codRouter = Router();

codRouter.get("/config", async (_req, res, next) => {
  try {
    const config = await getCodConfig();
    return res.json({ ok: true, data: config });
  } catch (error) {
    return next(error);
  }
});