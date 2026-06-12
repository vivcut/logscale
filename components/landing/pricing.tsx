"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { ArrowRight, Check } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Hobby",
    price: "$0",
    cadence: "forever",
    tagline: "Everything an indie hacker needs to start the loop.",
    highlighted: false,
    features: [
      "1 feedback board",
      "Public kanban roadmap",
      "Changelog timeline",
      "1 survey · up to 3 questions",
      "2 monitored status sites",
      "Anonymous voting & comments",
    ],
    cta: "Start for free",
  },
  {
    name: "Startup",
    price: "$19",
    cadence: "per month",
    tagline: "Remove the limits and the watermark as you scale.",
    highlighted: true,
    features: [
      "Unlimited boards & surveys",
      "Unlimited status sites + custom paths",
      "Image uploads in posts & changelog",
      "Team members & multiple editors",
      "Custom contact page copy",
      "No “Built with ToTheMoon” watermark",
    ],
    cta: "Upgrade to Startup",
  },
];

/**
 * Pricing — two plans mirroring the real Hobby (free) and Startup tiers from
 * lib/subscription.ts. The Startup card is visually elevated with a glow and
 * gradient ring. Both CTAs route to /login (sign-in is the gate to checkout).
 */
export function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto w-full max-w-6xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          pricing
        </span>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Free to start. Fair as you grow.
        </h2>
        <p className="mt-4 text-balance text-muted-foreground">
          Begin on the Hobby plan with no credit card. Upgrade to Startup when
          you outgrow the limits — cancel anytime.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border p-7",
                plan.highlighted
                  ? "border-transparent bg-card [background:linear-gradient(var(--card),var(--card))_padding-box,linear-gradient(140deg,oklch(0.55_0.21_277),transparent_60%)_border-box]"
                  : "border-border bg-card"
              )}
            >
              {plan.highlighted ? (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 rounded-2xl [background:radial-gradient(80%_60%_at_50%_0%,oklch(0.55_0.21_277/0.12)_0%,transparent_70%)]"
                  />
                  <span className="absolute -top-3 left-7 rounded-full border border-border bg-foreground px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-background">
                    Most popular
                  </span>
                </>
              ) : null}

              <h3 className="text-lg font-semibold tracking-tight">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-end gap-1.5">
                <span className="text-4xl font-semibold tracking-tight">
                  {plan.price}
                </span>
                <span className="mb-1 font-mono text-xs text-muted-foreground">
                  {plan.cadence}
                </span>
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-chart-1" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={plan.highlighted ? "default" : "outline"}
                asChild
              >
                <Link href="/login">
                  {plan.cta}
                  <ArrowRight />
                </Link>
              </Button>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
