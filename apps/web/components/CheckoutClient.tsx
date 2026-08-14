"use client";

import { useState } from "react";
import { Check, CreditCard, Landmark, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";

export function CheckoutClient() {
  const { items, subtotal } = useCart();
  const [method, setMethod] = useState<"razorpay" | "cod">("razorpay");
  const [placed, setPlaced] = useState(false);
  const shipping = subtotal >= 2499 || subtotal === 0 ? 0 : 149;
  const total = subtotal + shipping;

  if (placed) {
    return (
      <div className="checkout-success">
        <div className="checkout-success__icon"><Check size={28} /></div>
        <span className="eyebrow">Demo order complete</span>
        <h2>Thank you. The flow works.</h2>
        <p>This is intentionally a demo confirmation. No charge, inventory mutation, email, or shipment was created. Connect the integrations in `CONFIGURE_ME.md` before turning this into a live checkout.</p>
        <button className="button button--dark" onClick={() => setPlaced(false)}>Return to checkout demo</button>
      </div>
    );
  }

  return (
    <div className="checkout-grid">
      <form className="checkout-form" onSubmit={(event) => { event.preventDefault(); setPlaced(true); }}>
        <div className="checkout-section">
          <div className="checkout-section__title"><span>01</span><h2>Contact</h2></div>
          <label>Email<input required type="email" placeholder="you@example.com" /></label>
        </div>
        <div className="checkout-section">
          <div className="checkout-section__title"><span>02</span><h2>Delivery address</h2></div>
          <div className="form-grid">
            <label>First name<input required placeholder="Aarav" /></label>
            <label>Last name<input required placeholder="Sharma" /></label>
            <label className="field-wide">Address<input required placeholder="House / street / area" /></label>
            <label>City<input required placeholder="New Delhi" /></label>
            <label>State<input required placeholder="Delhi" /></label>
            <label>PIN code<input required inputMode="numeric" placeholder="110001" /></label>
            <label>Phone<input required inputMode="tel" placeholder="+91 98765 43210" /></label>
          </div>
        </div>
        <div className="checkout-section">
          <div className="checkout-section__title"><span>03</span><h2>Payment</h2></div>
          <div className="payment-options">
            <button type="button" className={method === "razorpay" ? "active" : ""} onClick={() => setMethod("razorpay")}>
              <CreditCard size={19} /><div><strong>Pay online</strong><span>Razorpay · Cards · UPI · Netbanking</span></div><i />
            </button>
            <button type="button" className={method === "cod" ? "active" : ""} onClick={() => setMethod("cod")}>
              <Landmark size={19} /><div><strong>Cash on Delivery</strong><span>Payment collected on delivery</span></div><i />
            </button>
          </div>
          <div className="integration-note"><ShieldCheck size={17} /><p><strong>Demo integration boundary.</strong> Replace the current submit behavior with a call to your Express payment/order API. Online payments must be verified server-side via Razorpay webhook/signature.</p></div>
        </div>
        <button className="button button--dark button--full checkout-submit" type="submit" disabled={items.length === 0}>Place demo order — {formatPrice(total)}</button>
      </form>

      <aside className="checkout-summary">
        <span className="eyebrow">Your order</span>
        <div className="checkout-items">
          {items.map((item) => <div className="checkout-item" key={item.lineId}><div><strong>{item.name}</strong><span>{item.variantLabel} × {item.quantity}</span></div><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}
          {items.length === 0 && <p className="muted">Your cart is empty. Add a product before testing checkout.</p>}
        </div>
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="summary-row"><span>Shipping</span><span>{shipping ? formatPrice(shipping) : "Complimentary"}</span></div>
        <div className="summary-row summary-row--total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
        <div className="checkout-benefits"><span><Truck size={16} /> Tracked shipping</span><span><ShieldCheck size={16} /> Secure payment boundary</span></div>
      </aside>
    </div>
  );
}
