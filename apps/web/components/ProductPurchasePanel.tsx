"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import { useDeliveryConfig } from "@/lib/delivery";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const delivery = useDeliveryConfig();
  const [variantId, setVariantId] = useState(product.variants.find((variant) => variant.inventory > 0)?.id ?? product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const variant = useMemo(() => product.variants.find((item) => item.id === variantId) ?? product.variants[0], [product, variantId]);

  return (
    <>
      <div className="purchase-panel">
      <div className="product-detail__heading">
        <span className="eyebrow">{product.collection}</span>
        <h1>{product.name}</h1>
        <p className="product-detail__subtitle">{product.subtitle}</p>
        <div className="product-detail__price">
          <strong>{formatPrice(product.price)}</strong>
          {product.compareAtPrice && <span>{formatPrice(product.compareAtPrice)}</span>}
        </div>
      </div>
      <p className="product-detail__description">{product.description}</p>

      <div className="variant-block">
        <div className="variant-block__head"><span>Finish / size</span><small>{variant.inventory > 0 ? `${variant.inventory} in stock` : "Sold out"}</small></div>
        <div className="variant-grid">
          {product.variants.map((item) => (
            <button
              key={item.id}
              disabled={item.inventory <= 0}
              className={item.id === variantId ? "active" : ""}
              onClick={() => { setVariantId(item.id); setQuantity(1); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="purchase-row">
        <div className="quantity-control quantity-control--large">
          <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={15} /></button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity((value) => Math.min(variant.inventory || 1, value + 1))} aria-label="Increase quantity"><Plus size={15} /></button>
        </div>
        <button className="button button--dark purchase-button" disabled={variant.inventory <= 0} onClick={() => addItem(product, variant, quantity)}>
          {variant.inventory > 0 ? `Add to bag — ${formatPrice(product.price * quantity)}` : "Sold out"}
        </button>
      </div>

      <div className="purchase-notes">
        <span><Truck size={17} /> Free delivery over {formatPrice(delivery.freeDeliveryThreshold)}</span>
        <span><ShieldCheck size={17} /> Secure checkout / COD available</span>
      </div>

      <details className="product-accordion" open><summary>Details</summary><ul>{product.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></details>
      <details className="product-accordion"><summary>Leather & care</summary><p>Natural leather develops a patina. Wipe gently with a dry cloth, condition sparingly, and store away from prolonged moisture or direct heat.</p></details>
      <details className="product-accordion"><summary>Shipping & returns</summary><p>Demo policy: ships in 2–4 business days. Replace this copy with your real shipping, exchange, and return policy before launch.</p></details>
      </div>

      <div className="purchase-bar" hidden={variant.inventory <= 0}>
        <div className="purchase-bar__price"><b>{formatPrice(product.price * quantity)}</b><span>{variant.label}</span></div>
        <button className="button button--dark" onClick={() => addItem(product, variant, quantity)}>Add to bag <Plus size={15} /></button>
      </div>
    </>
  );
}
