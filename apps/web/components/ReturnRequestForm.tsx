"use client";

import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { requestReturn } from "@/lib/api";
import { formatPrice } from "@/lib/format";

const REASON_OPTIONS = [
  { value: "wrong_item", label: "Wrong item received", question: "Which item did you receive instead?" },
  { value: "damaged", label: "Damaged / broken on arrival", question: "What is damaged about the item?" },
  { value: "defective", label: "Defective / not working as expected", question: "What is wrong with the item?" },
  { value: "quality", label: "Quality not as expected", question: "How is the quality different from expected?" },
  { value: "sizing", label: "Does not fit / wrong size", question: "What size did you need instead?" },
  { value: "changed_mind", label: "Changed my mind", question: "Any additional detail you'd like to share?" }
];

const CONDITION_OPTIONS = [
  { value: "unused", label: "Unused, with tags attached" },
  { value: "used_like_new", label: "Used, but in like-new condition" },
  { value: "used_slightly", label: "Used slightly, shows normal wear" },
  { value: "damaged", label: "Damaged (came this way or during use)" }
];

type Line = { productId: string; variantId: string; sku: string; name: string; variantLabel?: string; quantity: number; unitPrice: number; lineTotal: number };export type ReturnOrderDetail = { id: string; lines: Line[] };

export function ReturnRequestForm({ order, onDone, onClose }: { order: { id: string; lines: Line[] }; onDone: () => void; onClose: () => void }) {
  const [selected, setSelected] = useState<Record<string, number>>(() => Object.fromEntries(order.lines.map((l) => [l.sku, l.quantity])));
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(order.lines.map((l) => [l.sku, 1])));
  const [reasonCategory, setReasonCategory] = useState("");
  const [reason, setReason] = useState("");
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLines = order.lines.filter((l) => selected[l.sku]);
  const selectedReason = REASON_OPTIONS.find((r) => r.value === reasonCategory);

  function toggleLine(sku: string) {
    setSelected((s) => ({ ...s, [sku]: s[sku] ? 0 : 1 }));
  }

  function submit() {
    setError(null);
    if (selectedLines.length === 0) return setError("Select at least one item to return.");
    if (!reasonCategory) return setError("Please choose a reason for the return.");
    if (reason.trim().length < 3) return setError("Please answer the question above so we can help faster.");
    setSubmitting(true);
    requestReturn({
      orderId: order.id,
      reasonCategory,
      reason: reason.trim(),
      condition,
      notes: notes.trim() || undefined,
      items: selectedLines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: quantities[l.sku] || 1, issueType: reasonCategory }))
    })
      .then((result) => {
        if (!result.ok) return setError(result.error || "Could not submit return request.");
        onDone();
      })
      .catch(() => setError("Could not submit return request."))
      .finally(() => setSubmitting(false));
  }

  return (
    <div className="return-form">
      <div className="return-form__head">
        <div><RotateCcw size={18} /><strong>Request a return</strong></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={16} /></button>
      </div>

      <div className="return-form__section">
        <span className="eyebrow">1 · Select items to return</span>
        {order.lines.map((line) => (
          <label className="return-item" key={line.sku}>
            <input type="checkbox" checked={Boolean(selected[line.sku])} onChange={() => toggleLine(line.sku)} />
            <span className="return-item__name">
              <strong>{line.name}{line.variantLabel ? ` (${line.variantLabel})` : ""}</strong>
              <small>{formatPrice(line.unitPrice)} each</small>
            </span>
            {selected[line.sku] ? (
              <span className="return-qty">
                <button type="button" onClick={() => setQuantities((q) => ({ ...q, [line.sku]: Math.max(1, (q[line.sku] || 1) - 1) }))}>−</button>
                <span>{quantities[line.sku]}</span>
                <button type="button" onClick={() => setQuantities((q) => ({ ...q, [line.sku]: Math.min(line.quantity, (q[line.sku] || 1) + 1) }))}>+</button>
              </span>
            ) : null}
          </label>
        ))}
      </div>

      <div className="return-form__section">
        <span className="eyebrow">2 · What's the reason?</span>
        <div className="return-reasons">
          {REASON_OPTIONS.map((option) => (
            <button type="button" key={option.value} className={reasonCategory === option.value ? "active" : ""} onClick={() => setReasonCategory(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
        {selectedReason && (
          <label className="return-question">
            {selectedReason.question}
            <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us more…" />
          </label>
        )}
      </div>

      <div className="return-form__section">
        <span className="eyebrow">3 · Condition</span>
        <div className="return-reasons return-reasons--stack">
          {CONDITION_OPTIONS.map((option) => (
            <button type="button" key={option.value} className={condition === option.value ? "active" : ""} onClick={() => setCondition(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="return-form__section">
        <span className="eyebrow">4 · Anything else? (optional)</span>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Order notes, preference, etc." />
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button className="button button--dark button--full" onClick={submit} disabled={submitting}>
        {submitting ? <><span className="btn-spinner" aria-hidden="true" /> Submitting…</> : "Submit return request"}
      </button>
    </div>
  );
}