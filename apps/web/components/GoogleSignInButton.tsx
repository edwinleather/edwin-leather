"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loginWithGoogle } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleSignInButton({ onSuccess, onError }: { onSuccess?: () => void; onError?: (message: string) => void }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      try {
        await loginWithGoogle(response.credential);
        onSuccess?.();
      } catch (error) {
        onError?.(error instanceof Error ? error.message : "Google sign-in failed");
      }
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setStatus("error");
      return;
    }
    if (renderedRef.current) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || renderedRef.current) return;
      renderedRef.current = true;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false
      });
      if (containerRef.current) {
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: 320
        });
      }
      setStatus("ready");
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      script.onerror = () => setStatus("error");
      document.head.appendChild(script);
    }
  }, [handleCredential]);

  if (status === "error") {
    return (
      <p className="auth-note">
        Google sign-in is not configured yet. Add{" "}
        <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to <code>.env.local</code> and restart the dev server.
      </p>
    );
  }

  return (
    <div className="google-button">
      <div ref={containerRef} className="google-button__slot" />
      {status === "loading" && <div className="auth-note">Loading Google sign-in…</div>}
    </div>
  );
}