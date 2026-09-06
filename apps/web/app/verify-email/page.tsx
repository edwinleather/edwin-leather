"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, Loader2, TriangleAlert } from "lucide-react";
import { verifyEmail } from "@/lib/api";
import { useAuth } from "@/components/useAuth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const { refresh } = useAuth();

  const [state, setState] = useState<"checking" | "done" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token. Sign in to request a fresh one.");
      return;
    }
    let active = true;
    verifyEmail(token)
      .then(async (result) => {
        if (!active) return;
        if (result.ok) {
          await refresh().catch(() => {});
          setState("done");
        } else {
          setState("error");
          setMessage(result.error || "This verification link is invalid or has expired. Sign in to request a new one.");
        }
      })
      .catch(() => {
        if (!active) return;
        setState("error");
        setMessage("Could not verify your email right now. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [token, refresh]);

  return (
    <div className="auth-page">
      <div className="auth-panel-wrap">
        <div className="auth-card">
          <div className="auth-card__heading">
            <span className="eyebrow">Email verification</span>
            <h1>{state === "error" ? "That link didn't work." : state === "done" ? "You're all set." : "Verifying your email…"}</h1>
          </div>
          <div className="auth-note" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {state === "checking" && <><Loader2 size={16} className="spin" /> <span>Verifying your email address…</span></>}
            {state === "done" && <><CircleCheck size={18} /> <span>Your email is verified. {message || "You can now sign in and place orders."}</span></>}
            {state === "error" && <><TriangleAlert size={18} /> <span>{message}</span></>}
          </div>
          <p className="auth-switch">
            {state === "error" || state === "done" ? (
              <button type="button" className="text-button" onClick={() => router.push("/login")}>Go to sign in</button>
            ) : (
              <button type="button" className="text-button" onClick={() => router.push("/")}>Back to shop</button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}