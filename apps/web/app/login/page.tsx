import type { Metadata } from "next";
<<<<<<< Updated upstream
import { AuthPanel } from "@/components/AuthPanel";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: `Sign in · ${siteConfig.name}`, description: "Sign in to your Edwin Leathers account." };
=======
import Image from "next/image";
import { AuthPanel } from "@/components/AuthPanel";

export const metadata: Metadata = { title: "Login" };
>>>>>>> Stashed changes

export default function LoginPage() {
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
        <AuthPanel initialMode="login" />
      </div>
=======
      <div className="auth-visual">
        <Image src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1500&q=88" alt="Brown leather bag detail" fill priority sizes="(max-width: 900px) 100vw, 48vw" />
        <div className="auth-visual__veil" />
        <div className="auth-visual__copy"><span className="eyebrow">Made for repetition</span><p>Your orders, addresses and pieces, kept in one quiet place.</p></div>
      </div>
      <div className="auth-panel-wrap"><AuthPanel initialMode="login" /></div>
>>>>>>> Stashed changes
    </div>
  );
}