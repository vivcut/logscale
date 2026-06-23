"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
 ChatTeardropText,
 Kanban,
 RocketLaunch,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Cardo } from "next/font/google";

const serif = Cardo({
 weight: ["400", "700"],
 subsets: ["latin"],
});

const STATS = [
 { value: "600+", label: "startups use us" },
 { value: "2 min", label: "to live workspace" },
 { value: "99.9%", label: "uptime" },
];

const features = [
 {
  id: "feedback",
  icon: ChatTeardropText,
  label: "Feedback Boards",
 },
 {
  id: "kanban",
  icon: Kanban,
  label: "Kanban Roadmaps",
 },
 {
  id: "changelogs",
  icon: RocketLaunch,
  label: "Public Changelogs",
 },
];

export function Hero() {
 const reduce = useReducedMotion();

 const fade = (delay: number) =>
  reduce
   ? {}
   : {
     initial: { opacity: 0, y: 18 },
     animate: { opacity: 1, y: 0 },
     transition: {
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
     },
    };

 return (
  <section className="relative isolate min-h-screen w-full overflow-hidden flex flex-col items-center justify-start pb-24 pt-32 md:pt-40">
   {/* Decorative subtle top glow */}
   <div
    aria-hidden
    className="pointer-events-none absolute inset-0 -z-20 [background:radial-gradient(60%_50%_at_50%_0%,oklch(1_0_0/0.03)_0%,transparent_70%)]"
   />

   <div className="mx-auto flex max-w-6xl flex-col items-center px-6 text-center w-full z-10">
    {/* Social proof badge */}
    <motion.div
     {...fade(0.04)}
     className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground"
    >
     <span className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
     </span>
     Trusted by 600+ startups shipping faster
    </motion.div>

    <motion.h1
     {...fade(0.08)}
     className={`${serif.className} max-w-4xl text-balance font-bold leading-[1.05] text-black tracking-tight text-5xl md:text-[76px]`}
    >
     Your users are requesting features.{" "}
     <span className="italic text-primary">Are you listening?</span>
    </motion.h1>

    <motion.p
     {...fade(0.14)}
     className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
    >
     Collect feedback, prioritize with a public roadmap, and announce
     every ship — all in one beautiful workspace. Free to start.
    </motion.p>

    {/* Feature pills */}
    <motion.div
     {...fade(0.18)}
     className="mt-10 flex flex-col items-center gap-3 w-full max-w-2xl"
    >
     <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-3">
      {features.map((item) => {
       const IconComponent = item.icon;
       return (
        <div
         key={item.id}
         className="flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 border-border bg-black/5 transition-colors hover:border-primary/30"
        >
         <IconComponent size={24} className="shrink-0" weight="fill" />
         <span className="text-lg font-medium tracking-tight text-black">
          {item.label}
         </span>
        </div>
       );
      })}
     </div>
    </motion.div>

    {/* CTA buttons */}
    <motion.div
     {...fade(0.24)}
     className="mt-12 flex flex-col gap-3 sm:flex-row"
    >
     <Button size="lg" asChild className="shadow-black/40 text-base px-8">
      <Link href="/login">Start free — no credit card</Link>
     </Button>
     <Button size="lg" variant="outline" asChild className="text-base px-8">
      <Link href="#demo">See live demo</Link>
     </Button>
    </motion.div>

    {/* Stats strip */}
    <motion.div
     {...fade(0.32)}
     className="mt-20 grid w-full max-w-2xl grid-cols-3 gap-3 overflow-hidden"
    >
     {STATS.map((s) => (
      <div
       key={s.label}
       className="flex flex-col items-center gap-1 bg-black/5 backdrop-blur-md px-3 py-5 rounded-2xl border border-border"
      >
       <span className="text-xl font-semibold tracking-tight text-black md:text-3xl">
        {s.value}
       </span>
       <span className="text-center font-semibold text-xs text-black/60">
        {s.label}
       </span>
      </div>
     ))}
    </motion.div>
   </div>
  </section>
 );
}
