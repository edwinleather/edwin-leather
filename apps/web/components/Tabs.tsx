"use client";

import { motion } from "framer-motion";

type TabsProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export function Tabs({ options, value, onChange, ariaLabel = "Filters" }: TabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            className={`tabs__tab${active ? " is-active" : ""}`}
            onClick={() => onChange(option)}
          >
            {active && <motion.span className="tabs__pill" layoutId="tabs-pill" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className="tabs__label">{option}</span>
          </button>
        );
      })}
    </div>
  );
}