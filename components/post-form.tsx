"use client";

import * as React from "react";
import {
 ArrowUp,
 FilePdf,
 ImageIcon,
 Loader2,
 MessageSquarePlus,
 Paperclip,
 Search,
 Send,
 X,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";
import { flairBadgeClass } from "@/lib/flairs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareQuote } from "lucide-react";

/** Minimal shape returned by POST /api/posts. */
export type CreatedPost = {
 id: string;
 title: string;
 description: string | null;
 status: string;
 upvotes_count: number;
 flair: string | null;
 created_at: string;
};

// Strict client-side mirror of the server limits (see /api/posts/attachments).
const MAX_FILES = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,application/pdf";
const ALLOWED_TYPES = [
 "image/png",
 "image/jpeg",
 "image/webp",
 "image/gif",
 "application/pdf",
];

/**
 * PostForm — the canonical "Add post" submission form.
 *
 * Requires the user to be signed in. Name/email are no longer collected —
 * the server identifies the user via their session and attributes posts
 * to their profile automatically.
 */
export function PostForm({
 boardId,
 flairs,
 onCreated,
 onClose,
 workspaceSlug,
 boardSlug,
}: {
 boardId: string;
 flairs: string[];
 onCreated: (post: CreatedPost) => void;
 onClose?: () => void;
 workspaceSlug?: string;
 boardSlug?: string;
}) {
 const [title, setTitle] = React.useState("");
 const [description, setDescription] = React.useState("");
 const [flair, setFlair] = React.useState<string | null>(null);
 const [submitting, setSubmitting] = React.useState(false);
 const [formError, setFormError] = React.useState<string | null>(null);

 // Pending attachments (uploaded after the post is created).
 const [files, setFiles] = React.useState<File[]>([]);
 const fileInputRef = React.useRef<HTMLInputElement>(null);

 // Inline duplicate detection.
 const [matches, setMatches] = React.useState<CreatedPost[]>([]);
 const [searching, setSearching] = React.useState(false);

 const fingerprintRef = React.useRef<string>("");
 React.useEffect(() => {
  fingerprintRef.current = getFingerprint();
 }, []);

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

  try {
   const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     boardId,
     title: title.trim(),
     description: description.trim(),
     flair,
     fingerprint: fingerprintRef.current,
    }),
   });
   const json = await res.json();
   if (!res.ok) {
    setFormError(json.error ?? "Something went wrong.");
    return;
   }

   const newPost = json.post as CreatedPost;
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
      /* best effort */
     }
    }
   }

   onCreated(newPost);
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

 return (
  <div className="rounded-md border border-border bg-card p-5">
   <div className="mb-4 flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
     <MessageSquareQuote className="size-6 text-muted-foreground" />
     <h2 className="text-lg font-semibold">Add post</h2>
    </div>
    {onClose ? (
     <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
     >
      <X className="size-4" />
     </button>
    ) : null}
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
       <div className="flex items-center gap-2 border-t px-3 py-2">
        {searching ? (
         <Loader2 className="size-3 animate-spin text-muted-foreground" />
        ) : (
         <Search className="size-3 text-muted-foreground" />
        )}
        <span className="font-mono text-[11px] text-muted-foreground">
         {matches.length > 0
          ? "similar ideas — click to view"
          : "no similar ideas found"}
        </span>
       </div>
       {matches.length > 0 ? (
        <ul className="max-h-40 overflow-y-auto p-1">
         {matches.map((m) => {
          const postUrl = workspaceSlug && boardSlug
           ? `/public/${workspaceSlug}/${boardSlug}/${m.id}`
           : "#";
          return (
           <li key={m.id}>
            <a
             href={postUrl}
             className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-secondary"
            >
             <span className="flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground">
              <ArrowUp className="size-3" />
              {m.upvotes_count}
             </span>
             <span className="min-w-0 flex-1 truncate text-xs">
              {m.title}
             </span>
            </a>
           </li>
          );
         })}
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
          : "ring-1 ring-inset ring- border border-border bg-popover text-muted-foreground hover:text-foreground"
        )}
       >
        {f}
       </button>
      ))}
     </div>
    </div>

    <div className="flex flex-col gap-2">
     <Label htmlFor="description" className="text-muted-foreground">
      Details <span className="text-muted-foreground/60">(optional)</span>
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
       className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-popover border-dashed px-3 py-2 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
       <Paperclip className="size-3.5" />
       attach image or PDF
      </button>
     ) : null}
     <p className="font-mono text-[10px] text-muted-foreground">
      up to {MAX_FILES} files · images or PDFs · max 5MB each
     </p>
    </div>

    {formError ? (
     <p className="font-mono text-xs text-destructive">{formError}</p>
    ) : null}

    <Button variant={"secondary"} type="submit" disabled={submitting || !title.trim()}>
     {submitting ? <Loader2 className="animate-spin" /> : <Send />}
     Submit
    </Button>
   </form>
  </div>
 );
}
