"use client";

import * as React from "react";
import { Check, Copy, ExternalLink } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EmbedItem = { name: string; slug: string };
type ThemeType = "auto" | "dark" | "light";

export function EmbedSnippet({
  origin,
  workspaceSlug,
}: {
  origin: string;
  workspaceSlug: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [embedType, setEmbedType] = React.useState<"script" | "iframe">("script");
  const [theme, setTheme] = React.useState<ThemeType>("auto");

  // Construct URLs with dynamic theme query parameters
  const themeParam = `?theme=${theme}`;
  const previewUrl = `${origin}/public/${workspaceSlug}${themeParam}`;

  const initOpts = `{ workspace: '${workspaceSlug}', theme: '${theme}' }`;

  const scriptSnippet = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['CannyKillerObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)},w[o].l=1*new Date();
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','ck','${origin}/embed.js'));
  ck('init', ${initOpts});
</script>`;

  const iframeSnippet = `<iframe 
  src="${previewUrl}" 
  title="Pitstop Widget" 
  width="100%" 
  height="600px" 
  style="border: none; border-radius: 8px;"
></iframe>`;

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

  return (
    <div className="space-y-4">
      {/* Theme Selection Controller */}
      <div className="flex items-center gap-3 rounded-xl border-2 border-border-2 bg-card px-4 py-3">
        <span className="text-xs font-medium text-muted-foreground">Widget Theme:</span>
        <div className="flex items-center gap-1 rounded-xl bg-background/60 p-0.5 border-2 border-border/60">
          {(["auto", "dark", "light"] as ThemeType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                "rounded-xl px-3 py-1 text-xs font-medium capitalize transition-all",
                theme === t
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Code Snippet Container */}
      <div className="rounded-xl border-2 border-border-2 bg-card">
        <div className="flex items-center justify-between border-b-2 border-border-2 px-4 py-2.5">
          {/* Format Toggle Segment */}
          <div className="flex items-center gap-1 rounded-xl bg-background/60 p-0.5 border-2 border-border/60">
            <button
              type="button"
              onClick={() => setEmbedType("script")}
              className={cn(
                "rounded-xl px-2.5 py-1 text-xs font-medium transition-all",
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
                "rounded-xl px-2.5 py-1 text-xs font-medium transition-all",
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

      {/* Live preview */}
      <div className="rounded-xl border-2 border-border-2 bg-card">
        <div className="flex items-center justify-between border-b-2 border-border-2 px-4 py-3">
          <span className="font-mono text-xs text-muted-foreground">
            live preview · dashboard ({theme})
          </span>
          <a
            href={previewUrl}
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
            src={previewUrl}
            title="Widget preview"
            className="h-[520px] w-full max-w-[380px] rounded-xl border-2 border-border-2 bg-background"
          />
        </div>
      </div>
    </div>
  );
}