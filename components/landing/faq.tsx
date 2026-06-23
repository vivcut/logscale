"use client";

import { useState } from "react";
import { Reveal } from "./reveal";
import { Cardo } from "next/font/google";
import { cn } from "@/lib/utils";

const serif = Cardo({
 weight: ["400", "700"],
 subsets: ["latin"],
});

const FAQS = [
 {
  question: "Is Pittstop really free to start?",
  answer:
   "Yes! The Hobby plan is completely free forever — no credit card required. You get 1 feedback board, a public roadmap, changelog, 1 survey, and 2 status sites. Upgrade only when you need unlimited boards and team features.",
 },
 {
  question: "How long does it take to set up?",
  answer:
   "Under 2 minutes. Sign up, name your workspace, and your feedback board is live. You can share the public link immediately or embed it in your product with a single line of code.",
 },
 {
  question: "Can my users submit feedback without creating an account?",
  answer:
   "Absolutely. Pittstop uses anonymous fingerprinted voting and commenting. Your users never hit a login wall — they can vote, comment, and submit feedback instantly.",
 },
 {
  question: "How is Pittstop different from Canny or UserVoice?",
  answer:
   "Pittstop combines feedback boards, kanban roadmaps, changelogs, surveys, status pages, and a contact page in one workspace — at a fraction of the cost. Our free tier is more generous, and our Startup plan at $14/mo includes everything most teams need.",
 },
 {
  question: "Can I embed Pittstop in my own product?",
  answer:
   "Yes! Drop a single script tag into your app and Pittstop renders natively inside your product. You can embed boards, roadmaps, changelogs, surveys, or the full workspace. It themes to match your brand automatically.",
 },
 {
  question: "Do you support custom domains?",
  answer:
   "Custom domain support is on our roadmap and coming soon. Currently, your public workspace lives at a clean pittstop.space/your-workspace URL that you can share anywhere.",
 },
 {
  question: "Can I invite team members?",
  answer:
   "Yes — on the Startup plan you can invite unlimited team members as editors. They can manage boards, update post statuses, write changelog entries, and respond to feedback.",
 },
 {
  question: "What happens if I exceed the free plan limits?",
  answer:
   "We'll let you know when you're approaching limits. Your existing data is never deleted — you just won't be able to create new boards or surveys until you upgrade or remove existing ones.",
 },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
 const [open, setOpen] = useState(false);

 return (
  <div className="border-b border-border">
   <button
    onClick={() => setOpen(!open)}
    className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-primary"
   >
    <span className="text-sm font-semibold pr-4 md:text-base">{question}</span>
    <svg
     className={cn(
      "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
      open && "rotate-180"
     )}
     fill="none"
     viewBox="0 0 24 24"
     stroke="currentColor"
     strokeWidth={2}
    >
     <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
   </button>
   <div
    className={cn(
     "overflow-hidden transition-all duration-300",
     open ? "max-h-96 pb-5" : "max-h-0"
    )}
   >
    <p className="text-sm leading-relaxed text-muted-foreground">{answer}</p>
   </div>
  </div>
 );
}

export function FAQ() {
 return (
  <section id="faq" className="relative mx-auto w-full max-w-3xl px-6 py-28">
   <Reveal className="mx-auto max-w-2xl text-center">
    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
     faq
    </span>
    <h2 className="mt-3 text-balance text-3xl tracking-tight md:text-5xl">
     <span className={serif.className}>Frequently asked questions</span>
    </h2>
    <p className="mt-4 text-balance text-muted-foreground">
     Everything you need to know about Pittstop. Can&apos;t find what you&apos;re
     looking for? Reach out to us.
    </p>
   </Reveal>

   <div className="mt-14">
    {FAQS.map((faq) => (
     <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
    ))}
   </div>
  </section>
 );
}
