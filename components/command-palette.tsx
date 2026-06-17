"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CornerDownLeft,
  FileText,
  Loader2,
  MessageSquare,
  Search,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import type { SearchResult } from "@/app/api/search/route";

const STATUS_LABELS: Record<string, string> = {
  "under-review": "under review",
  planned: "planned",
  "in-progress": "in progress",
  completed: "completed",
};

/**
 * Global Cmd/Ctrl+K command palette. Mounted on public workspace pages.
 * Searches feedback posts + published changelogs and navigates on select.
 */
export function CommandPalette({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global hotkey: Cmd+K / Ctrl+K toggles, Escape closes.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus the input whenever opened, and reset transient state on close.
  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    setQuery("");
    setResults([]);
    setActive(0);
  }, [open]);

  // Debounced search.
  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?workspace=${encodeURIComponent(
            workspaceSlug
          )}&q=${encodeURIComponent(query.trim())}`,
          { signal: ctrl.signal }
        );
        const json = await res.json();
        setResults(json.results ?? []);
        setActive(0);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query, open, workspaceSlug]);

  function select(r: SearchResult) {
    setOpen(false);
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      select(results[active]);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-border-2 bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-1 hidden rounded border-2 border-border-2 bg-secondary px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      {!open ? null : (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border-2 border-border-2 bg-popover shadow-2xl">
            {/* search input */}
            <div className="flex items-center gap-3 border-b-2 border-border-2 px-4">
              {loading ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Search className="size-4 shrink-0 text-muted-foreground" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search feedback and changelogs…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border-2 border-border-2 bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                esc
              </kbd>
            </div>

            {/* results */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center font-mono text-xs text-muted-foreground">
                  {loading ? "searching…" : "no results"}
                </p>
              ) : (
                <ul>
                  {results.map((r, i) => (
                    <li key={`${r.type}-${r.id}`}>
                      <button
                        onMouseEnter={() => setActive(i)}
                        onClick={() => select(r)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          active === i ? "bg-secondary" : "hover:bg-secondary/50"
                        )}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-xl border-2 border-border-2 bg-card text-muted-foreground">
                          {r.type === "post" ? (
                            <MessageSquare className="size-3.5" />
                          ) : (
                            <FileText className="size-3.5" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">
                            {r.title}
                          </span>
                          {r.subtitle ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {r.subtitle}
                            </span>
                          ) : null}
                        </span>
                        {r.type === "post" ? (
                          <span className="shrink-0 rounded-full border-2 border-border-2 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        ) : (
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                            changelog
                          </span>
                        )}
                        {active === i ? (
                          <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center gap-3 border-t-2 border-border-2 px-4 py-2 font-mono text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded border-2 border-border-2 bg-secondary px-1">
                  ↑↓
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border-2 border-border-2 bg-secondary px-1">
                  ↵
                </kbd>
                open
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
