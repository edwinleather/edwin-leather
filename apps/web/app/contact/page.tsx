import type { Metadata } from "next";
import { AtSign, Clock3, Mail, MapPin, Phone, Star } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { siteConfig } from "@/lib/site-config";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Contact Us", description: "Contact Edwin Leathers about products, orders, care and collaborations.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <div className="page-shell contact-page">
      <div className="container">
        <div className="page-intro"><span className="eyebrow">Contact us</span><h1>Questions are<br /><em>welcome here.</em></h1><p>Product details, order questions, leather care or something less ordinary. Send us a note.</p></div>
        <div className="contact-grid">
          <aside className="contact-details">
            <div><Mail size={18} /><span className="eyebrow">Email</span><a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a></div>
            <div><Phone size={18} /><span className="eyebrow">Phone</span><a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a></div>
            <div><AtSign size={18} /><span className="eyebrow">WhatsApp</span><a href={whatsappLink()} target="_blank" rel="noreferrer">Chat with us on WhatsApp</a></div>
            <div><Clock3 size={18} /><span className="eyebrow">Hours</span><p>Monday-Saturday<br />10:00 AM-6:00 PM IST</p></div>
            <div><MapPin size={18} /><span className="eyebrow">Store</span><a href={siteConfig.mapsUrl} target="_blank" rel="noreferrer">{siteConfig.storeName}<br />View on Google Maps</a></div>
            <div><AtSign size={18} /><span className="eyebrow">Instagram</span><a href={siteConfig.instagram} target="_blank" rel="noreferrer">@edwin_the_leather_world</a></div>
          </aside>
          <div className="contact-form-card">
            <span className="eyebrow">Write to us</span><h2>What can we help with?</h2><ContactForm />
            <a className="google-review-cta" href={siteConfig.mapsUrl} target="_blank" rel="noreferrer">
              <Star size={15} fill="currentColor" /> Loved your visit? Leave us a review on Google
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}