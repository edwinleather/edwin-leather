"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform
} from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { SmoothLink } from "./SmoothLink";
import { SmartImage } from "./SmartImage";
import { useDeliveryConfig } from "@/lib/delivery";
import { useSiteSettings } from "@/lib/site-settings";
import { formatPrice } from "@/lib/format";

const AUTOPLAY_MS = 5200;

type Slide = {
  image: string;
  alt: string;
  badge: string;
  eyebrow: string;
  line1: string;
  line2: string;
  subtitle: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 26, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease } }
};

export function Hero() {
  const delivery = useDeliveryConfig();
  const { settings } = useSiteSettings();
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  const yImage = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 260]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 430]);
  const ySweep = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 640]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.06]);

  const springImage = useSpring(yImage, { stiffness: 90, damping: 22, mass: 0.4 });
  const springGlow = useSpring(yGlow, { stiffness: 90, damping: 22, mass: 0.4 });
  const springSweep = useSpring(ySweep, { stiffness: 90, damping: 22, mass: 0.4 });
  const springScale = useSpring(heroScale, { stiffness: 70, damping: 20, mass: 0.5 });

  // Mouse-follow spotlight + tilt
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const spotlight = useMotionTemplate`radial-gradient(620px circle at ${useTransform(mx, (v) => v * 100)}% ${useTransform(my, (v) => v * 100)}%, rgba(255,244,224,0.18), transparent 60%)`;
  const rotateX = useSpring(useTransform(my, (v) => (v - 0.5) * -5), { stiffness: 120, damping: 20 });
  const rotateY = useSpring(useTransform(mx, (v) => (v - 0.5) * 5), { stiffness: 120, damping: 20 });

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduce || e.clientX === 0) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const slides: Slide[] = [
    {
      image: settings?.heroImage?.trim() || "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894110/edwin/assets/wjorleikcvlc21h4tjys.webp",
      alt: "Rich brown leather travel bag",
      badge: settings?.heroBadge || "New season · The Everyday Edit",
      eyebrow: settings?.heroEyebrow || "Leather goods, made to gather stories",
      line1: settings?.heroTitleLine1 || "Objects for",
      line2: settings?.heroTitleLine2 || "your next decade.",
      subtitle: settings?.heroSubtitle || "Full-grain leather. Considered proportions. Hardware that earns its patina. Objects for the everyday, without the disposable part."
    },
    {
      image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894115/edwin/assets/mgzyaetkznw6ft1f6tdi.webp",
      alt: "Brown leather bag detail",
      badge: "Hand-finished in India",
      eyebrow: "Small-batch, full-grain",
      line1: "Made by hand,",
      line2: "made to age.",
      subtitle: "Each piece is cut and stitched in small runs. Natural grain and honest hardware that develop a patina with use, not against it."
    },
    {
      image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894275/edwin/assets/jmsky5qf33pm7v9izsel.webp",
      alt: "Leather wallet detail",
      badge: "Free delivery over " + formatPrice(delivery.freeDeliveryThreshold),
      eyebrow: "The everyday edit",
      line1: "Carry less,",
      line2: "carry better.",
      subtitle: "Wallets, belts and bags built around daily repetition. Useful proportions and tactile materials, with nothing added just to fill a photograph."
    }
  ];

  const count = slides.length;
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [next, reduce]);

  const active = slides[index];

  return (
    <section className="hero" ref={sectionRef} onMouseMove={onMove}>
      <motion.div
        className="hero__bg"
        initial={reduce ? false : { scale: 1.04, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.15, ease }}
      >
        <motion.div className="hero__scale" style={{ scale: springScale }}>
          <div className="hero__layers">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={index}
                className="hero__layer hero__layer--image"
                initial={reduce ? false : { opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.4, ease: [0.45, 0, 0.55, 1] }}
                style={{ y: springImage }}
              >
                <SmartImage
                  src={active.image}
                  alt={active.alt}
                  priority
                  sizes="100vw"
                  className="hero__image"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.div className="hero__layer hero__layer--glow" initial={false} style={{ y: springGlow }} aria-hidden />
          <motion.div className="hero__layer hero__layer--sweep" initial={false} style={{ y: springSweep }} aria-hidden />
        </motion.div>
        <motion.div className="hero__layer hero__layer--aurora" style={{ y: springSweep }} aria-hidden />
        <motion.div className="hero__spotlight" style={{ background: spotlight }} aria-hidden />
        <motion.div className="hero__veil" aria-hidden />
        <div className="hero__grain" aria-hidden />
      </motion.div>

      <motion.div className="hero__content container-wide" style={{ rotateX, rotateY, transformPerspective: 1200 }}>
        <motion.div style={{ opacity: copyOpacity, y: copyY }} className="hero__copy-wrap">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={index}
              className="hero__copy"
              initial={reduce ? false : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.55, ease }}
            >
              <motion.div variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="hero__copy-inner">
                <motion.span variants={itemVariants} className="hero__badge">
                  <Sparkles size={13} /> {active.badge}
                </motion.span>
                <motion.span variants={itemVariants} className="hero__eyebrow">{active.eyebrow}</motion.span>
                <motion.h1 variants={itemVariants}>
                  {active.line1}<br /><em className="hero-highlight">{active.line2}</em>
                </motion.h1>
                <motion.p variants={itemVariants}>{active.subtitle}</motion.p>
                <motion.div variants={itemVariants} className="hero__actions">
                  <SmoothLink href="/shop" className="button button--cream hero__cta">Shop the collection <ArrowUpRight size={16} /></SmoothLink>
                  <SmoothLink href="/story" className="hero__text-link">Inside the workshop <ArrowDown size={14} /></SmoothLink>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="hero__controls">
          <button className="hero__arrow" onClick={prev} aria-label="Previous slide"><ArrowLeft size={16} /></button>
          <div className="hero__dots" role="tablist" aria-label="Slides">
            {slides.map((s, i) => (
              <button
                key={i}
                className={`hero__dot ${i === index ? "is-active" : ""}`}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button className="hero__arrow" onClick={next} aria-label="Next slide"><ArrowRight size={16} /></button>
        </div>

        <div className="hero__meta">
          <span>Est. {settings?.estYear || 2026}</span><i /><span>Hand-finished in India</span><i /><span>Free delivery over {formatPrice(delivery.freeDeliveryThreshold)}</span>
        </div>
        <a href="#featured" className="hero__scroll" aria-label="Scroll to products"><ArrowDown size={17} /></a>
      </motion.div>
    </section>
  );
}