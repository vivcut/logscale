"use client"

import { Avocado } from "@phosphor-icons/react";
import Link from "next/link";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: "Product",
      links: [
        { label: "Feedback Boards", href: "#boards" },
        { label: "Roadmaps", href: "#roadmap" },
        { label: "Changelog", href: "#changelog" },
        { label: "Surveys", href: "#features" },
        { label: "Status Pages", href: "#features" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "Pricing", href: "#pricing" },
        { label: "Get started", href: "/login" },
        { label: "Sign in", href: "/login" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ];

/**
 * Landing footer — link columns over a faint star-grid, with the brand mark and
 * a "built with" credit line. Privacy / Terms route to their dedicated pages.
 */
export function Footer() {
  return (
    <footer className="relative border-t-2 border-border-2 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className={"flex items-center gap-1 w-full px-3 justify-center"}>
          <Avocado weight="fill" className="size-6 text-primary" />
          <h1 className={`text-2xl font-bold `}>Pitstop</h1>
        </div>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              The feedback platform for startups and indie developers. Collect,
              prioritize, and ship — all in one sleek workspace.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {col.heading}
              </span>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t-2 border-border-2 pt-8 text-xs text-muted-foreground md:flex-row">
          <span className="font-mono">© 2026 Pitstop. All rights reserved.</span>
          <span className="font-mono">built with next.js · supabase · shadcn/ui</span>
        </div>
      </div>
    </footer>
  );
}
