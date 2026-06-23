"use client";

import * as React from "react";
import { Info, X } from "@phosphor-icons/react";

export function FrozenOverlay({ workspaceName }: { workspaceName: string }) {
 const [showPopup, setShowPopup] = React.useState(false);

 return (
  <>
   {/* Full-screen blurred overlay */}
   <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
    {/* Backdrop blur */}
    <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

    {/* Content */}
    <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
     {/* Frozen message */}
     <div className="flex flex-col items-center gap-3">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
       <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 256 256"
        className="text-muted-foreground"
       >
        <path
         fill="currentColor"
         d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Zm-8-88V80a8 8 0 0 1 16 0v48a8 8 0 0 1-16 0Zm20 36a12 12 0 1 1-12-12a12 12 0 0 1 12 12Z"
        />
       </svg>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
       {workspaceName} is frozen
      </h1>
     </div>

     {/* Owner action */}
     <button
      onClick={() => setShowPopup(true)}
      className="mt-4 flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
     >
      <Info className="size-4" />
      <span>I own this workspace</span>
     </button>
    </div>
   </div>

   {/* Info popup */}
   {showPopup && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
     {/* Backdrop */}
     <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={() => setShowPopup(false)}
     />
     {/* Dialog */}
     <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
      <button
       onClick={() => setShowPopup(false)}
       className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
       aria-label="Close"
      >
       <X className="size-4" />
      </button>

      <div className="flex flex-col gap-4">
       <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
         <Info className="size-5 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
         Plan limit exceeded
        </h2>
       </div>

       <p className="text-sm text-muted-foreground leading-relaxed">
        You have exceeded your Hobby plan limits. Your public workspace pages
        are frozen until you upgrade your plan. Upgrade to the Startup plan to
        remove all limits and restore access.
       </p>

       <a
        href="/subscriptions/plan"
        className="mt-2 flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
       >
        Upgrade Plan
       </a>
      </div>
     </div>
    </div>
   )}
  </>
 );
}
