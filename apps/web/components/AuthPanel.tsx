"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { completeFirebaseAuth } from "@/lib/api";
import { createAccountWithEmail, signInWithPassword, sendPasswordReset, currentIdToken, resendEmailVerification, firebaseConfigured } from "@/lib/firebase";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/components/useAuth";
import { GENERIC_ERROR, logAndGeneric } from "@/lib/errors";

type Mode = "login" | "signup";

export function AuthPanel({ initialMode = "login" }: { initialMode?: Mode }) {
  return (
    <Suspense fallback={null}>
      <AuthPanelInner initialMode={initialMode} />
    </Suspense>
  );
}

function AuthPanelInner({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") || "/account";
  const { authed, loading, refresh } = useAuth();

  // Already signed in? Skip the login page and go straight to the destination.
  useEffect(() => {
    if (!loading && authed) router.replace(returnTo);
  }, [loading, authed, returnTo, router]);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [view, setView] = useState<"form" | "reset">("form");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setView("form");
    setError(null);
    setNote(null);
  }

  async function finishSession(idToken: string, extra?: { firstName?: string; lastName?: string; phone?: string }) {
    const result = await completeFirebaseAuth(idToken, extra);
    if (!result.ok) throw new Error(result.error);
    await refresh();
    router.push(returnTo);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!firebaseConfigured()) {
      setError("Firebase isn't configured yet. Add your NEXT_PUBLIC_FIREBASE_* values first.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
      setBusy(true);
      try {
        await createAccountWithEmail(email, password);
        try {
          localStorage.setItem("el-pending-profile", JSON.stringify({ firstName, lastName: lastName || undefined, phone }));
        } catch { /* ignore */ }
        setView("reset");
        setNote("We've created your account and sent a verification link to your email. Open it to activate your account.");
      } catch (cause) {
        if (/already-in-use/i.test(String(cause instanceof Error ? cause.message : cause))) {
          setError("An account with that email already exists. Try signing in instead.");
        } else {
          setError(messageOf(cause));
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const user = await signInWithPassword(email, password);
      if (!user.emailVerified) {
        setView("reset");
        setNote("Please verify your email before signing in. We've sent a link to your inbox - open it to activate your account.");
        return;
      }
      let extra: { firstName?: string; lastName?: string; phone?: string } | undefined;
      try {
        const pending = localStorage.getItem("el-pending-profile");
        if (pending) {
          extra = JSON.parse(pending);
          localStorage.removeItem("el-pending-profile");
        }
      } catch { /* ignore */ }
      const idToken = await currentIdToken();
      try {
        await finishSession(idToken, extra);
      } catch (cause) {
        setError(logAndGeneric(cause, "auth:session"));
      }
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!firebaseConfigured()) { setError("Firebase isn't configured yet."); return; }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setView("reset");
      setNote("If an account exists for that email, a password reset link is on its way. Open it to set a new password.");
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  const goBackToForm = () => { setView("form"); setError(null); setNote(null); };

  async function handleResend() {
    setError(null);
    setResending(true);
    try {
      await resendEmailVerification();
      setNote("We've re-sent the verification link. Check your inbox (and spam folder) and open it to activate your account.");
    } catch (cause) {
      if (/no current user|not signed in/i.test(String(cause instanceof Error ? cause.message : cause))) {
        setError("Session expired. Sign in again to re-send the link.");
      } else {
        setError(messageOf(cause));
      }
    } finally {
      setResending(false);
    }
  }

  if (view === "reset") {
    return (
      <div className="auth-card">
        <div className="auth-card__heading">
          <span className="eyebrow">Check your inbox</span>
          <h1>Almost there.</h1>
          <p><strong>{email || "Your email"}</strong> should receive a link from Edwin. Open it to continue, then come back and sign in. If it doesn't arrive within a few minutes, check your spam or promotions folder.</p>
        </div>
        {error && <p className="auth-error">{error}</p>}
        {note && <p className="auth-note">{note}</p>}
        <button className="button button--dark button--full" type="button" onClick={handleResend} disabled={resending}>
          {resending ? <><span className="btn-spinner" aria-hidden="true" /> Resending…</> : "Resend verification link"}
        </button>
        <p className="auth-switch"><button type="button" className="text-button" onClick={goBackToForm}>Back to sign in</button></p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Login</button>
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Sign up</button>
      </div>

      <div className="auth-card__heading">
        <span className="eyebrow">{mode === "login" ? "Returning customer" : "New to Edwin"}</span>
        <h1>{mode === "login" ? "Welcome back." : "Make it yours."}</h1>
        <p>{mode === "login" ? "Sign in to view orders, saved addresses and account details." : "Create an account for a faster checkout and a home for your order history."}</p>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {note && <p className="auth-note">{note}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <label>
              First name
              <span className="input-shell"><UserRound size={16} /><input required autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Aarav" /></span>
            </label>
            <label>
              Last name
              <span className="input-shell"><UserRound size={16} /><input required autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Sharma" /></span>
            </label>
          </>
        )}
        <label>
          Email address
          <span className="input-shell"><Mail size={16} /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></span>
        </label>
        {mode === "signup" && (
          <label>
            Phone
            <span className="input-shell"><Phone size={16} /><input required inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" /></span>
          </label>
        )}
        <label>
          Password
          <span className="input-shell">
            <LockKeyhole size={16} />
            <input required type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </span>
        </label>
        {mode === "signup" && (
          <label>
            Confirm password
            <span className="input-shell">
              <LockKeyhole size={16} />
              <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" />
            </span>
          </label>
        )}
        <button className="button button--dark button--full" type="submit" disabled={busy}>
          {busy ? <><span className="btn-spinner" aria-hidden="true" /> {mode === "login" ? "Signing in…" : "Creating account…"}</> : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} /></>}
        </button>
        {mode === "login" && <button type="button" className="text-button" onClick={handleForgot}>Forgot your password?</button>}
      </form>

      <div className="auth-divider"><span>or</span></div>

      <GoogleSignInButton
        label={mode === "login" ? "Continue with Google" : "Sign up with Google"}
        onSuccess={async () => { await refresh(); router.push(returnTo); }}
        onError={(message) => setError(message)}
      />

      <p className="auth-switch">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button type="button" className="text-button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button>
      </p>
    </div>
  );
}

function messageOf(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/email-already-in-use/i.test(message)) return "An account with that email already exists. Try signing in instead.";
  if (/wrong-password|invalid-credential|invalid-login/i.test(message)) return "Invalid email or password.";
  if (/user-not-found/i.test(message)) return "No account found for that email.";
  if (/weak-password/i.test(message)) return "Password must be at least 6 characters.";
  if (/too-many-requests/i.test(message)) return "We've sent quite a few emails recently. Please wait about a minute before trying again.";
  if (/network-request-failed/i.test(message)) return "Could not reach Firebase. Check your connection.";
  if (/configuration-not-found/i.test(message)) return "Firebase isn't configured for this project yet.";
  return logAndGeneric(error, "auth");
}