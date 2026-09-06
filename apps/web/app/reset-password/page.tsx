"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, TriangleAlert } from "lucide-react";
import { resetPassword } from "@/lib/api";
import { PlaceholdersInput } from "@/components/ui/PlaceholdersInput";
import { GENERIC_ERROR } from "@/lib/errors";

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-panel-wrap">
        <Suspense fallback={null}>
          <ResetPasswordCard />
        </Suspense>
      </div>
    </div>
  );
}

function ResetPasswordCard() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="auth-card">
        <div className="auth-card__heading"><span className="eyebrow">Password reset</span><h1>Link missing.</h1></div>
        <p className="auth-error">This reset link is missing its token. Request a new one from the sign-in page.</p>
        <p className="auth-switch"><button type="button" className="text-button" onClick={() => router.push("/login")}>Back to sign in</button></p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-card">
        <div className="auth-card__heading"><span className="eyebrow">Password reset</span><h1>Password updated.</h1></div>
        <p className="auth-note">Your password has been changed. Sign in with your new password.</p>
        <button className="button button--dark button--full" type="button" onClick={() => router.push("/login")}>Go to sign in <ArrowRight size={15} /></button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const result = await resetPassword(token, password);
      if (!result.ok) {
        setError(result.error || GENERIC_ERROR);
        return;
      }
      setDone(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(message || GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card__heading">
        <span className="eyebrow">Password reset</span>
        <h1>Choose a new password.</h1>
        <p>Pick something memorable. You'll use it the next time you sign in.</p>
      </div>
      {error && <p className="auth-error"><TriangleAlert size={15} /> {error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          New password
          <PlaceholdersInput
            label="New password"
            icon={<LockKeyhole size={16} />}
            rightSlot={<button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
            inputProps={{ required: true, type: showPassword ? "text" : "password", autoComplete: "new-password", minLength: 8, value: password, onChange: (event) => setPassword(event.target.value) }}
          />
        </label>
        <label>
          Confirm new password
          <PlaceholdersInput
            label="Confirm new password"
            icon={<LockKeyhole size={16} />}
            inputProps={{ required: true, type: showPassword ? "text" : "password", autoComplete: "new-password", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value) }}
          />
        </label>
        <button className="button button--dark button--full" type="submit" disabled={busy}>
          {busy ? <><span className="btn-spinner" aria-hidden="true" /> Updating…</> : <>Set password <ArrowRight size={15} /></>}
        </button>
      </form>
      <p className="auth-switch"><button type="button" className="text-button" onClick={() => router.push("/login")}>Back to sign in</button></p>
    </div>
  );
}