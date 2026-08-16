"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Trash2, Star } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Feedback = {
  _id: string;
  name?: string;
  email?: string;
  customerId?: string;
  topic?: string;
  rating?: number;
  message: string;
  status: "new" | "read" | "resolved";
  createdAt: string;
};

const FILTERS = ["all", "new", "read", "resolved"] as const;

export function FeedbackManager() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/feedback?status=${filter}`, { credentials: "include" });
      const body = await res.json();
      setItems(body?.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function setStatus(item: Feedback, status: Feedback["status"]) {
    await fetch(`${API}/admin/feedback/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status })
    });
    load();
  }

  async function remove(item: Feedback) {
    await fetch(`${API}/admin/feedback/${item._id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  const q = query.trim().toLowerCase();
  const visible = items.filter(
    (item) => !q || (item.name ?? "").toLowerCase().includes(q) || (item.email ?? "").toLowerCase().includes(q) || (item.topic ?? "").toLowerCase().includes(q) || item.message.toLowerCase().includes(q)
  );

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div><span className="eyebrow">Customer feedback</span><h1>What customers think</h1></div>
      </header>
      <div className="admin-tabs">
        {FILTERS.map((value) => (
          <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}</button>
        ))}
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or message" /></label>

      {loading ? (
        <p className="admin-empty"><Loader2 size={18} className="spin" /> Loading feedback…</p>
      ) : items.length === 0 ? (
        <p className="admin-empty">No feedback here yet.</p>
      ) : visible.length === 0 ? (
        <p className="admin-empty">No feedback matches your search.</p>
      ) : (
        <div className="admin-feedback-list">
          {visible.map((item) => (
            <article className="admin-feedback-card" key={item._id}>
              <div className="admin-feedback-card__head">
                <div>
                  <strong>{item.name || "Anonymous"}</strong>
                  {item.rating ? (
                    <span className="rating-input" aria-label={`${item.rating} stars`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={13} fill={n <= (item.rating as number) ? "currentColor" : "none"} color={n <= (item.rating as number) ? "var(--star, #d4a24c)" : "var(--muted)"} />
                      ))}
                    </span>
                  ) : null}
                </div>
                <span className={`status status--${item.status}`}>{item.status}</span>
              </div>
              <p className="admin-feedback-card__meta">{item.topic || "General"} · {item.email ? item.email : "no email"} · {new Date(item.createdAt).toLocaleString()}</p>
              <p className="admin-feedback-card__body">{item.message}</p>
              <div className="admin-feedback-card__actions">
                <button className="button button--ghost button--small" onClick={() => setStatus(item, item.status === "resolved" ? "new" : "resolved")}>{item.status === "resolved" ? "Reopen" : "Mark resolved"}</button>
                {item.status !== "read" && <button className="button button--ghost button--small" onClick={() => setStatus(item, "read")}>Mark read</button>}
                <button className="button button--ghost button--small text-button--danger" onClick={() => remove(item)}><Trash2 size={14} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}