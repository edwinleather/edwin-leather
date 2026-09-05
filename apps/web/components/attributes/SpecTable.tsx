type SpecRow = { key: string; label: string; value: string | string[] };

type Props = {
  attributes: SpecRow[];
  // key -> whether the attribute is customer-visible. When omitted, all
  // attributes are shown (backward compatibility with legacy data).
  refs?: Record<string, { customerVisible?: boolean }>;
};

// Renders a product's attributes, only showing those the category marks
// customer-visible. Reusable across product detail pages.
export function SpecTable({ attributes, refs }: Props) {
  const rows = attributes.filter((row) => {
    if (!refs) return true;
    return refs[row.key]?.customerVisible === true;
  });
  if (rows.length === 0) return null;

  return (
    <div className="product-specs__grid">
      {rows.map((row) => (
        <div key={row.key} className="product-specs__item">
          <span className="product-specs__label">{row.label}</span>
          <span className="product-specs__value">{Array.isArray(row.value) ? row.value.join(", ") : row.value}</span>
        </div>
      ))}
    </div>
  );
}