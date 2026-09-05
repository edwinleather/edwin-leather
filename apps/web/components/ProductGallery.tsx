"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lens } from "./ui/lens";
import type { Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const images = product.images;
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState(false);

  const closeLightbox = useCallback(() => {
    setLightbox(false);
    setZoom(false);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") setActive((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setActive((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.classList.add("lb-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.classList.remove("lb-open");
    };
  }, [lightbox, images.length, closeLightbox]);

  return (
    <>
      <div className="pg">
        <div className="pg__thumbs" role="tablist" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`pg__thumb${i === active ? " pg__thumb--active" : ""}`}
              onClick={() => setActive(i)}
            >
              <img src={src} alt={`${product.name} view ${i + 1}`} draggable={false} loading="lazy" />
            </button>
          ))}
        </div>

        <div className="pg__main">
          <div className="pg__counter">{active + 1} / {images.length}</div>
          <div className="pg__stage">
            <Lens src={images[active]} className="pg__lens" onClick={() => setLightbox(true)} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="lb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button className="lb__close" onClick={closeLightbox} aria-label="Close">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>

            {images.length > 1 && (
              <>
                <button
                  className="lb__nav lb__nav--prev"
                  onClick={() => { setActive((i) => Math.max(i - 1, 0)); setZoom(false); }}
                  disabled={active === 0}
                  aria-label="Previous image"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  className="lb__nav lb__nav--next"
                  onClick={() => { setActive((i) => Math.min(i + 1, images.length - 1)); setZoom(false); }}
                  disabled={active === images.length - 1}
                  aria-label="Next image"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}

            <motion.div
              className="lb__image-wrap"
              key={active}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <img
                src={images[active]}
                alt={`${product.name} view ${active + 1}`}
                className="lb__image"
                draggable={false}
              />
            </motion.div>

            <div className="lb__dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`lb__dot${i === active ? " lb__dot--active" : ""}`}
                  onClick={() => { setActive(i); setZoom(false); }}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
