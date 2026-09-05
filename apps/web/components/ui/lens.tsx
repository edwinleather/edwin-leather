"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from "framer-motion";

type LensProps = {
  src: string;
  alt?: string;
  zoomFactor?: number;
  lensSize?: number;
  className?: string;
  onClick?: () => void;
};

export function Lens({ src, zoomFactor = 2, lensSize = 150, className = "", onClick }: LensProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth || 1, h: el.clientHeight || 1 });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mouseX = useMotionValue(size.w / 2);
  const mouseY = useMotionValue(size.h / 2);
  const springX = useSpring(mouseX, { stiffness: 320, damping: 32 });
  const springY = useSpring(mouseY, { stiffness: 320, damping: 32 });

  const origin = useMotionTemplate`${springX}px ${springY}px`;
  const clipPath = useMotionTemplate`circle(${lensSize / 2}px at ${springX}px ${springY}px)`;
  const ringX = useTransform(springX, (v) => v - lensSize / 2);
  const ringY = useTransform(springY, (v) => v - lensSize / 2);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={() => { mouseX.set(size.w / 2); mouseY.set(size.h / 2); }} className={`lens ${className}`} onClick={onClick}>
      <img src={src} alt="" className="lens__base" draggable={false} />
      <motion.div className="lens__viewport" style={{ clipPath }}>
        <motion.img src={src} alt="" draggable={false} className="lens__zoom" style={{ transformOrigin: origin, scale: zoomFactor }} />
      </motion.div>
      <motion.div className="lens__ring" style={{ width: lensSize, height: lensSize, x: ringX, y: ringY }} />
    </div>
  );
}
