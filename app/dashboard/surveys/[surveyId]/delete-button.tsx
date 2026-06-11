"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Trash2 } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { deleteSurvey, type SurveyActionState } from "../actions";

const initialState: SurveyActionState = { ok: false };

export function DeleteSurveyButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    deleteSurvey,
    initialState
  );
  const [confirming, setConfirming] = React.useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
        delete
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="font-mono text-xs text-muted-foreground">sure?</span>
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
        Delete
      </Button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        cancel
      </button>
      {state.error ? (
        <span className="font-mono text-xs text-destructive">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
