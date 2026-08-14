"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { SmoothLink } from "./SmoothLink";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

export function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, removeItem, setQuantity } = useCart();
  const progress = Math.min((subtotal / siteConfig.shippingThreshold) * 100, 100);
  const remaining = Math.max(siteConfig.shippingThreshold - subtotal, 0);

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
                {remaining > 0 ? `${formatPrice(remaining)} away from complimentary shipping` : "Complimentary shipping unlocked"}
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
                {items.map((item) => (
                  <div className="cart-line" key={item.lineId}>
                    <SmoothLink href={`/product/${item.slug}`} className="cart-line__image" onClick={closeCart}>
                      <Image src={item.image} alt={item.name} fill sizes="96px" />
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
                          <button onClick={() => setQuantity(item.lineId, item.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                        </div>
                        <div className="cart-line__price">{formatPrice(item.price * item.quantity)}</div>
                      </div>
                      <button className="text-button tiny" onClick={() => removeItem(item.lineId)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="drawer-footer">
                <div className="drawer-total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                <p className="muted tiny">Taxes included where applicable. Shipping calculated at checkout.</p>
                <SmoothLink href="/checkout" className="button button--dark button--full" onClick={closeCart}>Checkout</SmoothLink>
                <SmoothLink href="/cart" className="button button--ghost button--full" onClick={closeCart}>View bag</SmoothLink>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
