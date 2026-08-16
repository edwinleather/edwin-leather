"use client";

import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "./CartProvider";
import { SmoothLink } from "./SmoothLink";
import { SmartImage } from "./SmartImage";
import { formatPrice } from "@/lib/format";

export function CartPageClient() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const available = items.filter((item) => !item.isOutOfStock);
  const unavailable = items.filter((item) => item.isOutOfStock);
  return (
    <div className="cart-page-grid">
      <section>
        {items.length === 0 ? (
          <div className="cart-page-empty"><h2>Your bag is empty.</h2><p>There is room for something that gets better with use.</p><SmoothLink href="/shop" className="button button--dark">Browse the collection</SmoothLink></div>
        ) : (
          <div className="cart-page-lines">
            {available.map((item) => (
              <article className="cart-page-line" key={item.lineId}>
                <SmoothLink href={`/product/${item.slug}`} className="cart-page-line__media"><SmartImage src={item.image} alt={item.name} sizes="160px" /></SmoothLink>
                <div className="cart-page-line__copy">
                  <div><SmoothLink href={`/product/${item.slug}`} className="cart-page-line__name">{item.name}</SmoothLink><p>{item.variantLabel}</p></div>
                  <div className="cart-page-line__actions">
                    <div className="quantity-control"><button onClick={() => setQuantity(item.lineId, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => setQuantity(item.lineId, item.quantity + 1)}><Plus size={14} /></button></div>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                    <button className="remove-icon" onClick={() => removeItem(item.lineId)} aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ))}

            {unavailable.length > 0 && (
              <div className="cart-page-unavailable">
                <span className="eyebrow">No longer available</span>
                <p className="muted tiny">These items are out of stock and were left out of your checkout. Remove them to clear your bag.</p>
                {unavailable.map((item) => (
                  <article className="cart-page-line cart-page-line--dim" key={item.lineId}>
                    <SmoothLink href={`/product/${item.slug}`} className="cart-page-line__media"><SmartImage src={item.image} alt={item.name} sizes="160px" /></SmoothLink>
                    <div className="cart-page-line__copy">
                      <div><SmoothLink href={`/product/${item.slug}`} className="cart-page-line__name">{item.name}</SmoothLink><p>{item.variantLabel}</p></div>
                      <div className="cart-page-line__actions">
                        <span className="sold-out-tag">Sold out</span>
                        <strong>{formatPrice(item.price * item.quantity)}</strong>
                        <button className="remove-icon" onClick={() => removeItem(item.lineId)} aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
        <SmoothLink href="/shop" className="back-link"><ArrowLeft size={14} /> Continue shopping</SmoothLink>
      </section>

      <aside className="order-summary">
        <span className="eyebrow">Order summary</span>
        <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <div className="summary-row"><span>Shipping</span><span>Calculated at checkout</span></div>
        <div className="summary-row summary-row--total"><span>Estimated total</span><strong>{formatPrice(subtotal)}</strong></div>
        <SmoothLink href="/checkout" className={`button button--dark button--full ${available.length === 0 ? "button--disabled" : ""}`}>Proceed to checkout</SmoothLink>
        <p className="tiny muted">Demo checkout supports the UI for Razorpay and Cash on Delivery. No payment is processed until you connect real credentials.</p>
      </aside>
    </div>
  );
}