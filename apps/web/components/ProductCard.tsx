"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { productInStock, variantInStock } from "@/lib/utils";
import { trackSelectItem, type AnalyticsItem } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { SmoothLink } from "./SmoothLink";
import { SmartImage } from "./SmartImage";
import { useCart } from "./CartProvider";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addItem } = useCart();
  const variant = product.variants.find(variantInStock) ?? product.variants[0];
  const soldOut = !productInStock(product.variants);
  const analyticsItem: AnalyticsItem = {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    item_category: product.category,
    item_variant: variant?.label
  };
  const onSelect = () => trackSelectItem(analyticsItem, "product-grid", "Product grid");

  return (
    <article className="product-card">
      <div className="product-card__media">
        <SmoothLink href={`/product/${product.slug}`} ariaLabel={`View ${product.name}`} onClick={onSelect}>
          <SmartImage
            src={product.images[0]}
            alt={product.imageAlts?.[0] || product.name}
            priority={priority}
            sizes="(max-width: 700px) 82vw, (max-width: 1100px) 44vw, 31vw"
            className="product-card__image"
            style={{ viewTransitionName: `product-${product.slug}` }}
          />
          {product.images[1] && (
            <SmartImage
              src={product.images[1]}
              alt=""
              crossfade={false}
              sizes="(max-width: 700px) 82vw, (max-width: 1100px) 44vw, 31vw"
              className="product-card__image product-card__image--alt"
            />
          )}
        </SmoothLink>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        {soldOut && <span className="product-badge product-badge--soldout">Sold out</span>}
        <button className="quick-add" onClick={() => addItem(product, variant)} disabled={soldOut} aria-label={`Quick add ${product.name}`}>
          <Plus size={17} /> <span>{soldOut ? "Sold out" : "Quick add"}</span>
        </button>
      </div>
      <div className="product-card__info">
        <div>
          <SmoothLink href={`/product/${product.slug}`} className="product-card__name" onClick={onSelect}>{product.name} <ArrowUpRight size={13} /></SmoothLink>
          <p>{product.subtitle}</p>
        </div>
        <div className="product-card__price">
          {product.compareAtPrice && <span>{formatPrice(product.compareAtPrice)}</span>}
          <strong>{formatPrice(product.price)}</strong>
        </div>
      </div>
    </article>
  );
}
