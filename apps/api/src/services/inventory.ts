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
    const updated = await Product.findOneAndUpdate(
      {
        _id: line.productId,
        ...lineMatch(line),
        "variants.active": true,
        "variants.inventoryAvailable": { $gte: line.quantity }
      },
      {
        $inc: { "variants.$.inventoryAvailable": -line.quantity, "variants.$.inventoryReserved": line.quantity }
      },
      { new: false, projection: { "variants.$": 1 } }
    ).lean();

    if (!updated) {
      const product = await Product.findOne({ _id: line.productId, ...lineMatch(line) }, { "variants.$": 1 }).lean();
      const variant = product?.variants?.[0] as { sku?: string; inventoryAvailable?: number } | undefined;
      failures.push({ sku: line.sku, available: variant?.inventoryAvailable ?? 0, requested: line.quantity });
    } else {
      reserved.push(line);
    }
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