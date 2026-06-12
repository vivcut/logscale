"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, BadgeCheck, MessageSquare } from "@/components/icons";


import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";
import { statusBadgeClass, statusLabel, statusRank } from "@/lib/status";
import { flairBadgeClass } from "@/lib/flairs";
import { PostForm } from "@/components/post-form";


export type PublicPost = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
  flair: string | null;
  is_official?: boolean;
  author_name?: string | null;
  created_at: string;
};



type Sort = "top" | "new";


const FILTERS = [

  { key: "all", label: "all" },
  { key: "completed", label: "completed" },
  { key: "in-progress", label: "in progress" },
  { key: "planned", label: "planned" },
  { key: "under-review", label: "under review" },
  { key: "closed", label: "closed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function formatDate(iso: string) {

  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function FeedbackBoard({
  boardId,
  workspaceSlug,
  boardSlug,
  flairs,
  initialPosts,
  lockedName,
  lockedEmail,
}: {
  boardId: string;
  workspaceSlug: string;
  boardSlug: string;
  flairs: string[];
  initialPosts: PublicPost[];
  /** When set, the submitter is a signed-in team member; their name/email are
   *  prefilled and locked so team-authored posts are always attributed. */
  lockedName?: string | null;
  lockedEmail?: string | null;
}) {

  const [posts, setPosts] = React.useState<PublicPost[]>(initialPosts);
  const [sort, setSort] = React.useState<Sort>("top");
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [voted, setVoted] = React.useState<Record<string, boolean>>({});
  const [pendingVotes, setPendingVotes] = React.useState<
    Record<string, boolean>
  >({});

  const fingerprintRef = React.useRef<string>("");
  React.useEffect(() => {
    fingerprintRef.current = getFingerprint();
  }, []);

  const sortedPosts = React.useMemo(() => {
    let list = [...posts];

    // Filtering: "all" hides closed by default; a specific filter shows only it.
    if (filter === "all") {
      list = list.filter((p) => p.status !== "closed");
    } else {
      list = list.filter((p) => p.status === filter);
    }

    if (sort === "new") {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (filter === "all") {
      // Group by the canonical status order, then by votes within each group.
      list.sort(
        (a, b) =>
          statusRank(a.status) - statusRank(b.status) ||

          b.upvotes_count - a.upvotes_count ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      list.sort(
        (a, b) =>
          b.upvotes_count - a.upvotes_count ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [posts, sort, filter]);

  async function handleUpvote(postId: string) {
    if (pendingVotes[postId]) return;
    const hasVoted = !!voted[postId];

    setPendingVotes((p) => ({ ...p, [postId]: true }));
    setVoted((v) => ({ ...v, [postId]: !hasVoted }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, upvotes_count: p.upvotes_count + (hasVoted ? -1 : 1) }
          : p
      )
    );

    try {
      const res = await fetch("/api/upvotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, fingerprint: fingerprintRef.current }),
      });
      const json = await res.json();
      if (res.ok) {
        setVoted((v) => ({ ...v, [postId]: json.voted }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, upvotes_count: json.upvotes_count } : p
          )
        );
      } else {
        setVoted((v) => ({ ...v, [postId]: hasVoted }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, upvotes_count: p.upvotes_count + (hasVoted ? 1 : -1) }
              : p
          )
        );
      }
    } catch {
      setVoted((v) => ({ ...v, [postId]: hasVoted }));
    } finally {
      setPendingVotes((p) => ({ ...p, [postId]: false }));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Left column — submission form */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <PostForm
          boardId={boardId}
          flairs={flairs}
          lockedName={lockedName}
          lockedEmail={lockedEmail}
          onCreated={(post) =>
            setPosts((prev) => [post as PublicPost, ...prev])
          }
        />

      </aside>

      {/* Right column — posts list */}
      <section>
        {/* Filter chips */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
                filter === f.key
                  ? "border-foreground/30 bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            {sortedPosts.length} {sortedPosts.length === 1 ? "post" : "posts"}
          </p>
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            {(["top", "new"] as Sort[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  "rounded-sm px-2.5 py-1 font-mono text-xs transition-colors",
                  sort === s
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <h3 className="text-sm font-medium">No feedback here</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "all"
                ? "Be the first to add a post."
                : "Nothing in this view yet."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {sortedPosts.map((post) => (
              <li
                key={post.id}
                className="flex gap-4 bg-card p-4 transition-colors hover:bg-secondary/30"
              >
                <button
                  onClick={() => handleUpvote(post.id)}
                  disabled={pendingVotes[post.id]}
                  className={cn(
                    "flex h-fit w-12 shrink-0 flex-col items-center gap-0.5 rounded-md border py-2 transition-colors",
                    voted[post.id]
                      ? "border-foreground/40 bg-secondary text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  <ArrowUp className="size-4" />
                  <span className="font-mono text-xs font-medium tabular-nums">
                    {post.upvotes_count}
                  </span>
                </button>

                {/* Whole card links to the dedicated post page. */}
                <Link
                  href={`/public/${workspaceSlug}/${boardSlug}/${post.id}`}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium hover:underline">
                      {post.title}
                    </h3>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {post.flair ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-mono text-[10px] lowercase",
                            flairBadgeClass(post.flair)
                          )}
                        >
                          {post.flair}
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-mono text-[10px] lowercase",
                          statusBadgeClass(post.status)
                        )}
                      >
                        {statusLabel(post.status)}
                      </span>
                    </div>

                  </div>

                  {post.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {post.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                    {post.author_name ? (
                      <span className="inline-flex items-center gap-1 text-foreground/70">
                        {post.author_name}
                        {post.is_official ? (
                          <BadgeCheck className="size-3 text-indigo-300" />
                        ) : null}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      view & discuss
                    </span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>

                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
