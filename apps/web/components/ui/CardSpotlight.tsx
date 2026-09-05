"use client";

import { useRef } from "react";
import { motion, useMotionValue, useMotionTemplate, useSpring } from "framer-motion";

type SpotlightProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardSpotlight({ children, className = "" }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${springX}px ${springY}px, rgba(255,255,255,.18), transparent 70%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div ref={ref} onMouseMove={onMove} className={`card-spotlight ${className}`}>
      <motion.div className="card-spotlight__glow" style={{ background: spotlight }} aria-hidden />
      {children}
    </div>
  );
}