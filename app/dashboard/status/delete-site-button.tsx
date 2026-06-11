"use client";

import { useActionState } from "react";
import { Loader2, Trash2 } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { deleteMonitoredSite, type StatusActionState } from "./actions";

const initialState: StatusActionState = { ok: false };

export function DeleteSiteButton({ id }: { id: string }) {
  const [, formAction, pending] = useActionState(
    deleteMonitoredSite,
    initialState
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        disabled={pending}
        className="text-muted-foreground hover:text-destructive"
        aria-label="Remove site"
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </Button>
    </form>
  );
}
