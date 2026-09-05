"use client";

import { useId, useState } from "react";

type PlaceholdersInputProps = {
  label: string;
  icon?: React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  rightSlot?: React.ReactNode;
};

export function PlaceholdersInput({ label, icon, inputProps, rightSlot }: PlaceholdersInputProps) {
  const id = useId();
  const [value, setValue] = useState(inputProps?.value ?? "");

  const isFloating = String(value).length > 0 || inputProps?.type === "date";

  return (
    <div className={`ph-input${isFloating ? " is-floating" : ""}`}>
      {icon && <span className="ph-input__icon">{icon}</span>}
      <input
        {...inputProps}
        id={id}
        value={value}
        onChange={(e) => { setValue(e.target.value); inputProps?.onChange?.(e); }}
        placeholder=" "
        className="ph-input__field"
      />
      <label htmlFor={id} className="ph-input__label">{label}</label>
      {rightSlot && <span className="ph-input__right">{rightSlot}</span>}
    </div>
  );
}