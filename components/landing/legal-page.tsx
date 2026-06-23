import * as React from "react";

import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export type LegalSection = {
 heading: string;
 body: React.ReactNode;
};

/**
 * Shared chrome for the Privacy Policy and Terms of Service pages. Renders the
 * landing navbar + footer around a centered, prose-styled article so the legal
 * pages stay on-brand and consistent. Pass a title, "last updated" date, an
 * intro, and an ordered list of sections.
 */
export function LegalPage({
 title,
 updated,
 intro,
 sections,
}: {
 title: string;
 updated: string;
 intro: React.ReactNode;
 sections: LegalSection[];
}) {
 return (
  <>
   <Navbar />
   <main className="relative flex flex-1 flex-col">
    {/* Faint glow header backdrop */}
    <div
     aria-hidden
     className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 [background:radial-gradient(60%_100%_at_50%_0%,oklch(0.55_0.21_277/0.12)_0%,transparent_70%)]"
    />

    <article className="mx-auto w-full max-w-3xl px-6 pb-28 pt-36">
     <header className="border-t pb-8">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
       legal
      </span>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
       {title}
      </h1>
      <p className="mt-3 font-mono text-xs text-muted-foreground">
       Last updated: {updated}
      </p>
     </header>

     <div className="mt-8 text-pretty leading-relaxed text-muted-foreground">
      {intro}
     </div>

     <div className="mt-10 flex flex-col gap-10">
      {sections.map((s, i) => (
       <section key={s.heading} className="scroll-mt-24">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
         <span className="mr-2 font-mono text-sm text-muted-foreground">
          {String(i + 1).padStart(2, "0")}.
         </span>
         {s.heading}
        </h2>
        <div className="mt-3 text-pretty leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
         {s.body}
        </div>
       </section>
      ))}
     </div>
    </article>
   </main>
   <Footer />
  </>
 );
}
