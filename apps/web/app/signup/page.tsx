import type { Metadata } from "next";
import Image from "next/image";
import { AuthPanel } from "@/components/AuthPanel";

export const metadata: Metadata = { title: "Sign Up", alternates: { canonical: "/signup" } };

export default function SignupPage() {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Image src="https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/jmsky5qf33pm7v9izsel.webp" alt="Leather wallet detail" fill priority sizes="(max-width: 900px) 100vw, 48vw" />
        <div className="auth-visual__veil" />
        <div className="auth-visual__copy"><span className="eyebrow">Start an account</span><p>A simpler checkout, a clearer order history, and a place for the things you carry.</p></div>
      </div>
      <div className="auth-panel-wrap"><AuthPanel initialMode="signup" /></div>
    </div>
  );
}