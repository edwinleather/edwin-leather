import { MetadataRoute } from "next";
import { connectDatabase, ensureDatabase } from "../server/config/db";
import { Product } from "../server/models/Product";
import { Category } from "../server/models/Category";
import { siteUrl } from "../lib/site-url";

const SITE = siteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use direct database access so the sitemap always renders even when the
  // HTTP API layer is slow to cold-start on Vercel.
  let products: { slug: string }[] = [];
  let categories: { slug: string }[] = [];
  try {
    if (await ensureDatabase()) {
      products = await Product.find({ active: true }, { slug: 1, _id: 0 }).lean<{ slug: string }[]>();
      categories = await Category.find({ active: true }, { slug: 1, _id: 0 }).lean<{ slug: string }[]>();
    }
  } catch {
    // If the database is unavailable, ship the static pages only. Search
    // engines will re-crawl and pick up product/category pages once the DB
    // is back online.
  }

  const now = new Date();

  const staticPages = [
    { url: SITE, lastModified: now, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${SITE}/shop`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${SITE}/shipping-policy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${SITE}/returns-policy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.1 }
  ];

  const categoryPages = categories.map((cat) => ({
    url: `${SITE}/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  const productPages = products.map((p) => ({
    url: `${SITE}/product/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}