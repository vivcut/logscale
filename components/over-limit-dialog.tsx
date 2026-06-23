"use client";

import * as React from "react";
import { Warning, X } from "@/components/icons";

/**
 * Dismissible dialog shown on dashboard pages when the workspace
 * is on the Hobby plan and has exceeded the external user limit.
 * Uses sessionStorage so it reappears each browser session.
 */
export function OverLimitDialog({
 userCount,
 limit,
}: {
 userCount: number;
 limit: number;
}) {
 const [open, setOpen] = React.useState(false);

 React.useEffect(() => {
  // Show once per session (dismissed state stored in sessionStorage)
  const dismissed = sessionStorage.getItem("over-limit-dismissed");
  if (!dismissed) {
   setOpen(true);
  }
 }, []);

 function dismiss() {
  setOpen(false);
  sessionStorage.setItem("over-limit-dismissed", "1");
 }

 if (!open) return null;

 return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
   <div className="relative mx-4 w-full max-w-md rounded-2xl border-2 border-red-500/30 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
    <button
     onClick={dismiss}
     className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
     <X className="size-4" />
    </button>

    <div className="flex items-center gap-3 mb-4">
     <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
      <Warning weight="fill" className="size-5 text-red-400" />
     </div>
     <div>
      <h2 className="text-lg font-semibold">User Limit Exceeded</h2>
      <p className="text-xs text-muted-foreground">Hobby plan</p>
     </div>
    </div>

    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
     Your workspace has{" "}
     <span className="font-semibold text-foreground">{userCount}</span> external
     users but your plan only allows{" "}
     <span className="font-semibold text-foreground">{limit}</span>.
    </p>
    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
     Your public page is frozen and will not be visible to users anymore. Upgrade to the Startup plan to remove this limit and unlock all features.
    </p>

    <div className="flex items-center gap-3">
     <a
      href="/subscriptions/plan"
      className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
     >
      Upgrade Now
     </a>
     <button
      onClick={dismiss}
      className="flex-1 rounded-xl border-2 border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
     >
      Dismiss
     </button>
    </div>
   </div>
  </div>
 );
}
