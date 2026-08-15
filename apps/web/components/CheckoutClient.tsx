"use client";

import { useState } from "react";
import { Check, CreditCard, Landmark, ShieldCheck, Tag, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";
import { placeOrder, createRazorpayOrder, verifyPayment, type OrderResponse } from "@/lib/api";

type Placed = { order: OrderResponse; demo: boolean } | null;

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function previewDiscount(code: string, subtotal: number, shipping: number): { amount: number; freeShipping: boolean; valid: boolean; note: string } {
  const normalized = code.trim().toUpperCase();
  if (normalized === "WELCOME10") {
    if (subtotal < 999) return { amount: 0, freeShipping: false, valid: false, note: "Minimum order ₹999" };
    return { amount: Math.min(Math.round(subtotal * 0.1), 500), freeShipping: false, valid: true, note: "10% off" };
  }
  if (normalized === "FREESHIP") {
    if (subtotal < 1499) return { amount: 0, freeShipping: false, valid: false, note: "Minimum order ₹1,499" };
    return { amount: shipping, freeShipping: true, valid: true, note: "Free shipping" };
  }
  return { amount: 0, freeShipping: false, valid: false, note: "Validated at confirmation" };
}

export function CheckoutClient() {
  const { items, subtotal, clearCart } = useCart();
  const [method, setMethod] = useState<"razorpay" | "cod">("razorpay");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ amount: number; freeShipping: boolean; valid: boolean; note: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed>(null);

  const shipping = subtotal >= 2499 || subtotal === 0 ? 0 : 149;
  const discount = applied?.valid && applied.freeShipping ? applied.amount : (applied?.valid ? applied.amount : 0);
  const total = Math.max(0, subtotal + shipping - discount);

  function applyCoupon() {
    setError(null);
    if (!coupon.trim()) return;
    setApplied(previewDiscount(coupon, subtotal, shipping));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      paymentMethod: method,
      items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
      couponCode: applied && applied.valid ? coupon.trim().toUpperCase() : undefined,
      shippingAddress: {
        fullName: `${String(form.get("firstName") ?? "")} ${String(form.get("lastName") ?? "")}`.trim(),
        line1: String(form.get("address") ?? ""),
        city: String(form.get("city") ?? ""),
        state: String(form.get("state") ?? ""),
        postalCode: String(form.get("pin") ?? ""),
        phone: String(form.get("phone") ?? "")
      }
    };

    const result = await placeOrder(payload);

    if (!result.ok) {
      setSubmitting(false);
      setError(result.demo ? (result.error || "The order service is not live yet. Your order was not charged.") : (result.error || "Something went wrong placing your order."));
      return;
    }

    if (method === "cod") {
      setSubmitting(false);
      setPlaced({ order: result.order, demo: false });
      return;
    }

    const rzp = await createRazorpayOrder(result.order.id, result.order.orderNumber);
    if (!rzp.ok) {
      setSubmitting(false);
      setError(rzp.error || "Could not start the payment. Your order is saved but not charged.");
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setSubmitting(false);
      setError("Could not load the payment window. Your order is saved but not charged.");
      return;
    }

    const checkout = new window.Razorpay!({
      key: rzp.keyId,
      amount: rzp.amount,
      currency: rzp.currency,
      name: "Edwin Leathers",
      description: `Order ${result.order.orderNumber}`,
      order_id: rzp.orderId,
      handler: async (response: RazorpayResponse) => {
        const verified = await verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        setSubmitting(false);
        if (verified.ok) {
          setPlaced({ order: { ...result.order, orderStatus: "confirmed" }, demo: false });
        } else {
          setError(verified.error || "Payment completed but could not be confirmed. We will reconcile it before dispatch.");
        }
      },
      modal: { ondismiss: () => setSubmitting(false) },
      prefill: { email: payload.email },
      theme: { color: "#2b241e" }
    });
    checkout.open();
  }

  if (placed) {
    return (
      <div className="checkout-success">
        <div className="checkout-success__icon"><Check size={28} /></div>
        <span className="eyebrow">{placed.demo ? "Demo order" : "Order received"}</span>
        <h2>{placed.demo ? "The flow works." : `Thank you, ${placed.order.orderNumber}.`}</h2>
        <p>
          {placed.demo
            ? "Demo confirmation. No charge, inventory mutation, email, or shipment was created. Connect MongoDB and the integrations in CONFIGURE_ME.md to go live."
            : `Order ${placed.order.orderNumber} is ${placed.order.orderStatus === "confirmed" ? "confirmed" : "awaiting payment"}. We emailed the receipt to the address you provided.`}
        </p>
        <div className="checkout-success__totals">
          <div><span>Subtotal</span><strong>{formatPrice(placed.order.subtotal)}</strong></div>
          <div><span>Shipping</span><strong>{placed.order.shippingAmount ? formatPrice(placed.order.shippingAmount) : "Complimentary"}</strong></div>
          {placed.order.discountAmount > 0 && <div><span>Discount</span><strong>− {formatPrice(placed.order.discountAmount)}</strong></div>}
          <div className="total"><span>Total</span><strong>{formatPrice(placed.order.total)}</strong></div>
        </div>
        <button className="button button--dark" onClick={() => { clearCart(); setPlaced(null); setApplied(null); setCoupon(""); }}>Continue shopping</button>
      </div>
    );
  }

  return (
    <div className="checkout-grid">
      <form className="checkout-form" onSubmit={onSubmit}>
        <div className="checkout-section">
          <div className="checkout-section__title"><span>01</span><h2>Contact</h2></div>
          <label>Email<input required type="email" name="email" placeholder="you@example.com" /></label>
        </div>
        <div className="checkout-section">
          <div className="checkout-section__title"><span>02</span><h2>Delivery address</h2></div>
          <div className="form-grid">
            <label>First name<input required name="firstName" placeholder="Aarav" /></label>
            <label>Last name<input required name="lastName" placeholder="Sharma" /></label>
            <label className="field-wide">Address<input required name="address" placeholder="House / street / area" /></label>
            <label>City<input required name="city" placeholder="New Delhi" /></label>
            <label>State<input required name="state" placeholder="Delhi" /></label>
            <label>PIN code<input required inputMode="numeric" name="pin" placeholder="110001" /></label>
            <label>Phone<input required inputMode="tel" name="phone" placeholder="+91 98765 43210" /></label>
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
        </div>
        {error && <div className="checkout-error">{error}</div>}
        <button className="button button--dark button--full checkout-submit" type="submit" disabled={items.length === 0 || submitting}>
          {submitting ? "Placing order…" : `Place ${method === "cod" ? "COD" : "online"} order — ${formatPrice(total)}`}
        </button>
        <p className="checkout-note"><ShieldCheck size={15} /> Online payments are verified server-side. Your card details never touch this store.</p>
      </form>

      <aside className="checkout-summary">
        <span className="eyebrow">Your order</span>
        <div className="checkout-items">
          {items.map((item) => <div className="checkout-item" key={item.lineId}><div><strong>{item.name}</strong><span>{item.variantLabel} × {item.quantity}</span></div><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}
          {items.length === 0 && <p className="muted">Your cart is empty. Add a product before testing checkout.</p>}
        </div>
        <label className="coupon-row"><Tag size={15} /><input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Coupon code" /><button type="button" onClick={applyCoupon}>Apply</button></label>
        {applied && <p className={`coupon-status ${applied.valid ? "is-valid" : "is-invalid"}`}>{applied.valid ? `${coupon.trim().toUpperCase()} applied — ${applied.note}` : applied.note}</p>}
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="summary-row"><span>Shipping</span><span>{shipping ? formatPrice(shipping) : "Complimentary"}</span></div>
        {discount > 0 && <div className="summary-row summary-row--discount"><span>Discount</span><span>− {formatPrice(discount)}</span></div>}
        <div className="summary-row summary-row--total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
        <div className="checkout-benefits"><span><Truck size={16} /> Tracked shipping</span><span><ShieldCheck size={16} /> Secure payment boundary</span></div>
      </aside>
    </div>
  );
}