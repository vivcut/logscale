import type { Metadata } from "next";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { DemoSection } from "@/components/landing/demo-section";
import { ShowcaseSections } from "@/components/landing/showcase-sections";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
 title: "Pittstop — The #1 Feedback Platform for Startups | Boards, Roadmaps & Changelogs",
 description:
  "Collect user feedback, prioritize with kanban roadmaps, and announce updates with public changelogs. The all-in-one platform trusted by 600+ startups. Start free today.",
 keywords: [
  "feedback board",
  "feature request tool",
  "public roadmap",
  "kanban roadmap",
  "public changelog",
  "product feedback tool",
  "user feedback platform",
  "startup tools",
  "indie developer tools",
  "feature voting board",
  "product management",
  "customer feedback software",
  "canny alternative",
  "uservoice alternative",
 ],
 openGraph: {
  title: "Pittstop — The #1 Feedback Platform for Startups",
  description:
   "Collect user feedback, prioritize with kanban roadmaps, and announce updates with public changelogs. Trusted by 600+ startups.",
  type: "website",
  url: "https://pittstop.space",
  siteName: "Pittstop",
  images: [
   {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    alt: "Pittstop — Feedback Boards, Roadmaps & Changelogs",
   },
  ],
 },
 twitter: {
  card: "summary_large_image",
  title: "Pittstop — The #1 Feedback Platform for Startups",
  description:
   "Collect user feedback, prioritize with kanban roadmaps, and announce updates with public changelogs.",
  images: ["/og-image.png"],
 },
 alternates: {
  canonical: "https://pittstop.space",
 },
};

export default function Home() {
 return (
  <>
   <Navbar />
   <main className="flex flex-1 flex-col">
    <Hero />
    <DemoSection />
    <ShowcaseSections />
    <Testimonials />
    <Pricing />
    <FAQ />
    <CTA />
   </main>
   <Footer />
  </>
 );
}
