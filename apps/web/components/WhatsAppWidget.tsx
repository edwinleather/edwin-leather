"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const href = whatsappLink();

  return (
    <div className="wa-widget" aria-live="polite">
      {open && (
        <div className="wa-popover">
          <p className="wa-popover__title">Chat with us on WhatsApp</p>
          <p className="wa-popover__text">We&rsquo;d love to help.<br />Tap below to open a chat with the shop.</p>
          <a className="wa-popover__cta" href={href} target="_blank" rel="noreferrer">
            Start chatting
          </a>
        </div>
      )}
      <button
        type="button"
        className="wa-button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Connect on WhatsApp"
        aria-expanded={open}
      >
        {open ? <X size={24} /> : <WhatsAppIcon />}
      </button>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M16.04 3C8.9 3 3.1 8.8 3.1 15.94c0 2.28.6 4.5 1.74 6.46L3.05 29l6.7-1.76a12.9 12.9 0 0 0 6.29 1.6h.01c7.13 0 12.93-5.8 12.93-12.94A12.86 12.86 0 0 0 16.04 3zm0 23.6a10.7 10.7 0 0 1-5.45-1.49l-.39-.23-3.98 1.05 1.06-3.88-.25-.4a10.68 10.68 0 0 1-1.65-5.71c0-5.94 4.83-10.77 10.77-10.77 2.88 0 5.58 1.12 7.61 3.15a10.7 10.7 0 0 1 3.15 7.62c0 5.94-4.84 10.66-10.87 10.66zm5.9-7.97c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.51-.16-.72.16-.21.32-.82 1.05-1 1.27-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59a9.6 9.6 0 0 1-1.78-2.22c-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.08 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.83.67.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37z" />
    </svg>
  );
}