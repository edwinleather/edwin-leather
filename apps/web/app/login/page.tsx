import type { Metadata } from "next";
import { AuthPanel } from "@/components/AuthPanel";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: `Sign in · ${siteConfig.name}`, description: "Sign in to your Edwin Leathers account." };

export default function LoginPage() {
  return (
    <div className="auth-page">
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
    </div>
  );
}