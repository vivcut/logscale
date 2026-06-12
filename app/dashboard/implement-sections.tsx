"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, MessageSquare, Sparkles } from "@/components/icons";

import { cn } from "@/lib/utils";

export type ImplementItem = {
  id: string;
  title: string;
  upvotes_count: number;
  comments_count: number;
  boardSlug: string | null;
  boardName: string | null;
  summary: string | null;
};

export type ImplementSection = {
  key: string;
  label: string;
  dot: string;
  items: ImplementItem[];
};

/**
 * "What to build next" overview — groups the most-upvoted posts by status
 * (under review → planned → in progress), showing the top 3 in each. Every item
 * shows its upvotes, comment count, and which board it came from.
 *
 * The one-line AI gist is fetched lazily after the page has rendered (via
 * /api/boards/summaries) so the dashboard displays instantly and the AI call
 * never blocks it.
 */
export function ImplementSections({
  workspaceSlug,
  sections,
}: {
  workspaceSlug: string;
  sections: ImplementSection[];
}) {
  const hasAny = sections.some((s) => s.items.length > 0);

  // AI summaries, keyed by post id, filled in after mount.
  const [summaries, setSummaries] = React.useState<Record<string, string>>({});

  // Collect the ids we need summaries for (stable across renders).
  const ids = React.useMemo(
    () => sections.flatMap((s) => s.items.map((i) => i.id)),
    [sections]
  );
  const idsKey = ids.join(",");

  React.useEffect(() => {
    if (!hasAny || ids.length === 0) return;
    let cancelled = false;
    // Defer to the next tick so the page paints first, then fetch the gists.
    const run = async () => {
      try {
        const res = await fetch("/api/boards/summaries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          summaries?: Record<string, string>;
        };
        if (!cancelled && json.summaries) setSummaries(json.summaries);
      } catch {
        // Silent — items just render without a gist line.
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, hasAny]);

  if (!hasAny) return null;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-3.5 text-muted-foreground" />
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          what to build next
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.key}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className={cn("size-1.5 rounded-full", section.dot)} />
              <h3 className="text-sm font-medium">{section.label}</h3>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                top {section.items.length}
              </span>
            </div>

            {section.items.length === 0 ? (
              <p className="px-4 py-6 text-center font-mono text-[11px] text-muted-foreground">
                nothing here
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {section.items.map((item) => {
                  const summary = summaries[item.id] ?? item.summary;
                  return (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <span className="flex w-9 shrink-0 flex-col items-center rounded-md border border-border py-1 text-muted-foreground">
                          <ArrowUp className="size-3" />
                          <span className="font-mono text-[11px] tabular-nums">
                            {item.upvotes_count}
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          {item.boardSlug ? (
                            <Link
                              href={`/public/${workspaceSlug}/${item.boardSlug}/${item.id}`}
                              target="_blank"
                              className="block truncate text-sm font-medium hover:underline"
                            >
                              {item.title}
                            </Link>
                          ) : (
                            <span className="block truncate text-sm font-medium">
                              {item.title}
                            </span>
                          )}

                          {summary ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {summary}
                            </p>
                          ) : null}

                          {/* meta: comment count + originating board */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="size-3" />
                              {item.comments_count}
                            </span>
                            {item.boardName ? (
                              <>
                                <span className="text-border">·</span>
                                <span className="truncate rounded-full bg-secondary px-1.5 py-0.5">
                                  {item.boardName}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
