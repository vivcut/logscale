"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "@/components/icons";

import { cn } from "@/lib/utils";
import { setWidgetTheme } from "./actions";

type WidgetTheme = "auto" | "dark" | "light";

const OPTIONS: {
  value: WidgetTheme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  { value: "auto", label: "Auto", icon: Monitor, hint: "Match the visitor's OS" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Always dark" },
  { value: "light", label: "Light", icon: Sun, hint: "Always light" },
];

/**
 * Picks the colour scheme used by the embeddable widget (and its iframe
 * drawer). "Auto" follows the host page / visitor's prefers-color-scheme.
 */
export function WidgetAppearance({
  initial,
  canManage,
}: {
  initial: WidgetTheme;
  canManage: boolean;
}) {
  const [theme, setTheme] = React.useState<WidgetTheme>(initial);
  const [pending, setPending] = React.useState<WidgetTheme | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function pick(next: WidgetTheme) {
    if (!canManage || next === theme) return;
    const prev = theme;
    setTheme(next);
    setPending(next);
    setError(null);
    const res = await setWidgetTheme(next);
    setPending(null);
    if (!res.ok) {
      setTheme(prev);
      setError(res.error ?? "Couldn't save.");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const active = theme === o.value;
          return (
            <button
              key={o.value}
              onClick={() => pick(o.value)}
              disabled={!canManage || pending !== null}
              title={o.hint}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors",
                active
                  ? "border-ring bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                (!canManage || pending !== null) && "opacity-70"
              )}
            >
              <Icon className="size-4" />
              <span className="font-medium">{o.label}</span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-2 font-mono text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
