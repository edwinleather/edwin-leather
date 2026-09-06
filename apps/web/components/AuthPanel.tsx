"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { signUp, signIn, forgotPassword, resendEmailVerification } from "@/lib/api";
import { PlaceholdersInput } from "@/components/ui/PlaceholdersInput";
import { useAuth } from "@/components/useAuth";
import { GENERIC_ERROR } from "@/lib/errors";

type Mode = "login" | "signup";
type ResetPurpose = "verify" | "forgot";

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
  const [purpose, setPurpose] = useState<ResetPurpose>("verify");
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
    setPurpose("verify");
    setError(null);
    setNote(null);
  }

  async function finishSession() {
    await refresh();
    router.push(returnTo);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
      setBusy(true);
      try {
        const result = await signUp({ email: email.trim(), password, firstName, lastName: lastName || undefined, phone });
        if (!result.ok) return setError(messageOf(result.error, result.code));
        setPurpose("verify");
        setView("reset");
        setNote("We've created your account and sent a verification link to your email. Open it to activate your account.");
      } catch (cause) {
        setError(messageOf(cause));
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const result = await signIn({ email: email.trim(), password });
      if (!result.ok) {
        if (result.code === "EMAIL_NOT_VERIFIED") {
          await resendEmailVerification(email.trim()).catch(() => {});
          setPurpose("verify");
          setView("reset");
          setNote("Please verify your email before signing in. We've sent a fresh link to your inbox - open it to activate your account.");
        } else {
          setError(messageOf(result.error, result.code));
        }
        return;
      }
      await finishSession();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }
async function handleForgot(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await forgotPassword(email.trim());
      setPurpose("forgot");
      setView("reset");
      setNote(result.ok
        ? "If an account exists for that email, a password reset link is on its way. Open it to set a new password."
        : (result.message || "We couldn't send a reset link right now. Please try again."));
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
      const result = purpose === "forgot"
        ? await forgotPassword(email.trim())
        : await resendEmailVerification(email.trim());
      setNote(result.ok
        ? (purpose === "forgot"
          ? "We've re-sent the password reset link. Check your inbox (and spam folder)."
          : "We've re-sent the verification link. Check your inbox (and spam folder) and open it to activate your account.")
        : (result.message || "We couldn't resend the link. Try again in a minute."));
    } catch (cause) {
      setError(messageOf(cause));
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
          {resending ? <><span className="btn-spinner" aria-hidden="true" /> Resending…</> : (purpose === "forgot" ? "Resend reset link" : "Resend verification link")}
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
              <PlaceholdersInput label="First name" icon={<UserRound size={16} />} inputProps={{ required: true, autoComplete: "given-name", value: firstName, onChange: (event) => setFirstName(event.target.value) }} />
            </label>
            <label>
              Last name
              <PlaceholdersInput label="Last name" icon={<UserRound size={16} />} inputProps={{ autoComplete: "family-name", value: lastName, onChange: (event) => setLastName(event.target.value) }} />
            </label>
          </>
        )}
        <label>
          Email address
          <PlaceholdersInput label="Email address" icon={<Mail size={16} />} inputProps={{ required: true, type: "email", autoComplete: "email", value: email, onChange: (event) => setEmail(event.target.value) }} />
        </label>
        {mode === "signup" && (
          <label>
            Phone
            <PlaceholdersInput label="Phone" icon={<Phone size={16} />} inputProps={{ required: true, inputMode: "tel", autoComplete: "tel", value: phone, onChange: (event) => setPhone(event.target.value) }} />
          </label>
        )}
        <label>
          Password
          <PlaceholdersInput
            label="Password"
            icon={<LockKeyhole size={16} />}
            rightSlot={<button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
            inputProps={{ required: true, type: showPassword ? "text" : "password", autoComplete: mode === "login" ? "current-password" : "new-password", minLength: 8, value: password, onChange: (event) => setPassword(event.target.value) }}
          />
        </label>
        {mode === "signup" && (
          <label>
            Confirm password
            <PlaceholdersInput
              label="Confirm password"
              icon={<LockKeyhole size={16} />}
              inputProps={{ required: true, type: showPassword ? "text" : "password", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value) }}
            />
          </label>
        )}
        <button className="button button--dark button--full" type="submit" disabled={busy}>
          {busy ? <><span className="btn-spinner" aria-hidden="true" /> {mode === "login" ? "Signing in…" : "Creating account…"}</> : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} /></>}
        </button>
        {mode === "login" && <button type="button" className="text-button" onClick={handleForgot}>Forgot your password?</button>}
      </form>

      <p className="auth-switch">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button type="button" className="text-button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button>
      </p>
    </div>
  );
}
function messageOf(error: unknown, code?: string): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (code === "EMAIL_NOT_VERIFIED") return "Please verify your email before signing in.";
  if (/email-already-in-use|already exists/i.test(message)) return "An account with that email already exists. Try signing in instead.";
  if (/invalid email or password|wrong-password|invalid-credential|invalid-login/i.test(message)) return "Invalid email or password.";
  if (/user-not-found|no account found/i.test(message)) return "No account found for that email.";
  if (/weak-password/i.test(message)) return "Password must be at least 8 characters.";
  if (/too-many-requests/i.test(message)) return "We've sent quite a few emails recently. Please wait about a minute before trying again.";
  if (message) console.error("[auth]", error);
  if (/network-request-failed|socket|fetch failed|timed? ?out|abort|connection/i.test(message)) {
    return "Network error, check your connection.";
  }
  if (/not configured|unavailable/i.test(message)) {
    return "Something went wrong on our side. Please try again.";
  }
  return GENERIC_ERROR;
}