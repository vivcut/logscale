"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, BadgeCheck, MessageSquare, Search, Trash2, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";
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
 author_avatar_url?: string | null;
 created_at: string;
};

export type BoardSummary = {
 id: string;
 name: string;
 slug: string;
 post_count: number;
};

type Sort = "trending" | "new";

function formatDate(iso: string) {
 return new Date(iso).toLocaleDateString(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
 });
}

export function FeedbackBoard({
 boardId,
 boardName,
 workspaceSlug,
 workspaceName,
 boardSlug,
 flairs,
 initialPosts,
 boards,
 isSignedIn,
 isAdmin,
}: {
 boardId: string;
 boardName: string;
 workspaceSlug: string;
 workspaceName: string;
 boardSlug: string;
 flairs: string[];
 initialPosts: PublicPost[];
 boards?: BoardSummary[];
 isSignedIn: boolean;
 isAdmin: boolean;
}) {
 const router = useRouter();
 const [posts, setPosts] = React.useState<PublicPost[]>(initialPosts);
 const [sort, setSort] = React.useState<Sort>("trending");
 const [search, setSearch] = React.useState("");
 const [voted, setVoted] = React.useState<Record<string, boolean>>({});
 const [pendingVotes, setPendingVotes] = React.useState<Record<string, boolean>>({});
 const [showDialog, setShowDialog] = React.useState(false);
 const [signInPrompt, setSignInPrompt] = React.useState<string | null>(null);

 const sortedPosts = React.useMemo(() => {
  let list = [...posts].filter((p) => p.status !== "closed");

  if (search.trim()) {
   const q = search.toLowerCase();
   list = list.filter(
    (p) =>
     p.title.toLowerCase().includes(q) ||
     (p.description && p.description.toLowerCase().includes(q))
   );
  }

  if (sort === "new") {
   list.sort(
    (a, b) =>
     new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
   );
  } else {
   list.sort(
    (a, b) =>
     statusRank(a.status) - statusRank(b.status) ||
     b.upvotes_count - a.upvotes_count ||
     new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
   );
  }
  return list;
 }, [posts, sort, search]);

 async function handleUpvote(postId: string) {
  // Gate: must be signed in
  if (!isSignedIn) {
   setSignInPrompt(postId);
   // Auto-dismiss after 4 seconds
   setTimeout(() => setSignInPrompt((cur) => (cur === postId ? null : cur)), 4000);
   return;
  }

  if (pendingVotes[postId]) return;
  const hasVoted = !!voted[postId];
  const optimisticCount = hasVoted ? -1 : 1;

  // Optimistic update
  setPendingVotes((p) => ({ ...p, [postId]: true }));
  setVoted((v) => ({ ...v, [postId]: !hasVoted }));
  setPosts((prev) =>
   prev.map((p) =>
    p.id === postId
     ? { ...p, upvotes_count: p.upvotes_count + optimisticCount }
     : p
   )
  );

  try {
   const res = await fetch("/api/upvotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
   });
   const json = await res.json();
   if (res.ok) {
    // Only update if server value differs from optimistic
    setVoted((v) => ({ ...v, [postId]: json.voted }));
    setPosts((prev) =>
     prev.map((p) =>
      p.id === postId ? { ...p, upvotes_count: json.upvotes_count } : p
     )
    );
   } else {
    // Revert optimistic update
    setVoted((v) => ({ ...v, [postId]: hasVoted }));
    setPosts((prev) =>
     prev.map((p) =>
      p.id === postId
       ? { ...p, upvotes_count: p.upvotes_count - optimisticCount }
       : p
     )
    );
   }
  } catch {
   // Revert on network error
   setVoted((v) => ({ ...v, [postId]: hasVoted }));
   setPosts((prev) =>
    prev.map((p) =>
     p.id === postId
      ? { ...p, upvotes_count: p.upvotes_count - optimisticCount }
      : p
    )
   );
  } finally {
   setPendingVotes((p) => ({ ...p, [postId]: false }));
  }
 }

 function handleNewFeedbackClick() {
  if (!isSignedIn) {
   // Redirect to login with return path and brand
   window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}&brand=${encodeURIComponent(workspaceName)}`;
   return;
  }
  setShowDialog(true);
 }

 async function handleDeletePost(postId: string) {
  if (!confirm("Are you sure you want to delete this post?")) return;
  try {
   const res = await fetch(`/api/posts?postId=${postId}`, { method: "DELETE" });
   if (res.ok) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
   } else {
    const json = await res.json();
    alert(json.error ?? "Failed to delete post.");
   }
  } catch {
   alert("Network error.");
  }
 }

 function getSignInUrl() {
  return `/login?next=${encodeURIComponent(window.location.pathname)}&brand=${encodeURIComponent(workspaceName)}`;
 }

 return (
  <>
   {/* Dialog overlay for post form */}
   {showDialog && (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
     {/* Backdrop */}
     <div
      className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      onClick={() => setShowDialog(false)}
     />
     {/* Dialog */}
     <div className="relative z-10 mx-4 w-full max-w-lg">
       <PostForm
        boardId={boardId}
        flairs={flairs}
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        onCreated={(post) => {
         setPosts((prev) => [post as PublicPost, ...prev]);
         setShowDialog(false);
        router.push(`/public/${workspaceSlug}/${boardSlug}/${post.id}`);
       }}
       onClose={() => setShowDialog(false)}
      />
     </div>
    </div>
   )}

   <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
    {/* Left column — posts list */}
    <section className="min-w-0">
     <div className="mb-6 flex items-center gap-2">
      <h2 className="text-2xl font-bold tracking-tight">• {boardName}</h2>
     </div>

     {sortedPosts.length === 0 ? (
      <div className="flex flex-col items-center justify-center rounded-md border border-border border-dashed py-16 text-center">
       <h3 className="text-sm font-medium">No feedback yet</h3>
       <p className="mt-1 text-sm text-muted-foreground">
        Be the first to share a suggestion.
       </p>
      </div>
     ) : (
      <div className="space-y-0 divide-y divide-border overflow-hidden rounded-md border border-border">
       {sortedPosts.map((post) => (
        <div
         key={post.id}
         className="p-5 transition-colors hover:bg-secondary/20"
        >
         <Link
          href={`/public/${workspaceSlug}/${boardSlug}/${post.id}`}
          prefetch={true}
          className="block"
         >
          <h3 className="text-base font-semibold text-foreground">
           {post.title}
          </h3>
          {post.description && (
           <p className="mt-2 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
            {post.description}
           </p>
          )}
         </Link>

         <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
           {post.author_name && (
            <div className="flex items-center gap-1.5">
             <div className="size-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold uppercase text-muted-foreground overflow-hidden">
              {post.author_avatar_url ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={post.author_avatar_url} alt={post.author_name} className="size-full object-cover" />
              ) : (
               post.author_name.charAt(0)
              )}
             </div>
             <span className="text-xs font-medium text-foreground/80">
              {post.author_name}
             </span>
             {post.is_official && (
              <BadgeCheck className="size-3.5 text-primary" />
             )}
            </div>
           )}
           <span className="text-xs text-muted-foreground">
            {formatDate(post.created_at)}
           </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
           {post.flair && (
            <span
             className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              flairBadgeClass(post.flair)
             )}
            >
             • {post.flair}
            </span>
           )}
           <span
            className={cn(
             "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
             statusBadgeClass(post.status)
            )}
           >
            ○ {statusLabel(post.status)}
           </span>

           <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            <MessageSquare className="size-3" />
            0
           </span>

           <div className="relative">
            <button
             onClick={(e) => {
              e.preventDefault();
              handleUpvote(post.id);
             }}
             disabled={pendingVotes[post.id]}
             className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-all duration-200",
              pendingVotes[post.id] && "pointer-events-none opacity-70",
              voted[post.id]
               ? "border-primary/40 bg-primary/10 text-primary"
               : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
             )}
            >
             <ArrowUp className="size-3" />
             <span className="tabular-nums">{post.upvotes_count}</span>
            </button>
            {/* Sign-in prompt tooltip */}
            {signInPrompt === post.id && (
             <div className="absolute bottom-full right-0 mb-2 z-50 w-48 rounded-lg border border-border bg-card p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-xs text-muted-foreground mb-2">Sign in to upvote</p>
              <a
               href={getSignInUrl()}
               className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
               Sign in / Sign up
              </a>
             </div>
            )}
           </div>

           {isAdmin && (
            <button
             onClick={(e) => {
              e.preventDefault();
              handleDeletePost(post.id);
             }}
             title="Delete post"
             className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive"
            >
             <Trash2 className="size-3" />
            </button>
           )}
          </div>
         </div>
        </div>
       ))}
      </div>
     )}
    </section>

    {/* Right sidebar */}
    <aside className="lg:sticky lg:top-8 lg:self-start space-y-4">
     <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
      {(["trending", "new"] as Sort[]).map((s) => (
       <button
        key={s}
        onClick={() => setSort(s)}
        className={cn(
         "flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
         sort === s
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground"
        )}
       >
        {s === "trending" ? "🔥 Trending" : "🕐 New"}
       </button>
      ))}
     </div>

     <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
       placeholder="Search..."
       value={search}
       onChange={(e) => setSearch(e.target.value)}
       className="pl-9 bg-card"
      />
     </div>

     <Button className="w-full text-lg bg-black text-white cursor-pointer hover:bg-zinc-800" size="lg" onClick={handleNewFeedbackClick}>
      New Feedback
     </Button>

     {boards && boards.length > 0 && (
      <div className="rounded-md border border-border bg-card p-4">
       <h3 className="mb-3 text-sm font-semibold">Boards</h3>
       <ul className="space-y-2.5">
        {boards.map((b, i) => {
         const colors = [
          "bg-muted-foreground",
          "bg-purple-500",
          "bg-blue-500",
          "bg-yellow-500",
          "bg-red-500",
         ];
         const dotColor = colors[i % colors.length];
         const isActive = b.slug === boardSlug;
         return (
          <li key={b.id}>
           <Link
            href={`/public/${workspaceSlug}/${b.slug}`}
            prefetch={true}
            className={cn(
             "flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors",
             isActive ? "bg-secondary font-medium" : "hover:bg-secondary/50"
            )}
           >
            <span className="flex items-center gap-2">
             <span className={cn("size-2.5 rounded-full", dotColor)} />
             {b.name}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
             {b.post_count}
            </span>
           </Link>
          </li>
         );
        })}
       </ul>
      </div>
     )}
    </aside>
   </div>
  </>
 );
}
