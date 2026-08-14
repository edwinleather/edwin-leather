import type { Metadata } from "next";
import Image from "next/image";
import { AuthPanel } from "@/components/AuthPanel";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Image src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1500&q=88" alt="Brown leather bag detail" fill priority sizes="(max-width: 900px) 100vw, 48vw" />
        <div className="auth-visual__veil" />
        <div className="auth-visual__copy"><span className="eyebrow">Made for repetition</span><p>Your orders, addresses and pieces, kept in one quiet place.</p></div>
      </div>
      <div className="auth-panel-wrap"><AuthPanel initialMode="login" /></div>
    </div>
  );
}