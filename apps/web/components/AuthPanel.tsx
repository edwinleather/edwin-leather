"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { login, signup, verifyOtp, resendOtp } from "@/lib/api";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/components/useAuth";

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
  const { refresh } = useAuth();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [view, setView] = useState<"form" | "otp">("form");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setView("form");
    setCode("");
    setError(null);
    setNote(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
      setBusy(true);
      const result = await signup({ firstName, lastName: lastName || undefined, email, phone, password });
      setBusy(false);
      if (!result.ok) { setError(result.error ?? "Could not create your account."); return; }
      setView("otp");
      setNote(result.devOtp ? `Dev mode — your code is ${result.devOtp}` : "We sent a one-time code to your email. Enter it below to activate your account.");
      return;
    }

    setBusy(true);
    const result = await login({ email, password });
    setBusy(false);
    if (!result.ok) {
      if (result.code === "EMAIL_NOT_VERIFIED") {
        setView("otp");
        setNote("Your email isn't verified yet. Enter the code we sent, or resend it.");
        const resent = await resendOtp(email);
        if (resent.devOtp) setNote(`Dev mode — your code is ${resent.devOtp}`);
        return;
      }
      setError(result.error);
      return;
    }
    await refresh();
    router.push(returnTo);
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = await verifyOtp({ email, code });
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    await refresh();
    router.push(returnTo);
  }

  async function handleResend() {
    setError(null);
    const result = await resendOtp(email);
    if (!result.ok) setError(result.error ?? "Could not resend the code.");
    else setNote(result.devOtp ? `Dev mode — your code is ${result.devOtp}` : "A new code has been sent.");
  }

  const goBackToForm = () => { setView("form"); setCode(""); setError(null); };

  if (view === "otp") {
    return (
      <div className="auth-card">
        <div className="auth-card__heading">
          <span className="eyebrow">Confirm your email</span>
          <h1>One last step.</h1>
          <p>Enter the code we sent to <strong>{email}</strong>. It expires in 10 minutes.</p>
        </div>
        {error && <p className="auth-error">{error}</p>}
        {note && <p className="auth-note">{note}</p>}
        <form className="auth-form" onSubmit={handleVerify}>
          <label>
            One-time code
            <span className="input-shell">
              <LockKeyhole size={16} />
              <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" />
            </span>
          </label>
          <button className="button button--dark button--full" type="submit" disabled={code.length !== 6 || busy}>
            {busy ? "Verifying…" : "Verify & continue"} <ArrowRight size={15} />
          </button>
          <button type="button" className="text-button" onClick={handleResend}>Resend code</button>
        </form>
        <p className="auth-switch"><button type="button" className="text-button" onClick={goBackToForm}>Back to {mode === "login" ? "log in" : "sign up"}</button></p>
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
          <label>
            Full name
            <span className="input-shell"><UserRound size={16} /><input required autoComplete="name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Aarav Sharma" /></span>
          </label>
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
          {busy ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign in" : "Create account")} <ArrowRight size={15} />
        </button>
      </form>

      <div className="auth-divider"><span>or</span></div>

      <GoogleSignInButton
        label={mode === "login" ? "Continue with Google" : "Sign up with Google"}
        onSuccess={() => router.push(returnTo)}
        onError={(message) => setError(message)}
      />

      <p className="auth-switch">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button type="button" className="text-button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button>
      </p>
    </div>
  );
}