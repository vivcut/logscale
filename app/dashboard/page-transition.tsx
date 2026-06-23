"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Gently fades dashboard content in on every navigation / workspace switch.
 * The surrounding layout (sidebar) stays put; only this inner content animates.
 * Keying the wrapper on the pathname forces React to remount it per route, so
 * the CSS fade-in (see .animate-fade-in in globals.css) replays each time.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 return (
   <div key={pathname} className="animate-fade-in">
   {children}
  </div>
 );
}
