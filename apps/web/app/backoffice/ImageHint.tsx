"use client";

import { useEffect, useState } from "react";

type Dims = { w: number; h: number } | null;

export function ImageHint({ suggested, url }: { suggested: string; url?: string }) {
  const [dims, setDims] = useState<Dims>(null);

  useEffect(() => {
    if (!url) {
      setDims(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setDims(null);
    img.src = url;
  }, [url]);

  return (
    <p className="image-hint">
      <span>Suggested size: <strong>{suggested}</strong></span>
      {dims && <span className="image-hint__current">Current upload: {dims.w} × {dims.h}px</span>}
    </p>
  );
}