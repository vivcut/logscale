"use client";

import Link from "next/link";

import { ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

/**
 * Closing CTA — a self-contained "to the moon" panel with a layered radial
 * glow + faint grid, the final pitch, and both primary actions routing to
 * /login. Sits just above the footer.
 */
export function CTA() {
 return (
  <section className="relative mx-auto w-full max-w-6xl px-6 pb-28">
   <Reveal>
    <div className="relative overflow-hidden rounded-3xl  border-2 border-border bg-card px-6 py-20 text-center md:py-28">
     {/* Glow */}
     <div
      aria-hidden
      // className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_80%_at_50%_120%,oklch(0.55_0.21_277/0.28)_0%,transparent_60%)]"
     />
     {/* Grid */}
     <div
      aria-hidden
      // className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:44px_44px]"
     />

     <div className="relative">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
       ready for liftoff
      </span>
      <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
       Put your users in the loop
      </h2>
      <p className="mx-auto mt-5 max-w-lg text-balance text-muted-foreground">
       Join the startups and indie developers shipping what their users
       actually want. Free forever to start — no credit card.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
       <Button size="lg" asChild>
        <Link href="/login">
         Get started free
         <ArrowRight />
        </Link>
       </Button>
       <Button size="lg" variant="outline" asChild>
        <Link href="/login">Sign in</Link>
       </Button>
      </div>
     </div>
    </div>
   </Reveal>
  </section>
 );
}
