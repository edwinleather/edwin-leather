import type { Metadata } from "next";
import { AtSign, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Contact Us", description: "Contact Edwin Leathers about products, orders, care and collaborations." };

export default function ContactPage() {
  return (
    <div className="page-shell contact-page">
      <div className="container">
        <div className="page-intro"><span className="eyebrow">Contact us</span><h1>Questions are<br /><em>welcome here.</em></h1><p>Product details, order questions, leather care or something less ordinary. Send us a note.</p></div>
        <div className="contact-grid">
          <aside className="contact-details">
            <div><Mail size={18} /><span className="eyebrow">Email</span><a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a></div>
            <div><Phone size={18} /><span className="eyebrow">Phone</span><a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a></div>
            <div><Clock3 size={18} /><span className="eyebrow">Hours</span><p>Monday–Saturday<br />10:00 AM–6:00 PM IST</p></div>
            <div><MapPin size={18} /><span className="eyebrow">Workshop</span><p>India<br />Visits by appointment</p></div>
            <div><AtSign size={18} /><span className="eyebrow">Instagram</span><a href={siteConfig.instagram} target="_blank" rel="noreferrer">@edwinleathers.demo</a></div>
          </aside>
          <div className="contact-form-card"><span className="eyebrow">Write to us</span><h2>What can we help with?</h2><ContactForm /></div>
        </div>
      </div>
    </div>
  );
}