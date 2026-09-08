"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export function SmoothLink({
  href,
  children,
  className,
  onClick,
  ariaLabel
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => onClick?.()}
      aria-label={ariaLabel}
      prefetch={true}
    >
      {children}
    </Link>
  );
}
