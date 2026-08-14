"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";

type ParallaxProps = {
  children: ReactNode;
  speed?: number;
  className?: string;
  style?: CSSProperties;
};

export function Parallax({ children, speed = 60, className, style }: ParallaxProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.16, 1.1, 1.16]);
  const smoothY = useSpring(y, { stiffness: 90, damping: 20, mass: 0.4 });

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden", ...style }}>
      <motion.div style={{ y: reduce ? 0 : smoothY, scale: reduce ? 1 : scale, height: "100%", width: "100%" }}>
        {children}
      </motion.div>
    </div>
  );
}