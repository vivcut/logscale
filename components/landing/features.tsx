"use client";

import * as React from "react";
import { motion } from "motion/react";

import {
  Activity,
  BarChart3,
  Code2,
  GitBranch,
  MessageSquare,
  Sparkles,
  Users,
} from "@/components/icons";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { cn } from "@/lib/utils";
import { Check } from "@phosphor-icons/react";

declare global {
  interface Window {
    CannyKillerObject?: string;
    ck?: any;
  }
}

/**
 * The full feature set, surfaced first as a scannable grid then expanded into
 * alternating "deep dive" sections below. `id` anchors line up with the navbar
 * + footer links so in-page navigation lands on the right block.
 */
const FEATURES = [
  {
    id: "boards",
    icon: MessageSquare,
    tag: "boards",
    title: "Feedback Boards",
    blurb:
      "Collect, organize, and prioritize feature requests with anonymous, fingerprinted voting.",
    points: [
      "Frictionless anonymous voting — no login wall for your users",
      "Status flairs, tags, and merging to keep the signal clean",
      "Threaded comments so the conversation stays in context",
    ],
  },
  {
    id: "roadmap",
    icon: GitBranch,
    tag: "roadmap",
    title: "Kanban Roadmaps",
    blurb:
      "Turn the loudest signals into a public roadmap your users can follow in real time.",
    points: [
      "Drag-and-drop columns: Planned → In Progress → Shipped",
      "Auto-sorted by upvotes so priorities are obvious",
      "Public, embeddable, and always up to date",
    ],
  },
  {
    id: "changelog",
    icon: Sparkles,
    tag: "changelog",
    title: "Public Changelogs",
    blurb:
      "Ship updates in markdown and announce them with a clean, scannable changelog.",
    points: [
      "Rich markdown editor with image uploads",
      "Auto-link shipped items back to the requests that drove them",
      "A timeline your users actually want to read",
    ],
  },
  {
    id: "surveys",
    icon: BarChart3,
    tag: "surveys",
    title: "Surveys & Forms",
    blurb:
      "Ask the right questions with hosted forms, then analyze responses at a glance.",
    points: [
      "Multiple question types with conditional logic",
      "Shareable hosted forms — no embed required",
      "Response analytics built in",
    ],
  },
  {
    id: "status",
    icon: Activity,
    tag: "status",
    title: "Status & Uptime",
    blurb:
      "A public status page with automated uptime checks and incident timelines.",
    points: [
      "Automated monitoring with scheduled checks",
      "Incident history with clear, honest updates",
      "Build trust with a page that's always live",
    ],
  },
  {
    id: "contact-page",
    icon: Activity,
    tag: "contact-pages",
    title: "Create a contact page",
    blurb:
      "A public status and embeddable page to collect feedback and build trust with your users",
    points: [
      "Customize how it looks",
      "Responses go straight to your workspace",
      // "Build trust with a page that's always live",
    ],
  },
  
  {
    id: "widget",
    icon: Code2,
    tag: "widget",
    title: "Embeddable Widget",
    blurb:
      "Drop a single snippet to use LogScale pages inside your product.",
    points: [
      "One-line embed script — works anywhere",
      "Themed to match your brand",
      "Feedback flows straight into your boards",
    ],
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto w-full max-w-6xl px-6 py-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="font-mono font-bold text-xs uppercase tracking-wider text-muted-foreground">
          everything you need
        </span>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-6xl">
          One workspace. The whole loop.
        </h2>
        <p className="mt-6 text-balance text-muted-foreground">
          Stop stitching together five tools. LogScale covers the full journey
          from collecting feedback, shipping updates, and keeping users in the loop.
        </p>
      </Reveal>

      {/* Feature grid */}
      <Stagger className="mt-14 grid gap-3 overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <StaggerItem key={f.id}>
            <motion.a
              href={`#${f.id}`}
              // whileHover={{ y: -4 }}
              // transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="group flex h-full flex-col gap-3 !rounded-xl bg-border not-dark:bg-transparent p-6 not-dark:border-2 transition-colors hover:bg-white/15"
            >
              {/* <div className="flex size-10 items-center bg-black/10 justify-center rounded-lg border-border text-foreground transition-colors group-hover:border-foreground/30"> */}
                <f.icon weight="fill" className="size-8 text-black dark:text-white" />
              {/* </div> */}
              <span className="font-mono text-xs text-muted-foreground">
                /{f.tag}
              </span>
              <h3 className="text-2xl font-semibold tracking-tight">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.blurb}</p>
            </motion.a>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Deep-dive alternating sections */}
      <div className="mt-28 flex flex-col gap-28">
        {FEATURES.map((f, i) => (
          <FeatureDetail key={f.id} feature={f} flipped={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

function FeatureDetail({
  feature,
  flipped,
}: {
  feature: (typeof FEATURES)[number];
  flipped: boolean;
}) {
  const Icon = feature.icon;
  return (
    <div
      id={feature.id}
      className="grid scroll-mt-24 items-center gap-10 md:grid-cols-2 md:gap-16"
    >
      {/* Copy */}
      <Reveal className={cn(flipped && "md:order-2")}>
        <div className="flex items-center gap-2">
          {/* <span className="flex size-8 items-center justify-center rounded-md border border-border bg-secondary"> */}
            <Icon className="size-6" />
          {/* </span> */}
          <br/>
          <span className="font-mono text-md font-semibold translate-y-0.5 uppercase tracking-wider text-muted-foreground">
            /{feature.tag}
          </span>
        </div>
        <h3 className="mt-5 text-balance text-2xl font-semibold tracking-tight md:text-5xl">
          {feature.title}
        </h3>
        <p className="mt-4 text-balance text-muted-foreground">
          {feature.blurb}
        </p>
        <ul className="mt-6 flex flex-col gap-3">
          {feature.points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm">
              {/* <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground"> */}
                <Check className="size-5" />
              {/* </span> */}
              <span className="text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* Visual */}
      <Reveal
        delay={0.1}
        className={cn(
          "border-2 rounded-xl",
          flipped && "md:order-1"
        )}
      >
        <FeatureVisual id={feature.id} />
      </Reveal>
    </div>
  );
}

/**
 * Per-feature mock visual. Lightweight, themed, CSS-only mini UIs so each deep
 * dive shows the product rather than a stock illustration.
 */
function FeatureVisual({ id }: { id: string }) {
  const glow = (
   <></>
  );

  if (id === "boards") {


  const previewSrc = `${origin}/widget/acme?view=boards`;

  // 2. Return the pure, safe JSX UI representation of the snippet and iframe
  return (
  
      
      
        
        
          <iframe
            src={previewSrc}
            title="Widget preview"
            
            className=" h-[600px] w-full pointer-events-none rounded-lg bg-background select-none disabled"
          />
        
     
    
  );
}

  if (id === "roadmap") {
     const previewSrc = `${origin}/widget/acme?view=roadmap`;

  // 2. Return the pure, safe JSX UI representation of the snippet and iframe
  return (
  
      
      
        
        
          <iframe
            src={previewSrc}
            title="Widget preview"
            
            className=" h-[600px] w-full pointer-events-none rounded-lg bg-background select-none disabled"
          />
        
     
    
  );
  }

  if (id === "changelog") {
     const previewSrc = `${origin}/widget/acme?view=changelog`;

  // 2. Return the pure, safe JSX UI representation of the snippet and iframe
  return (
  
      
      
        
        
          <iframe
            src={previewSrc}
            title="Widget preview"
            
            className=" h-[600px] w-full pointer-events-none rounded-lg bg-background select-none disabled"
          />
        
     
    
  );
  }

  if (id === "surveys") {
     const previewSrc = `${origin}/widget/acme?view=survey%3Ahow-do-you-like-our-services`;

  // 2. Return the pure, safe JSX UI representation of the snippet and iframe
  return (
  
      
      
        
        
          <iframe
            src={previewSrc}
            title="Widget preview"
            
            className=" h-[600px] w-full pointer-events-none rounded-lg bg-background select-none disabled"
          />
        
     
    
  );
  }

  if (id === "status") {
    const previewSrc = `${origin}/widget/acme?view=status`;

  // 2. Return the pure, safe JSX UI representation of the snippet and iframe
  return (
  
      
      
        
        
          <iframe
            src={previewSrc}
            title="Widget preview"
            
            className=" h-[600px] w-full pointer-events-none rounded-lg bg-background select-none disabled"
          />
        
     
    
  );
  }

  if (id === "contact-page") {
    const previewSrc = `${origin}/widget/acme?view=contact`;

  // 2. Return the pure, safe JSX UI representation of the snippet and iframe
  return (
  
      
      
        
        
          <iframe
            src={previewSrc}
            title="Widget preview"
            
            className=" h-[600px] w-full pointer-events-none rounded-lg bg-background select-none disabled"
          />
        
     
    
  );
  }

  // widget
  return (
    <div className="relative grid h-full place-items-center p-5">
      {glow}
      <div className="w-full max-w-xs rounded-xl border border-border bg-background/70 shadow-xl">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Users className="size-3.5" />
          <span className="text-xs font-medium">Embedded page</span>
        </div>
        <div className="space-y-2 p-3">
          <div className="h-8 rounded-md border border-border bg-secondary/50" />
          <div className="h-16 rounded-md border border-border bg-secondary/50" />
          <div className="flex h-8 items-center justify-center rounded-md bg-foreground text-xs font-medium text-background">
            Submit
          </div>
        </div>
      </div>
    </div>
  );
}
