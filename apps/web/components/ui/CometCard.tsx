"use client";

import { useRef } from "react";
import { motion, useMotionValue, useMotionTemplate, useSpring } from "framer-motion";

type CometProps = {
  children: React.ReactNode;
  className?: string;
};

export function CometCard({ children, className = "" }: CometProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  const tail = useMotionTemplate`radial-gradient(160px circle at ${springX}px ${springY}px, var(--comet-color), transparent 70%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => { mouseX.set(-200); mouseY.set(-200); }} className={`comet-card ${className}`}>
      <motion.div className="comet-card__tail" style={{ background: tail }} aria-hidden />
      {children}
    </div>
  );
}