"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

const ROLES = ["employee", "admin", "superadmin"] as const;
type Role = (typeof ROLES)[number];

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  permissions: string[];
};

export function AdminsManager() {
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", name: "", role: "employee" as Role });
  const [query, setQuery] = useState("");

  const load = async () => {
    try {
      const res = await fetch(`${API}/admin/users`, { credentials: "include" });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not load admin users");
      setRows(body.data);
    } catch {
      setError("Could not load admin users");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const q = query.trim().toLowerCase();
  const visible = (rows ?? []).filter((row) => !q || row.email.toLowerCase().includes(q) || (row.name ?? "").toLowerCase().includes(q) || row.role.includes(q));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`${API}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form)
    });
    const body = await res.json();
    if (!res.ok) return setError(body?.error || "Could not add user");
    setForm({ email: "", name: "", role: "employee" });
    load();
  }

  async function patch(row: AdminUser, patch: Partial<AdminUser>) {
    const res = await fetch(`${API}/admin/users/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch)
    });
    if (res.ok) load();
    else setError(((await res.json())?.error) || "Update failed");
  }

  async function remove(row: AdminUser) {
    if (!confirm(`Remove ${row.email} from backoffice access?`)) return;
    const res = await fetch(`${API}/admin/users/${row.id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  }

  if (!rows) return <div className="admin-panel">{error ? <p className="auth-error">{error}</p> : "Loading admin users…"}</div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Access control</span><h2>Admin users</h2></div>
        <span className="muted" style={{ fontSize: 13 }}>Only these people can open the backoffice. Roles decide which features they see.</span>
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or role" /></label>

      <form className="checkout-form" onSubmit={add} style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
        <div className="form-grid">
          <label>Email <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" /></label>
          <label>Name <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Optional" /></label>
          <label>Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <button type="submit" className="button button--dark"><UserPlus size={15} /> Add admin user</button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={5} className="muted">No admin users match your search.</td></tr>}
            {visible.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.name || "-"}</strong></td>
                <td>{row.email}</td>
                <td>
                  <select value={row.role} onChange={(e) => patch(row, { role: e.target.value as Role })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td><span className={`status ${row.active ? "status--confirmed" : ""}`}>{row.active ? "Active" : "Disabled"}</span></td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="text-button" onClick={() => patch(row, { active: !row.active })}>{row.active ? "Disable" : "Enable"}</button>
                  <button className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => remove(row)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}