"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { resolveUnitPrice, resolveProductPrice } from "@/lib/pricing";
import type { Product, ProductVariant, ProductVariantItem } from "@/lib/types";
import { trackViewItem } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import { useDeliveryConfig } from "@/lib/delivery";
import { variantInStock } from "@/lib/utils";
import { SmoothLink } from "./SmoothLink";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const delivery = useDeliveryConfig();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const hasAttrVariants = (product.productVariants?.length ?? 0) > 0 && (product.variantAttributes?.length ?? 0) > 0;

  // Legacy flow: pick from the embedded color/size variant buttons.
  const [variantId, setVariantId] = useState(product.variants.find(variantInStock)?.id ?? product.variants[0]?.id ?? "");
  const legacyVariant = useMemo(() => product.variants.find((item) => item.id === variantId) ?? product.variants[0] ?? { id: "", label: "", sku: "", color: "", inventory: 0, price: 0 }, [product, variantId]);

  // Attribute flow: select one value per dimension, then resolve the matching SKU.
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const dim of product.variantAttributes ?? []) {
      const first = product.productVariants?.find((v) => v.attributes.some((a) => a.name === dim.name))?.attributes.find((a) => a.name === dim.name)?.value;
      init[dim.name] = String(first ?? dim.options[0] ?? "");
    }
    return init;
  });

  const activeItem: ProductVariantItem | null = useMemo(() => {
    if (!hasAttrVariants) return null;
    return (
      product.productVariants!.find(
        (v) =>
          v.active &&
          v.attributes.every((a) => selection[a.name] !== undefined && selection[a.name] === String(a.value))
      ) ?? null
    );
  }, [product, selection, hasAttrVariants]);

  const variant: ProductVariant = useMemo(() => {
    if (!activeItem) return legacyVariant;
    const labels = (product.variantAttributes ?? []).map((d) => selection[d.name]).filter(Boolean);
    const values = activeItem.attributes;
    return {
      id: activeItem.id,
      label: labels.length > 0 ? labels.join(" / ") : values.map((a) => String(a.value)).join(" / "),
      sku: activeItem.sku,
      color: values[0] ? String(values[0].value) : "",
      size: values[1] ? String(values[1].value) : undefined,
      inventory: activeItem.stock,
      allowBackorder: activeItem.allowBackorder,
      price: activeItem.price,
      salePrice: activeItem.salePrice,
      promotionPrice: activeItem.promotionPrice
    };
  }, [activeItem, legacyVariant, product.variantAttributes, selection]);

  const unitPrice = activeItem
    ? resolveUnitPrice(activeItem)
    : resolveProductPrice(product);
  const inStock = activeItem ? activeItem.stock > 0 || Boolean(activeItem.allowBackorder) : variantInStock(variant);

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

  const addToBag = () => {
    if (!inStock) return;
    addItem(product, variant, quantity, false);
    setAdded(true);
  };

  const setSelectionValue = (name: string, value: string) => {
    setSelection((s) => ({ ...s, [name]: value }));
    setQuantity(1);
  };

  return (
    <>
      <div className="purchase-panel">
      <div className="product-detail__heading">
        <span className="eyebrow">{product.collection}</span>
        <h1>{product.name}</h1>
        <p className="product-detail__subtitle">{product.subtitle}</p>
        <div className="product-detail__price">
          <strong>{formatPrice(unitPrice)}</strong>
          {product.compareAtPrice && product.compareAtPrice > unitPrice && <span>{formatPrice(product.compareAtPrice)}</span>}
        </div>
      </div>
      <p className="product-detail__description">{product.description}</p>

      <div className="variant-block">
        <div className="variant-block__head"><span>Finish / size</span><small>{inStock ? `${variant.inventory} in stock` : "Sold out"}</small></div>
        {hasAttrVariants ? (
          <div className="variant-grid variant-grid--selects" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
            {(product.variantAttributes ?? []).map((dim) => (
              <label key={dim.attributeId} className="variant-select">
                <span>{dim.name}</span>
                <select
                  value={selection[dim.name] ?? ""}
                  onChange={(e) => setSelectionValue(dim.name, e.target.value)}
                >
                  {dim.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : (
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
        )}
      </div>

      <div className="purchase-row">
        <div className="quantity-control quantity-control--large">
          <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={15} /></button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity((value) => Math.min(Math.max(variant.inventory, 1), value + 1))} aria-label="Increase quantity"><Plus size={15} /></button>
        </div>
        <button className="button button--dark purchase-button" disabled={!inStock} onClick={addToBag}>
          {inStock ? `Add to bag - ${formatPrice(unitPrice * quantity)}` : "Sold out"}
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

      <div className="purchase-bar" hidden={!inStock}>
        <div className="purchase-bar__price"><b>{formatPrice(unitPrice * quantity)}</b><span>{variant.label}</span></div>
        <button className="button button--dark" onClick={addToBag}>Add to bag <Plus size={15} /></button>
      </div>

      <AnimatePresence>
        {added && (
          <motion.div
            className="added-modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAdded(false)}
          >
            <motion.div
              className="added-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Added to bag"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", damping: 26, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="added-modal__check"><Check size={20} /></span>
              <span className="eyebrow">Added to your bag</span>
              <h3>{product.name}</h3>
              <p className="added-modal__variant">{variant.label} · {formatPrice(unitPrice * quantity)}</p>
              <div className="added-modal__actions">
                <SmoothLink href="/checkout" className="button button--dark button--full" onClick={() => setAdded(false)}>Checkout</SmoothLink>
                <button className="button button--ghost button--full" onClick={() => setAdded(false)}>Keep shopping</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}