import { Router } from "express";
import { ensureDatabase } from "../config/db.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/error.js";

export const productsRouter = Router();

// Reject query parameters that look like MongoDB operators ($gt, $ne, $regex, $in…)
// so a malicious client can never inject into the filter object.
function isOperator(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  return Object.keys(obj).some((k) => k.startsWith("$"));
}

productsRouter.get("/", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Catalog unavailable. Configure MONGODB_URI."));
    const category = req.query.category;
    if (isOperator(category)) return next(new ApiError(400, "Invalid category filter"));
    const filter: Record<string, unknown> = { active: true };
    if (typeof category === "string") filter.category = category;
    const data = await Product.find(filter).sort({ featured: -1, createdAt: -1 }).lean();
    return res.json({ ok: true, source: "mongodb", data });
  } catch (error) {
    return next(error);
  }
});

productsRouter.get("/:slug", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Catalog unavailable. Configure MONGODB_URI."));
    const product = await Product.findOne({ slug: req.params.slug, active: true }).lean();
    if (!product) return next(new ApiError(404, "Product not found"));
    return res.json({ ok: true, source: "mongodb", data: product });
  } catch (error) {
    return next(error);
  }
});