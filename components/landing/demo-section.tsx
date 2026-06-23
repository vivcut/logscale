"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { Cardo } from "next/font/google";

const serif = Cardo({
 weight: ["400", "700"],
 subsets: ["latin"],
});

/**
 * Demo section — shows an iframe of the live product right below the hero.
 * Clicking it navigates to the full demo page.
 */
export function DemoSection() {
 return (
  <section id="demo" className="relative mx-auto w-full max-w-6xl px-6 py-20">
   <Reveal className="mx-auto max-w-2xl text-center">
    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
     live demo
    </span>
    <h2 className="mt-3 text-balance text-3xl tracking-tight md:text-5xl">
     <span className={serif.className}>See Pittstop in action</span>
    </h2>
    <p className="mt-4 text-balance text-muted-foreground">
     Explore a real workspace — browse feedback boards, check the roadmap, and
     read changelogs. No signup needed.
    </p>
   </Reveal>

   <Reveal delay={0.1}>
    <Link href="https://placeholder-demo-url.com" target="_blank" className="group mt-10 block">
     <div className="relative overflow-hidden rounded-2xl border-2 border-border shadow-2xl shadow-black/10 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-primary/10">
      {/* Gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <iframe
       src="https://placeholder-demo-url.com"
       title="Pittstop Live Demo"
       className="h-[600px] w-full pointer-events-none select-none bg-background"
       loading="lazy"
      />
      
      {/* Click overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
       <div className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg">
        Open full demo
        <ArrowRight className="size-4" />
       </div>
      </div>
     </div>
    </Link>
   </Reveal>

   <div className="mt-6 flex justify-center">
    <Button variant="outline" size="lg" asChild>
     <Link href="https://placeholder-demo-url.com" target="_blank">
      Try the interactive demo
      <ArrowRight className="ml-2 size-4" />
     </Link>
    </Button>
   </div>
  </section>
 );
}
