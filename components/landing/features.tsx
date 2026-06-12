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
    id: "widget",
    icon: Code2,
    tag: "widget",
    title: "Embeddable Widget",
    blurb:
      "Drop a single snippet to collect feedback right inside your product.",
    points: [
      "One-line embed script — works anywhere",
      "Themed to match your brand",
      "Feedback flows straight into your boards",
    ],
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto w-full max-w-6xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          everything you need
        </span>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          One workspace. The whole feedback loop.
        </h2>
        <p className="mt-4 text-balance text-muted-foreground">
          Stop stitching together five tools. ToTheMoon covers the full journey
          from raw idea to shipped feature — and tells your users about it.
        </p>
      </Reveal>

      {/* Feature grid */}
      <Stagger className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <StaggerItem key={f.id}>
            <motion.a
              href={`#${f.id}`}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="group flex h-full flex-col gap-3 bg-card p-6 transition-colors hover:bg-card/60"
            >
              <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-foreground transition-colors group-hover:border-foreground/30">
                <f.icon className="size-5" />
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                /{f.tag}
              </span>
              <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
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
          <span className="flex size-8 items-center justify-center rounded-md border border-border bg-secondary">
            <Icon className="size-4" />
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            /{feature.tag}
          </span>
        </div>
        <h3 className="mt-5 text-balance text-2xl font-semibold tracking-tight md:text-3xl">
          {feature.title}
        </h3>
        <p className="mt-4 text-balance text-muted-foreground">
          {feature.blurb}
        </p>
        <ul className="mt-6 flex flex-col gap-3">
          {feature.points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm">
              <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground">
                ✓
              </span>
              <span className="text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* Visual */}
      <Reveal
        delay={0.1}
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card",
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
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_50%_0%,oklch(0.55_0.21_277/0.12)_0%,transparent_70%)]"
    />
  );

  if (id === "boards") {
    return (
      <div className="relative h-full p-5">
        {glow}
        <div className="flex flex-col gap-2.5">
          {[
            { t: "Dark mode for the dashboard", v: 248 },
            { t: "Slack + Discord integration", v: 191 },
            { t: "Bulk CSV export", v: 96 },
          ].map((r) => (
            <div
              key={r.t}
              className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2.5"
            >
              <span className="text-sm">{r.t}</span>
              <span className="flex flex-col items-center rounded-md border border-border px-2 py-0.5 font-mono text-[11px]">
                ▲<span className="tabular-nums">{r.v}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "roadmap") {
    const cols = [
      { h: "Planned", items: ["SSO login", "Webhooks"] },
      { h: "In Progress", items: ["Custom domains"] },
      { h: "Shipped", items: ["Anon voting", "Dark mode"] },
    ];
    return (
      <div className="relative grid h-full grid-cols-3 gap-2 p-4">
        {glow}
        {cols.map((c) => (
          <div key={c.h} className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {c.h}
            </span>
            {c.items.map((it) => (
              <div
                key={it}
                className="rounded-md border border-border bg-background/60 px-2 py-2 text-[11px]"
              >
                {it}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (id === "changelog") {
    return (
      <div className="relative h-full p-5">
        {glow}
        <div className="flex flex-col gap-4">
          {[
            { v: "v1.4", t: "Custom domains", d: "Bring your own domain." },
            { v: "v1.3", t: "Anonymous voting", d: "No login required." },
          ].map((c) => (
            <div key={c.v} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="size-2 rounded-full bg-chart-1" />
                <span className="mt-1 w-px flex-1 bg-border" />
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {c.v}
                </span>
                <p className="text-sm font-medium">{c.t}</p>
                <p className="text-xs text-muted-foreground">{c.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "surveys") {
    return (
      <div className="relative h-full p-5">
        {glow}
        <p className="text-sm font-medium">How likely are you to recommend us?</p>
        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "flex h-7 flex-1 items-center justify-center rounded-md border border-border font-mono text-[11px]",
                i >= 7 ? "bg-secondary text-foreground" : "text-muted-foreground"
              )}
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          {[78, 54, 33].map((w, i) => (
            <div key={i} className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${w}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "status") {
    return (
      <div className="relative h-full p-5">
        {glow}
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium">All systems operational</span>
        </div>
        <div className="mt-5 space-y-3">
          {["API", "Dashboard", "Webhooks"].map((s) => (
            <div key={s}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{s}</span>
                <span className="font-mono text-muted-foreground">99.9%</span>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 28 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-5 flex-1 rounded-[2px]",
                      i === 19 ? "bg-chart-4" : "bg-emerald-500/70"
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // widget
  return (
    <div className="relative grid h-full place-items-center p-5">
      {glow}
      <div className="w-full max-w-xs rounded-xl border border-border bg-background/70 shadow-xl">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Users className="size-3.5" />
          <span className="text-xs font-medium">Send us feedback</span>
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
