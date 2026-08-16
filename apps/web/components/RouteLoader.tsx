"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="route-loader" aria-hidden="true">
      <i />
    </div>
  );
}