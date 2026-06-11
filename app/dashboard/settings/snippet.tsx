"use client";

import * as React from "react";
import { Check, Copy } from "@/components/icons";

import { Button } from "@/components/ui/button";

export function EmbedSnippet({
  origin,
  workspaceSlug,
}: {
  origin: string;
  workspaceSlug: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const snippet = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['CannyKillerObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)},w[o].l=1*new Date();
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','ck','${origin}/embed.js'));
  ck('init', { workspace: '${workspaceSlug}' });
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

  return (
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
  );
}
