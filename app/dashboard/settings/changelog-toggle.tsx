"use client";

import * as React from "react";
import { Loader2 } from "@/components/icons";

import { cn } from "@/lib/utils";
import { setChangelogEnabled } from "./actions";

/**
 * Owner/admin toggle that shows or hides the public changelog. Updates
 * optimistically and reverts if the server action fails.
 */
export function ChangelogToggle({
  initialEnabled,
  canManage,
}: {
  initialEnabled: boolean;
  canManage: boolean;
}) {
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function toggle() {
    if (!canManage || busy) return;
    const next = !enabled;
    setEnabled(next);
    setBusy(true);
    setError(null);
    const res = await setChangelogEnabled(next);
    if (!res.ok) {
      setEnabled(!next); // revert
      setError(res.error ?? "Could not update.");
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">Public changelog</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {enabled
            ? "Your changelog is live and linked from public pages."
            : "Your changelog is hidden from visitors."}
        </p>
        {error ? (
          <p className="mt-1 font-mono text-[10px] text-destructive">{error}</p>
        ) : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={!canManage || busy}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          enabled ? "bg-primary" : "bg-secondary"
        )}
      >
        <span
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-full bg-background shadow transition-transform",
            enabled ? "translate-x-5" : "translate-x-0.5"
          )}
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : null}
        </span>
      </button>
    </div>
  );
}
