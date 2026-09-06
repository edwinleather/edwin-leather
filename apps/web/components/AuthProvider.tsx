"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchMe, logout, type AccountMe } from "@/lib/api";

type AuthUser = {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  provider?: string;
  role: string;
  addresses: unknown[];
  emailVerifiedAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  authed: boolean;
  loading: boolean;
  refresh: () => Promise<AccountMe>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  const value: AuthContextValue = {
    user: me?.ok ? me.user : null,
    authed: Boolean(me?.ok),
    loading,
    refresh,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}