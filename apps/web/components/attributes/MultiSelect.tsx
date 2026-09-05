"use client";

type Props = {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
};

// Multi-select control. Renders a checkbox group when options are defined,
// otherwise a comma-separated text input for free-form values.
export function MultiSelect({ options, value, onChange }: Props) {
  function toggle(option: string) {
    const has = value.includes(option);
    onChange(has ? value.filter((v) => v !== option) : [...value, option]);
  }

  if (options.length === 0) {
    return (
      <input
        value={value.join(", ")}
        onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        placeholder="Enter values, comma separated"
      />
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {options.map((option) => (
        <label key={option} className="toggle-label">
          <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} /> {option}
        </label>
      ))}
    </div>
  );
}