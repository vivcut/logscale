"use client";

import { Reveal, Stagger, StaggerItem } from "./reveal";

const STEPS = [
 {
  n: "01",
  title: "Collect",
  body: "Spin up boards and let users post and upvote ideas — anonymously, no account required.",
 },
 {
  n: "02",
  title: "Prioritize",
  body: "Watch the signal sort itself by votes, then drag the winners onto your public roadmap.",
 },
 {
  n: "03",
  title: "Ship & announce",
  body: "Close the loop with a changelog entry that links straight back to the request it solved.",
 },
];

/**
 * Workflow — a three-step "how it works" rail that frames the product as a
 * single feedback loop (collect → prioritize → ship). Numbered, mono-labeled
 * cards connected by a subtle gradient line on desktop.
 */
export function Workflow() {
 return (
  <section className="relative border-y bg-card/30">
   <div className="mx-auto max-w-6xl px-6 py-24">
    <Reveal className="mx-auto max-w-2xl text-center">
     <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
      how it works
     </span>
     <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
      A loop, not a backlog.
     </h2>
     <p className="mt-4 text-balance text-muted-foreground">
      Every request your users submit flows through the same tight cycle —
      so nothing important falls through the cracks.
     </p>
    </Reveal>

    <Stagger className="relative mt-16 grid gap-8 md:grid-cols-3">
     {/* connecting line */}
     <div
      aria-hidden
      className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via- border-2 border-border to-transparent md:block"
     />
     {STEPS.map((s) => (
      <StaggerItem key={s.n}>
       <div className="relative flex flex-col gap-3 rounded-2xl  border-2 border-border bg-background p-6">
        <span className="flex size-12 items-center justify-center rounded-full  border-2 border-border bg-card font-mono text-sm font-semibold">
         {s.n}
        </span>
        <h3 className="mt-2 text-lg font-semibold tracking-tight">
         {s.title}
        </h3>
        <p className="text-sm text-muted-foreground">{s.body}</p>
       </div>
      </StaggerItem>
     ))}
    </Stagger>
   </div>
  </section>
 );
}
