import { Router } from "express";
import { databaseReady } from "../config/db.js";
import { Category } from "../models/Category.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res, next) => {
  try {
    if (!databaseReady()) return res.json({ ok: true, source: "demo", data: [] });
    const data = await Category.find({ active: true }).sort({ displayOrder: 1, name: 1 }).lean();
    return res.json({ ok: true, source: "mongodb", data });
  } catch (error) {
    return next(error);
  }
});