"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, PackageCheck, UserRound, LogOut } from "lucide-react";
import { fetchMe } from "@/lib/api";
import { useAuth } from "@/components/useAuth";
import { formatPrice } from "@/lib/format";

type Order = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  currency: string;
  lines: { name: string; variantLabel?: string; quantity: number; unitPrice: number }[];
  createdAt?: string;
};

type Address = { _id: string; label?: string; fullName?: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; phone?: string };

export default function AccountPage() {
  const router = useRouter();
  const { user, authed, loading, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!authed) {
      router.replace("/login?returnTo=/account");
      return;
    }
    fetchMe().catch(() => {});
    Promise.all([fetch(`${process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1"}/account/orders`, { credentials: "include" }).then((r) => r.json()).catch(() => ({ orders: [] })), fetch(`${process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1"}/account/addresses`, { credentials: "include" }).then((r) => r.json()).catch(() => ({ addresses: [] }))]).then(([o, a]) => {
      setOrders(o.orders ?? []);
      setAddresses(a.addresses ?? []);
      setOrdersLoading(false);
    });
  }, [authed, loading, router]);

  if (loading || !authed) return <div className="page-shell"><div className="container"><p className="auth-note">Loading your account…</p></div></div>;

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
            <button className="active"><UserRound size={17} /> Overview</button>
            <button><PackageCheck size={17} /> Orders</button>
            <button><MapPin size={17} /> Addresses</button>
            <button onClick={async () => { await signOut(); router.push("/login"); }}><LogOut size={17} /> Log out</button>
          </aside>
          <section className="account-content">
            <div className="account-card account-card--hero">
              <span className="eyebrow">Profile</span>
              <h2>{user?.firstName ?? "Edwin Customer"}</h2>
              <p>{user?.email} · {user?.phone ? user.phone : "no phone on file"}</p>
            </div>

            <div className="account-section-head"><h2>Recent orders</h2></div>
            {ordersLoading ? (
              <p className="auth-note">Loading orders…</p>
            ) : orders.length === 0 ? (
              <div className="account-card"><p>No orders yet. When you place one, it'll show up here with live status.</p></div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div className="order-card" key={order.id}>
                  <div>
                    <span className="eyebrow">#{order.orderNumber}</span>
                    <h3>{order.lines[0]?.name ?? "Order"}{order.lines.length > 1 ? ` +${order.lines.length - 1} more` : ""}</h3>
                    <p>{order.lines[0]?.variantLabel ? `${order.lines[0].variantLabel} · ` : ""}{order.lines.reduce((sum, line) => sum + line.quantity, 0)} piece(s)</p>
                  </div>
                  <div className="order-card__status"><span>{order.orderStatus.replace("_", " ")}</span><strong>{formatPrice(order.total)}</strong></div>
                </div>
              ))
            )}

            <div className="account-section-head"><h2>Saved address</h2></div>
            {addresses.length === 0 ? (
              <div className="account-card"><p>No saved addresses yet.</p></div>
            ) : (
              addresses.map((address) => (
                <div className="address-card" key={address._id}>
                  <strong>{address.label || "Saved address"}</strong>
                  <p>{address.fullName}<br />{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.city}, {address.state} {address.postalCode}<br />{address.phone}</p>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}