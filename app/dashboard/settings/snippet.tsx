"use client";

import * as React from "react";
import { Check, Copy, ExternalLink } from "@/components/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EmbedItem = { name: string; slug: string };

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
  // 1. State tracking whether the user wants the script or raw iframe
  const [embedType, setEmbedType] = React.useState<"script" | "iframe">("script");

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

  const initOpts =
    view === "all"
      ? `{ workspace: '${workspaceSlug}' }`
      : `{ workspace: '${workspaceSlug}', view: '${view}' }`;

  const previewSrc =
    view === "all"
      ? `${origin}/widget/${workspaceSlug}`
      : `${origin}/widget/${workspaceSlug}?view=${encodeURIComponent(view)}`;

  // 2. Compute both code snippets dynamically
  const scriptSnippet = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['CannyKillerObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)},w[o].l=1*new Date();
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','ck','${origin}/embed.js'));
  ck('init', ${initOpts});
</script>`;

  const iframeSnippet = `<iframe 
  src="${previewSrc}" 
  title="LogScale Widget" 
  width="100%" 
  height="600px" 
  style="border: none; border-radius: 8px;"
></iframe>`;

  // Determine active text display for the copy function and code block display
  const activeSnippet = embedType === "script" ? scriptSnippet : iframeSnippet;

  async function copy() {
    try {
      await navigator.clipboard.writeText(activeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const activeLabel = views.find((v) => v.id === view)?.label ?? view;

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

      {/* Code Snippet Container */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          {/* Format Toggle Segment */}
          <div className="flex items-center gap-1 rounded-lg bg-background/60 p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => setEmbedType("script")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                embedType === "script"
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              JS Snippet
            </button>
            <button
              type="button"
              onClick={() => setEmbedType("iframe")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                embedType === "iframe"
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Raw HTML Iframe
            </button>
          </div>

          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="text-emerald-400 size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        
        {/* Code Content Window */}
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground bg-black/5 dark:bg-black/20">
          <code>{activeSnippet}</code>
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