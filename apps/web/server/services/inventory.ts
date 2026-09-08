import { Product } from "../models/Product.js";
import { ProductVariant } from "../models/ProductVariant.js";
import { Inventory } from "../models/Inventory.js";
import { InventoryLog } from "../models/InventoryLog.js";
import { ApiError } from "../middleware/error.js";

export type StockLine = { productId: string; variantId: string; sku: string; quantity: number };

export type MovementType = "purchase" | "sale" | "return" | "adjustment" | "cancellation";

function legacyMatch(line: StockLine) {
  return { "variants._id": line.variantId, "variants.sku": line.sku };
}

async function productVariantFor(line: StockLine) {
  return ProductVariant.findOne({ _id: line.variantId, productId: line.productId }).lean();
}

export type MovementInput = {
  variantId: string;
  productId?: string;
  type: MovementType;
  quantity: number;
  referenceId?: string;
  note?: string;
  actorId?: string;
};

// Append a stock-movement log. Best-effort and non-blocking so it can never
// break the purchase/order flow.
export async function logMovement(input: MovementInput) {
  try {
    await InventoryLog.create({
      variantId: input.variantId,
      productId: input.productId,
      type: input.type,
      quantity: input.quantity,
      referenceId: input.referenceId,
      note: input.note,
      actorId: input.actorId
    });
  } catch {
    // logging must not affect stock integrity
  }
}

// Ensure an Inventory document exists for a ProductVariant, initialised from its
// live stock counter. Upsert-only, never overwrites reserved/damaged.
export async function ensureInventory(productVariantId: string, initial?: { stock?: number; allowBackorder?: boolean }) {
  try {
    await Inventory.updateOne(
      { variantId: productVariantId },
      {
        $setOnInsert: {
          available: initial?.stock ?? 0,
          reserved: 0,
          damaged: 0,
          lowStockThreshold: 3,
          allowBackorder: initial?.allowBackorder ?? false
        }
      },
      { upsert: true }
    );
  } catch {
    // best-effort
  }
}

// Mirror a ProductVariant stock change onto its Inventory document.
async function syncInventory(variantId: string, ops: { available?: number; reserved?: number }) {
  try {
    const inc: Record<string, number> = {};
    if (ops.available !== undefined) inc.available = ops.available;
    if (ops.reserved !== undefined) inc.reserved = ops.reserved;
    if (Object.keys(inc).length > 0) {
      await Inventory.updateOne({ variantId }, { $inc: inc });
    }
  } catch {
    // best-effort
  }
}

export async function reserveStock(lines: StockLine[], referenceId?: string) {
  const failures: { sku: string; available: number; requested: number }[] = [];
  const reserved: StockLine[] = [];

  for (const line of lines) {
    const pv = await productVariantFor(line);
    if (pv) {
      await ensureInventory(String(pv._id), { stock: pv.stock, allowBackorder: pv.allowBackorder });
      const available = pv.stock ?? 0;
      if (available < line.quantity && !pv.allowBackorder) {
        failures.push({ sku: line.sku, available, requested: line.quantity });
        continue;
      }
      const res = await ProductVariant.findOneAndUpdate(
        {
          _id: line.variantId,
          productId: line.productId,
          active: true,
          ...(pv.allowBackorder ? {} : { stock: { $gte: line.quantity } })
        },
        { $inc: { stock: -line.quantity } }
      ).lean();
      if (!res) {
        failures.push({ sku: line.sku, available, requested: line.quantity });
        continue;
      }
      await syncInventory(String(line.variantId), { available: -line.quantity, reserved: line.quantity });
      await logMovement({ variantId: line.variantId, productId: line.productId, type: "purchase", quantity: line.quantity, referenceId });
      reserved.push(line);
      continue;
    }

    const product = await Product.findOne({ _id: line.productId, ...legacyMatch(line), "variants.active": { $ne: false } }, { "variants.$": 1 }).lean();
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
    const res = await Product.findOneAndUpdate(
      {
        _id: line.productId,
        ...legacyMatch(line),
        "variants.active": { $ne: false },
        ...(variant.allowBackorder ? {} : { "variants.inventoryAvailable": { $gte: line.quantity } })
      },
      { $inc: { "variants.$.inventoryAvailable": -line.quantity, "variants.$.inventoryReserved": line.quantity } }
    ).lean();
    if (!res) {
      failures.push({ sku: line.sku, available, requested: line.quantity });
      continue;
    }
    await logMovement({ variantId: line.variantId, productId: line.productId, type: "purchase", quantity: line.quantity, referenceId });
    reserved.push(line);
  }

  if (failures.length > 0) {
    await releaseStock(reserved);
    const detail = failures.map((failure) => `${failure.sku} (requested ${failure.requested}, available ${failure.available})`).join(", ");
    throw new ApiError(409, `Not enough stock for: ${detail}`);
  }
}

export async function releaseStock(lines: StockLine[], referenceId?: string, type: MovementType = "cancellation") {
  for (const line of lines) {
    const pv = await productVariantFor(line);
    if (pv) {
      const result = await ProductVariant.findOneAndUpdate(
        { _id: line.variantId, productId: line.productId, stock: { $gte: line.quantity } },
        { $inc: { stock: line.quantity } }
      ).lean();
      if (!result) continue;
      await syncInventory(String(line.variantId), { available: line.quantity, reserved: -line.quantity });
      await logMovement({ variantId: line.variantId, productId: line.productId, type, quantity: line.quantity, referenceId });
      continue;
    }
    const result = await Product.findOneAndUpdate(
      { _id: line.productId, ...legacyMatch(line), "variants.inventoryReserved": { $gte: line.quantity } },
      { $inc: { "variants.$.inventoryAvailable": line.quantity, "variants.$.inventoryReserved": -line.quantity } }
    ).lean();
    if (result) {
      await logMovement({ variantId: line.variantId, productId: line.productId, type, quantity: line.quantity, referenceId });
    }
  }
}

export async function commitStock(lines: StockLine[], referenceId?: string, type: MovementType = "sale") {
  for (const line of lines) {
    const pv = await productVariantFor(line);
    if (pv) {
      // ProductVariant.stock was already decremented at reserve time; commit only
      // clears the reserved bucket and records the sale.
      await syncInventory(String(line.variantId), { reserved: -line.quantity });
      await logMovement({ variantId: line.variantId, productId: line.productId, type, quantity: line.quantity, referenceId });
      continue;
    }
    const result = await Product.findOneAndUpdate(
      { _id: line.productId, ...legacyMatch(line), "variants.inventoryReserved": { $gte: line.quantity } },
      { $inc: { "variants.$.inventoryReserved": -line.quantity } }
    ).lean();
    if (result) {
      await logMovement({ variantId: line.variantId, productId: line.productId, type, quantity: line.quantity, referenceId });
    }
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
  const pv = await ProductVariant.findOne({ _id: variantId, productId }).lean();
  if (pv) {
    const updates: Record<string, unknown> = {
      stock: Math.max(0, Math.round(input.inventoryTotal))
    };
    if (input.allowBackorder !== undefined) updates.allowBackorder = Boolean(input.allowBackorder);
    const updated = await ProductVariant.findOneAndUpdate({ _id: variantId, productId }, { $set: updates }, { returnDocument: "after" }).lean();
    await ensureInventory(variantId, { stock: input.inventoryTotal, allowBackorder: input.allowBackorder });
    await Inventory.updateOne(
      { variantId },
      {
        $set: {
          available: Math.max(0, Math.round(input.inventoryTotal)),
          allowBackorder: Boolean(input.allowBackorder),
          lowStockThreshold: input.lowStockThreshold ?? 3
        }
      }
    );
    return (updated ?? null) as never;
  }

  const product = await Product.findOne({ _id: productId, "variants._id": variantId }, { "variants.$": 1 }).lean();
  const variant = product?.variants?.[0] as
    | { _id?: unknown; inventoryReserved?: number; lowStockThreshold?: number; allowBackorder?: boolean }
    | undefined;
  if (!variant) return null;

  const reserved = variant.inventoryReserved ?? 0;
  const total = Math.max(0, Math.round(input.inventoryTotal));
  const store = Math.max(0, Math.round(input.inventoryStoreAllocated));
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
    { returnDocument: "after" }
  ).lean();

  if (!updated) return null;
  return updated as never;
}

// Admin adjustment for a ProductVariant-backed SKU. Keeps ProductVariant.stock
// (the live purchase counter) in sync with the Inventory view and appends an
// adjustment log.
export async function adjustVariantInventory(
  variantId: string,
  productId: string,
  input: { total: number; damaged: number; lowStockThreshold?: number; allowBackorder?: boolean },
  actorId?: string
) {
  const pv = await ProductVariant.findOne({ _id: variantId, productId }).lean();
  if (!pv) return null;

  const inv = await Inventory.findOne({ variantId }).lean();
  const reserved = inv?.reserved ?? 0;
  const total = Math.max(0, Math.round(input.total));
  const damaged = Math.max(0, Math.round(input.damaged));
  const available = Math.max(0, total - reserved - damaged);

  await ProductVariant.findOneAndUpdate(
    { _id: variantId, productId },
    { $set: { stock: available, allowBackorder: Boolean(input.allowBackorder) } }
  ).lean();

  await Inventory.updateOne(
    { variantId },
    {
      $set: {
        available,
        damaged,
        lowStockThreshold: input.lowStockThreshold ?? 3,
        allowBackorder: Boolean(input.allowBackorder)
      }
    },
    { upsert: true }
  );

  await logMovement({
    variantId,
    productId,
    type: "adjustment",
    quantity: available,
    note: `Adjusted to ${available} available, ${damaged} damaged`,
    actorId
  });

  return { variantId, available, reserved, damaged, lowStockThreshold: input.lowStockThreshold ?? 3, allowBackorder: Boolean(input.allowBackorder) };
}