import type { Metadata } from "next";
<<<<<<< Updated upstream
import { AuthPanel } from "@/components/AuthPanel";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: `Create account · ${siteConfig.name}`, description: "Create your Edwin Leathers account." };
=======
import Image from "next/image";
import { AuthPanel } from "@/components/AuthPanel";

export const metadata: Metadata = { title: "Sign Up" };
>>>>>>> Stashed changes

export default function SignupPage() {
  return (
    <div className="auth-page">
<<<<<<< Updated upstream
      <div className="auth-visual" aria-hidden>
        <div className="auth-visual__inner">
          <span className="auth-visual__word">EDWIN</span>
          <span className="auth-visual__sub">Leathers</span>
          <p>Handcrafted leather goods, made to last a lifetime.</p>
        </div>
      </div>
      <div className="auth-panel-wrap">
        <AuthPanel initialMode="signup" />
      </div>
=======
      <div className="auth-visual">
        <Image src="https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1500&q=88" alt="Leather wallet detail" fill priority sizes="(max-width: 900px) 100vw, 48vw" />
        <div className="auth-visual__veil" />
        <div className="auth-visual__copy"><span className="eyebrow">Start an account</span><p>A simpler checkout, a clearer order history, and a place for the things you carry.</p></div>
      </div>
      <div className="auth-panel-wrap"><AuthPanel initialMode="signup" /></div>
>>>>>>> Stashed changes
    </div>
  );
}