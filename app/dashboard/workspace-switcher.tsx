"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "@/components/icons";

import { cn } from "@/lib/utils";
import { setActiveWorkspace } from "./workspace-actions";


type Workspace = {
 id: string;
 name: string;
 slug: string;
 logo_url: string | null;
 shared?: boolean;
};


export function WorkspaceSwitcher({
 workspaces,
 activeId: activeIdProp,
}: {
 workspaces: Workspace[];
 activeId?: string | null;
}) {
 const router = useRouter();
 const [open, setOpen] = React.useState(false);
 const [pending, setPending] = React.useState(false);

 // The active workspace is resolved server-side (cookie-backed) and passed in.
 const activeId = activeIdProp ?? workspaces[0]?.id ?? null;
 const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

 const handleSwitch = async (id: string) => {
  setOpen(false);
  if (id === activeId) return;
  setPending(true);
  // Persist the selection in a cookie, then jump straight to the overview for
  // the newly selected workspace (and refresh server components so the whole
  // dashboard reflects it). Switching context shouldn't strand you on a
  // detail page that may not exist in the other workspace.
  await setActiveWorkspace(id);
  router.push("/dashboard");
  router.refresh();
  setPending(false);
 };



 if (workspaces.length === 0) {
  return (
   <Link
    href="/onboarding?new=1"
    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
   >
    <span className="flex size-6 items-center justify-center rounded  border border-border border-dashed border-border">
     <Plus weight="bold" className="size-3.5" />
    </span>
    Create workspace
   </Link>
  );
 }


 return (
  <div className="relative w-full">
   <button
    onClick={() => setOpen((v) => !v)}
    className="flex w-full items-center gap-2 rounded-md px-0 pr-2 cursor-pointer py-1.5 text-left transition-colors group"
   >
    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded bg-primary text-[10px] font-bold text-primary-foreground">
     {active?.logo_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
       src={active.logo_url}
       alt={active.name}
       className="size-full object-cover"
      />
     ) : (
      active?.name.charAt(0).toUpperCase()
     )}
    </span>
    <span className="min-w-0 flex-1 truncate text-sm font-semibold group-hover:text-primary">
     {active?.name}
     {active?.shared ? (
      <span className="ml-1 font-mono text-[10px] font-normal text-muted-foreground">
       (shared)
      </span>
     ) : null}
    </span>
    <ChevronsUpDown weight="fill" className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />

   </button>

   {open ? (
    <>
     <div
      className="fixed inset-0 z-10"
      onClick={() => setOpen(false)}
     />
     <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md  border border-border bg-popover p-1 shadow-xl shadow-black/40">
      {workspaces.map((w) => (
       <button
        key={w.id}
        onClick={() => handleSwitch(w.id)}
        disabled={pending}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-60"
       >

        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-secondary text-[9px] font-bold">
         {w.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate">
         {w.name}
         {w.shared ? (
          <span className="ml-1 font-mono text-[10px] text-muted-foreground">
           (shared)
          </span>
         ) : null}
        </span>
        <Check

         className={cn(
          "size-3.5",
          active?.id === w.id ? "opacity-100" : "opacity-0"
         )}
        />
       </button>
      ))}
      <div className="my-1 h-px bg-border" />
      <Link
       href="/onboarding?new=1"
       onClick={() => setOpen(false)}
       className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
      >
       <span className="flex size-5 items-center bg-primary justify-center rounded">
        <Plus className="size-4 text-white" />
       </span>
       New workspace
      </Link>

     </div>
    </>
   ) : null}
  </div>
 );
}
