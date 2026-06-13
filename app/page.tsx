import type { Metadata } from "next";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { ThemePopup } from "@/components/landing/theme-popup"; // 👈 Import the popup

export const metadata: Metadata = {
  title: "LogScale — Ship what your users actually want",
  description:
    "The high-performance feedback platform for startups and indie developers. Feedback boards, kanban roadmaps, public changelogs, surveys, and status pages in one sleek workspace.",
  openGraph: {
    title: "LogScale — Ship what your users actually want",
    description:
      "Feedback boards, kanban roadmaps, changelogs, surveys, and status pages in one sleek workspace built for startups and indie developers.",
    type: "website",
  },
};

const COMPANIES = [
  "Acme Corp", "Linear", "Vercel", "Supabase", "Stripe", "Clerk", "Resend",
  "Shadcn", "Framer", "Railway", "Dub.co", "Cal.com", "PostHog", "PlanetScale"
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        
        {/* --- INFINITE SCROLLING COMPANY MARQUEE STRIP --- */}
        <section className="relative w-full overflow-hiddenr dark:border-t-2 pt-6 pb-6 backdrop-blur-sm">
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
            {[...COMPANIES, ...COMPANIES].map((company, index) => (
              <span 
                key={index} 
                className="text-lg font-medium text-white not-dark:text-black opacity-70"
              >
                {company}
              </span>
            ))}
          </div>
          
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-black not-dark:!from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-black not-dark:!from-white to-transparent" />
        </section>

        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
      
      {/* --- FLOATING THEME INTERFACES --- */}
      <ThemePopup /> 
    </>
  );
}