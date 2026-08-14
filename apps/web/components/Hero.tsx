"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SmoothLink } from "./SmoothLink";

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="hero">
      <motion.div
        className="hero__image-wrap"
        initial={reduce ? false : { scale: 1.04, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=2200&q=92"
          alt="Rich brown leather travel bag"
          fill
          priority
          sizes="100vw"
          className="hero__image"
        />
        <div className="hero__veil" />
      </motion.div>

      <div className="hero__content container-wide">
        <motion.div
          className="hero__copy"
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.16 } } }}
        >
          <motion.span className="hero__eyebrow" variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            Leather goods, made to gather stories
          </motion.span>
          <motion.h1 variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}>
            Better with<br /><em>every year.</em>
          </motion.h1>
          <motion.p variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
            Full-grain leather. Considered proportions. Hardware that earns its patina. Objects for the everyday, without the disposable part.
          </motion.p>
          <motion.div className="hero__actions" variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
            <SmoothLink href="/shop" className="button button--cream">Shop the collection <ArrowUpRight size={16} /></SmoothLink>
            <SmoothLink href="/story" className="hero__text-link">Inside the workshop</SmoothLink>
          </motion.div>
        </motion.div>

        <div className="hero__index">EST. / 2026</div>
        <a href="#featured" className="hero__scroll" aria-label="Scroll to products"><ArrowDown size={17} /></a>
      </div>
    </section>
  );
}
