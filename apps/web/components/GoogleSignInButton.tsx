"use client";

import { useState } from "react";
import { signInWithGoogle, currentIdToken, firebaseConfigured } from "@/lib/firebase";
import { completeFirebaseAuth } from "@/lib/api";
import { GENERIC_ERROR, logAndGeneric } from "@/lib/errors";

export function GoogleSignInButton({ onSuccess, onError, label }: { onSuccess?: (email: string) => void; onError?: (message: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const user = await signInWithGoogle();
      const idToken = await user.getIdToken();
      const result = await completeFirebaseAuth(idToken);
      if (!result.ok) {
        const generic = logAndGeneric(result.error, "google:session");
        setError(generic);
        onError?.(generic);
      } else {
        onSuccess?.(result.user.email);
      }
    } catch (cause) {
      const generic = logAndGeneric(cause, "google");
      setError(generic);
      onError?.(generic);
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseConfigured()) {
    return (
      <button type="button" className="google-button google-button--button google-button--disabled" disabled title="Add NEXT_PUBLIC_FIREBASE_* to enable Google sign-in">
        <GoogleIcon />
        <span>{label ?? "Continue with Google"}</span>
      </button>
    );
  }

  return (
    <>
      <button type="button" className="google-button google-button--button" onClick={handleClick} disabled={busy}>
        <GoogleIcon />
        <span>{busy ? <><span className="btn-spinner" aria-hidden="true" /> Connecting…</> : label ?? "Continue with Google"}</span>
      </button>
      {error && <p className="auth-error">{error}</p>}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
    </svg>
  );
}