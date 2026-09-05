"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { useCart, useCartDrawer } from "./CartProvider";
import { SmoothLink } from "./SmoothLink";
import { SmartImage } from "./SmartImage";
import { formatPrice } from "@/lib/format";
import { useDeliveryConfig } from "@/lib/delivery";

export function CartDrawer() {
  const { items, subtotal, removeItem, setQuantity, refreshStock } = useCart();
  const { isOpen, closeCart } = useCartDrawer();
  const delivery = useDeliveryConfig();
  const threshold = delivery.freeDeliveryThreshold;
  const progress = threshold > 0 ? Math.min((subtotal / threshold) * 100, 100) : 0;
  const remaining = Math.max(threshold - subtotal, 0);
  const available = items.filter((item) => !item.isOutOfStock);
  const unavailable = items.filter((item) => item.isOutOfStock);

  useEffect(() => {
    if (isOpen) refreshStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            className="drawer-backdrop"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="cart-drawer"
            aria-label="Shopping bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
          >
            <div className="drawer-head">
              <div>
                <span className="eyebrow">Your edit</span>
                <h2>Shopping bag</h2>
              </div>
              <button className="icon-button" onClick={closeCart} aria-label="Close cart">
                <X size={19} />
              </button>
            </div>

            <div className="shipping-progress">
              <div className="shipping-progress__copy">
                {remaining > 0 ? `${formatPrice(remaining)} away from free delivery` : "Free delivery unlocked"}
              </div>
              <div className="shipping-progress__track"><span style={{ width: `${progress}%` }} /></div>
            </div>

            {items.length === 0 ? (
              <div className="empty-cart">
                <ShoppingBag size={34} strokeWidth={1.3} />
                <h3>Your bag is waiting.</h3>
                <p>Start with one piece you will use for years.</p>
                <SmoothLink href="/shop" className="button button--dark" onClick={closeCart}>Explore the collection</SmoothLink>
              </div>
            ) : (
              <div className="cart-lines">
                {available.map((item) => (
                  <div className="cart-line" key={item.lineId}>
                    <SmoothLink href={`/product/${item.slug}`} className="cart-line__image" onClick={closeCart}>
                      <SmartImage src={item.image} alt={item.name} sizes="96px" />
                    </SmoothLink>
                    <div className="cart-line__body">
                      <div>
                        <SmoothLink href={`/product/${item.slug}`} onClick={closeCart} className="cart-line__name">{item.name}</SmoothLink>
                        <div className="muted tiny">{item.variantLabel}</div>
                      </div>
                      <div className="cart-line__bottom">
                        <div className="quantity-control">
                          <button onClick={() => setQuantity(item.lineId, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => setQuantity(item.lineId, item.quantity + 1)} disabled={Boolean(item.maxQuantity && item.quantity >= item.maxQuantity)} aria-label="Increase quantity"><Plus size={14} /></button>
                        </div>
                        <div className="cart-line__price">{formatPrice(item.price * item.quantity)}</div>
                      </div>
                      <button className="text-button tiny" onClick={() => removeItem(item.lineId)}>Remove</button>
                    </div>
                  </div>
                ))}
                {unavailable.length > 0 && (
                  <div className="cart-unavailable">
                    <span className="eyebrow">No longer available</span>
                    {unavailable.map((item) => (
                      <div className="cart-line cart-line--dim" key={item.lineId}>
                        <SmoothLink href={`/product/${item.slug}`} className="cart-line__image" onClick={closeCart}>
                          <SmartImage src={item.image} alt={item.name} sizes="96px" />
                        </SmoothLink>
                        <div className="cart-line__body">
                          <div>
                            <SmoothLink href={`/product/${item.slug}`} onClick={closeCart} className="cart-line__name">{item.name}</SmoothLink>
                            <div className="muted tiny">{item.variantLabel}</div>
                          </div>
                          <div className="cart-line__bottom">
                            <span className="sold-out-tag">Sold out</span>
                            <div className="cart-line__price">{formatPrice(item.price * item.quantity)}</div>
                          </div>
                          <button className="text-button tiny" onClick={() => removeItem(item.lineId)}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {available.length > 0 && (
              <>
                <div className="drawer-footer">
                <div className="drawer-total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                <p className="muted tiny">Taxes included where applicable. Shipping calculated at checkout.</p>
                <SmoothLink href="/checkout" className="button button--dark button--full" onClick={closeCart}>Checkout</SmoothLink>
                <SmoothLink href="/cart" className="button button--ghost button--full" onClick={closeCart}>View bag</SmoothLink>
              </div>
              </>
            )}
            {available.length === 0 && items.length > 0 && (
              <div className="drawer-footer">
                <div className="drawer-total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                <p className="muted tiny">Your items are no longer available. Remove them to continue.</p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
