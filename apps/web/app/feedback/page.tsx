import type { Metadata } from "next";
import { MessageCircleMore, PackageCheck, Sparkles } from "lucide-react";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata: Metadata = { title: "Feedback", description: "Share feedback about your Edwin Leathers product or shopping experience.", alternates: { canonical: "/feedback" } };

export default function FeedbackPage() {
  return (
    <div className="page-shell feedback-page">
      <div className="container feedback-grid">
        <div className="feedback-copy"><span className="eyebrow">Feedback</span><h1>Tell us what<br /><em>stayed with you.</em></h1><p>Good product work is repetitive. Your experience gives us something concrete to improve on the next cut, the next parcel and the next version of the site.</p><div className="feedback-points"><span><PackageCheck size={18} /> Product and packaging</span><span><MessageCircleMore size={18} /> Service and support</span><span><Sparkles size={18} /> Website experience</span></div></div>
        <div className="feedback-card"><FeedbackForm /></div>
      </div>
    </div>
  );
}