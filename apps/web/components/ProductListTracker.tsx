"use client";

import { useEffect } from "react";
import { trackViewItemList, type AnalyticsItem } from "@/lib/analytics";
import type { Product } from "@/lib/types";

function toItem(product: Product): AnalyticsItem {
  const variant = product.variants.find((item) => item.inventory > 0) ?? product.variants[0];
  return {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    item_category: product.category,
    item_variant: variant?.label
  };
}

// Fires one GA4 view_item_list event when the grid first renders. Each page
// renders a single grid, so no de-duplication is needed within a page load.
export function ProductListTracker({
  products,
  listId,
  listName
}: {
  products: Product[];
  listId: string;
  listName: string;
}) {
  useEffect(() => {
    trackViewItemList(products.map(toItem), listId, listName);
    // The list contents are stable for a given page; only the list identity matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  return null;
}
