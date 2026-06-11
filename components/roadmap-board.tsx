import { ArrowUp } from "@/components/icons";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
};

const COLUMNS = [
  { key: "planned", label: "Planned", accent: "bg-blue-500" },
  { key: "in-progress", label: "In Progress", accent: "bg-amber-500" },
  { key: "completed", label: "Completed", accent: "bg-emerald-500" },
] as const;

/**
 * Shared, presentational roadmap board (three columns: planned / in-progress /
 * completed). Used identically by the public roadmap page and the embeddable
 * widget so both render exactly the same. Pure component — safe in server and
 * client trees.
 */
export function RoadmapBoard({
  posts,
  compact = false,
}: {
  posts: RoadmapItem[];
  compact?: boolean;
}) {
  const grouped: Record<string, RoadmapItem[]> = {
    planned: [],
    "in-progress": [],
    completed: [],
  };
  for (const p of posts) {
    if (p.status in grouped) grouped[p.status].push(p);
  }

  return (
    <div className={cn("grid gap-4", compact ? "grid-cols-1" : "lg:grid-cols-3")}>
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          className="flex flex-col rounded-xl border border-border bg-card/40"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", col.accent)} />
              <span className="text-sm font-medium">{col.label}</span>
            </div>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {grouped[col.key].length}
            </span>
          </div>

          <div className="flex min-h-24 flex-1 flex-col gap-2 p-3">
            {grouped[col.key].length === 0 ? (
              <p className="px-2 py-6 text-center font-mono text-xs text-muted-foreground">
                empty
              </p>
            ) : (
              grouped[col.key].map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-snug">
                      {post.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="shrink-0 gap-1 font-mono text-[10px] text-muted-foreground"
                    >
                      <ArrowUp className="size-3" />
                      {post.upvotes_count}
                    </Badge>
                  </div>
                  {post.description ? (
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {post.description}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
