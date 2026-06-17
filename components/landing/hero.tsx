"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";


// Importing Phosphor Icons
import { 
  ChatTeardropText, 
  Kanban, 
  RocketLaunch, 
  ClipboardText, 
  Pulse,
  Phone
} from "@phosphor-icons/react";

import { ArrowUp } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Cardo } from "next/font/google";

// --- STATS CONFIGURATION ---
const STATS = [
  { value: "600+", label: "startups use us" },
  { value: "2 min", label: "to live workspace" },
  { value: "99.9%", label: "uptime" },
];

const serif = Cardo({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const PREVIEW_ROWS = [
  { status: "completed", title: "Anonymous voting", votes: 511 },
  { status: "in-progress", title: "Custom domains", votes: 342 },
  { status: "planned", title: "Slack notifications", votes: 128 },
];

const features = [
    {
      id: 'feedback',
      icon: ChatTeardropText,
      iconColor: 'text-purple-400',
      label: 'Feedback Boards',
    },
    {
      id: 'kanban',
      icon: Kanban,
      iconColor: 'text-indigo-400',
      label: 'Kanban Roadmaps',
    },
    {
      id: 'changelogs',
      icon: RocketLaunch,
      iconColor: 'text-cyan-400',
      label: 'Public Changelogs',
    },
   
  ];

const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-500",
  "in-progress": "bg-chart-1",
  planned: "bg-muted-foreground",
};

// --- MAIN HERO COMPONENT ---
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
    <section className="relative isolate min-h-screen w-full overflow-hidden dark:bg-black flex flex-col items-center justify-start pb-24 pt-32 md:pt-40">
      
      {/* FIXED IMMERSIVE HERO BACKGROUND IMAGE - CHANGED TO JPG & CONTAINER VIEW */}
      <div className="absolute inset-0 -z-30 h-full w-full select-none pointer-events-none flex items-center justify-center dark:bg-black">
        <div className="relative w-full h-full mx-auto">
          <Image
            src="/hero.jpg"
            alt="Hero Background Layout"
            fill
            priority
            quality={100}
            className="not-dark:hidden opacity-80" 
          />
        </div>
        {/* Soft edge fading mask so the image blends smoothly into the dark viewport */}
        <div className="not-dark:hidden absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
      </div>

      {/* Decorative subtle top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 [background:radial-gradient(60%_50%_at_50%_0%,oklch(1_0_0/0.03)_0%,transparent_70%)]"
      />

      <img className="absolute h-30 right-23 opacity-35 not-md:hidden top-20 -rotate-15 z-200" src="/arrow.png"/>

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 text-center w-full z-10">
        <motion.h1
          {...fade(0.08)}
          className="mt-7 max-w-4xl text-balance font-medium leading-[1.05] not-dark:!text-black tracking-tight text-white md:text-[80px] text-5xl dark:drop-shadow-md"
        >
          <h1 className={serif.className}><b className="font-[700] text-5xl  italic md:text-[80px]">Right now<img className="absolute h-40 right-23 opacity-100 not-md:hidden -translate-x-2 not-dark:!hidden translate-y-1" src="/squiggly.png"/> </b>  a user is requesting a feature.</h1>
          {/* <br /> */}
          <p className="!text-3xl tracking-normal mt-12 opacity-80">Collect feedback. Ship it. Without breaking the bank.</p>
     
        </motion.h1>

        {/* Modular Feature Layout: Stacked into two discrete rows (Top 3, Bottom 2) */}
        <motion.div
      {...fade(0.14)} // Ensure fade() is defined or imported in your file
      className="mt-14 flex flex-col items-center gap-3 w-full max-w-2xl"
    >
      {/* Unified Grid: 1 column on mobile, 3 columns on small screens and up */}
      <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-3">
        {features.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-center gap-2.5 py-3 rounded-xl bg-border-2 not-dark:!bg-black/5 transition-colors hover:border-white/20"
            >
              <IconComponent
                size={24}
                className={`shrink-0`}
                weight="fill"
              />
              <span className="text-lg font-medium tracking-tight text-white not-dark:text-black">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>

      

        <motion.div
          {...fade(0.26)}
          className="mt-16 flex flex-col gap-3 sm:flex-row"
        >
          <Button size="lg" asChild className="shadow-black/40">
            <Link href="/login">
              Start free
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="">
            <Link href="#features">Explore features</Link>
          </Button>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          {...fade(0.32)}
          className="mt-24 grid w-full max-w-2xl grid-cols-3 gap-3 overflow-hidden"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 bg-black/50 not-dark:bg-black/5 backdrop-blur-md px-3 py-5 rounded-2xl border-white/10"
            >
              <span className="text-xl font-semibold tracking-tight text-white not-dark:text-black md:text-3xl">
                {s.value} 
              </span>
              <span className="text-center font-semibold text-xs text-white/60 not-dark:text-black/60">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

