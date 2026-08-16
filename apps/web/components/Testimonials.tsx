"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";

const testimonials = [
  {
    quote: <>Bought the Heritage Tote in October. Three seasons in, it looks <em>better</em> than the day it arrived. Nothing I own ages like this.</>,
    name: "Aarav Sharma",
    role: "New Delhi",
    initials: "AS"
  },
  {
    quote: <>The Wallet is the quietest flex I own. People ask about it constantly - it just keeps getting richer in colour.</>,
    name: "Meera Iyer",
    role: "Bengaluru",
    initials: "MI"
  },
  {
    quote: <>Hesitated for months before replacing a cheap bag. Wish I had done it years earlier - this one is <em>my</em> bag now.</>,
    name: "Kabir Singh",
    role: "Mumbai",
    initials: "KS"
  }
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % testimonials.length), 5200);
    return () => clearInterval(timer);
  }, [reduce]);

  const current = testimonials[index];

  return (
    <section className="section testimonials">
      <div className="container testimonials__inner">
        <Reveal>
          <div className="section-heading">
            <div><span className="eyebrow">Word of mouth</span><h2>Carried daily, loved longer.</h2></div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              className="testimonial"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <blockquote className="testimonial__quote">{current.quote}</blockquote>
              <figcaption className="testimonial__who">
                <span className="testimonial__avatar" aria-hidden="true">{current.initials}</span>
                <div><div className="testimonial__name">{current.name}</div><div className="testimonial__role">{current.role}</div></div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </Reveal>
        <div className="testimonials__dots" role="tablist" aria-label="Testimonials">
          {testimonials.map((item, dotIndex) => (
            <button key={item.name} className={dotIndex === index ? "active" : ""} onClick={() => setIndex(dotIndex)} aria-label={`Show testimonial from ${item.name}`} />
          ))}
        </div>
      </div>
    </section>
  );
}