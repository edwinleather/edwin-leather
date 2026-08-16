"use client";

import { useRef, useState } from "react";
import { Database, Download, Loader2, Upload } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type DumpMeta = { format: string; version: number; exportedAt: string; databases: Record<string, Record<string, unknown[]>> };

export function DatabaseManager() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function download() {
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/admin/export/database`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage({ ok: false, text: body?.error || "Export failed. Check you have superadmin access." });
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const filename = match?.[1] || `edwin-database-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage({ ok: true, text: "Database downloaded. Upload it into a new database of the same name to migrate." });
    } catch {
      setMessage({ ok: false, text: "Could not download the database." });
    } finally {
      setDownloading(false);
    }
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const text = await file.text();
      const dump = JSON.parse(text) as DumpMeta;
      if (dump.format !== "edwin-database-dump") throw new Error("Not an Edwin database export file.");
      if (!confirm("This will OVERWRITE all current data with the uploaded database. Continue?")) {
        setMessage({ ok: false, text: "Import cancelled." });
        return;
      }
      const res = await fetch(`${API}/admin/import/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dump)
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage({ ok: false, text: body?.error || "Import failed." });
        return;
      }
      setMessage({ ok: true, text: body?.message || "Database restored." });
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not read that file." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__head"><div><span className="eyebrow">Migration</span><h2>Database backup &amp; restore</h2></div></div>
      <p className="muted" style={{ maxWidth: 640, lineHeight: 1.7 }}>
        Download the entire database (store + backoffice) as a BSON Extended JSON dump that preserves every field and type.
        To switch to a new database, create it with the same database names, point this app at it, then upload the file here to restore everything.
      </p>

      <div className="form-actions" style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="button button--dark" onClick={download} disabled={downloading}>
          {downloading ? <><span className="btn-spinner" aria-hidden="true" /> Exporting…</> : <><Download size={16} /> Download database</>}
        </button>
        <button className="button button--ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <><span className="btn-spinner" aria-hidden="true" /> Importing…</> : <><Upload size={16} /> Upload database</>}
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onFile} />
      </div>

      {message && <p className={message.ok ? "ok-note" : "auth-error"} style={{ marginTop: 16 }}>{message.text}</p>}

      <div className="admin-note" style={{ marginTop: 22, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Database size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>Only a superadmin can download or restore the database. Uploading a dump fully overwrites existing data, so keep a fresh export before you restore.</span>
      </div>
    </section>
  );
}
