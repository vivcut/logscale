"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Plus, X } from "@/components/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addIncidentUpdate, type StatusActionState } from "./actions";
import type { IncidentTag } from "@/lib/uptime";

const initialState: StatusActionState = { ok: false };

const TAGS: { id: IncidentTag; label: string; cls: string }[] = [
  {
    id: "investigating",
    label: "Investigating",
    cls: "border-red-500/30 bg-red-500/10 text-red-400",
  },
  {
    id: "identified",
    label: "Identified",
    cls: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    cls: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  },
  {
    id: "resolved",
    label: "Resolved",
    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
];

/**
 * Per-site "post an incident update" control. Collapsed to a small button until
 * opened, then exposes a tag picker + title + description. On success the form
 * collapses and resets (the parent page revalidates to show the new entry).
 */
export function IncidentForm({ siteId }: { siteId: string }) {
  const [open, setOpen] = React.useState(false);
  const [tag, setTag] = React.useState<IncidentTag>("investigating");
  const [state, formAction, pending] = useActionState(
    addIncidentUpdate,
    initialState
  );

  // Collapse + reset once an update is posted.
  React.useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setTag("investigating");
    }
  }, [state.ok]);

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Update
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full rounded-xl border-2 border-border-2 bg-background/60 p-3"
    >
      <input type="hidden" name="site_id" value={siteId} />
      <input type="hidden" name="tag" value={tag} />

      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          post update
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Tag picker */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {TAGS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTag(t.id)}
            className={cn(
              "rounded-full border-2 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide transition-opacity",
              t.cls,
              tag === t.id ? "opacity-100 ring-1 ring-inset" : "opacity-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Input
        name="title"
        placeholder="Short summary (e.g. Investigating elevated errors)"
        required
        className="mb-2"
      />
      <Textarea
        name="body"
        placeholder="Optional details for your users…"
        rows={2}
        className="mb-2"
      />

      {state.error ? (
        <p className="mb-2 font-mono text-[10px] text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Post update
        </Button>
      </div>
    </form>
  );
}
