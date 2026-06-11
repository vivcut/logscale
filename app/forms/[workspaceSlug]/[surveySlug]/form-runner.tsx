"use client";

import * as React from "react";
import { useActionState } from "react";
import { BadgeCheck, Loader2, Send } from "@/components/icons";

import { type SurveyQuestion } from "@/lib/surveys";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitSurveyResponse, type SubmitState } from "@/app/dashboard/surveys/actions";

const initialState: SubmitState = { ok: false };

export function FormRunner({
  surveyId,
  questions,
  requireEmail,
}: {
  surveyId: string;
  questions: SurveyQuestion[];
  requireEmail: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    submitSurveyResponse,
    initialState
  );

  // Success screen once submitted.
  if (state.ok) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
        <BadgeCheck className="mb-3 size-8 text-emerald-400" />
        <h2 className="text-lg font-semibold">Thanks for your response!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your answers have been recorded.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="survey_id" value={surveyId} />

      {/* Email field */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email{" "}
          {requireEmail ? (
            <span className="text-destructive">*</span>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              (optional)
            </span>
          )}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required={requireEmail}
        />
      </div>

      {/* Questions */}
      {questions.map((q, idx) => (
        <fieldset
          key={q.id}
          className="space-y-3 rounded-xl border border-border bg-card p-5"
        >
          <legend className="text-sm font-medium">
            <span className="mr-1.5 font-mono text-xs text-muted-foreground">
              {idx + 1}.
            </span>
            {q.label}
            {q.is_required ? (
              <span className="ml-1 text-destructive">*</span>
            ) : null}
          </legend>

          {q.type === "short_text" ? (
            <Input name={`q_${q.id}`} required={q.is_required} />
          ) : null}

          {q.type === "long_text" ? (
            <textarea
              name={`q_${q.id}`}
              rows={4}
              required={q.is_required}
              className="w-full resize-y rounded-md border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
            />
          ) : null}

          {q.type === "multiple_choice" ? (
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-background px-3.5 py-2.5 text-sm transition-colors hover:border-ring"
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={opt}
                    required={q.is_required}
                    className="size-4 accent-current"
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : null}

          {q.type === "checkboxes" ? (
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-background px-3.5 py-2.5 text-sm transition-colors hover:border-ring"
                >
                  <input
                    type="checkbox"
                    name={`q_${q.id}`}
                    value={opt}
                    className="size-4 accent-current"
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : null}
        </fieldset>
      ))}

      {state.error ? (
        <p className="font-mono text-xs text-destructive">{state.error}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          Submit response
        </Button>
      </div>
    </form>
  );
}
