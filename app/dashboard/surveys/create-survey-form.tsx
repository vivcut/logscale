"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSurvey, type SurveyActionState } from "./actions";

const initialState: SurveyActionState = { ok: false };

/**
 * Inline "new survey" composer. On submit it creates an empty draft and the
 * server action redirects straight into the editor.
 */
export function CreateSurveyForm() {
  const [state, formAction, pending] = useActionState(
    createSurvey,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
      <Input
        name="title"
        placeholder="New form title (e.g. Product feedback survey)"
        required
        className="sm:flex-1"
      />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Plus />}
        Create form
      </Button>
      {state.error ? (
        <p className="font-mono text-xs text-destructive sm:self-center">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
