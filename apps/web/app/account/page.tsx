"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, MapPin, PackageCheck, UserRound } from "lucide-react";
import { useAuth } from "@/components/useAuth";
import { addAddress, deleteAddress, fetchAddresses, updateProfile, type Address } from "@/lib/api";

type Section = "overview" | "orders" | "addresses";

const emptyAddress: Omit<Address, "_id"> = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  phone: "",
  isDefault: false
};

export default function AccountPage() {
  const { user, loading, refresh, signOut } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesError, setAddressesError] = useState("");

  const loadAddresses = useCallback(async () => {
    try {
      const { addresses: next } = await fetchAddresses();
      setAddresses(next);
      setAddressesError("");
    } catch (err) {
      setAddressesError(err instanceof Error ? err.message : "Could not load addresses");
    }
  }, []);

  useEffect(() => {
    if (user) loadAddresses();
  }, [user, loadAddresses]);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="page-shell account-page">
        <div className="container"><p className="account-empty">Loading your account…</p></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-shell account-page">
        <div className="container">
          <div className="page-intro page-intro--compact"><span className="eyebrow">Account</span><h1>Sign in to continue</h1><p>You need to be signed in to view your account.</p></div>
          <div className="account-empty">
            <a className="button button--dark" href="/login">Go to login</a>
          </div>
        </div>
      </div>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Your account";

  return (
    <div className="page-shell account-page">
      <div className="container">
        <div className="page-intro page-intro--compact">
          <span className="eyebrow">Account</span>
          <h1>Good to see you{user.firstName ? `, ${user.firstName}` : ""}.</h1>
          <p>Manage your profile, addresses and orders.</p>
        </div>
        <div className="account-grid">
          <aside className="account-nav">
            <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><UserRound size={17} /> Overview</button>
            <button className={section === "orders" ? "active" : ""} onClick={() => setSection("orders")}><PackageCheck size={17} /> Orders</button>
            <button className={section === "addresses" ? "active" : ""} onClick={() => setSection("addresses")}><MapPin size={17} /> Addresses</button>
            <button onClick={handleLogout}>Log out</button>
          </aside>
          <section className="account-content">
            {section === "overview" && <Overview user={user} refresh={refresh} />}
            {section === "orders" && <Orders />}
            {section === "addresses" && (
              <Addresses addresses={addresses} loadAddresses={loadAddresses} error={addressesError} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Overview({ user, refresh }: { user: NonNullable<ReturnType<typeof useAuth>["user"]>; refresh: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateProfile({ firstName, lastName, phone });
      await refresh();
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="account-card account-card--hero">
        <span className="eyebrow">Profile</span>
        <h2>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Your account"}</h2>
        <p>{user.email}</p>
        {!editing ? (
          <button className="underlined-link" onClick={() => setEditing(true)}>Edit profile <ArrowUpRight size={14} /></button>
        ) : (
          <div className="account-form">
            <div className="auth-name-row">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
            </div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" />
            {error && <p className="auth-error">{error}</p>}
            <div className="account-form__actions">
              <button className="text-button" onClick={() => { setEditing(false); setError(""); }}>Cancel</button>
              <button className="button button--dark" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
            {saved && <p className="auth-note">Profile updated.</p>}
          </div>
        )}
      </div>

      <div className="account-section-head"><h2>Recent orders</h2><button className="text-button" onClick={() => window.location.assign("/account?tab=orders")}>View all</button></div>
      <div className="order-card">
        <div><span className="eyebrow">Your orders</span><h3>No orders yet</h3><p>When you place an order it will appear here.</p></div>
      </div>
    </>
  );
}

function Orders() {
  return (
    <>
      <div className="account-section-head"><h2>Orders</h2></div>
      <div className="order-card">
        <div><span className="eyebrow">Your orders</span><h3>No orders yet</h3><p>When you place an order it will appear here.</p></div>
      </div>
    </>
  );
}

function Addresses({ addresses, loadAddresses, error }: { addresses: Address[]; loadAddresses: () => Promise<void>; error: string }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Address, "_id">>(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (key: keyof Omit<Address, "_id">, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setSaving(true);
    setFormError("");
    try {
      await addAddress(form);
      setForm(emptyAddress);
      setShowForm(false);
      await loadAddresses();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id?: string) => {
    if (!id) return;
    try {
      await deleteAddress(id);
      await loadAddresses();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete address");
    }
  };

  return (
    <>
      <div className="account-section-head">
        <h2>Saved addresses</h2>
        <button className="text-button" onClick={() => { setShowForm((v) => !v); setFormError(""); }}>{showForm ? "Cancel" : "Add address"}</button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {addresses.length === 0 && !showForm && (
        <div className="order-card"><div><span className="eyebrow">Addresses</span><h3>No saved addresses</h3><p>Add a delivery address to speed up checkout.</p></div></div>
      )}

      {addresses.map((addr) => (
        <div className="address-card" key={addr._id}>
          <strong>{addr.label || "Saved address"}{addr.isDefault && " · Default"}</strong>
          <p>{addr.fullName}<br />{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />{addr.city}, {addr.state} {addr.postalCode}<br />{addr.phone}</p>
          <button className="underlined-link" onClick={() => remove(addr._id)}>Remove <ArrowUpRight size={14} /></button>
        </div>
      ))}

      {showForm && (
        <div className="account-card">
          <div className="account-form">
            <input value={form.label ?? ""} onChange={(e) => set("label", e.target.value)} placeholder="Label (e.g. Home)" />
            <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Full name" />
            <input value={form.line1} onChange={(e) => set("line1", e.target.value)} placeholder="Address line 1" />
            <input value={form.line2 ?? ""} onChange={(e) => set("line2", e.target.value)} placeholder="Address line 2 (optional)" />
            <div className="auth-name-row">
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
              <input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="State" />
            </div>
            <div className="auth-name-row">
              <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="Postal code" />
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" />
            </div>
            {formError && <p className="auth-error">{formError}</p>}
            <div className="account-form__actions">
              <button className="text-button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="button button--dark" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save address"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}