"use client";

import * as React from "react";
import { Sparkles } from "@/components/icons";

import { renderMarkdown } from "@/lib/markdown";

/**
 * "Most important features" — an AI recommendation of what to build next, based
 * on the top 3 most-upvoted under-review requests. Fetches on mount so the page
 * isn't blocked, showing a skeleton while the worker responds. Renders nothing
 * when there are no under-review posts (the API returns { empty: true }).
 */
export function ImportantFeaturesReport() {
  const [state, setState] = React.useState<
    | { status: "loading" }
    | { status: "empty" }
    | { status: "error"; message: string }
    | { status: "ready"; html: string }
  >({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/boards/report");
        const json = await res.json();
        if (cancelled) return;
        if (json.empty) {
          setState({ status: "empty" });
        } else if (json.markdown) {
          setState({ status: "ready", html: renderMarkdown(json.markdown) });
        } else {
          setState({
            status: "error",
            message: json.error || "Couldn't generate a report.",
          });
        }
      } catch {
        if (!cancelled)
          setState({ status: "error", message: "Couldn't generate a report." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing under review → render nothing at all.
  if (state.status === "empty") return null;

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Sparkles className="size-3.5 text-chart-1" />
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          most important features
        </h2>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          AI · top voted
        </span>
      </div>

      <div className="p-4">
        {state.status === "loading" ? (
          <ReportSkeleton />
        ) : state.status === "error" ? (
          <p className="font-mono text-xs text-muted-foreground">
            {state.message}
          </p>
        ) : (
          <div
            className="prose-changelog"
            dangerouslySetInnerHTML={{ __html: state.html }}
          />
        )}
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-3.5 w-3/4 rounded bg-secondary" />
      <div className="h-3 w-full rounded bg-secondary" />
      <div className="space-y-2 pt-1">
        <div className="h-3 w-11/12 rounded bg-secondary" />
        <div className="h-3 w-10/12 rounded bg-secondary" />
        <div className="h-3 w-9/12 rounded bg-secondary" />
      </div>
    </div>
  );
}
