"use client";

import type { Attribute, CategoryAttributeRef } from "@/lib/field-defs";
import { AttributeField } from "./AttributeField";

type Props = {
  refs: CategoryAttributeRef[];
  values: Record<string, string | string[]>;
  onChange: (key: string, value: string | string[]) => void;
  errors?: Record<string, string>;
};

// Maps a category's attached attributes to a grid of AttributeField controls.
export function AttributeFields({ refs, values, onChange, errors }: Props) {
  const valid = refs.filter((r) => typeof r.attributeId === "object" && r.attributeId);
  if (valid.length === 0) return null;

  return (
    <div className="form-grid">
      {valid.map((ref) => {
        const attribute = ref.attributeId as Attribute;
        return (
          <AttributeField
            key={attribute.key}
            attribute={attribute}
            required={ref.required}
            value={values[attribute.key] ?? (attribute.type === "multi" ? [] : "")}
            onChange={(value) => onChange(attribute.key, value)}
            error={errors?.[attribute.key]}
          />
        );
      })}
    </div>
  );
}