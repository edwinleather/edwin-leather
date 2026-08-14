"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMe, logout, type AccountMe } from "@/lib/api";

export function useAuth() {
  const [me, setMe] = useState<AccountMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchMe().then((result) => {
      if (active) {
        setMe(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const result = await fetchMe();
    setMe(result);
    setLoading(false);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setMe({ ok: false });
  }, []);

  return {
    user: me?.ok ? me.user : null,
    authed: Boolean(me?.ok),
    loading,
    refresh,
    signOut
  };
}