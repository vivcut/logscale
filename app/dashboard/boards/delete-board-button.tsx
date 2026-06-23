"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "@/components/icons";
import { deleteBoard } from "@/app/dashboard/boards/[boardSlug]/actions";

export function DeleteBoardButton({ boardSlug }: { boardSlug: string }) {
 const router = useRouter();
 const [confirming, setConfirming] = React.useState(false);
 const [deleting, setDeleting] = React.useState(false);

 async function handleDelete() {
  if (!confirming) {
   setConfirming(true);
   return;
  }
  setDeleting(true);
  const result = await deleteBoard(boardSlug);
  if (result.ok) {
   router.refresh();
  } else {
   alert(result.error ?? "Failed to delete board.");
   setDeleting(false);
   setConfirming(false);
  }
 }

 return (
  <button
   onClick={handleDelete}
   onBlur={() => setConfirming(false)}
   disabled={deleting}
   className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
   title={confirming ? "Click again to confirm deletion" : "Delete board"}
  >
   {deleting ? (
    <Loader2 className="size-4 animate-spin" />
   ) : (
    <Trash2 className="size-4" />
   )}
   {confirming ? "Confirm?" : "Delete"}
  </button>
 );
}
