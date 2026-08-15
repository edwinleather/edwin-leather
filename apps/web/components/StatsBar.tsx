"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { useSiteSettings } from "@/lib/site-settings";
import { Reveal } from "./Reveal";

type Stat = { value: number; mark?: string; label: string };

const DEFAULT_STATS = [
  { value: 8, label: "Objects in the collection" },
  { value: 60, label: "Hours of craft per piece" },
  { value: 100, mark: "%", label: "Full-grain leather, always" },
  { value: 4, mark: " days", label: "To reach your door" }
];

function StatValue({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || !ref.current || reduce) {
      if (ref.current && reduce) ref.current.textContent = String(stat.value);
      return;
    }
    const controls = animate(0, stat.value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => { if (ref.current) ref.current.textContent = String(Math.round(value)); }
    });
    return () => controls.stop();
  }, [inView, reduce, stat.value]);

  return (
    <span className="stat__value">
      <span ref={ref}>{stat.value}</span>{stat.mark && <span className="stat__mark">{stat.mark}</span>}
    </span>
  );
}

export function StatsBar() {
  const { settings } = useSiteSettings();
  const s = settings?.homepage?.stats;
  const items = s?.items?.length ? s.items : DEFAULT_STATS;
  return (
    <section className="stats-section container">
      <div className="stats-head">
        <Reveal><span className="eyebrow">{s?.eyebrow || "By the numbers"}</span><h2>{s?.title || "Slow is the point."}</h2></Reveal>
        <Reveal delay={0.08}><p>{s?.note || "Small batches, deliberate choices, and a workshop that measures quality in decades rather than drops."}</p></Reveal>
      </div>
      <div className="stats-grid">
        {items.map((stat, index) => (
          <Reveal key={`${stat.label}-${index}`} delay={index * 0.06} className="stat">
            <StatValue stat={stat} />
            <div className="stat__label">{stat.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}