"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Sparkles } from "lucide-react";
import { SmoothLink } from "./SmoothLink";
import { SmartImage } from "./SmartImage";
import { useDeliveryConfig } from "@/lib/delivery";
import { useSiteSettings } from "@/lib/site-settings";
import { formatPrice } from "@/lib/format";

export function Hero() {
  const delivery = useDeliveryConfig();
  const { settings } = useSiteSettings();
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  const yImage = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 260]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 430]);
  const ySweep = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 640]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.24]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

  const springImage = useSpring(yImage, { stiffness: 90, damping: 22, mass: 0.4 });
  const springGlow = useSpring(yGlow, { stiffness: 90, damping: 22, mass: 0.4 });
  const springSweep = useSpring(ySweep, { stiffness: 90, damping: 22, mass: 0.4 });
  const springScale = useSpring(imageScale, { stiffness: 90, damping: 22, mass: 0.4 });

  return (
    <section className="hero" ref={sectionRef}>
      <motion.div
        className="hero__bg"
        initial={reduce ? false : { scale: 1.04, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div className="hero__layer hero__layer--image" style={{ y: springImage, scale: reduce ? undefined : springScale }}>
          <motion.div
            className="hero__image-kenburns"
            initial={reduce ? false : { scale: 1.08, y: 0 }}
            animate={reduce ? undefined : { scale: 1.2, y: [0, -26, 0] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          >
            <SmartImage
              src={settings?.heroImage?.trim() || "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894110/edwin/assets/wjorleikcvlc21h4tjys.webp"}
              alt="Rich brown leather travel bag"
              priority
              sizes="100vw"
              className="hero__image"
            />
          </motion.div>
        </motion.div>
        <motion.div className="hero__layer hero__layer--glow" initial={false} style={{ y: springGlow }} aria-hidden />
        <motion.div className="hero__layer hero__layer--sweep" initial={false} style={{ y: springSweep }} aria-hidden />
        <div className="hero__veil" />
      </motion.div>

      <div className="hero__content container-wide">
        <motion.div style={{ opacity: copyOpacity, y: copyY }}>
          <motion.div
            className="hero__copy"
            initial={reduce ? false : "hidden"}
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.16 } } }}
          >
            <motion.span className="hero__badge" variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
              <Sparkles size={13} /> {settings?.heroBadge || "New season · The Everyday Edit"}
            </motion.span>
            <motion.span className="hero__eyebrow" variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
              {settings?.heroEyebrow || "Leather goods, made to gather stories"}
            </motion.span>
            <motion.h1 variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}>
              {settings?.heroTitleLine1 || "Objects for"}<br /><em>{settings?.heroTitleLine2 || "your next decade."}</em>
            </motion.h1>
            <motion.p variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
              {settings?.heroSubtitle ||
                "Full-grain leather. Considered proportions. Hardware that earns its patina. Objects for the everyday, without the disposable part."}
            </motion.p>
            <motion.div className="hero__actions" variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
              <SmoothLink href="/shop" className="button button--cream">Shop the collection <ArrowUpRight size={16} /></SmoothLink>
              <SmoothLink href="/story" className="hero__text-link">Inside the workshop</SmoothLink>
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="hero__meta">
          <span>Est. {settings?.estYear || 2026}</span><i /><span>Hand-finished in India</span><i /><span>Free delivery over {formatPrice(delivery.freeDeliveryThreshold)}</span>
        </div>
        <a href="#featured" className="hero__scroll" aria-label="Scroll to products"><ArrowDown size={17} /></a>
      </div>
    </section>
  );
}