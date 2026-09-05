"use client";

import { motion } from "framer-motion";

type HeroHighlightProps = {
  children: React.ReactNode;
  className?: string;
  highlightWords?: string[];
};

export function HeroHighlight({ children, className = "" }: HeroHighlightProps) {
  return (
    <span className={`hero-highlight ${className}`}>
      {children}
    </span>
  );
}