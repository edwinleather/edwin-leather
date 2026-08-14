import { Router } from "express";
import { databaseReady } from "../config/db.js";
import { demoProducts } from "../data/demoProducts.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/error.js";

export const productsRouter = Router();

productsRouter.get("/", async (req, res, next) => {
  try {
    if (!databaseReady()) {
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      return res.json({ ok: true, source: "demo", data: category ? demoProducts.filter((item) => item.category === category) : demoProducts });
    }

    const filter: Record<string, unknown> = { active: true };
    if (typeof req.query.category === "string") filter.category = req.query.category;
    const data = await Product.find(filter).sort({ featured: -1, createdAt: -1 }).lean();
    return res.json({ ok: true, source: "mongodb", data });
  } catch (error) {
    return next(error);
  }
});

productsRouter.get("/:slug", async (req, res, next) => {
  try {
    if (!databaseReady()) {
      const product = demoProducts.find((item) => item.slug === req.params.slug);
      if (!product) return next(new ApiError(404, "Product not found"));
      return res.json({ ok: true, source: "demo", data: product });
    }

    const product = await Product.findOne({ slug: req.params.slug, active: true }).lean();
    if (!product) return next(new ApiError(404, "Product not found"));
    return res.json({ ok: true, source: "mongodb", data: product });
  } catch (error) {
    return next(error);
  }
});
