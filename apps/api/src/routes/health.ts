import { Router } from "express";
import { databaseReady } from "../config/db.js";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "edwin-leathers-api",
    demoMode: env.demoMode,
    database: databaseReady() ? "connected" : "not-connected",
    timestamp: new Date().toISOString()
  });
});
