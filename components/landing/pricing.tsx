"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import { ArrowRight, Check } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";
import { Cardo } from "next/font/google";

const serif = Cardo({
 weight: ["400", "700"],
 subsets: ["latin"],
});

export function Pricing() {
 const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

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
   price: billingPeriod === "monthly" ? "$14" : "$94",
   cadence: billingPeriod === "monthly" ? "per month" : "per year",
   tagline: "Remove the limits and the watermark as you scale.",
   highlighted: true,
   features: [
    "Unlimited boards & surveys",
    "Unlimited status sites + custom paths",
    "Image uploads in posts & changelog",
    "Team members & multiple editors",
    "Custom contact page copy",
    "No “Built with Pittstop” watermark",
   ],
   cta: "Upgrade to Startup",
  },
 ];

 return (
  <section id="pricing" className="relative mx-auto w-full max-w-6xl px-6 py-28">
   <Reveal className="mx-auto max-w-2xl text-center">
    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
     pricing
    </span>
    <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-6xl">
     <span className={serif.className}>
      Free to start. Fair as you grow.
     </span>
     
    </h2>
    <p className="mt-4 text-balance text-muted-foreground">
     Begin on the Hobby plan with no credit card. Upgrade to Startup when
     you outgrow the limits — cancel anytime.
    </p>

    {/* Billing Period Switcher */}
    <div className="mt-10 flex justify-center">
     <div className="relative flex rounded-full  border-2 border-border bg-muted p-1">
      <button
       onClick={() => setBillingPeriod("monthly")}
       className={cn(
        "rounded-full px-4 py-1.5 font-mono text-xs font-medium transition-all",
        billingPeriod === "monthly"
         ? "bg-background text-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       Monthly
      </button>
      <button
       onClick={() => setBillingPeriod("yearly")}
       className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-xs font-medium transition-all",
        billingPeriod === "yearly"
         ? "bg-background text-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       Yearly
       <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
        Save ~44%
       </span>
      </button>
     </div>
    </div>
   </Reveal>

   <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
    {PLANS.map((plan, i) => (
     <Reveal key={plan.name} delay={i * 0.08}>
      <motion.div
       whileHover={{ y: -4 }}
       transition={{ type: "spring", stiffness: 300, damping: 22 }}
       className={cn(
        "relative flex h-full flex-col rounded-2xl  border-2 border-border p-7",
        plan.highlighted
         ? "border-transparent bg-card [background:linear-gradient(var(--card),var(--card))_padding-box,linear-gradient(140deg,#8caa4a,transparent_60%)_border-box]"
         : " bg-card"
       )}
      >
       {plan.highlighted ? (
        <>
         <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-2xl"
         />
         <span className="absolute -top-3 left-7 rounded-full  border-2 border-border bg-foreground px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-background">
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
        <span className="mb-1 font-mono text-xs text-muted-foreground transition-all">
         {plan.cadence}
        </span>
       </div>

       <ul className="mt-6 flex flex-1 flex-col gap-3">
        {plan.features.map((f) => (
         <li key={f} className="flex items-start gap-2.5 text-sm">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
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