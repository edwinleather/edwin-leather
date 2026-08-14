"use client";

<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
    </div>
  );
}