"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

/**
 * Reveal — a small Framer Motion (now `motion`) wrapper that fades + lifts its
 * children into view the first time they scroll onto screen. Respects
 * prefers-reduced-motion by rendering statically. Use `delay` to stagger
 * siblings, and `as` is fixed to a div to keep the API tiny.
 */
export function Reveal({
 children,
 delay = 0,
 y = 16,
 className,
 once = true,
}: {
 children: React.ReactNode;
 delay?: number;
 y?: number;
 className?: string;
 once?: boolean;
}) {
 const reduce = useReducedMotion();

 if (reduce) {
  return <div className={className}>{children}</div>;
 }

 return (
  <motion.div
   className={className}
   initial={{ opacity: 0, y }}
   whileInView={{ opacity: 1, y: 0 }}
   viewport={{ once, margin: "-80px" }}
   transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
  >
   {children}
  </motion.div>
 );
}

/**
 * Stagger — wraps a list whose direct children are <RevealItem> so they cascade
 * in one after another when the group enters the viewport.
 */
const containerVariants: Variants = {
 hidden: {},
 show: {
  transition: { staggerChildren: 0.08, delayChildren: 0.05 },
 },
};

const itemVariants: Variants = {
 hidden: { opacity: 0, y: 18 },
 show: {
  opacity: 1,
  y: 0,
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
 },
};

export function Stagger({
 children,
 className,
}: {
 children: React.ReactNode;
 className?: string;
}) {
 const reduce = useReducedMotion();

 if (reduce) {
  return <div className={className}>{children}</div>;
 }

 return (
  <motion.div
   className={className}
   variants={containerVariants}
   initial="hidden"
   whileInView="show"
   viewport={{ once: true, margin: "-60px" }}
  >
   {children}
  </motion.div>
 );
}

export function StaggerItem({
 children,
 className,
}: {
 children: React.ReactNode;
 className?: string;
}) {
 const reduce = useReducedMotion();

 if (reduce) {
  return <div className={className}>{children}</div>;
 }

 return (
  <motion.div className={className} variants={itemVariants}>
   {children}
  </motion.div>
 );
}
