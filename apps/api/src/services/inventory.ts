import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/error.js";

export type StockLine = { productId: string; variantId: string; sku: string; quantity: number };

function lineMatch(line: StockLine) {
  return { "variants._id": line.variantId, "variants.sku": line.sku };
}

export async function reserveStock(lines: StockLine[]) {
  const failures: { sku: string; available: number; requested: number }[] = [];
  const reserved: StockLine[] = [];

  for (const line of lines) {
    const product = await Product.findOne({ _id: line.productId, ...lineMatch(line), "variants.active": true }, { "variants.$": 1 }).lean();
    const variant = product?.variants?.[0] as { _id?: unknown; inventoryAvailable?: number; allowBackorder?: boolean } | undefined;
    if (!variant) {
      failures.push({ sku: line.sku, available: 0, requested: line.quantity });
      continue;
    }
    const available = variant.inventoryAvailable ?? 0;
    if (available < line.quantity && !variant.allowBackorder) {
      failures.push({ sku: line.sku, available, requested: line.quantity });
      continue;
    }
    // Atomic conditional update: only decrement if enough is actually in stock.
    // This re-checks availability within the same write, preventing concurrent
    // requests from over-reserving past the physical stock.
    const res = await Product.findOneAndUpdate(
      {
        _id: line.productId,
        ...lineMatch(line),
        "variants.active": true,
        ...(variant.allowBackorder ? {} : { "variants.inventoryAvailable": { $gte: line.quantity } })
      },
      { $inc: { "variants.$.inventoryAvailable": -line.quantity, "variants.$.inventoryReserved": line.quantity } }
    ).lean();
    if (!res) {
      failures.push({ sku: line.sku, available, requested: line.quantity });
      continue;
    }
    reserved.push(line);
  }

  if (failures.length > 0) {
    await releaseStock(reserved);
    const detail = failures.map((failure) => `${failure.sku} (requested ${failure.requested}, available ${failure.available})`).join(", ");
    throw new ApiError(409, `Not enough stock for: ${detail}`);
  }
}

export async function releaseStock(lines: StockLine[]) {
  for (const line of lines) {
    await Product.findOneAndUpdate(
      { _id: line.productId, ...lineMatch(line), "variants.inventoryReserved": { $gte: line.quantity } },
      { $inc: { "variants.$.inventoryAvailable": line.quantity, "variants.$.inventoryReserved": -line.quantity } }
    ).lean();
  }
}

export async function commitStock(lines: StockLine[]) {
  for (const line of lines) {
    await Product.findOneAndUpdate(
      { _id: line.productId, ...lineMatch(line), "variants.inventoryReserved": { $gte: line.quantity } },
      { $inc: { "variants.$.inventoryReserved": -line.quantity } }
    ).lean();
  }
}

// Available-for-online-sale is derived: total physical stock minus store
// allocation minus units already reserved by carts/pending orders.
export type InventorySetInput = {
  inventoryTotal: number;
  inventoryStoreAllocated: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
};

export async function setVariantInventory(productId: string, variantId: string, input: InventorySetInput) {
  const product = await Product.findOne({ _id: productId, "variants._id": variantId }, { "variants.$": 1 }).lean();
  const variant = product?.variants?.[0] as
    | { _id?: unknown; inventoryReserved?: number; lowStockThreshold?: number; allowBackorder?: boolean }
    | undefined;
  if (!variant) return null;

  const reserved = variant.inventoryReserved ?? 0;
  const total = Math.max(0, Math.round(input.inventoryTotal));
  const store = Math.max(0, Math.round(input.inventoryStoreAllocated));
  // Cannot allocate more to the store than total physical stock.
  const safeStore = Math.min(store, total);
  const available = Math.max(0, total - safeStore - reserved);

  const updates: Record<string, unknown> = {
    "variants.$.inventoryTotal": total,
    "variants.$.inventoryStoreAllocated": safeStore,
    "variants.$.inventoryAvailable": available
  };
  if (input.lowStockThreshold !== undefined) updates["variants.$.lowStockThreshold"] = Math.max(0, Math.round(input.lowStockThreshold));
  if (input.allowBackorder !== undefined) updates["variants.$.allowBackorder"] = Boolean(input.allowBackorder);

  const updated = await Product.findOneAndUpdate(
    { _id: productId, "variants._id": variantId },
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) return null;
  return updated as never;
}