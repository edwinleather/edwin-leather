"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, PackageCheck, UserRound, LogOut, ChevronDown, ChevronUp, Pencil, Trash2, Plus, KeyRound, CircleCheck } from "lucide-react";
import { getAddresses, addAddress, updateAddress, deleteAddress, updateProfile, changePassword, getOrder, type Address, type OrderResponse } from "@/lib/api";
import { useAuth } from "@/components/useAuth";
import { Loader } from "@/components/Loader";
import { formatPrice } from "@/lib/format";
import { logAndGeneric } from "@/lib/errors";

type Order = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  currency: string;
  lines: { name: string; variantLabel?: string; quantity: number; unitPrice: number }[];
  tracking?: { trackingUrl?: string; deliveryPartnerName?: string; trackingId?: string };
  createdAt?: string;
};

type Tab = "overview" | "orders" | "addresses" | "profile";
const EMPTY_ADDRESS: Address = { fullName: "", line1: "", line2: "", city: "", state: "", postalCode: "", phone: "", label: "Home", isDefault: false };

function StatusPill({ status }: { status: string }) {
  const normalized = status.replace("_", " ");
  const tone = ["cancelled", "refunded", "payment_failed"].includes(status) ? "bad" : ["pending_payment"].includes(status) ? "warn" : "good";
  return <span className={`status-pill status-pill--${tone}`}>{normalized}</span>;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, authed, loading, signOut, refresh } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [addressForm, setAddressForm] = useState<Address | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [profileDraft, setProfileDraft] = useState<{ firstName?: string; lastName?: string; phone?: string }>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [pwDraft, setPwDraft] = useState({ currentPassword: "", newPassword: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!authed) {
      router.replace("/login?returnTo=/account");
      return;
    }
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1"}/account/orders`, { credentials: "include" }).then((r) => r.json()).catch(() => ({ orders: [] })),
      getAddresses()
    ]).then(([o, a]) => {
      setOrders(o.orders ?? []);
      setAddresses(a ?? []);
      setOrdersLoading(false);
    });
  }, [authed, loading, router]);

  useEffect(() => {
    if (user && Object.keys(profileDraft).length === 0) {
      setProfileDraft({ firstName: user.firstName, lastName: user.lastName, phone: user.phone });
    }
  }, [user]);

  async function toggleOrderDetail(orderId: string) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setOrderDetail(null);
      return;
    }
    setExpandedOrder(orderId);
    setDetailLoading(true);
    setOrderDetail(null);
    const detail = await getOrder(orderId);
    setOrderDetail(detail);
    setDetailLoading(false);
  }

  function openAddressForm(address?: Address) {
    setAddressForm(address ? { ...address } : { ...EMPTY_ADDRESS });
    setAddressError(null);
  }

  async function handleAddressSave(event: React.FormEvent) {
    event.preventDefault();
    if (!addressForm) return;
    setSavingAddress(true);
    setAddressError(null);
    const result = addressForm._id ? await updateAddress(addressForm._id, addressForm) : await addAddress(addressForm);
    setSavingAddress(false);
    if (!result.ok) {
      setAddressError(logAndGeneric(result.error, "account:address"));
      return;
    }
    setAddresses(result.addresses ?? []);
    setAddressForm(null);
  }

  async function handleAddressDelete(addressId: string) {
    const result = await deleteAddress(addressId);
    if (result.ok) setAddresses(result.addresses ?? []);
  }

  async function handleProfileSave(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const result = await updateProfile(profileDraft);
    setSavingProfile(false);
    if (!result.ok) { setProfileMsg(logAndGeneric(result.error, "account:profile")); return; }
    await refresh();
    setProfileMsg("Profile updated.");
  }

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault();
    setSavingPw(true);
    setPwMsg(null);
    if (pwDraft.newPassword.length < 8) { setPwMsg("New password must be at least 8 characters."); setSavingPw(false); return; }
    const result = await changePassword(pwDraft);
    setSavingPw(false);
    if (!result.ok) { setPwMsg(result.error ? logAndGeneric(result.error, "account:password") : "Could not change your password."); return; }
    setPwMsg("Password updated.");
    setPwDraft({ currentPassword: "", newPassword: "" });
  }

  if (loading || !authed) return <div className="page-shell"><div className="container"><Loader label="Loading your account" /></div></div>;

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <UserRound size={17} /> },
    { key: "orders", label: "Orders", icon: <PackageCheck size={17} /> },
    { key: "addresses", label: "Addresses", icon: <MapPin size={17} /> },
    { key: "profile", label: "Profile & security", icon: <KeyRound size={17} /> }
  ];

  return (
    <div className="page-shell account-page">
      <div className="container">
        <div className="page-intro page-intro--compact">
          <span className="eyebrow">Your customer area</span>
          <h1>Good to see you{user?.firstName ? `, ${user.firstName}` : ""}.</h1>
          <p>Your profile, orders and saved addresses — all pulled straight from your account.</p>
        </div>
        <div className="account-grid">
          <aside className="account-nav">
            {navItems.map((item) => (
              <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>{item.icon} {item.label}</button>
            ))}
            <button onClick={async () => { await signOut(); router.push("/login"); }}><LogOut size={17} /> Log out</button>
          </aside>

          <section className="account-content">
            {tab === "overview" && (
              <>
                <div className="account-card account-card--hero">
                  <span className="eyebrow">Profile</span>
                  <h2>{user?.firstName ?? "Edwin Customer"}</h2>
                  <p>{user?.email} · {user?.phone ? user.phone : "no phone on file"}</p>
                </div>
                <div className="account-section-head"><h2>Recent orders</h2><button className="text-button" onClick={() => setTab("orders")}>View all</button></div>
                {ordersLoading ? (
                  <p className="auth-note">Loading orders…</p>
                ) : orders.length === 0 ? (
                  <div className="account-card"><p>No orders yet. When you place one, it'll show up here with live status.</p></div>
                ) : (
                  orders.slice(0, 3).map((order) => (
                    <div className="order-card" key={order.id}>
                      <div>
                        <span className="eyebrow">#{order.orderNumber}</span>
                        <h3>{order.lines[0]?.name ?? "Order"}{order.lines.length > 1 ? ` +${order.lines.length - 1} more` : ""}</h3>
                        <p>{order.lines[0]?.variantLabel ? `${order.lines[0].variantLabel} · ` : ""}{order.lines.reduce((sum, line) => sum + line.quantity, 0)} piece(s)</p>
                      </div>
                      <div className="order-card__status"><StatusPill status={order.orderStatus} /><strong>{formatPrice(order.total)}</strong></div>
                    </div>
                  ))
                )}
              </>
            )}

            {tab === "orders" && (
              <>
                <div className="account-section-head"><h2>All orders</h2></div>
                {ordersLoading ? (
                  <Loader label="Loading orders" size="sm" />
                ) : orders.length === 0 ? (
                  <div className="account-card"><p>No orders yet. Your order history will appear here.</p></div>
                ) : (
                  orders.map((order) => (
                    <div className="order-card order-card--expandable" key={order.id}>
                      <button className="order-card__summary" onClick={() => toggleOrderDetail(order.id)}>
                        <div>
                          <span className="eyebrow">#{order.orderNumber}</span>
                          <h3>{order.lines[0]?.name ?? "Order"}{order.lines.length > 1 ? ` +${order.lines.length - 1} more` : ""}</h3>
                          <p>{order.lines[0]?.variantLabel ? `${order.lines[0].variantLabel} · ` : ""}{order.lines.reduce((sum, line) => sum + line.quantity, 0)} piece(s)</p>
                        </div>
                        <div className="order-card__status"><StatusPill status={order.orderStatus} /><strong>{formatPrice(order.total)}</strong></div>
                        {expandedOrder === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {expandedOrder === order.id && (
                        <div className="order-detail">
                          {detailLoading ? (
                            <Loader label="Loading details" size="sm" />
                          ) : orderDetail ? (
                            <>
                              <div className="order-detail__meta">
                                <span>Order #{orderDetail.orderNumber}</span>
                                <span>Placed {orderDetail.createdAt ? new Date(orderDetail.createdAt).toLocaleDateString() : "recently"}</span>
                                <span>Payment: {orderDetail.paymentMethod} · {orderDetail.paymentStatus.replace("_", " ")}</span>
                              </div>
                              <h4>Items</h4>
                              <div className="order-lines">
                                {orderDetail.lines?.map((line) => (
                                  <div className="order-line" key={line.sku}>
                                    <span>{line.name}{line.variantLabel ? ` (${line.variantLabel})` : ""} × {line.quantity}</span>
                                    <span>{formatPrice(line.lineTotal)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="order-totals">
                                <span><span>Subtotal</span><span>{formatPrice(orderDetail.subtotal)}</span></span>
                                <span><span>Shipping</span><span>{formatPrice(orderDetail.shippingAmount)}</span></span>
                                {orderDetail.discountAmount > 0 && <span><span>Discount</span><span>−{formatPrice(orderDetail.discountAmount)}</span></span>}
                                <span className="order-totals__grand"><span>Total</span><span>{formatPrice(orderDetail.total)}</span></span>
                              </div>
                              {orderDetail.tracking?.trackingId && (
                                <div className="order-detail__block">
                                  <h4>Tracking</h4>
                                  <p>AWB {orderDetail.tracking.trackingId}{orderDetail.tracking.courier ? ` · ${orderDetail.tracking.courier}` : ""}</p>
                                  {orderDetail.tracking.trackingUrl && <a className="text-button" href={orderDetail.tracking.trackingUrl} target="_blank" rel="noreferrer">Track shipment →</a>}
                                </div>
                              )}
                              {orderDetail.shippingAddress && (
                                <div className="order-detail__block">
                                  <h4>Deliver to</h4>
                                  <p>{orderDetail.shippingAddress.fullName}<br />{orderDetail.shippingAddress.line1}{orderDetail.shippingAddress.line2 ? `, ${orderDetail.shippingAddress.line2}` : ""}<br />{orderDetail.shippingAddress.city}, {orderDetail.shippingAddress.state} {orderDetail.shippingAddress.postalCode}</p>
                                </div>
                              )}
                              {orderDetail.timeline && orderDetail.timeline.length > 0 && (
                                <div className="order-detail__block">
                                  <h4>Timeline</h4>
                                  <ul className="order-timeline">
                                    {orderDetail.timeline.map((entry, index) => (
                                      <li key={index}><CircleCheck size={15} /><span>{entry.message || entry.type.replace("_", " ")}<time>{entry.at ? new Date(entry.at).toLocaleString() : ""}</time></span></li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="auth-note">Could not load order details.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {tab === "addresses" && (
              <>
                <div className="account-section-head"><h2>Saved addresses</h2><button className="button button--ghost button--small" onClick={() => openAddressForm()}><Plus size={15} /> Add address</button></div>
                {addressForm && (
                  <form className="account-card address-form" onSubmit={handleAddressSave}>
                    <h3>{addressForm._id ? "Edit address" : "Add a new address"}</h3>
                    {addressError && <p className="auth-error">{addressError}</p>}
                    <div className="form-grid">
                      <label>Label<select value={addressForm.label || "Home"} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}><option>Home</option><option>Work</option><option>Other</option></select></label>
                      <label>Full name<input required value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} placeholder="Aarav Sharma" /></label>
                      <label className="field-wide">Address line 1<input required value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} placeholder="House, street, area" /></label>
                      <label className="field-wide">Address line 2<input value={addressForm.line2 || ""} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} placeholder="Landmark (optional)" /></label>
                      <label>City<input required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} /></label>
                      <label>State<input required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} /></label>
                      <label>PIN code<input required inputMode="numeric" value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })} /></label>
                      <label>Phone<input required inputMode="tel" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} /></label>
                    </div>
                    <div className="account-card__actions">
                      <button className="button button--dark button--small" type="submit" disabled={savingAddress}>{savingAddress ? <><span className="btn-spinner" aria-hidden="true" /> Saving…</> : "Save address"}</button>
                      <button className="button button--ghost button--small" type="button" onClick={() => setAddressForm(null)}>Cancel</button>
                    </div>
                  </form>
                )}
                {addresses.length === 0 ? (
                  <div className="account-card"><p>No saved addresses yet.</p></div>
                ) : (
                  addresses.map((address) => (
                    <div className="address-card" key={address._id}>
                      <strong>{address.label || "Saved address"}{address.isDefault ? <span className="muted tiny"> · Default</span> : ""}</strong>
                      <p>{address.fullName}<br />{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.city}, {address.state} {address.postalCode}<br />{address.phone}</p>
                      <div className="address-card__actions">
                        <button className="text-button" onClick={() => openAddressForm(address)}><Pencil size={13} /> Edit</button>
                        <button className="text-button text-button--danger" onClick={() => handleAddressDelete(address._id!)}><Trash2 size={13} /> Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {tab === "profile" && (
              <>
                <div className="account-section-head"><h2>Profile</h2></div>
                <form className="account-card" onSubmit={handleProfileSave}>
                  {profileMsg && <p className={profileMsg.includes("updated") || profileMsg.includes("Profile updated") ? "auth-note" : "auth-error"}>{profileMsg}</p>}
                  <div className="form-grid">
                    <label>First name<input value={profileDraft.firstName || ""} onChange={(e) => setProfileDraft({ ...profileDraft, firstName: e.target.value })} /></label>
                    <label>Last name<input value={profileDraft.lastName || ""} onChange={(e) => setProfileDraft({ ...profileDraft, lastName: e.target.value })} /></label>
                    <label className="field-wide">Phone<input inputMode="tel" value={profileDraft.phone || ""} onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })} placeholder="+91 98765 43210" /></label>
                    <label className="field-wide">Email<input disabled value={user?.email || ""} /></label>
                  </div>
                  <div className="account-card__actions">
                    <button className="button button--dark button--small" type="submit" disabled={savingProfile}>{savingProfile ? <><span className="btn-spinner" aria-hidden="true" /> Saving…</> : "Save profile"}</button>
                  </div>
                </form>

                <div className="account-section-head"><h2>Change password</h2></div>
                <form className="account-card" onSubmit={handlePasswordChange}>
                  {pwMsg && <p className={pwMsg.includes("updated") || pwMsg.includes("Password updated") ? "auth-note" : "auth-error"}>{pwMsg}</p>}
                  <div className="form-grid">
                    <label className="field-wide">Current password<input required type="password" autoComplete="current-password" value={pwDraft.currentPassword} onChange={(e) => setPwDraft({ ...pwDraft, currentPassword: e.target.value })} /></label>
                    <label className="field-wide">New password<input required type="password" minLength={8} autoComplete="new-password" value={pwDraft.newPassword} onChange={(e) => setPwDraft({ ...pwDraft, newPassword: e.target.value })} /></label>
                  </div>
                  <div className="account-card__actions">
                    <button className="button button--dark button--small" type="submit" disabled={savingPw}>{savingPw ? <><span className="btn-spinner" aria-hidden="true" /> Updating…</> : "Update password"}</button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}