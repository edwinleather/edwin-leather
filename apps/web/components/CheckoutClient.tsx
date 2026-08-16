"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Landmark, ShieldCheck, Tag, Truck, XCircle } from "lucide-react";
import { useCart } from "./CartProvider";
import { useAuth } from "./useAuth";
import { trackBeginCheckout, trackPurchase, type AnalyticsItem } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { placeOrder, validateCoupon, createRazorpayOrder, verifyPayment, addAddress, type OrderResponse, type Address } from "@/lib/api";
import { INDIAN_STATES, deliveryFeeFor, useDeliveryConfig } from "@/lib/delivery";
import { gstFor, useTaxConfig } from "@/lib/tax";
import { useCodConfig } from "@/lib/cod";
import { logAndGeneric } from "@/lib/errors";
import { Loader } from "@/components/Loader";

type Placed = OrderResponse | null;

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

export function CheckoutClient() {
  const { items, subtotal, clearCart } = useCart();
  const availableItems = items.filter((item) => !item.isOutOfStock);
  const { authed, loading, user } = useAuth();
  const router = useRouter();
  const { enabled: codGlobalEnabled } = useCodConfig();
  const [method, setMethod] = useState<"razorpay" | "cod">("razorpay");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ amount: number; freeShipping: boolean; valid: boolean; note: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [couponChecking, setCouponChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed>(null);
  const [pendingOrder, setPendingOrder] = useState<OrderResponse | null>(null);
  const [failed, setFailed] = useState<OrderResponse | null>(null);
  const [state, setState] = useState("");
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    pin: "",
    phone: ""
  });
  const [imported, setImported] = useState(false);
  const deliveryConfig = useDeliveryConfig();
  const taxConfig = useTaxConfig();

  // Fire one GA4 begin_checkout event per checkout page view.
  useEffect(() => {
    trackBeginCheckout(
      items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_variant: item.variantLabel
      })),
      subtotal
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Record a purchase exactly once per order (shared key with /thank-you so a
  // redirect to that page never double-counts).
  function recordPurchase(order: OrderResponse) {
    const key = `el-purchase-${order.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage unavailable - fire anyway
    }
    trackPurchase({
      transaction_id: order.orderNumber,
      value: order.total,
      tax: order.gstAmount,
      shipping: order.shippingAmount,
      currency: order.currency || "INR",
      items: order.lines.map((line): AnalyticsItem => ({
        item_id: line.productId,
        item_name: line.name,
        price: line.unitPrice,
        quantity: line.quantity,
        item_variant: line.variantLabel
      }))
    });
  }

  useEffect(() => {
    if (!loading && !authed) {
      router.replace(`/login?returnTo=${encodeURIComponent("/checkout")}&utm_source=checkout`);
    }
  }, [loading, authed, router]);

  // Import the user's saved default (or first) address into the form on first load.
  useEffect(() => {
    if (imported || loading || !user?.addresses?.length) return;
    const saved = (user.addresses as Address[]).find((a) => a.isDefault) ?? (user.addresses as Address[])[0];
    if (!saved) return;
    const parts = (saved.fullName ?? "").trim().split(/\s+/);
    setForm({
      email: user.email ?? "",
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") ?? "",
      address: saved.line1 ?? "",
      city: saved.city ?? "",
      pin: saved.postalCode ?? "",
      phone: saved.phone ?? ""
    });
    if (saved.state) setState(saved.state);
    setImported(true);
  }, [imported, loading, user]);

  // If the user has no saved details, capture them on their behalf once an order lands.
  async function maybeSaveAddress(payload: { fullName: string; line1: string; line2?: string; city: string; state: string; postalCode: string; phone: string }) {
    try {
      if (user?.addresses?.length) return; // already has saved details
      await addAddress({ ...payload, isDefault: true, label: "Default" });
    } catch {
      // non-fatal - the order itself already succeeded
    }
  }

  if (loading) {
    return <div className="checkout-grid"><div className="muted" style={{ padding: "60px 0", textAlign: "center" }}><Loader label="Checking your session" /></div></div>;
  }
  if (!authed) {
    return null;
  }

  if (user && !user.emailVerifiedAt) {
    return (
      <div className="checkout-grid">
        <div className="checkout-form">
          <div className="checkout-section">
            <div className="checkout-section__title"><span>!</span><h2>Verify your email to order</h2></div>
            <p style={{ lineHeight: 1.6, color: "var(--ink-soft)" }}>
              Your email isn&rsquo;t verified yet. Open the verification link we sent to{" "}
              <strong>{user.email}</strong>, then refresh this page to continue checking out.
              Check your spam or promotions folder if it didn&rsquo;t arrive.
            </p>
            <a className="button button--dark button--full" style={{ textAlign: "center" }} href="/login?utm_source=checkout-verify">
              Go to sign in to resend the link
            </a>
          </div>
        </div>
      </div>
    );
  }

  const freeDelivery = subtotal === 0 || subtotal >= deliveryConfig.freeDeliveryThreshold || (applied?.valid && applied.freeShipping);
  const shipping = freeDelivery ? 0 : deliveryFeeFor(deliveryConfig, state);
  const gst = gstFor(taxConfig, subtotal);
  const discount = applied?.valid ? applied.amount : 0;
  const total = Math.max(0, subtotal + gst + shipping - discount);
  const remainingToFree = Math.max(deliveryConfig.freeDeliveryThreshold - subtotal, 0);

  // COD is offered only when globally enabled AND every cart item supports it.
  const codEnabled = codGlobalEnabled && availableItems.length > 0 && availableItems.every((item) => item.codAvailable !== false);
  useEffect(() => {
    if (method === "cod" && !codEnabled) setMethod("razorpay");
  }, [method, codEnabled]);

  function applyCoupon() {
    setError(null);
    const code = coupon.trim();
    if (!code) return;
    setCouponChecking(true);
    validateCoupon({ code, state, items: availableItems.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })) })
      .finally(() => setCouponChecking(false))
      .then((result) => {
      if (!result) {
        setApplied({ amount: 0, freeShipping: false, valid: false, note: "Could not validate the coupon." });
        return;
      }
      setApplied({ amount: result.amount, freeShipping: result.freeShipping, valid: result.valid, note: result.note });
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (availableItems.length === 0) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const shippingAddress = {
      fullName: `${String(form.get("firstName") ?? "")} ${String(form.get("lastName") ?? "")}`.trim(),
      line1: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      state,
      postalCode: String(form.get("pin") ?? ""),
      phone: String(form.get("phone") ?? "")
    };
    const payload = {
      email: String(form.get("email") ?? ""),
      paymentMethod: method,
      items: availableItems.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
      couponCode: applied && applied.valid ? coupon.trim().toUpperCase() : undefined,
      shippingAddress
    };

    const result = await placeOrder(payload);

    if (!result.ok) {
      setSubmitting(false);
      setError(logAndGeneric(result.error, "checkout:place"));
      return;
    }

    maybeSaveAddress(shippingAddress);

    if (method === "cod") {
      setSubmitting(false);
      setPlaced(result.order);
      recordPurchase(result.order);
      clearCart();
      return;
    }

    setPendingOrder(result.order);
    await startRazorpay(result.order);
  }

  async function startRazorpay(order: OrderResponse) {
    setSubmitting(true);
    const rzp = await createRazorpayOrder(order.id, order.orderNumber);
    if (!rzp.ok) {
      setSubmitting(false);
      setError(logAndGeneric(rzp.error, "checkout:razorpay-order"));
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setSubmitting(false);
      setError(logAndGeneric("Could not load the payment window. Your order is saved but not charged.", "checkout:razorpay-script"));
      return;
    }

    let handled = false;
    const checkout = new window.Razorpay!({
      key: rzp.keyId,
      amount: rzp.amount,
      currency: rzp.currency,
      name: "Edwin Leathers",
      description: `Order ${order.orderNumber}`,
      order_id: rzp.orderId,
      handler: async (response: RazorpayResponse) => {
        handled = true;
        const verified = await verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        setSubmitting(false);
        if (verified.ok) {
          const completed = { ...order, orderStatus: "order_received" };
          setPlaced(completed);
          recordPurchase(completed);
          clearCart();
        } else {
          setFailed(order);
        }
      },
      modal: {
        ondismiss: () => {
          setSubmitting(false);
          if (!handled) setFailed(order);
        }
      },
      prefill: { email: order.email },
      theme: { color: "#2b241e" }
    });
    checkout.open();
  }

  if (failed) {
    return (
      <div className="checkout-success">
        <div className="checkout-success__icon is-error"><XCircle size={28} /></div>
        <span className="eyebrow">Payment not completed</span>
        <h2>Your payment didn&rsquo;t go through.</h2>
        <p>
          Order {failed.orderNumber} was not charged. Your bag is still saved, so you can try again or choose Cash on Delivery.
        </p>
        <div className="checkout-success__totals">
          <div><span>Subtotal</span><strong>{formatPrice(failed.subtotal)}</strong></div>
          {failed.gstAmount ? <div><span>GST</span><strong>{formatPrice(failed.gstAmount)}</strong></div> : null}
          <div><span>Delivery</span><strong>{failed.shippingAmount ? formatPrice(failed.shippingAmount) : "Free"}</strong></div>
          {failed.discountAmount > 0 && <div><span>Discount</span><strong>− {formatPrice(failed.discountAmount)}</strong></div>}
          <div className="total"><span>Total</span><strong>{formatPrice(failed.total)}</strong></div>
        </div>
        <div className="checkout-success__actions">
          <button className="button button--dark" disabled={submitting} onClick={() => { setFailed(null); if (pendingOrder) startRazorpay(pendingOrder); }}>{submitting ? "Opening payment…" : "Try again"}</button>
          <button className="button button--ghost" onClick={() => setFailed(null)}>Return to checkout</button>
        </div>
      </div>
    );
  }

if (placed) {
    return (
      <div className="checkout-success">
        <div className="checkout-success__icon"><Check size={28} /></div>
        <span className="eyebrow">Order received</span>
        <h2>Thank you, {placed.orderNumber}.</h2>
        <p>
          {placed.paymentMethod === "cod"
            ? `Your order is confirmed. Payment of ${formatPrice(placed.total)} is due on delivery.`
            : `Your order is ${placed.orderStatus === "confirmed" ? "confirmed" : "awaiting payment"}. We emailed the receipt to the address you provided.`}
        </p>
        <div className="checkout-success__totals">
          <div><span>Subtotal</span><strong>{formatPrice(placed.subtotal)}</strong></div>
          {placed.gstAmount ? <div><span>GST</span><strong>{formatPrice(placed.gstAmount)}</strong></div> : null}
          <div><span>Delivery</span><strong>{placed.shippingAmount ? formatPrice(placed.shippingAmount) : "Free"}</strong></div>
          {placed.discountAmount > 0 && <div><span>Discount</span><strong>− {formatPrice(placed.discountAmount)}</strong></div>}
          <div className="total"><span>Total</span><strong>{formatPrice(placed.total)}</strong></div>
        </div>
        <div className="checkout-success__actions">
          <button className="button button--dark" onClick={() => router.push(`/thank-you?order=${placed.id}`)}>View order details</button>
          <button className="button button--ghost" onClick={() => { setPlaced(null); setApplied(null); setCoupon(""); router.push("/"); }}>Continue shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-grid">
      <form className="checkout-form" onSubmit={onSubmit}>
        <div className="checkout-section">
          <div className="checkout-section__title"><span>01</span><h2>Contact</h2></div>
          <label>Email<input required type="email" name="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></label>
        </div>
        <div className="checkout-section">
          <div className="checkout-section__title"><span>02</span><h2>Delivery address</h2></div>
          {imported && user?.addresses?.length ? <p className="checkout-note">We imported your saved address - update anything that&rsquo;s changed.</p> : null}
          <div className="form-grid">
            <label>First name<input required name="firstName" placeholder="Aarav" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} /></label>
            <label>Last name<input required name="lastName" placeholder="Sharma" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} /></label>
            <label className="field-wide">Address<input required name="address" placeholder="House / street / area" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></label>
            <label>City<input required name="city" placeholder="New Delhi" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></label>
            <label className="field-wide">State
              <select required name="state" value={state} onChange={(event) => setState(event.target.value)}>
                <option value="" disabled>Select a state</option>
                {INDIAN_STATES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>PIN code<input required inputMode="numeric" name="pin" placeholder="110001" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} /></label>
            <label>Phone<input required inputMode="tel" name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></label>
          </div>
        </div>
        <div className="checkout-section">
          <div className="checkout-section__title"><span>03</span><h2>Payment</h2></div>
          <div className="payment-options">
            <button type="button" className={method === "razorpay" ? "active" : ""} onClick={() => setMethod("razorpay")}>
              <CreditCard size={19} /><div><strong>Pay online</strong><span>Razorpay · Cards · UPI · Netbanking</span></div><i />
            </button>
            {codEnabled ? (
              <button type="button" className={method === "cod" ? "active" : ""} onClick={() => setMethod("cod")}>
                <Landmark size={19} /><div><strong>Cash on Delivery</strong><span>Payment collected on delivery</span></div><i />
              </button>
            ) : null}
          </div>
          {!codEnabled && availableItems.length > 0 && (
            <p className="checkout-note" style={{ marginTop: 10 }}><ShieldCheck size={15} /> Cash on Delivery is not available for this order.</p>
          )}
        </div>
        {error && <div className="checkout-error">{error}</div>}
        <button className="button button--dark button--full checkout-submit" type="submit" disabled={availableItems.length === 0 || submitting}>
          {submitting ? <><span className="btn-spinner" aria-hidden="true" /> Placing order…</> : `Place ${method === "cod" ? "COD" : "online"} order - ${formatPrice(total)}`}
        </button>
        <p className="checkout-note"><ShieldCheck size={15} /> Online payments are verified server-side. Your card details never touch this store.</p>
      </form>

      <aside className="checkout-summary">
        <span className="eyebrow">Your order</span>
        <div className="checkout-items">
          {availableItems.map((item) => <div className="checkout-item" key={item.lineId}><div><strong>{item.name}</strong><span>{item.variantLabel} × {item.quantity}</span></div><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}
          {availableItems.length === 0 && <p className="muted">Your cart is empty. Add a product before testing checkout.</p>}
        </div>
        <label className="coupon-row"><Tag size={15} /><input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Coupon code" /><button type="button" onClick={applyCoupon} disabled={couponChecking}>{couponChecking ? <span className="btn-spinner" aria-hidden="true" /> : "Apply"}</button></label>
        {applied && <p className={`coupon-status ${applied.valid ? "is-valid" : "is-invalid"}`}>{applied.valid ? `${coupon.trim().toUpperCase()} applied - ${applied.note}` : applied.note}</p>}
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        {gst > 0 && <div className="summary-row"><span>GST ({taxConfig.gstRate}%)</span><span>{formatPrice(gst)}</span></div>}
        <div className="summary-row"><span>Delivery</span><span>{shipping ? formatPrice(shipping) : "Free"}</span></div>
        {!freeDelivery && remainingToFree > 0 && <div className="summary-row summary-row--hint"><span>Add {formatPrice(remainingToFree)} more for free delivery</span><span /></div>}
        {discount > 0 && <div className="summary-row summary-row--discount"><span>Discount</span><span>− {formatPrice(discount)}</span></div>}
        <div className="summary-row summary-row--total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
        <div className="checkout-benefits"><span><Truck size={16} /> Tracked shipping</span><span><ShieldCheck size={16} /> Secure payment boundary</span></div>
      </aside>
    </div>
  );
}