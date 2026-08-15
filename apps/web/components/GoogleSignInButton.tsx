"use client";

import { useEffect, useRef, useState } from "react";
import { loginWithGoogle } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean }) => void;
          renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; width?: number; shape?: string; text?: string }) => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignInButton({ onSuccess, onError, label }: { onSuccess?: (email: string) => void; onError?: (message: string) => void; label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    if (window.google?.accounts) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError("Google sign-in could not load. Please try again.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!ready || !window.google?.accounts || !containerRef.current || renderedRef.current) return;
    renderedRef.current = true;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID!,
      auto_select: false,
      callback: async (response) => {
        try {
          const result = await loginWithGoogle(response.credential);
          if (!result.ok) {
            setError(result.error);
            onError?.(result.error);
          } else {
            onSuccess?.(result.user.email);
          }
        } catch {
          setError("Google sign-in failed. Please try again.");
          onError?.("Google sign-in failed. Please try again.");
        }
      }
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      shape: "rectangular",
      text: (label?.toLowerCase().includes("sign in") ? "signin_with" : "continue_with") as "signin_with" | "continue_with"
    });
  }, [ready, label]);

  if (!CLIENT_ID) {
    return (
      <div className="google-button google-button--disabled" title="Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in">
        <GoogleIcon />
        <span>{label ?? "Continue with Google"}</span>
        <small>Not configured</small>
      </div>
    );
  }

  return (
    <>
      <div className="google-button">
        {ready ? <div ref={containerRef} aria-label="Continue with Google" /> : <div className="google-button__placeholder">Loading Google sign-in…</div>}
      </div>
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