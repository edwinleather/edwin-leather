"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { SmoothLink } from "./SmoothLink";
import { SmartImage } from "./SmartImage";
import { useCart } from "./CartProvider";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addItem } = useCart();
  const variant = product.variants.find((item) => item.inventory > 0) ?? product.variants[0];

  return (
    <article className="product-card">
      <div className="product-card__media">
        <SmoothLink href={`/product/${product.slug}`} ariaLabel={`View ${product.name}`}>
          <SmartImage
            src={product.images[0]}
            alt={product.name}
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
        <button className="quick-add" onClick={() => addItem(product, variant)} aria-label={`Quick add ${product.name}`}>
          <Plus size={17} /> <span>Quick add</span>
        </button>
      </div>
      <div className="product-card__info">
        <div>
          <SmoothLink href={`/product/${product.slug}`} className="product-card__name">{product.name} <ArrowUpRight size={13} /></SmoothLink>
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
