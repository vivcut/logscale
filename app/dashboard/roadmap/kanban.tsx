"use client";

import * as React from "react";
import { ArrowUp, Check, ChevronDown, Loader2 } from "@/components/icons";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { updatePostStatus } from "./actions";

export type RoadmapPost = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
};

type StatusKey = "planned" | "in-progress" | "completed";

const COLUMNS: { key: StatusKey; label: string; accent: string }[] = [
  { key: "planned", label: "Planned", accent: "bg-zinc-500" },
  { key: "in-progress", label: "In Progress", accent: "bg-indigo-500" },
  { key: "completed", label: "Completed", accent: "bg-emerald-500" },
];

const ALL_STATUSES = [
  { value: "under-review", label: "Under review" },
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
];

export function RoadmapKanban({ posts }: { posts: RoadmapPost[] }) {
  const [items, setItems] = React.useState(posts);

  React.useEffect(() => setItems(posts), [posts]);

  const grouped = React.useMemo(() => {
    const map: Record<StatusKey, RoadmapPost[]> = {
      planned: [],
      "in-progress": [],
      completed: [],
    };
    for (const p of items) {
      if (p.status in map) map[p.status as StatusKey].push(p);
    }
    return map;
  }, [items]);

  function handleLocalChange(postId: string, status: string) {
    setItems((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status } : p))
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
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
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {grouped[col.key].length}
            </span>
          </div>

          <div className="flex min-h-32 flex-1 flex-col gap-2 p-3">
            {grouped[col.key].length === 0 ? (
              <p className="px-2 py-6 text-center font-mono text-xs text-muted-foreground">
                empty
              </p>
            ) : (
              grouped[col.key].map((post) => (
                <RoadmapCard
                  key={post.id}
                  post={post}
                  onChange={handleLocalChange}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoadmapCard({
  post,
  onChange,
}: {
  post: RoadmapPost;
  onChange: (postId: string, status: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function setStatus(status: string) {
    setOpen(false);
    if (status === post.status) return;
    onChange(post.id, status); // optimistic
    const fd = new FormData();
    fd.set("post_id", post.id);
    fd.set("status", status);
    startTransition(async () => {
      const res = await updatePostStatus({ ok: false }, fd);
      if (!res.ok) {
        // Revert on failure.
        onChange(post.id, post.status);
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug">{post.title}</h3>
        <Badge
          variant="secondary"
          className="shrink-0 gap-1 font-mono text-[10px] text-muted-foreground"
        >
          <ArrowUp className="size-3" />
          {post.upvotes_count}
        </Badge>
      </div>

      {post.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {post.description}
        </p>
      ) : null}

      <div className="relative mt-3">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={pending}
          className="flex w-full items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-left font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          {pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <span>move to…</span>
          )}
          <ChevronDown className="size-3" />
        </button>

        {open ? (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-xl shadow-black/40">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary"
                >
                  {s.label}
                  {s.value === post.status ? (
                    <Check className="size-3" />
                  ) : null}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
