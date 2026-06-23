"use client";

import * as React from "react";
import Link from "next/link";
import {
 ArrowUp,
 Check,
 ChevronDown,
 ExternalLink,
 Inbox,
 MessageSquare,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { flairBadgeClass } from "@/lib/flairs";

export type OverviewBoard = {
 id: string;
 name: string;
 slug: string;
};

export type OverviewPost = {
 id: string;
 title: string;
 description: string | null;
 status: string;
 upvotes_count: number;
 comments_count?: number;
 flair?: string | null;
 created_at: string;
 board_id: string;
};

// Timeframe options for the "posts" metric — scope the count + list to a recent
// window instead of all-time. Mirrors the board admin selector.
const TIMEFRAMES = [
 { key: "all", label: "all time", days: null },
 { key: "7", label: "last 7 days", days: 7 },
 { key: "14", label: "last 14 days", days: 14 },
 { key: "30", label: "last 30 days", days: 30 },
 { key: "90", label: "last 90 days", days: 90 },
] as const;

type TimeframeKey = (typeof TIMEFRAMES)[number]["key"];

// Compact relative time ("3d ago", "5h ago", "just now").
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

/**
 * Recent-feedback panel with a board switcher and a timeframe filter. Each row
 * reuses the public/admin board post card (votes · flair · status · meta) so
 * the experience stays consistent everywhere posts are listed.
 */
export function OverviewBoards({
 workspaceSlug,
 boards,
 posts,
}: {
 workspaceSlug: string;
 boards: OverviewBoard[];
 posts: OverviewPost[];
}) {
 const [activeId, setActiveId] = React.useState<string>("all");
 const [menuOpen, setMenuOpen] = React.useState(false);
 const [timeframe, setTimeframe] = React.useState<TimeframeKey>("all");

 const boardById = React.useMemo(
  () => Object.fromEntries(boards.map((b) => [b.id, b])),
  [boards]
 );

 const activeBoard = activeId === "all" ? null : boardById[activeId];

 // Apply board + timeframe filters; the count reflects the same scope.
 const scoped = React.useMemo(() => {
  const tf = TIMEFRAMES.find((t) => t.key === timeframe);
  const cutoff = tf?.days != null ? Date.now() - tf.days * 86_400_000 : null;
  return posts.filter((p) => {
   if (activeId !== "all" && p.board_id !== activeId) return false;
   if (cutoff != null && new Date(p.created_at).getTime() < cutoff)
    return false;
   return true;
  });
 }, [posts, activeId, timeframe]);

 const visible = scoped.slice(0, 12);

 return (
  <div className="mt-8">
   <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
    <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
     recent feedback
    </h2>

    <div className="flex items-center gap-2">
     {/* Total-posts pill scoped to the active timeframe */}
     <span className="inline-flex items-center gap-1.5 rounded-md  border border-border bg-secondary/40 px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted-foreground">
      <Inbox className="size-3" />
      {scoped.length} {scoped.length === 1 ? "post" : "posts"}
     </span>

     {/* Timeframe selector */}
     <TimeframeSelect value={timeframe} onChange={setTimeframe} />

     {/* Board switcher */}
     <div className="relative">
      <button
       onClick={() => setMenuOpen((o) => !o)}
       className="flex items-center gap-1.5 rounded-md  border border-border bg-secondary/40 px-2.5 py-1 text-xs transition-colors hover:bg-secondary"
      >
       <MessageSquare className="size-3 text-muted-foreground" />
       {activeBoard ? activeBoard.name : "All boards"}
       <ChevronDown className="size-3 text-muted-foreground" />
      </button>
      {menuOpen ? (
       <>
        <div
         className="fixed inset-0 z-10"
         onClick={() => setMenuOpen(false)}
        />
        <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md  border border-border bg-popover p-1 shadow-xl">
         <button
          onClick={() => {
           setActiveId("all");
           setMenuOpen(false);
          }}
          className={cn(
           "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary",
           activeId === "all" && "bg-secondary"
          )}
         >
          All boards
         </button>
         {boards.map((b) => (
          <button
           key={b.id}
           onClick={() => {
            setActiveId(b.id);
            setMenuOpen(false);
           }}
           className={cn(
            "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary",
            activeId === b.id && "bg-secondary"
           )}
          >
           {b.name}
          </button>
         ))}
        </div>
       </>
      ) : null}
     </div>
    </div>
   </div>

   {visible.length === 0 ? (
    <div className="rounded-md  border border-border border-dashed px-4 py-10 text-center font-mono text-xs text-muted-foreground">
     no feedback in this range
    </div>
   ) : (
    <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
     {visible.map((p) => {
      const board = boardById[p.board_id];
      const href = board
       ? `/public/${workspaceSlug}/${board.slug}/${p.id}`
       : "#";
      return (
       <li
        key={p.id}
        className="group flex gap-4 bg-card p-4 transition-colors hover:bg-secondary/30"
       >
        {/* votes */}
        <div className="flex h-fit w-12 shrink-0 flex-col items-center gap-0.5 rounded-md  border border-border py-2 text-muted-foreground">
         <ArrowUp className="size-4" />
         <span className="font-mono text-xs font-medium tabular-nums">
          {p.upvotes_count}
         </span>
        </div>

        {/* body */}
        <div className="min-w-0 flex-1">
         <div className="flex items-start justify-between gap-2">
          <Link
           href={href}
           target="_blank"
           className="text-sm font-medium hover:underline"
          >
           {p.title}
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
           {p.flair ? (
            <span
             className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[10px] lowercase",
              flairBadgeClass(p.flair)
             )}
            >
             {p.flair}
            </span>
           ) : null}
           <span
            className={cn(
             "rounded-full px-2 py-0.5 font-mono text-[10px] lowercase",
             statusBadgeClass(p.status)
            )}
           >
            {statusLabel(p.status)}
           </span>
           <ExternalLink className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
         </div>

         {p.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
           {p.description}
          </p>
         ) : null}

         {/* meta row: time posted · comments · board */}
         <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span>{timeAgo(p.created_at)}</span>
          <span className="inline-flex items-center gap-1">
           <MessageSquare className="size-3" />
           {p.comments_count ?? 0}
          </span>
          {board ? <span className="truncate">{board.name}</span> : null}
         </div>
        </div>
       </li>
      );
     })}
    </ul>
   )}
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
    className="flex items-center gap-1.5 rounded-md  border border-border bg-secondary/40 px-2.5 py-1 font-mono text-[11px] transition-colors hover:bg-secondary"
   >
    {current.label}
    <ChevronDown className="size-3 text-muted-foreground" />
   </button>
   {open ? (
    <>
     <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
     <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-md  border border-border bg-popover p-1 shadow-xl">
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
