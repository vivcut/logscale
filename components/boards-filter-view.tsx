"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, Search, X } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { flairBadgeClass } from "@/lib/flairs";

type FilteredPost = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
  flair: string | null;
  is_official?: boolean;
  author_name?: string | null;
  author_avatar_url?: string | null;
  created_at: string;
  board_id: string;
  boards?: { id: string; name: string; slug: string; workspace_id: string } | null;
};

type BoardOption = {
  id: string;
  name: string;
  slug: string;
};

const STATUSES = [
  { key: "under-review", label: "Under Review" },
  { key: "planned", label: "Planned" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "closed", label: "Closed" },
];

const PERIODS = [
  { key: "all", label: "All time" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
];

const SORTS = [
  { key: "votes", label: "Most Upvoted" },
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
];

export function BoardsFilterView({
  workspaceId,
  workspaceSlug,
  boards,
  flairs,
  boardId,
  boardSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
  boards: BoardOption[];
  flairs: string[];
  boardId?: string;
  boardSlug?: string;
}) {
  const [posts, setPosts] = React.useState<FilteredPost[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filter state
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedFlairs, setSelectedFlairs] = React.useState<string[]>([]);
  const [selectedBoard, setSelectedBoard] = React.useState<string>(boardId ?? "");
  const [sort, setSort] = React.useState("votes");
  const [period, setPeriod] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedBoard) {
      params.set("boardId", selectedBoard);
    } else {
      params.set("workspaceId", workspaceId);
    }
    if (selectedStatuses.length > 0) params.set("status", selectedStatuses.join(","));
    if (selectedFlairs.length > 0) params.set("flair", selectedFlairs.join(","));
    if (sort) params.set("sort", sort);
    if (period) params.set("period", period);
    if (search.trim()) params.set("q", search.trim());

    try {
      const res = await fetch(`/api/posts/filtered?${params.toString()}`);
      const json = await res.json();
      setPosts(json.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, selectedBoard, selectedStatuses, selectedFlairs, sort, period, search]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function toggleStatus(s: string) {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function toggleFlair(f: string) {
    setSelectedFlairs((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function clearAll() {
    setSelectedStatuses([]);
    setSelectedFlairs([]);
    setSelectedBoard(boardId ?? "");
    setSort("votes");
    setPeriod("all");
    setSearch("");
  }

  const hasFilters =
    selectedStatuses.length > 0 ||
    selectedFlairs.length > 0 ||
    (selectedBoard && selectedBoard !== (boardId ?? "")) ||
    sort !== "votes" ||
    period !== "all" ||
    search.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="space-y-4 rounded-md border border-border bg-card p-4">
        {/* Search + Sort row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          {!boardId && (
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="">All Boards</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => toggleStatus(s.key)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                selectedStatuses.includes(s.key)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Flair pills */}
        {flairs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Flair:</span>
            {flairs.map((f) => (
              <button
                key={f}
                onClick={() => toggleFlair(f)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors capitalize",
                  selectedFlairs.includes(f)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {hasFilters && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
              <X className="size-3 mr-1" />
              Clear all filters
            </Button>
            <span className="text-xs text-muted-foreground">
              {posts.length} result{posts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center">
          <h3 className="text-sm font-medium">No posts found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-border overflow-hidden rounded-md border border-border">
          {posts.map((post) => {
            const board = Array.isArray(post.boards) ? post.boards[0] : post.boards;
            const postBoardSlug = boardSlug ?? board?.slug ?? "";
            return (
              <div
                key={post.id}
                className="flex items-start gap-3 bg-card p-4 transition-colors hover:bg-secondary/20"
              >
                {/* Upvote count */}
                <div className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-border py-1.5">
                  <ArrowUp className="size-3 text-muted-foreground" />
                  <span className="text-xs font-medium tabular-nums">
                    {post.upvotes_count}
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/public/${workspaceSlug}/${postBoardSlug}/${post.id}`}
                    className="block"
                  >
                    <h3 className="text-sm font-semibold text-foreground">
                      {post.title}
                    </h3>
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {post.flair && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          flairBadgeClass(post.flair)
                        )}
                      >
                        {post.flair}
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusBadgeClass(post.status)
                      )}
                    >
                      {statusLabel(post.status)}
                    </span>
                    {board && !boardId && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {board.name}
                      </span>
                    )}
                    {post.author_name && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {post.author_avatar_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.author_avatar_url}
                            alt=""
                            className="size-4 rounded-full object-cover"
                          />
                        )}
                        {post.author_name}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
