"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login, resendOtp, safeRedirect, sendSignupOtp, verifyOtp } from "@/lib/api";
import { GoogleSignInButton } from "./GoogleSignInButton";

type Mode = "login" | "signup";

function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button type="button" className="password-field__toggle" onClick={() => setVisible((v) => !v)} aria-label="Toggle password visibility">
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function AuthPanel({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [masked, setMasked] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const isLogin = mode === "login";

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const title = useMemo(() => (step === "otp" ? "Check your inbox" : isLogin ? "Welcome back" : "Create your account"), [step, isLogin]);
  const subtitle = useMemo(
    () =>
      step === "otp"
        ? `We sent a 6-digit code to ${masked || email}.`
        : isLogin
          ? "Sign in to continue to your account."
          : "Sign up to track orders and save your details.",
    [step, isLogin, masked, email]
  );

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    setSubmitting(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setStep("form");
    setError("");
    setCode("");
  };

  const handleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in your email and password.");
    if (!isLogin && password !== confirmPassword) return setError("Passwords do not match.");
    if (!isLogin && password.length < 8) return setError("Password must be at least 8 characters.");

    if (isLogin) {
      return run(async () => {
        await login({ email, password });
        safeRedirect("/account");
      });
    }

    return run(async () => {
      const { masked: nextMasked } = await sendSignupOtp({ email, password, firstName, lastName, phone });
      setMasked(nextMasked);
      setStep("otp");
    });
  };

  const handleOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return setError("Enter the 6-digit code.");
    return run(async () => {
      await verifyOtp({
        email,
        code,
        profile: { password, firstName, lastName, phone }
      });
      safeRedirect("/account");
    });
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(60);
    run(async () => {
      const { masked: nextMasked } = await resendOtp({ email });
      setMasked(nextMasked);
    });
  };

  return (
    <div className="auth-card">
      <div className="auth-card__head">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {step === "otp" ? (
        <form className="auth-form" onSubmit={handleOtp}>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            className="otp-input"
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="button button--dark auth-submit" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify & continue"}
          </button>
          <button type="button" className="auth-resend" onClick={handleResend} disabled={cooldown > 0 || submitting}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleForm}>
          {!isLogin && (
            <div className="auth-name-row">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" autoComplete="given-name" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" autoComplete="family-name" />
            </div>
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" />
          {!isLogin && (
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" autoComplete="tel" />
          )}
          <PasswordField value={password} onChange={setPassword} placeholder="Password" autoComplete={isLogin ? "current-password" : "new-password"} />
          {!isLogin && <PasswordField value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" autoComplete="new-password" />}
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="button button--dark auth-submit" disabled={submitting}>
            {submitting ? (isLogin ? "Signing in…" : "Sending code…") : isLogin ? "Sign in" : "Sign up"}
          </button>
        </form>
      )}

      <div className="auth-divider"><span>or continue with</span></div>
      <GoogleSignInButton onSuccess={() => safeRedirect("/account")} onError={setError} />

      {step === "form" && (
        <p className="auth-switch">
          {isLogin ? "New to Edwin Leathers?" : "Already have an account?"}{" "}
          <button type="button" onClick={() => switchMode(isLogin ? "signup" : "login")}>
            {isLogin ? "Create an account" : "Sign in"}
          </button>
        </p>
      )}
    </div>
  );
}