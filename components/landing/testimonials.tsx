"use client";

import { Reveal, Stagger, StaggerItem } from "./reveal";
import { Cardo } from "next/font/google";

const serif = Cardo({
 weight: ["400", "700"],
 subsets: ["latin"],
});

const TESTIMONIALS = [
 {
  quote:
   "We replaced Canny, Trello, and a Notion changelog with Pittstop. Saved us $200/mo and our users actually engage with the roadmap now.",
  author: "Sarah Chen",
  role: "Co-founder",
  company: "StreamlineAI",
  avatar: "SC",
 },
 {
  quote:
   "Setup took 2 minutes. Within an hour we had 40+ feature requests from users who never would have emailed us. Game changer for prioritization.",
  author: "Marcus Rodriguez",
  role: "Solo Founder",
  company: "ShipFast",
  avatar: "MR",
 },
 {
  quote:
   "The public changelog alone increased our retention by 15%. Users love seeing their requests go from 'Planned' to 'Shipped'.",
  author: "Emily Park",
  role: "Head of Product",
  company: "Kinetik",
  avatar: "EP",
 },
 {
  quote:
   "Best feedback tool for indie hackers, period. Free tier is genuinely useful and the paid plan is a no-brainer at $14/mo.",
  author: "James Liu",
  role: "Indie Developer",
  company: "PixelCraft",
  avatar: "JL",
 },
 {
  quote:
   "Our support tickets dropped 30% after launching our Pittstop board. Users help each other and vote instead of emailing us the same requests.",
  author: "Anna Kowalski",
  role: "CTO",
  company: "Plinth",
  avatar: "AK",
 },
 {
  quote:
   "The embed widget is seamless — feels native in our app. Users submit feedback without ever leaving the product. Exactly what we needed.",
  author: "David Okafor",
  role: "Engineering Lead",
  company: "VaporIO",
  avatar: "DO",
 },
];

export function Testimonials() {
 return (
  <section id="testimonials" className="relative mx-auto w-full max-w-6xl px-6 py-28">
   <Reveal className="mx-auto max-w-2xl text-center">
    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
     loved by builders
    </span>
    <h2 className="mt-3 text-balance text-3xl tracking-tight md:text-5xl">
     <span className={serif.className}>Trusted by 600+ startups worldwide</span>
    </h2>
    <p className="mt-4 text-balance text-muted-foreground">
     From solo indie hackers to growing teams — hear why builders choose Pittstop
     to close the feedback loop.
    </p>
   </Reveal>

   <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {TESTIMONIALS.map((t) => (
     <StaggerItem key={t.author}>
      <div className="flex h-full flex-col justify-between rounded-xl border-2 border-border bg-card p-6 transition-colors hover:border-primary/20">
       <blockquote className="text-sm leading-relaxed text-muted-foreground">
        &ldquo;{t.quote}&rdquo;
       </blockquote>
       <div className="mt-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
         {t.avatar}
        </div>
        <div>
         <p className="text-sm font-semibold text-foreground">{t.author}</p>
         <p className="text-xs text-muted-foreground">
          {t.role}, {t.company}
         </p>
        </div>
       </div>
      </div>
     </StaggerItem>
    ))}
   </Stagger>
  </section>
 );
}
