"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { deleteChangelog } from "../actions";

export function DeleteChangelogButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await deleteChangelog({ ok: false }, fd);
      if (res.ok) {
        router.push("/dashboard/changelog");
        router.refresh();
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={handleDelete}
        disabled={pending}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
        Confirm
      </Button>
    </div>
  );
}
