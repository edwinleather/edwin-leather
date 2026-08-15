"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onClick?.();

    const documentWithTransitions = document as Document & {
      startViewTransition?: (callback: () => void) => {
        finished: Promise<void>;
      };
    };

    if (documentWithTransitions.startViewTransition) {
      try {
        const transition = documentWithTransitions.startViewTransition(() => router.push(href));
        // Transitions are aborted (InvalidStateError) on rapid navigation or
        // when a new transition starts before the previous one finished.
        // The navigation itself already happened, so swallow the rejection.
        transition.finished.catch(() => undefined);
      } catch {
        router.push(href);
      }
    } else {
      router.push(href);
    }
  }

  return (
    <a href={href} className={className} onClick={handleClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
