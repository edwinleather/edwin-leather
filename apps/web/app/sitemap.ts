import type { MetadataRoute } from "next";
import { getCatalog, getCategoryList } from "@/lib/catalog";
import { siteUrl } from "@/lib/site-url";

const SITE = siteUrl();

// Public, indexable routes only. Never list /backoffice or authenticated routes.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "/",
    "/about",
    "/story",
    "/shop",
    "/contact",
    "/discount",
    "/feedback",
    "/terms",
    "/privacy",
    "/shipping-policy",
    "/returns-policy"
  ];

  let productRoutes: string[] = [];
  let categoryRoutes: string[] = [];
  try {
    const [catalog, categories] = await Promise.all([getCatalog(), getCategoryList()]);
    productRoutes = catalog.map((product) => `/product/${product.slug}`);
    categoryRoutes = categories.map((category) => `/category/${category.slug}`);
  } catch {
    productRoutes = [];
    categoryRoutes = [];
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes].map((route) => ({
    url: `${SITE}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : route.startsWith("/product/") ? 0.8 : route.startsWith("/category/") ? 0.7 : 0.6
  }));
}