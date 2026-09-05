"use client";
import { useEffect } from "react";
import { trackProductView } from "@/lib/analytics";

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackProductView(productId);
  }, [productId]);
  return null;
}
