"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUp,
  FilePdf,
  ImageIcon,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Paperclip,
  Search,
  Send,
  X,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";
import { statusBadgeClass, statusLabel, statusRank } from "@/lib/status";
import { flairBadgeClass } from "@/lib/flairs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


export type PublicPost = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
  flair: string | null;
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

const NAME_KEY = "ttm_name";
const EMAIL_KEY = "ttm_email";

// Strict client-side mirror of the server limits (see /api/posts/attachments).
const MAX_FILES = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf";
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];

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
}: {
  boardId: string;
  workspaceSlug: string;
  boardSlug: string;
  flairs: string[];
  initialPosts: PublicPost[];
}) {
  const [posts, setPosts] = React.useState<PublicPost[]>(initialPosts);
  const [sort, setSort] = React.useState<Sort>("top");
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [voted, setVoted] = React.useState<Record<string, boolean>>({});
  const [pendingVotes, setPendingVotes] = React.useState<
    Record<string, boolean>
  >({});

  // Submission form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [flair, setFlair] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Pending attachments (uploaded after the post is created).
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Inline duplicate detection

  const [matches, setMatches] = React.useState<PublicPost[]>([]);
  const [searching, setSearching] = React.useState(false);

  const fingerprintRef = React.useRef<string>("");
  React.useEffect(() => {
    fingerprintRef.current = getFingerprint();
    // Restore stored identity for convenience.
    try {
      setName(window.localStorage.getItem(NAME_KEY) ?? "");
      setEmail(window.localStorage.getItem(EMAIL_KEY) ?? "");
    } catch {
      /* ignore */
    }
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

  // Debounced duplicate search as the user types a title.
  React.useEffect(() => {
    const q = title.trim();
    if (q.length < 3) {
      setMatches([]);
      return;
    }
    setSearching(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/posts?boardId=${boardId}&q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal }
        );
        const json = await res.json();
        setMatches(json.posts ?? []);
      } catch {
        /* aborted */
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [title, boardId]);

  // Validate + queue picked files, enforcing the strict count/size/type caps.
  function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setFormError(null);

    setFiles((prev) => {
      const next = [...prev];
      for (const file of picked) {
        if (next.length >= MAX_FILES) {
          setFormError(`You can attach at most ${MAX_FILES} files.`);
          break;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          setFormError("Only images (PNG, JPG, WEBP, GIF) or PDFs are allowed.");
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          setFormError("Each file must be under 5MB.");
          continue;
        }
        // Skip exact duplicates (same name + size).
        if (next.some((f) => f.name === file.name && f.size === file.size)) {
          continue;
        }
        next.push(file);
      }
      return next.slice(0, MAX_FILES);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!flair) {
      setFormError("Please choose a flair for your post.");
      return;
    }
    setSubmitting(true);
    setFormError(null);


    // Persist identity for next time.
    try {
      if (name.trim()) window.localStorage.setItem(NAME_KEY, name.trim());
      if (email.trim()) window.localStorage.setItem(EMAIL_KEY, email.trim());
    } catch {
      /* ignore */
    }

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          title: title.trim(),
          description: description.trim(),
          flair,
          authorName: name.trim() || undefined,
          authorEmail: email.trim() || undefined,
          fingerprint: fingerprintRef.current,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Something went wrong.");
        return;
      }

      // Upload any queued attachments now that we have a post id. Failures here
      // are non-fatal — the post is already created.
      const newPost = json.post as PublicPost;
      if (files.length > 0 && newPost?.id) {
        for (const file of files) {
          const fd = new FormData();
          fd.append("postId", newPost.id);
          fd.append("file", file);
          try {
            await fetch("/api/posts/attachments", {
              method: "POST",
              body: fd,
            });
          } catch {
            /* best effort — ignore individual upload failures */
          }
        }
      }

      setPosts((prev) => [newPost, ...prev]);
      setTitle("");
      setDescription("");
      setFlair(null);
      setMatches([]);
      setFiles([]);

    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquarePlus className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Suggest an idea</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-muted-foreground">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add dark mode support"
                required
              />

              {title.trim().length >= 3 ? (
                <div className="rounded-md border border-border bg-background/60">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    {searching ? (
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    ) : (
                      <Search className="size-3 text-muted-foreground" />
                    )}
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {matches.length > 0
                        ? "similar ideas — upvote instead?"
                        : "no similar ideas found"}
                    </span>
                  </div>
                  {matches.length > 0 ? (
                    <ul className="max-h-40 overflow-y-auto p-1">
                      {matches.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => handleUpvote(m.id)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-secondary"
                          >
                            <span className="flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground">
                              <ArrowUp className="size-3" />
                              {m.upvotes_count}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xs">
                              {m.title}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Flair</Label>
              <div className="flex flex-wrap gap-1.5">
                {flairs.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFlair(f)}
                    className={cn(
                      "rounded-full px-2.5 py-1 font-mono text-[10px] lowercase transition-all",
                      flair === f
                        ? flairBadgeClass(f)
                        : "ring-1 ring-inset ring-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-muted-foreground">
                Details{" "}
                <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem and why it matters…"
                rows={4}
              />
            </div>

            {/* Attachments — images & PDFs (strict limit). */}
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">
                Attachments{" "}
                <span className="text-muted-foreground/60">(optional)</span>
              </Label>

              {files.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {files.map((file, idx) => {
                    const isImage = file.type.startsWith("image/");
                    return (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5"
                      >
                        {isImage ? (
                          <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <FilePdf className="size-3.5 shrink-0 text-red-400" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-xs">
                          {file.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {(file.size / 1024).toFixed(0)}kb
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label="Remove attachment"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                onChange={handlePickFiles}
                className="hidden"
              />
              {files.length < MAX_FILES ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <Paperclip className="size-3.5" />
                  attach image or PDF
                </button>
              ) : null}
              <p className="font-mono text-[10px] text-muted-foreground">
                up to {MAX_FILES} files · images or PDFs · max 5MB each
              </p>
            </div>


            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-muted-foreground">
                  Name{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-muted-foreground">
                  Email{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@co.com"
                />
              </div>
            </div>
            <p className="-mt-1 font-mono text-[10px] text-muted-foreground">
              email is private — only the team sees it to follow up
            </p>

            {formError ? (
              <p className="font-mono text-xs text-destructive">{formError}</p>
            ) : null}

            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send />}
              Submit feedback
            </Button>
          </form>
        </div>
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
                ? "Be the first to suggest an idea."
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
                  <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
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
