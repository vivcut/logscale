"use client";

import * as React from "react";
import { Loader2 } from "@/components/icons";

import { cn } from "@/lib/utils";
import { setSurfaceEnabled, type PublicSurface } from "./actions";

/**
 * Owner/admin toggle that shows or hides a public surface (boards / roadmap /
 * changelog / surveys / status). Optimistic UI that reverts on failure.
 * Turning a surface off never deletes data — it just hides the public page.
 */
export function SurfaceToggle({
  surface,
  label,
  description,
  initialEnabled,
  canManage,
}: {
  surface: PublicSurface;
  label: string;
  description: string;
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
    const res = await setSurfaceEnabled(surface, next);
    if (!res.ok) {
      setEnabled(!next); // revert
      setError(res.error ?? "Could not update.");
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-card p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {enabled ? description : "Hidden from visitors. No data is lost."}
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
