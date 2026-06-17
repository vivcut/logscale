import Link from "next/link";

import { ArrowRight } from "@/components/icons";

export const metadata = {
 title: "Not found — Pitstop",
};

/**
 * Global 404. Rendered by Next.js whenever a route (or a `notFound()` call,
 * e.g. a private board) has no match. Branded with the Pitstop watermark so
 * even missing/private pages feel like part of the product.
 */
export default function NotFound() {
 return (
  <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
   {/* Faint oversized watermark behind the content */}
   <span
    aria-hidden
    className="pointer-events-none select-none absolute inset-0 flex items-center justify-center font-mono text-[22vw] font-bold leading-none tracking-tighter text-foreground/[0.03]"
   >
    404
   </span>

   <div className="relative z-10 flex flex-col items-center">
    <div className="inline-flex items-center gap-1.5 rounded-full  border-2 border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
     <span aria-hidden>🚀</span>
     <span className="font-medium text-foreground">Pitstop</span>
    </div>

    <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
     Lost in space
    </h1>
    <p className="mt-3 max-w-md text-sm text-muted-foreground">
     This page doesn&apos;t exist or is private. The link may be broken, the
     board may have been set to private, or it was never here to begin with.
    </p>

    <Link
     href="/"
     className="mt-8 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
    >
     Back to home
     <ArrowRight className="size-4" />
    </Link>
   </div>
  </main>
 );
}
