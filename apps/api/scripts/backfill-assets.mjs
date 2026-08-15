import { connectDatabase, databaseReady } from "../dist/src/config/db.js";
import { Asset } from "../dist/src/models/Asset.js";
import { Product } from "../dist/src/models/Product.js";
import { Review } from "../dist/src/models/Review.js";
import { SiteSetting } from "../dist/src/models/SiteSetting.js";

await connectDatabase();
if (!databaseReady()) {
  console.error("DB not ready");
  process.exit(1);
}

const counts = { product: 0, review: 0, page: 0, asset: 0 };
const seen = new Set();

async function ensure(category, referenceType, referenceId, referenceLabel, { url, publicId, alt }) {
  if (!url) return;
  if (seen.has(url)) return;
  seen.add(url);
  const existing = await Asset.findOne({ url });
  if (existing) return;
  await Asset.create({
    category,
    url,
    publicId: publicId ?? undefined,
    alt,
    referenceType: referenceType ?? (category === "page" ? "page" : category === "review" ? "review" : category === "product" ? "product" : null),
    referenceId,
    referenceLabel
  });
  counts[category] += 1;
}

// Products
for (const product of await Product.find().lean()) {
  for (const image of product.images ?? []) {
    await ensure("product", "product", String(product._id), product.name, image);
  }
}

// Reviews
for (const review of await Review.find().lean()) {
  for (const image of review.images ?? []) {
    await ensure("review", "review", String(review._id), review.title || review.productName || "review", image);
  }
}

// Site / page images
const site = await SiteSetting.findOne({ key: "site" }).lean();
if (site) {
  if (site.heroImage) await ensure("page", "page", undefined, "hero", { url: site.heroImage });
  const editorialImage = site.homepage?.editorial?.image;
  if (editorialImage) await ensure("page", "page", undefined, "editorial", { url: editorialImage });
  for (const card of site.homepage?.categories?.cards ?? []) {
    if (card.image) await ensure("page", "page", undefined, `category-${card.title}`, { url: card.image });
  }
}

console.log("BACKFILL_OK", JSON.stringify(counts));
process.exit(0);