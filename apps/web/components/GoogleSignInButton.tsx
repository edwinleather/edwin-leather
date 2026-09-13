"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { completeGoogleAuth } from "@/lib/api";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

type GoogleCredentialResponse = { credential?: string };

type GoogleIdApi = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

export function GoogleSignInButton({
  text = "continue_with",
  onSuccess,
  onError
}: {
  text?: "signin_with" | "signup_with" | "continue_with";
  onSuccess?: (email: string) => void;
  onError?: (message: string) => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initDoneRef = useRef(false);

  const handlersRef = useRef({ onSuccess, onError });
  handlersRef.current = { onSuccess, onError };

  useEffect(() => {
    if (!CLIENT_ID || !window.google || initDoneRef.current) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      cancel_on_tap_outside: true,
      // Use the browser-native FedCM flow so sign-in works even when
      // third-party cookies are blocked (the classic popup shows a blank
      // page in that case).
      use_fedcm_for_prompt: true,
      callback: async (response) => {
        const credential = response?.credential;
        if (!credential) {
          handlersRef.current.onError?.("Google sign-in was cancelled.");
          return;
        }
        setBusy(true);
        try {
          const result = await completeGoogleAuth(credential);
          if (!result.ok) handlersRef.current.onError?.(result.error);
          else handlersRef.current.onSuccess?.(result.user.email);
        } catch (cause) {
          console.debug("[google-signin]", cause);
          handlersRef.current.onError?.("Google sign-in failed. Please try again.");
        } finally {
          setBusy(false);
        }
      }
    });
    initDoneRef.current = true;
  }, [scriptReady]);

  useEffect(() => {
    if (!initDoneRef.current || !window.google || !containerRef.current) return;
    const width = Math.min(400, Math.max(200, containerRef.current.offsetWidth || 320));
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text,
      shape: "pill",
      logo_alignment: "left",
      width
    });
  }, [scriptReady, text]);

  if (!CLIENT_ID) return null;

  return (
    <div className="google-signin-wrap">
      <Script src={GSI_SRC} strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={containerRef} className="google-signin-slot" aria-label="Sign in with Google" />
      {!busy && (
        <p className="tiny muted" style={{ textAlign: "center", marginTop: 6 }}>
          Popup stays blank? Allow cookies for accounts.google.com, or sign in with email above.
        </p>
      )}
      {busy && (
        <div className="google-signin-overlay" aria-hidden="true">
          <span className="btn-spinner" />
        </div>
      )}
    </div>
  );
}
