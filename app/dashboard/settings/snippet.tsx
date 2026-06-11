"use client";

import * as React from "react";
import { Check, Copy, ExternalLink } from "@/components/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";


export type EmbedItem = { name: string; slug: string };

// The surfaces an embed can expose. "all" shows every tab; the generic single
// views ("board", "roadmap", …) lock the widget to one surface; and the
// per-item views ("board:slug" / "survey:slug") lock it to one specific board
// or published survey.
type ViewOption = { id: string; label: string };

export function EmbedSnippet({
  origin,
  workspaceSlug,
  boards = [],
  surveys = [],
}: {
  origin: string;
  workspaceSlug: string;
  boards?: EmbedItem[];
  surveys?: EmbedItem[];
}) {
  const [copied, setCopied] = React.useState(false);
  const [view, setView] = React.useState<string>("all");

  // Build the full ordered list of view options. Generic surfaces first, then
  // a dedicated entry per board ("Board - NAME") and per survey ("Survey -
  // NAME"). Each per-item view targets that single board/survey only.
  const views = React.useMemo<ViewOption[]>(() => {
    const base: ViewOption[] = [
      { id: "all", label: "All tabs" },
      { id: "board", label: "Boards" },
    ];
    for (const b of boards) {
      base.push({ id: `board:${b.slug}`, label: `Board - ${b.name}` });
    }
    base.push(
      { id: "roadmap", label: "Roadmap" },
      { id: "changelog", label: "Changelog" },
      { id: "status", label: "Status" },
      { id: "contact", label: "Contact" }
    );
    for (const s of surveys) {
      base.push({ id: `survey:${s.slug}`, label: `Survey - ${s.name}` });
    }
    return base;
  }, [boards, surveys]);

  // Only emit the view option when it's not the default ("all"), keeping the
  // common snippet clean.
  const initOpts =
    view === "all"
      ? `{ workspace: '${workspaceSlug}' }`
      : `{ workspace: '${workspaceSlug}', view: '${view}' }`;

  // The widget URL the live preview iframe points at — mirrors what embed.js
  // loads, including the selected view.
  const previewSrc =
    view === "all"
      ? `${origin}/widget/${workspaceSlug}`
      : `${origin}/widget/${workspaceSlug}?view=${encodeURIComponent(view)}`;


  const snippet = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['CannyKillerObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)},w[o].l=1*new Date();
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','ck','${origin}/embed.js'));
  ck('init', ${initOpts});
</script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  // Friendly label for the currently selected view (used in the preview header).
  const activeLabel =
    views.find((v) => v.id === view)?.label ?? view;

  return (
    <div className="space-y-3">
      {/* View picker */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-xs text-muted-foreground">
          view:
        </span>
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors",
              view === v.id
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              embed.js
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="text-emerald-400" /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
          <code>{snippet}</code>
        </pre>
      </div>

      {/* Live preview — reflects the selected view in real time */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-mono text-xs text-muted-foreground">
            live preview · {activeLabel}
          </span>
          <a
            href={previewSrc}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-3" />
            open
          </a>
        </div>
        <div className="flex justify-center bg-background/40 p-4">
          {/* key forces a remount when the view changes so the iframe reloads */}
          <iframe
            key={view}
            src={previewSrc}
            title="Widget preview"
            className="h-[520px] w-full max-w-[380px] rounded-lg border border-border bg-background"
          />
        </div>
      </div>
    </div>
  );
}
