import type { Metadata } from "next";
import { ArrowUpRight, MapPin, PackageCheck, UserRound } from "lucide-react";
import { SmoothLink } from "@/components/SmoothLink";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="page-shell account-page">
      <div className="container">
        <div className="page-intro page-intro--compact"><span className="eyebrow">Demo customer area</span><h1>Good to see you.</h1><p>This page is wired as a polished account foundation. Connect real auth and order data later.</p></div>
        <div className="account-grid">
          <aside className="account-nav">
            <button className="active"><UserRound size={17} /> Overview</button>
            <button><PackageCheck size={17} /> Orders</button>
            <button><MapPin size={17} /> Addresses</button>
            <button>Change password</button>
            <button>Log out</button>
          </aside>
          <section className="account-content">
            <div className="account-card account-card--hero"><span className="eyebrow">Profile</span><h2>Demo Customer</h2><p>demo.customer@edwinleathers.example</p><button className="underlined-link">Edit profile <ArrowUpRight size={14} /></button></div>
            <div className="account-section-head"><h2>Recent orders</h2><button className="text-button">View all</button></div>
            <div className="order-card">
              <div><span className="eyebrow">#EL-10482</span><h3>Heritage Tote</h3><p>Cognac · 1 piece</p></div>
              <div className="order-card__status"><span>Shipped</span><strong>₹6,490</strong></div>
              <div className="order-card__tracking"><p>Courier: Delhivery</p><p>AWB: DEMO123456789</p><a href="#">Track shipment <ArrowUpRight size={14} /></a></div>
            </div>
            <div className="account-section-head"><h2>Saved address</h2><button className="text-button">Manage</button></div>
            <div className="address-card"><strong>Home</strong><p>Demo Customer<br />21 Sample Lane, New Delhi<br />Delhi 110001<br />+91 90000 00000</p></div>
          </section>
        </div>
      </div>
    </div>
  );
}
