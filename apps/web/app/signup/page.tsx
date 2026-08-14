import type { Metadata } from "next";
import { AuthPanel } from "@/components/AuthPanel";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: `Create account · ${siteConfig.name}`, description: "Create your Edwin Leathers account." };

export default function SignupPage() {
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
        <AuthPanel initialMode="signup" />
      </div>
    </div>
  );
}