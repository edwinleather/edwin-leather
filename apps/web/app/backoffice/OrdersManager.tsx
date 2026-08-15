"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Search, Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Order = {
  id: string;
  orderNumber: string;
  email: string;
  customerId?: string;
  lines: { productId: string; variantId: string; sku: string; name: string; variantLabel?: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingStatus: string;
  tracking?: { awb?: string; courier?: string; trackingUrl?: string };
  shippingAddress?: { fullName?: string; line1?: string; city?: string; state?: string; postalCode?: string; phone?: string };
  timeline?: { type: string; message?: string; at: string }[];
  createdAt?: string;
};

const STATUSES = ["pending_payment", "order_received", "confirmed", "processing", "packing", "shipping", "packed", "shipped", "delivered", "cancelled", "return_requested", "returned", "refunded"];
const STATUS_ACTIONS: Record<string, string[]> = {
  pending_payment: ["order_received", "cancelled"],
  order_received: ["confirmed", "processing", "cancelled", "delivered"],
  confirmed: ["processing", "packing", "cancelled"],
  processing: ["packing", "cancelled"],
  packing: ["shipping", "cancelled"],
  shipping: ["shipped", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  return_requested: ["returned", "refunded", "cancelled"],
  returned: [],
  refunded: []
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ");
}

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/orders`, { credentials: "include" });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not load orders");
      setOrders(body.data ?? []);
    } catch {
      setError("Could not load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = orders.filter((o) => {
    const matchesFilter = !filter || o.orderStatus === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || o.orderNumber.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || (o.shippingAddress?.fullName ?? "").toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  async function setStatus(order: Order, next: string, extras: { courier?: string; awb?: string; trackingUrl?: string }) {
    setError(null);
    const res = await fetch(`${API}/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderStatus: next, ...extras })
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return setError(body?.error || "Could not update order");
    load();
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Operations</span><h2>Orders</h2></div>
        <button className="button button--ghost" onClick={load} disabled={loading}>{loading ? <Loader2 size={14} className="spin" /> : null} Refresh</button>
      </div>

      <div className="order-toolbar">
        <div className="status-filter">
          <button className={filter === "" ? "active" : ""} onClick={() => setFilter("")}>All</button>
          {STATUSES.map((s) => <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{statusLabel(s)}</button>)}
        </div>
        <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search order #, email or name" /></label>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Item</th><th>Total</th><th>Payment</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="muted">Loading orders…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} className="muted">No orders match.</td></tr>}
            {filtered.map((o) => (
              <OrderRow key={o.id} order={o} expanded={expanded === o.id} onToggle={() => setExpanded(expanded === o.id ? null : o.id)} onStatus={(next, extras) => setStatus(o, next, extras)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderRow({ order, expanded, onToggle, onStatus }: { order: Order; expanded: boolean; onToggle: () => void; onStatus: (next: string, extras: { courier?: string; awb?: string; trackingUrl?: string }) => void }) {
  const [next, setNext] = useState("");
  const [courier, setCourier] = useState(order.tracking?.courier ?? "");
  const [awb, setAwb] = useState(order.tracking?.awb ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking?.trackingUrl ?? "");
  const actions = STATUS_ACTIONS[order.orderStatus] ?? [];

  const customer = order.shippingAddress?.fullName || order.email;
  const first = order.lines[0];

  return (
    <>
      <tr>
        <td><strong>{order.orderNumber}</strong></td>
        <td>{customer}</td>
        <td>{first ? `${first.name}${order.lines.length > 1 ? ` +${order.lines.length - 1}` : ""}` : "—"}</td>
        <td>{formatPrice(order.total)}</td>
        <td><span className={`status ${order.paymentStatus === "paid" || order.paymentStatus === "cod_pending" ? "status--confirmed" : ""}`}>{statusLabel(order.paymentMethod)} · {statusLabel(order.paymentStatus)}</span></td>
        <td><span className={`status status--${order.orderStatus}`}>{statusLabel(order.orderStatus)}</span></td>
        <td style={{ textAlign: "right" }}>
          <button className="text-button" onClick={onToggle}>{expanded ? <><ChevronUp size={14} /> Details</> : <><ChevronDown size={14} /> Details</>}</button>
        </td>
      </tr>
      {expanded && (
        <tr className="order-detail-row">
          <td colSpan={7}>
            <div className="order-detail">
              <div className="order-detail__grid">
                <div>
                  <span className="eyebrow">Items</span>
                  {order.lines.map((line, i) => (
                    <div key={i} className="order-line"><span>{line.name} {line.variantLabel ? `· ${line.variantLabel}` : ""} × {line.quantity}</span><strong>{formatPrice(line.lineTotal)}</strong></div>
                  ))}
                </div>
                <div>
                  <span className="eyebrow">Ship to</span>
                  {order.shippingAddress ? (
                    <p className="muted" style={{ lineHeight: 1.6 }}>
                      {order.shippingAddress.fullName}<br />{order.shippingAddress.line1}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />{order.shippingAddress.phone}
                    </p>
                  ) : <p className="muted">—</p>}
                </div>
                <div>
                  <span className="eyebrow">Totals</span>
                  <div className="order-line"><span>Subtotal</span><strong>{formatPrice(order.subtotal)}</strong></div>
                  <div className="order-line"><span>Delivery</span><strong>{order.shippingAmount ? formatPrice(order.shippingAmount) : "Free"}</strong></div>
                  {order.discountAmount > 0 && <div className="order-line"><span>Discount</span><strong>− {formatPrice(order.discountAmount)}</strong></div>}
                  <div className="order-line"><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
                </div>
              </div>

              {actions.length > 0 && (
                <div className="order-status-control">
                  <span className="eyebrow">Update status</span>
                  <div className="order-status-row">
                    <select value={next} onChange={(e) => setNext(e.target.value)}>
                      <option value="" disabled>Select next status…</option>
                      {actions.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                    {next === "shipped" && (
                      <>
                        <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier" />
                        <input value={awb} onChange={(e) => setAwb(e.target.value)} placeholder="AWB / tracking no." />
                        <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="Tracking URL" />
                      </>
                    )}
                    <button className="button button--dark" disabled={!next} onClick={() => onStatus(next, { courier, awb, trackingUrl })}><Truck size={14} /> Apply</button>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}