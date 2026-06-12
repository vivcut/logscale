import type { Metadata } from "next";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "ToTheMoon — Ship what your users actually want",
  description:
    "The high-performance feedback platform for startups and indie developers. Feedback boards, kanban roadmaps, public changelogs, surveys, and status pages in one sleek workspace.",
  openGraph: {
    title: "ToTheMoon — Ship what your users actually want",
    description:
      "Feedback boards, kanban roadmaps, changelogs, surveys, and status pages in one sleek workspace built for startups and indie developers.",
    type: "website",
  },
};

const COMPANIES = [
  "Acme Corp", "Linear", "Vercel", "Supabase", "Stripe", "Clerk", "Resend",
  "Shadcn", "Framer", "Railway", "Dub.co", "Cal.com", "PostHog", "PlanetScale"
];

/**
 * Marketing home page (/). A sleek, space-themed landing built for indie devs
 * and startups: a three.js starfield hero, a scannable feature grid that
 * expands into alternating deep-dive sections, a workflow rail, real-plan
 * pricing, and a closing CTA. Framer Motion drives the scroll reveals; every
 * primary action routes to /login. Nav + footer link to Privacy and Terms.
 */
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        
        {/* --- INFINITE SCROLLING COMPANY MARQUEE STRIP --- */}
        <section className="relative w-full overflow-hidden border-y border-border bg-card/30 py-4 backdrop-blur-sm">
          {/* Injecting a micro keyframe style directly so you don't have to touch tailwind.config */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-slow {
              display: flex;
              width: max-content;
              animation: marquee 30s linear infinite;
            }
          `}} />
          
          <div className="animate-marquee-slow gap-16 px-4">
            {/* Render twice for a perfect seamless infinite loop connection */}
            {[...COMPANIES, ...COMPANIES].map((company, index) => (
              <span 
                key={index} 
                className="font-mono text-xs font-medium tracking-widest uppercase text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                {company}
              </span>
            ))}
          </div>
          
          {/* Edge gradient masks to make the text blend beautifully into the screen boundaries */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-black to-transparent" />
        </section>

        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}