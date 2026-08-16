import type { Metadata } from "next";
import Image from "next/image";
import { AuthPanel } from "@/components/AuthPanel";

export const metadata: Metadata = { title: "Login", alternates: { canonical: "/login" } };

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Image src="https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894115/edwin/assets/mgzyaetkznw6ft1f6tdi.webp" alt="Brown leather bag detail" fill priority sizes="(max-width: 900px) 100vw, 48vw" />
        <div className="auth-visual__veil" />
        <div className="auth-visual__copy"><span className="eyebrow">Made for repetition</span><p>Your orders, addresses and pieces, kept in one quiet place.</p></div>
      </div>
      <div className="auth-panel-wrap"><AuthPanel initialMode="login" /></div>
    </div>
  );
}