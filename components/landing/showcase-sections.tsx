"use client";

import { Reveal } from "./reveal";
import { Cardo } from "next/font/google";
import { ChatTeardropText, Kanban, RocketLaunch } from "@phosphor-icons/react";

const serif = Cardo({
 weight: ["400", "700"],
 subsets: ["latin"],
});

const SHOWCASES = [
 {
  id: "boards",
  icon: ChatTeardropText,
  tag: "Feedback Boards",
  title: "Collect & prioritize feature requests",
  description:
   "Your users vote on what matters most. Anonymous, frictionless, and always organized. No more scattered feedback across emails, Slack, and spreadsheets.",
  iframeSrc: "https://placeholder-boards-url.com",
  points: [
   "Anonymous fingerprinted voting — no login wall",
   "Status flairs & tags to keep signal clean",
   "Threaded comments for context-rich conversations",
   "Merge duplicate requests automatically",
  ],
 },
 {
  id: "roadmap",
  icon: Kanban,
  tag: "Kanban Roadmaps",
  title: "Show users what's coming next",
  description:
   "Turn your loudest signals into a public roadmap. Drag-and-drop columns keep your team aligned and users excited about what's shipping.",
  iframeSrc: "https://placeholder-roadmap-url.com",
  points: [
   "Drag-and-drop: Planned → In Progress → Shipped",
   "Auto-sorted by upvotes for clear priorities",
   "Public & embeddable — always up to date",
   "Link roadmap items back to original requests",
  ],
 },
 {
  id: "changelog",
  icon: RocketLaunch,
  tag: "Public Changelogs",
  title: "Announce every ship with style",
  description:
   "Write updates in markdown, attach images, and publish a clean changelog your users actually want to read. Close the feedback loop automatically.",
  iframeSrc: "https://placeholder-changelog-url.com",
  points: [
   "Rich markdown editor with image uploads",
   "Auto-link shipped items to original requests",
   "Beautiful timeline your users love reading",
   "Email & in-app notification support",
  ],
 },
];

export function ShowcaseSections() {
 return (
  <section id="features" className="relative mx-auto w-full max-w-6xl px-6 py-20">
   <Reveal className="mx-auto max-w-2xl text-center">
    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
     everything you need
    </span>
    <h2 className="mt-3 text-balance text-3xl tracking-tight md:text-6xl">
     <span className={serif.className}>One workspace. The whole feedback loop.</span>
    </h2>
    <p className="mt-6 text-balance text-muted-foreground">
     Stop stitching together five tools. Pittstop covers the full journey —
     collecting feedback, shipping updates, and keeping users in the loop.
    </p>
   </Reveal>

   <div className="mt-24 flex flex-col gap-32">
    {SHOWCASES.map((showcase, i) => {
     const Icon = showcase.icon;
     const flipped = i % 2 === 1;

     return (
      <div
       key={showcase.id}
       id={showcase.id}
       className="grid scroll-mt-24 items-center gap-10 md:grid-cols-2 md:gap-16"
      >
       {/* Copy side */}
       <Reveal className={flipped ? "md:order-2" : ""}>
        <div className="flex items-center gap-3">
         <Icon weight="fill" className="size-8 text-primary" />
         <span className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {showcase.tag}
         </span>
        </div>
        <h3 className="mt-5 text-balance text-2xl tracking-tight md:text-4xl">
         <span className={serif.className}>{showcase.title}</span>
        </h3>
        <p className="mt-4 text-balance text-muted-foreground">
         {showcase.description}
        </p>
        <ul className="mt-6 flex flex-col gap-3">
         {showcase.points.map((point) => (
          <li key={point} className="flex items-start gap-3 text-sm">
           <svg
            className="mt-0.5 size-5 shrink-0 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
           >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
           </svg>
           <span className="text-muted-foreground">{point}</span>
          </li>
         ))}
        </ul>
       </Reveal>

       {/* iframe side */}
       <Reveal delay={0.1} className={flipped ? "md:order-1" : ""}>
        <div className="overflow-hidden rounded-xl border-2 border-border shadow-lg">
         <iframe
          src={showcase.iframeSrc}
          title={`${showcase.tag} preview`}
          className="h-[500px] w-full pointer-events-none select-none bg-background"
          loading="lazy"
         />
        </div>
       </Reveal>
      </div>
     );
    })}
   </div>
  </section>
 );
}
