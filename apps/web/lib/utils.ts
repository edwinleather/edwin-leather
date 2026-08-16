import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ProductVariant } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function variantInStock(variant: ProductVariant): boolean {
  return variant.inventory > 0 || Boolean(variant.allowBackorder);
}

export function productInStock(variants: ProductVariant[]): boolean {
  return variants.some(variantInStock);
}
