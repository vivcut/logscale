"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import {
  ArrowUp,
  Check,

  ChevronDown,
  ExternalLink,
  Flame,
  GitMerge,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { flairBadgeClass } from "@/lib/flairs";
import {
  updatePostStatus,
  mergePosts,
  deletePost,
  createInternalPost,
} from "./actions";




export type AdminPost = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
  category: string | null;
  flair: string | null;
  comments_count: number;
  created_at: string;

  admin_notes: string | null;
  pinned_response: string | null;
  merged_into_id: string | null;
  fingerprint_hash: string | null;
  author_name: string | null;
  author_email: string | null;
  author: {

    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

type Metrics = {
  totalPosts: number;
  unreviewed: number;
  totalVotes: number;
};

const STATUSES = [
  { key: "under-review", label: "Under Review", dot: "bg-zinc-500" },
  { key: "planned", label: "Planned", dot: "bg-blue-500" },
  { key: "in-progress", label: "In Progress", dot: "bg-indigo-500" },
  { key: "completed", label: "Completed", dot: "bg-emerald-500" },
  { key: "closed", label: "Closed", dot: "bg-zinc-700" },
] as const;

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

// Timeframe options for the "posts" metric — lets the owner scope the count to
// a recent window instead of all-time.
const TIMEFRAMES = [
  { key: "all", label: "all time", days: null },
  { key: "7", label: "last 7 days", days: 7 },
  { key: "14", label: "last 14 days", days: 14 },
  { key: "30", label: "last 30 days", days: 30 },
  { key: "90", label: "last 90 days", days: 90 },
] as const;

type TimeframeKey = (typeof TIMEFRAMES)[number]["key"];

// A post is "trending" if it's accruing votes fast relative to its age.
function isTrending(post: AdminPost): boolean {
  const ageHours =
    (Date.now() - new Date(post.created_at).getTime()) / 3_600_000;
  if (ageHours < 1) return post.upvotes_count >= 3;
  const perDay = post.upvotes_count / (ageHours / 24);
  return perDay >= 10 && post.upvotes_count >= 5;
}

// Compact relative time ("3d", "5h", "just now") for the post meta row.
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function AdminBoard({
  boardSlug,
  boardName,
  boardDescription,
  workspaceName,
  workspaceSlug,
  canManage,
  posts: initialPosts,
  followerCounts,
  metrics,
}: {
  boardSlug: string;
  boardName: string;
  boardDescription: string | null;
  workspaceName: string;
  workspaceSlug: string;
  canManage: boolean;
  posts: AdminPost[];
  followerCounts: Record<string, number>;
  metrics: Metrics;
}) {
  const [posts, setPosts] = React.useState<AdminPost[]>(initialPosts);
  const [mergingId, setMergingId] = React.useState<string | null>(null);
  const [showInternal, setShowInternal] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState<TimeframeKey>("all");
  const [pending, startTransition] = React.useTransition();

  // Posts count for the selected timeframe.
  const timeframePostCount = React.useMemo(() => {
    const tf = TIMEFRAMES.find((t) => t.key === timeframe);
    if (!tf || tf.days == null) return posts.length;
    const cutoff = Date.now() - tf.days * 86_400_000;
    return posts.filter((p) => new Date(p.created_at).getTime() >= cutoff)
      .length;
  }, [posts, timeframe]);

  function patchPost(id: string, patch: Partial<AdminPost>) {

    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function handleStatus(post: AdminPost, status: string) {
    patchPost(post.id, { status });
    startTransition(async () => {
      const res = await updatePostStatus(boardSlug, post.id, status);
      if (!res.ok) patchPost(post.id, { status: post.status });
    });
  }

  function handleDelete(post: AdminPost) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    startTransition(async () => {
      await deletePost(boardSlug, post.id);
    });
  }


  function handleMerge(targetId: string) {
    const sourceId = mergingId;
    if (!sourceId || sourceId === targetId) {
      setMergingId(null);
      return;
    }
    setMergingId(null);
    setPosts((prev) => prev.filter((p) => p.id !== sourceId));
    startTransition(async () => {
      await mergePosts(boardSlug, sourceId, targetId);
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          {workspaceName}
        </Link>
        <span>/</span>
        <Link href="/dashboard/boards" className="hover:text-foreground">
          boards
        </Link>
        <span>/</span>
        <span className="text-foreground">{boardName}</span>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{boardName}</h1>
          {boardDescription ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {boardDescription}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/public/${workspaceSlug}/${boardSlug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            public page
          </Link>
          {canManage ? (
            <Button size="sm" onClick={() => setShowInternal(true)}>
              <Plus className="size-4" />
              Add internal
            </Button>
          ) : null}
        </div>
      </div>

      {/* ---- Metrics Bar ---- */}
      <div className="mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
        {/* Posts metric with a timeframe selector. */}
        <div className="bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <Inbox className="size-3.5" />
              posts
            </div>
            <TimeframeSelect value={timeframe} onChange={setTimeframe} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="truncate text-xl font-semibold tabular-nums">
              {timeframePostCount.toLocaleString()}
            </span>
            {metrics.unreviewed > 0 ? (
              <span className="font-mono text-[11px] text-orange-400">
                {metrics.unreviewed} new
              </span>
            ) : (
              <span className="font-mono text-[11px] text-muted-foreground">
                all reviewed
              </span>
            )}
          </div>
        </div>

        <Metric
          icon={<ArrowUp className="size-3.5" />}
          label="total votes"
          value={metrics.totalVotes.toLocaleString()}
        />
      </div>

      {/* ---- Admin Feedback List (same card UI as the public board) ---- */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <MessageSquare className="size-5 text-muted-foreground" />
          <h2 className="mt-3 text-sm font-medium">No feedback yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Posts submitted on the public board will appear here for triage.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {posts.map((post) => {
            const isMergeTarget = mergingId && mergingId !== post.id;
            return (
              <li
                key={post.id}
                className={cn(
                  "flex gap-4 bg-card p-4 transition-colors hover:bg-secondary/30",
                  isMergeTarget &&
                    "cursor-pointer ring-1 ring-inset ring-indigo-500/40 hover:bg-indigo-500/5",
                  mergingId === post.id && "opacity-50"
                )}
                onClick={isMergeTarget ? () => handleMerge(post.id) : undefined}
              >
                {/* votes */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-fit w-12 flex-col items-center gap-0.5 rounded-md border border-border py-2 text-muted-foreground">
                    <ArrowUp className="size-4" />
                    <span className="font-mono text-xs font-medium tabular-nums">
                      {post.upvotes_count}
                    </span>
                  </div>
                  {isTrending(post) ? (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[9px] uppercase text-orange-400">
                      <Flame className="size-2.5" />
                      hot
                    </span>
                  ) : null}
                </div>

                {/* body */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    {isMergeTarget ? (
                      <h3 className="text-sm font-medium">{post.title}</h3>
                    ) : (
                      <Link
                        href={`/public/${workspaceSlug}/${boardSlug}/${post.id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                    )}
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

                  {/* meta row: time posted · comments · author */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                    <span>{timeAgo(post.created_at)}</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {post.comments_count}
                    </span>
                    <span className="truncate">
                      {post.author?.name ??
                        post.author?.email ??
                        post.author_name ??
                        (post.author_email ? null : "anonymous")}
                      {!post.author && post.author_email ? (
                        <a
                          href={`mailto:${post.author_email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-400 hover:underline"
                        >
                          {post.author_email}
                        </a>
                      ) : null}
                    </span>
                  </div>

                  {/* controls */}
                  {canManage ? (
                    <div
                      className="mt-3 flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StatusDropdown
                        value={post.status}
                        disabled={pending}
                        onChange={(s) => handleStatus(post, s)}
                      />
                      <button
                        title="Merge into another post"
                        onClick={() =>
                          setMergingId(mergingId === post.id ? null : post.id)
                        }
                        className={cn(
                          "rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground",
                          mergingId === post.id &&
                            "border-indigo-500/50 text-indigo-400"
                        )}
                      >
                        <GitMerge className="size-3.5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDelete(post)}
                        className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {mergingId ? (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-indigo-500/40 bg-indigo-500/5 px-4 py-2.5 text-xs">
          <span className="font-mono text-indigo-300">
            select a post above to merge into — upvotes will be combined
          </span>
          <button
            onClick={() => setMergingId(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            cancel
          </button>
        </div>
      ) : null}

      {/* ---- Add internal post modal ---- */}

      {showInternal ? (
        <InternalPostModal
          boardSlug={boardSlug}
          onClose={() => setShowInternal(false)}
          onCreated={(p) => setPosts((prev) => [p, ...prev])}
        />
      ) : null}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  subAccent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  subAccent?: boolean;
}) {
  return (
    <div className="bg-card p-4">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="truncate text-xl font-semibold tabular-nums">
          {value}
        </span>
        {sub ? (
          <span
            className={cn(
              "font-mono text-[11px]",
              subAccent ? "text-orange-400" : "text-muted-foreground"
            )}
          >
            {sub}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TimeframeSelect({
  value,
  onChange,
}: {
  value: TimeframeKey;
  onChange: (v: TimeframeKey) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const current = TIMEFRAMES.find((t) => t.key === value) ?? TIMEFRAMES[0];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2 py-1 font-mono text-[10px] transition-colors hover:bg-secondary"
      >
        {current.label}
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-xl">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  onChange(t.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left font-mono text-[11px] transition-colors hover:bg-secondary",
                  value === t.key && "bg-secondary"
                )}
              >
                {t.label}
                {value === t.key ? <Check className="size-3" /> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatusDropdown({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const current = STATUS_MAP[value] ?? STATUSES[0];

  // The table wrapper uses `overflow-hidden`, which would clip an absolutely
  // positioned menu. Render the menu in a portal with fixed coordinates
  // computed from the trigger button so it floats above everything.
  const positionMenu = React.useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 176),
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    positionMenu();

    function onPointer(e: MouseEvent) {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onScrollOrResize() {
      positionMenu();
    }
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, positionMenu]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-between gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-xs transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", current.dot)} />
          {current.label}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>
      {open && coords
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
              }}
              className="z-[60] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-xl"
            >
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    onChange(s.key);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-secondary"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={cn("size-1.5 rounded-full", s.dot)} />
                    {s.label}
                  </span>
                  {s.key === value ? <Check className="size-3" /> : null}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}


function InternalPostModal({

  boardSlug,
  onClose,
  onCreated,
}: {
  boardSlug: string;
  onClose: () => void;
  onCreated: (p: AdminPost) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const res = await createInternalPost(
      boardSlug,
      title,
      description,
      category
    );
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }
    // Optimistically add to the list; server revalidation will reconcile.
    onCreated({
      id: `temp-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || null,
      status: "under-review",
      upvotes_count: 0,
      category: category.trim() || null,
      flair: null,
      comments_count: 0,
      created_at: new Date().toISOString(),
      admin_notes: null,
      pinned_response: null,
      merged_into_id: null,
      fingerprint_hash: null,
      author_name: null,
      author_email: null,
      author: null,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Add internal post</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="i-title" className="text-muted-foreground">
              Title
            </Label>
            <Input
              id="i-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add Google Auth"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="i-cat" className="text-muted-foreground">
              Category <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="i-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Authentication"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="i-desc" className="text-muted-foreground">
              Details <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Textarea
              id="i-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {error ? (
            <p className="font-mono text-xs text-destructive">{error}</p>
          ) : null}
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="animate-spin" /> : <Plus />}
            Create post
          </Button>
        </div>
      </form>
    </div>
  );
}
