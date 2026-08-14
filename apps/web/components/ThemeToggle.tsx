"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark" || current === "light") setTheme(current);
  }, []);

  function toggle() {
    const root = document.documentElement;
    const next: "light" | "dark" = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("el-theme", next); } catch { /* private mode */ }
    setTheme(next);
    window.setTimeout(() => root.classList.remove("theme-switching"), 420);
  }

  return (
    <button className={`header-action theme-toggle ${className}`.trim()} onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}