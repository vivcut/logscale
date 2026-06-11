"use client";

import * as React from "react";
import moment from "moment";
import {

  ArrowUp,
  BadgeCheck,
  Check,
  ChevronDown,
  Loader2,
  Pin,
  Send,
  Trash2,
} from "@/components/icons";


import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";
import { flairBadgeClass } from "@/lib/flairs";
import { Badge } from "@/components/ui/badge";
import { updatePostStatus } from "@/app/dashboard/boards/[boardSlug]/actions";

export type DetailPost = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
  flair: string | null;
  created_at: string;
};


export type StatusEvent = {
  id: string;
  status: string;
  created_at: string;
};

type Comment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  author_name: string | null;
  is_official: boolean;
  is_pinned: boolean;
  created_at: string;
};

const STATUSES = [
  { key: "under-review", label: "under review", dot: "bg-zinc-500" },
  { key: "planned", label: "planned", dot: "bg-blue-500" },
  { key: "in-progress", label: "in progress", dot: "bg-indigo-500" },
  { key: "completed", label: "completed", dot: "bg-emerald-500" },
  { key: "closed", label: "closed", dot: "bg-zinc-700" },
] as const;

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUSES.map((s) => [s.key, s.label])
);
const STATUS_DOT: Record<string, string> = Object.fromEntries(
  STATUSES.map((s) => [s.key, s.dot])
);

const NAME_KEY = "ttm_name";
const EMAIL_KEY = "ttm_email";

// Friendly relative time (e.g. "2 months ago", "a few seconds ago").
function fromNow(iso: string) {
  return moment(iso).fromNow();
}

// Absolute timestamp for tooltips / hovers.
function formatDateTime(iso: string) {
  return moment(iso).format("MMM D, YYYY · h:mm A");
}

function formatDate(iso: string) {
  return moment(iso).format("MMM D, YYYY");
}


export function PostDetail({
  post: initialPost,
  statusEvents: initialEvents,
  boardSlug,
  canManage,
}: {
  post: DetailPost;
  statusEvents: StatusEvent[];
  boardSlug: string;
  canManage: boolean;
}) {
  const [post, setPost] = React.useState(initialPost);
  const [events, setEvents] = React.useState(initialEvents);
  const [voted, setVoted] = React.useState(false);
  const [voting, setVoting] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState(false);

  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fingerprintRef = React.useRef<string>("");
  React.useEffect(() => {
    fingerprintRef.current = getFingerprint();
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/comments?postId=${post.id}`);
        const json = await res.json();
        if (active) setComments(json.comments ?? []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [post.id]);

  async function handleUpvote() {
    if (voting) return;
    const hadVoted = voted;
    setVoting(true);
    setVoted(!hadVoted);
    setPost((p) => ({
      ...p,
      upvotes_count: p.upvotes_count + (hadVoted ? -1 : 1),
    }));
    try {
      const res = await fetch("/api/upvotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          fingerprint: fingerprintRef.current,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setVoted(json.voted);
        setPost((p) => ({ ...p, upvotes_count: json.upvotes_count }));
      } else {
        setVoted(hadVoted);
        setPost((p) => ({
          ...p,
          upvotes_count: p.upvotes_count + (hadVoted ? 1 : -1),
        }));
      }
    } catch {
      setVoted(hadVoted);
    } finally {
      setVoting(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (status === post.status) return;
    const prev = post.status;
    setPost((p) => ({ ...p, status }));
    setSavingStatus(true);
    // Optimistically prepend a timeline event.
    const optimistic: StatusEvent = {
      id: `temp-${Date.now()}`,
      status,
      created_at: new Date().toISOString(),
    };
    setEvents((e) => [...e, optimistic]);
    try {
      const res = await updatePostStatus(boardSlug, post.id, status);
      if (!res.ok) {
        setPost((p) => ({ ...p, status: prev }));
        setEvents((e) => e.filter((x) => x.id !== optimistic.id));
      }
    } catch {
      setPost((p) => ({ ...p, status: prev }));
      setEvents((e) => e.filter((x) => x.id !== optimistic.id));
    } finally {
      setSavingStatus(false);
    }
  }

  async function togglePin(comment: Comment) {
    const next = !comment.is_pinned;
    // Optimistic: only one pinned at a time.
    setComments((prev) =>
      prev.map((c) => ({
        ...c,
        is_pinned: c.id === comment.id ? next : next ? false : c.is_pinned,
      }))
    );
    try {
      await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id, pinned: next }),
      });
    } catch {
      /* best effort */
    }
  }

  async function deleteComment(comment: Comment) {
    if (!confirm("Delete this comment? Any replies to it are removed too."))
      return;
    // Optimistically remove the comment and any of its direct replies.
    const prev = comments;
    setComments((cs) =>
      cs.filter((c) => c.id !== comment.id && c.parent_id !== comment.id)
    );
    try {
      const res = await fetch(`/api/comments?commentId=${comment.id}`, {
        method: "DELETE",
      });
      if (!res.ok) setComments(prev); // revert on failure
    } catch {
      setComments(prev);
    }
  }


  // Pinned answer floats to the top, then chronological roots.
  const pinned = comments.find((c) => c.is_pinned) ?? null;
  const roots = comments
    .filter((c) => !c.parent_id && !c.is_pinned)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  const childrenOf = (id: string) =>
    comments
      .filter((c) => c.parent_id === id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

  function addComment(c: Comment) {
    setComments((prev) => [...prev, c]);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      {/* Main column */}
      <div>
        <div className="flex gap-4">
          <button
            onClick={handleUpvote}
            disabled={voting}
            className={cn(
              "flex h-fit w-14 shrink-0 flex-col items-center gap-0.5 rounded-md border py-2.5 transition-colors",
              voted
                ? "border-foreground/40 bg-secondary text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            <ArrowUp className="size-4" />
            <span className="font-mono text-sm font-medium tabular-nums">
              {post.upvotes_count}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="font-mono text-[10px] text-muted-foreground"
              >
                <span
                  className={cn(
                    "mr-1 inline-block size-1.5 rounded-full",
                    STATUS_DOT[post.status] ?? "bg-zinc-500"
                  )}
                />
                {STATUS_LABELS[post.status] ?? post.status}
              </Badge>
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
                className="font-mono text-[11px] text-muted-foreground"
                title={formatDateTime(post.created_at)}
              >
                submitted {fromNow(post.created_at)}
              </span>


            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {post.title}
            </h1>
            {post.description ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {post.description}
              </p>
            ) : null}

            {/* Owner-only inline controls */}
            {canManage ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-300">
                  team
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  set status
                </span>
                <StatusDropdown
                  value={post.status}
                  disabled={savingStatus}
                  onChange={handleStatusChange}
                />
                {savingStatus ? (
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Comments */}
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-semibold">
            Discussion{" "}
            <span className="font-mono text-xs text-muted-foreground">
              ({comments.length})
            </span>
          </h2>

          {loading ? (
            <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> loading discussion…
            </p>
          ) : (
            <>
              {/* Pinned answer */}
              {pinned ? (
                <div className="mb-4">
                  <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                    <Pin className="size-3" />
                    pinned answer
                  </div>
                  <CommentRow
                    comment={pinned}
                    canManage={canManage}
                    onTogglePin={togglePin}
                    onDelete={deleteComment}
                  />
                </div>
              ) : null}


              {roots.length === 0 && !pinned ? (
                <p className="mb-4 font-mono text-xs text-muted-foreground">
                  no comments yet — start the discussion
                </p>
              ) : (
                <ul className="mb-5 space-y-4">
                  {roots.map((c) => (
                    <li key={c.id}>
                      <CommentRow
                        comment={c}
                        canManage={canManage}
                        onTogglePin={togglePin}
                        onDelete={deleteComment}
                      />
                      <div className="ml-7 mt-2 space-y-2">
                        {childrenOf(c.id).map((child) => (
                          <CommentRow
                            key={child.id}
                            comment={child}
                            canManage={canManage}
                            onTogglePin={togglePin}
                            onDelete={deleteComment}
                          />
                        ))}

                        <ReplyToggle
                          postId={post.id}
                          parentId={c.id}
                          canManage={canManage}
                          fingerprintRef={fingerprintRef}
                          onAdded={addComment}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <CommentForm
                postId={post.id}
                parentId={null}
                canManage={canManage}
                fingerprintRef={fingerprintRef}
                onAdded={addComment}
              />
            </>
          )}
        </div>
      </div>

      {/* Sidebar — status timeline */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Activity
          </h2>
          <ol className="relative space-y-4 border-l border-border pl-4">
            {events.length === 0 ? (
              /* Fallback when no events exist yet: show the post's creation as
                 the first activity entry so the timeline is never empty. */
              <li className="relative">
                <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-zinc-400 ring-4 ring-card" />
                <p className="text-xs font-medium">Created · under review</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {formatDateTime(post.created_at)}
                </p>
              </li>
            ) : (
              events.map((ev, idx) => (
                <li key={ev.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-1 size-2.5 rounded-full ring-4 ring-card",
                      STATUS_DOT[ev.status] ?? "bg-zinc-500"
                    )}
                  />
                  <p className="text-xs font-medium">
                    {/* The earliest event marks the post's creation. */}
                    {idx === 0
                      ? `Created · ${STATUS_LABELS[ev.status] ?? ev.status}`
                      : STATUS_LABELS[ev.status] ?? ev.status}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {formatDateTime(ev.created_at)}
                  </p>
                </li>
              ))
            )}
          </ol>

        </div>
      </aside>
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
  const ref = React.useRef<HTMLDivElement>(null);
  const current = STATUSES.find((s) => s.key === value) ?? STATUSES[0];

  React.useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs transition-colors hover:bg-secondary disabled:opacity-60"
      >
        <span className={cn("size-1.5 rounded-full", current.dot)} />
        {current.label}
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-xl">
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
        </div>
      ) : null}
    </div>
  );
}

function CommentRow({
  comment,
  canManage,
  onTogglePin,
  onDelete,
}: {
  comment: Comment;
  canManage: boolean;
  onTogglePin: (c: Comment) => void;
  onDelete: (c: Comment) => void;
}) {

  return (
    <div
      className={cn(
        "group rounded-lg border px-3.5 py-2.5",
        comment.is_pinned
          ? "border-emerald-500/50 bg-emerald-500/10"
          : comment.is_official
          ? "border-indigo-500/40 bg-indigo-500/5"
          : "border-border bg-card"
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-xs font-medium">
          {comment.author_name ?? "Anonymous"}
        </span>
        {comment.is_official ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[9px] font-medium text-indigo-300">
            <BadgeCheck className="size-2.5" />
            team
          </span>
        ) : null}
        <span
          className="font-mono text-[9px] text-muted-foreground"
          title={formatDateTime(comment.created_at)}
        >
          {fromNow(comment.created_at)}
        </span>

        {canManage ? (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => onTogglePin(comment)}
              title={comment.is_pinned ? "Unpin" : "Pin to top"}
              className={cn(
                "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[9px] transition-colors",
                comment.is_pinned
                  ? "text-emerald-400"
                  : "text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
              )}
            >
              <Pin className="size-2.5" />
              {comment.is_pinned ? "pinned" : "pin"}
            </button>
            <button
              onClick={() => onDelete(comment)}
              title="Delete comment"
              className="inline-flex items-center rounded px-1 py-0.5 text-muted-foreground opacity-0 transition-colors hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="size-2.5" />
            </button>
          </div>
        ) : null}
      </div>

      <p className="whitespace-pre-wrap text-xs text-muted-foreground">
        {comment.content}
      </p>
    </div>
  );
}

function ReplyToggle({
  postId,
  parentId,
  canManage,
  fingerprintRef,
  onAdded,
}: {
  postId: string;
  parentId: string;
  canManage: boolean;
  fingerprintRef: React.MutableRefObject<string>;
  onAdded: (c: Comment) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? "cancel" : "reply"}
      </button>
      {open ? (
        <CommentForm
          postId={postId}
          parentId={parentId}
          canManage={canManage}
          fingerprintRef={fingerprintRef}
          onAdded={(c) => {
            onAdded(c);
            setOpen(false);
          }}
          compact
        />
      ) : null}
    </>
  );
}

function CommentForm({
  postId,
  parentId,
  canManage,
  fingerprintRef,
  onAdded,
  compact,
}: {
  postId: string;
  parentId: string | null;
  canManage: boolean;
  fingerprintRef: React.MutableRefObject<string>;
  onAdded: (c: Comment) => void;
  compact?: boolean;
}) {
  const [content, setContent] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (canManage) return; // signed-in team members reply as the team
    try {
      setName(window.localStorage.getItem(NAME_KEY) ?? "");
      setEmail(window.localStorage.getItem(EMAIL_KEY) ?? "");
    } catch {
      /* ignore */
    }
  }, [canManage]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    if (!canManage) {
      try {
        if (name.trim()) window.localStorage.setItem(NAME_KEY, name.trim());
        if (email.trim()) window.localStorage.setItem(EMAIL_KEY, email.trim());
      } catch {
        /* ignore */
      }
    }
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          parentId,
          content: content.trim(),
          // Signed-in team members are detected server-side via their session,
          // so we don't send (or require) a name/email for them.
          authorName: canManage ? undefined : name.trim() || undefined,
          authorEmail: canManage ? undefined : email.trim() || undefined,
          fingerprint: fingerprintRef.current,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }
      onAdded(json.comment as Comment);
      setContent("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          canManage
            ? "Reply as the team (verified)…"
            : parentId
            ? "Write a reply…"
            : "Add your thoughts…"
        }
        rows={compact ? 2 : 3}
        className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
      />
      {/* Anonymous visitors must leave contact info; the team is identified
          by their session and skips this entirely. */}
      {canManage ? null : (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="h-8 rounded-md border border-border bg-card px-2.5 text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email (private)"
            className="h-8 rounded-md border border-border bg-card px-2.5 text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
          />
        </div>
      )}
      {error ? (
        <p className="font-mono text-[10px] text-destructive">{error}</p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          {parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}
