import mongoose from "mongoose";
import { Media, type MediaType } from "../models/Media";

// Image shape used across the API. `publicId` is the Cloudinary public id when
// the image was uploaded through the store's own pipeline.
export type MediaItem = { url: string; publicId?: string; alt?: string };

type ProductWithVariants = {
  _id: unknown;
  images?: MediaItem[];
  productVariants?: { _id: unknown; images?: MediaItem[] }[];
};

function toItem(d: { url: string; publicId?: string; alt?: string }): MediaItem {
  return { url: d.url, publicId: d.publicId, alt: d.alt };
}

function keyOf(item: MediaItem): string {
  return (item.publicId || item.url || "").trim();
}

// Attach a merged media view to each product so both the admin panel and the
// storefront can render product-level and per-variant galleries.
//
//   product.media = {
//     product:  MediaItem[],                        // PRODUCT_IMAGE docs
//     variants: { [variantId]: MediaItem[] }        // VARIANT_IMAGE docs
//   }
//
// When no Media docs exist yet (pre-migration data), each gallery falls back to
// the legacy embedded arrays (product.images / variant.images) so the new UI
// works before any data is migrated.
export async function attachMedia(products: ProductWithVariants[]): Promise<void> {
  if (!products || products.length === 0) return;

  const productIds = products.map((p) => String(p._id)).filter(Boolean);
  const variantIds: string[] = [];
  const variantIdsByProduct = new Map<string, string[]>();
  for (const p of products) {
    const ids = (p.productVariants ?? []).map((v) => String(v._id)).filter(Boolean);
    variantIdsByProduct.set(String(p._id), ids);
    variantIds.push(...ids);
  }

  const or: Record<string, unknown>[] = [];
  if (productIds.length > 0) or.push({ productId: { $in: productIds }, type: "PRODUCT_IMAGE" });
  if (variantIds.length > 0) or.push({ variantId: { $in: variantIds }, type: "VARIANT_IMAGE" });
  const docs = or.length > 0 ? await Media.find({ $or: or }).sort({ position: 1, createdAt: 1 }).lean() : [];

  const productByPid = new Map<string, (typeof docs)[number][]>();
  const variantByVid = new Map<string, (typeof docs)[number][]>();
  for (const d of docs) {
    if (d.type === "PRODUCT_IMAGE" && d.productId) {
      const key = String(d.productId);
      const list = productByPid.get(key) ?? [];
      list.push(d);
      productByPid.set(key, list);
    } else if (d.type === "VARIANT_IMAGE" && d.variantId) {
      const key = String(d.variantId);
      const list = variantByVid.get(key) ?? [];
      list.push(d);
      variantByVid.set(key, list);
    }
  }

  for (const p of products) {
    const pMedia = productByPid.get(String(p._id));
    const productGallery =
      pMedia && pMedia.length > 0 ? pMedia.map(toItem) : (p.images ?? []);
    const variants: Record<string, MediaItem[]> = {};
    for (const v of p.productVariants ?? []) {
      const vMedia = variantByVid.get(String(v._id));
      variants[String(v._id)] =
        vMedia && vMedia.length > 0 ? vMedia.map(toItem) : (v.images ?? []);
    }
    (p as Record<string, unknown>).media = { product: productGallery, variants };
  }
}

// Append a media record at the next position in its scope (product or variant).
export async function addMedia(input: {
  type: MediaType;
  productId: string;
  variantId?: string | null;
  url: string;
  publicId?: string;
  alt?: string;
}): Promise<unknown> {
  const scope =
    input.type === "VARIANT_IMAGE" && input.variantId
      ? { variantId: input.variantId, type: input.type }
      : { productId: input.productId, type: input.type };
  const position = await Media.countDocuments(scope);
  return Media.create({ ...input, variantId: input.variantId ?? null, position });
}

// Remove a media record. The Cloudinary blob is left in place; the media module
// (/admin/media/delete) is responsible for cleaning the actual file.
export async function removeMedia(id: string): Promise<void> {
  await Media.deleteOne({ _id: id });
}

// Make the Media collection the source of truth for a product's galleries:
// upserts the provided product + per-variant image sets (matched by publicId,
// falling back to url) and deletes Media records that are no longer listed.
export async function reconcileMediaForSave(
  productId: string,
  productImages: MediaItem[],
  variantImages: Record<string, MediaItem[]>
): Promise<void> {
  const productIdObj = new mongoose.Types.ObjectId(productId);
  const existing = await Media.find({ productId: productIdObj }).lean();

  const ops: mongoose.mongo.AnyBulkWriteOperation[] = [];
  const updatedIds = new Set<string>();

  const upsertScoped = (type: MediaType, list: MediaItem[], variantId: string | null) => {
    let position = 0;
    for (const img of list) {
      const key = keyOf(img);
      const current = existing.find(
        (d) => d.type === type && String(d.variantId ?? null) === String(variantId) && keyOf({ url: d.url, publicId: d.publicId }) === key
      );
      const data: Record<string, unknown> = {
        type,
        productId: productIdObj,
        variantId: variantId ? new mongoose.Types.ObjectId(variantId) : null,
        url: img.url,
        publicId: img.publicId ?? "",
        alt: img.alt,
        position: position++
      };
      if (current) {
        updatedIds.add(String(current._id));
        ops.push({ updateOne: { filter: { _id: current._id }, update: { $set: data } } });
      } else {
        ops.push({ insertOne: { document: data } });
      }
    }
  };

  upsertScoped("PRODUCT_IMAGE", productImages, null);
  for (const [variantId, images] of Object.entries(variantImages)) {
    upsertScoped("VARIANT_IMAGE", images, variantId);
  }

  for (const d of existing) {
    if (!updatedIds.has(String(d._id))) {
      ops.push({ deleteOne: { filter: { _id: d._id } } });
    }
  }

  if (ops.length > 0) {
    await Media.bulkWrite(ops);
  }
}