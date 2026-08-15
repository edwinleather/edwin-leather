"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Save, Trash2, Truck } from "lucide-react";
import { DeliverySettingsManager } from "./DeliverySettingsManager";
import { InvoiceSettingsManager } from "./InvoiceSettingsManager";
import { OrderInvoice } from "./OrderInvoice";
import { formatPrice } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type DeliveryPartner = { _id: string; name: string; trackingUrl: string; active: boolean };
type Order = {
  id: string;
  orderNumber: string;
  email: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  lines: { name: string; quantity: number }[];
  tracking?: { deliveryPartnerName?: string; trackingId?: string; trackingUrl?: string; awb?: string };
};

const ACTIVE_STATUSES = new Set(["pending_payment", "order_received", "confirmed", "processing", "packing", "shipping", "packed", "shipped", "return_requested"]);
const FULLFILLMENT_STEPS: { value: string; label: string }[] = [
  { value: "order_received", label: "Order received" },
  { value: "packing", label: "Packing your order" },
  { value: "shipping", label: "Shipping your order" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];
const stepIndex = (s: string) => FULLFILLMENT_STEPS.findIndex((x) => x.value === s);

function PartnerRow({ partner, onSave, onDelete }: { partner: DeliveryPartner; onSave: (p: Partial<DeliveryPartner>) => void; onDelete: () => void }) {
  const [name, setName] = useState(partner.name);
  const [trackingUrl, setTrackingUrl] = useState(partner.trackingUrl);
  const [active, setActive] = useState(partner.active);
  return (
    <tr>
      <td><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" /></td>
      <td><input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://.../{tracking_id}" /></td>
      <td><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /></td>
      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <button className="text-button" onClick={() => onSave({ name, trackingUrl, active })}>Save</button>
        <button className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={onDelete}><Trash2 size={13} /> Delete</button>
      </td>
    </tr>
  );
}

function OrderFulfillmentRow({ order, partners, onApply, onInvoice }: { order: Order; partners: DeliveryPartner[]; onApply: (status: string, partnerId?: string, trackingId?: string) => void; onInvoice: () => void }) {
  const [next, setNext] = useState("");
  const [partnerId, setPartnerId] = useState(order.tracking?.deliveryPartnerName ? partners.find((p) => p.name === order.tracking?.deliveryPartnerName)?._id ?? "" : "");
  const [trackingId, setTrackingId] = useState(order.tracking?.trackingId ?? "");
  const current = stepIndex(order.orderStatus);
  return (
    <tr>
      <td>
        <strong>#{order.orderNumber}</strong>
        <span className="muted" style={{ display: "block", fontSize: 11 }}>{order.email}</span>
        <span className="muted" style={{ display: "block", fontSize: 11 }}>{order.lines.map((l) => l.name).join(", ")}</span>
      </td>
      <td>{formatPrice(order.total)}</td>
      <td><span className="status">{order.paymentMethod === "cod" ? "COD" : order.paymentMethod}</span> <span className="muted" style={{ fontSize: 10 }}>{order.paymentStatus.replace(/_/g, " ")}</span></td>
      <td>
        <select value={next} onChange={(e) => setNext(e.target.value)}>
          <option value="">— Set status —</option>
          {FULLFILLMENT_STEPS.filter((s) => s.value !== "delivered" || current >= 0).map((s) => <option key={s.value} value={s.value}>{s.label}{current >= 0 && s.value === order.orderStatus ? " ✓" : ""}</option>)}
        </select>
      </td>
      <td>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">— Partner —</option>
            {partners.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="Tracking ID" style={{ width: 110 }} />
          <button className="button button--dark" disabled={!next} onClick={() => onApply(next, partnerId || undefined, trackingId || undefined)}><Truck size={13} /> Apply</button>
        </div>
      </td>
      {order.tracking?.trackingUrl ? <td><a className="text-button" href={order.tracking.trackingUrl} target="_blank" rel="noreferrer">Track</a></td> : <td className="muted">—</td>}
      <td><button className="text-button" onClick={onInvoice}><FileText size={13} /> Invoice</button></td>
    </tr>
  );
}

export function DeliveryManager() {
  const [tab, setTab] = useState<"fulfillment" | "fee" | "invoice">("fulfillment");
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [invoice, setInvoice] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      const [o, p] = await Promise.all([
        fetch(`${API}/admin/orders`, { credentials: "include" }).then((r) => r.json()),
        fetch(`${API}/admin/delivery-partners`, { credentials: "include" }).then((r) => r.json())
      ]);
      if (o?.ok) setOrders(o.data);
      if (p?.ok) setPartners(p.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addPartner() {
    setMessage(null);
    if (!newName.trim() || !newUrl.trim()) return setMessage("Partner needs a name and a tracking link.");
    const res = await fetch(`${API}/admin/delivery-partners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: newName.trim(), trackingUrl: newUrl.trim(), active: true })
    });
    const body = await res.json();
    if (!res.ok) return setMessage(body?.error || "Could not add partner");
    setNewName("");
    setNewUrl("");
    setAdding(false);
    setMessage("Delivery partner added.");
    load();
  }

  async function savePartner(partner: DeliveryPartner, patch: Partial<DeliveryPartner>) {
    const res = await fetch(`${API}/admin/delivery-partners/${partner._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch)
    });
    if (res.ok) load();
  }

  async function deletePartner(partner: DeliveryPartner) {
    if (!confirm(`Delete delivery partner "${partner.name}"?`)) return;
    await fetch(`${API}/admin/delivery-partners/${partner._id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  async function apply(order: Order, status: string, partnerId?: string, trackingId?: string) {
    setMessage(null);
    const res = await fetch(`${API}/admin/delivery/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderStatus: status, deliveryPartnerId: partnerId, trackingId })
    });
    const body = await res.json();
    if (!res.ok) return setMessage(body?.error || "Could not update order");
    setMessage(`Order #${order.orderNumber} updated.`);
    load();
  }

  const active = orders.filter((o) => ACTIVE_STATUSES.has(o.orderStatus));

  return (
    <div>
      <header className="admin-header">
        <div><span className="eyebrow">Fulfillment</span><h1>Delivery</h1></div>
        <div className="status-filter">
          <button className={tab === "fulfillment" ? "active" : ""} onClick={() => setTab("fulfillment")}>Orders to ship ({active.length})</button>
          <button className={tab === "fee" ? "active" : ""} onClick={() => setTab("fee")}>Delivery fee</button>
          <button className={tab === "invoice" ? "active" : ""} onClick={() => setTab("invoice")}>Invoice</button>
        </div>
      </header>

      {invoice && <OrderInvoice orderId={invoice.orderId} orderNumber={invoice.orderNumber} onClose={() => setInvoice(null)} />}

      {tab === "fee" ? (
        <DeliverySettingsManager />
      ) : tab === "invoice" ? (
        <InvoiceSettingsManager />
      ) : (
        <>
          <section className="admin-panel">
            <div className="admin-panel__head">
              <div><span className="eyebrow">Couriers</span><h2>Delivery partners</h2></div>
              <button className="button button--dark" onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : <><Plus size={15} /> Add partner</>}</button>
            </div>
            <p className="delivery-config-hint">Add the couriers you use. Each needs a name and a tracking link — use <code>{`{tracking_id}`}</code> as the placeholder for the tracking number. Customers can then click <strong>Track</strong> on their order.</p>
            {adding && (
              <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); addPartner(); }} style={{ borderTop: "1px solid var(--line)", paddingTop: 18, marginBottom: 20 }}>
                <div className="form-grid">
                  <label>Partner name <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. DTDC" required /></label>
                  <label className="field-wide">Tracking link <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder={`https://www.dtdc.in/tracking.asp?trackid={tracking_id}`} required /></label>
                </div>
                <div className="form-actions"><button type="submit" className="button button--dark" disabled={!newName.trim() || !newUrl.trim()}><Save size={14} /> Add</button></div>
              </form>
            )}
            {message && <p className="delivery-message is-ok" style={{ margin: "0 0 12px" }}>{message}</p>}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Tracking link template</th><th>Active</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
                <tbody>
                  {partners.length === 0 && <tr><td colSpan={4} className="muted">No delivery partners yet. Add one to start shipping.</td></tr>}
                  {partners.map((p) => <PartnerRow key={p._id} partner={p} onSave={(patch) => savePartner(p, patch)} onDelete={() => deletePartner(p)} />)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <div><span className="eyebrow">Outstanding</span><h2>Orders awaiting action ({active.length})</h2></div>
            </div>
            <p className="delivery-config-hint">Orders still moving through fulfillment — from payment received through to shipped. Update the status and assign a delivery partner + tracking ID. Customers see each status and a Track link once shipped.</p>
            {loading ? <p className="muted">Loading orders…</p> : active.length === 0 ? <p className="muted">No outstanding orders. Everything is delivered or closed.</p> : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Order</th><th>Total</th><th>Payment</th><th>Status</th><th>Partner / Tracking</th><th>Track</th><th>Invoice</th></tr></thead>
                  <tbody>
                    {active.map((o) => <OrderFulfillmentRow key={o.id} order={o} partners={partners} onApply={(s, pid, tid) => apply(o, s, pid, tid)} onInvoice={() => setInvoice({ orderId: o.id, orderNumber: o.orderNumber })} />)}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}