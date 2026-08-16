"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import { trackViewItem } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import { useDeliveryConfig } from "@/lib/delivery";
import { variantInStock } from "@/lib/utils";
import { SmoothLink } from "./SmoothLink";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const delivery = useDeliveryConfig();
  const [variantId, setVariantId] = useState(product.variants.find(variantInStock)?.id ?? product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const variant = useMemo(() => product.variants.find((item) => item.id === variantId) ?? product.variants[0], [product, variantId]);

  // Fire one GA4 view_item event per product page view.
  useEffect(() => {
    trackViewItem({
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      item_category: product.category,
      item_variant: variant.label
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

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
        <div className="variant-block__head"><span>Finish / size</span><small>{variantInStock(variant) ? `${variant.inventory} in stock` : "Sold out"}</small></div>
        <div className="variant-grid">
          {product.variants.map((item) => (
            <button
              key={item.id}
              disabled={!variantInStock(item)}
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
          <button onClick={() => setQuantity((value) => Math.min(Math.max(variant.inventory, 1), value + 1))} aria-label="Increase quantity"><Plus size={15} /></button>
        </div>
        <button className="button button--dark purchase-button" disabled={!variantInStock(variant)} onClick={() => addItem(product, variant, quantity)}>
          {variantInStock(variant) ? `Add to bag - ${formatPrice(product.price * quantity)}` : "Sold out"}
        </button>
      </div>

      <div className="purchase-notes">
        <span><Truck size={17} /> Free delivery across India over {formatPrice(delivery.freeDeliveryThreshold)}</span>
        <span><ShieldCheck size={17} /> Cards · UPI · Netbanking · COD</span>
      </div>

      <details className="product-accordion" open><summary>Details</summary>{product.details.length > 0 ? <ul>{product.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : (
        <ul className="product-specs">
          {variant.sku && <li><span>SKU</span>{variant.sku}</li>}
          {variant.color && <li><span>Colour</span>{variant.color}</li>}
          {variant.size && <li><span>Size</span>{variant.size}</li>}
          {product.brand && <li><span>Brand</span>{product.brand}</li>}
          {product.hsn && <li><span>HSN</span>{product.hsn}{product.gst ? ` · GST ${product.gst}%` : ""}</li>}
        </ul>
      )}</details>
      <details className="product-accordion"><summary>Leather & care</summary><p>Natural leather develops a patina. Wipe gently with a dry cloth, condition sparingly, and store away from prolonged moisture or direct heat.</p></details>
      <details className="product-accordion"><summary>Shipping & returns</summary>
        <p>{product.deliveryBy ? `Estimated delivery: ${product.deliveryBy}. ` : ""}Free delivery across India on orders over {formatPrice(delivery.freeDeliveryThreshold)}. Read our <SmoothLink href="/shipping-policy">shipping policy</SmoothLink> and <SmoothLink href="/returns-policy">returns &amp; refunds</SmoothLink> for full details.</p>
      </details>
      </div>

      <div className="purchase-bar" hidden={!variantInStock(variant)}>
        <div className="purchase-bar__price"><b>{formatPrice(product.price * quantity)}</b><span>{variant.label}</span></div>
        <button className="button button--dark" onClick={() => addItem(product, variant, quantity)}>Add to bag <Plus size={15} /></button>
      </div>
    </>
  );
}
