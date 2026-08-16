"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

export type CodConfigData = { enabled: boolean };

export function useCodConfig(): { loaded: boolean; enabled: boolean } {
  const [loaded, setLoaded] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${API}/cod/config`)
      .then((r) => r.json())
      .then((body) => {
        if (active && body?.data) setEnabled(Boolean(body.data.enabled));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return { loaded, enabled };
}