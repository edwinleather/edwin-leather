"use client";

import type { Attribute } from "@/lib/field-defs";
import { MultiSelect } from "./MultiSelect";

type Props = {
  attribute: Attribute;
  required?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string | null;
};

// Renders the correct control for a single attribute based on its `type`.
export function AttributeField({ attribute, required, value, onChange, error }: Props) {
  const type = attribute.type;
  const label = `${attribute.name}${required ? " *" : ""}`;

  return (
    <label className={type === "textarea" ? "field-wide" : undefined}>
      {label}

      {type === "textarea" && (
        <textarea rows={3} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} required={required} />
      )}

      {type === "select" && (
        <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} required={required}>
          <option value="">Select…</option>
          {(attribute.options ?? []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )}

      {type === "yesno" && (
        <span className="toggle-label">
          <input type="checkbox" checked={(value as string) === "Yes"} onChange={(e) => onChange(e.target.checked ? "Yes" : "No")} /> Yes
        </span>
      )}

      {type === "number" && (
        <input type="number" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} required={required} />
      )}

      {type === "multi" && (
        <MultiSelect options={attribute.options ?? []} value={Array.isArray(value) ? value : []} onChange={onChange} />
      )}

      {type === "text" && (
        <input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} required={required} />
      )}

      {error && <small className="auth-error">{error}</small>}
    </label>
  );
}