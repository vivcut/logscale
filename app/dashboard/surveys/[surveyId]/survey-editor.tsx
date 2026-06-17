"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  AlignLeft,
  CheckCircle,
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "@/components/icons";
import { ShareLink } from "@/components/share-link";


import { cn } from "@/lib/utils";
import {
  QUESTION_TYPE_LABELS,
  isChoiceType,
  type QuestionType,
  type SurveyQuestion,
} from "@/lib/surveys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveSurvey,
  setSurveyPublished,
  type SurveyActionState,
} from "../actions";

const initialState: SurveyActionState = { ok: false };

// Local draft shape — mirrors SurveyQuestion but with a client-only key so we
// can reorder/remove rows before they ever hit the database.
type DraftQuestion = {
  key: string;
  type: QuestionType;
  label: string;
  options: string[];
  is_required: boolean;
};

const TYPE_ICON: Record<QuestionType, React.ComponentType<{ className?: string }>> =
  {
    short_text: FileText,
    long_text: AlignLeft,
    multiple_choice: CheckCircle,
    checkboxes: ClipboardList,
  };

let keyCounter = 0;
function freshKey() {
  keyCounter += 1;
  return `q-${Date.now()}-${keyCounter}`;
}

export function SurveyEditor({
  survey,
  questions,
  publicUrl,
}: {
  survey: {
    id: string;
    title: string;
    description: string | null;
    is_published: boolean;
    require_email: boolean;
  };
  questions: SurveyQuestion[];
  publicUrl: string;
}) {
  const [title, setTitle] = React.useState(survey.title);
  const [description, setDescription] = React.useState(
    survey.description ?? ""
  );
  const [requireEmail, setRequireEmail] = React.useState(survey.require_email);
  const [items, setItems] = React.useState<DraftQuestion[]>(
    questions.map((q) => ({
      key: q.id,
      type: q.type,
      label: q.label,
      options: q.options.length ? q.options : [],
      is_required: q.is_required,
    }))
  );

  const [saveState, saveAction, saving] = useActionState(
    saveSurvey,
    initialState
  );
  const [pubState, pubAction, publishing] = useActionState(
    setSurveyPublished,
    initialState
  );

  function addQuestion(type: QuestionType) {

    setItems((prev) => [
      ...prev,
      {
        key: freshKey(),
        type,
        label: "",
        options: isChoiceType(type) ? ["Option 1"] : [],
        is_required: false,
      },
    ]);
  }

  function updateItem(key: string, patch: Partial<DraftQuestion>) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it))
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function move(key: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.key === key);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }

  // Serialized payload the server action consumes.
  const questionsPayload = JSON.stringify(
    items.map((it) => ({
      type: it.type,
      label: it.label,
      options: it.options,
      is_required: it.is_required,
    }))
  );

  return (
    <div className="space-y-6">
      {/* Publish bar */}
      <div className="flex flex-col gap-3 rounded-xl border-2 border-border-2 bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex size-2 rounded-full",
                survey.is_published ? "bg-emerald-400" : "bg-zinc-600"
              )}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {survey.is_published ? "published & live" : "draft — not public"}
            </span>
          </div>
          {survey.is_published ? (
            <ShareLink
              url={publicUrl}
              label={`${survey.title} form`}
              className="mt-2"
            />
          ) : null}
        </div>

        <div className="flex items-center gap-2">

          <Link href={`/dashboard/surveys/${survey.id}/responses`}>
            <Button variant="outline" size="sm">
              View responses
            </Button>
          </Link>
          {/* Publish / unpublish toggle */}
          <form action={pubAction}>
            <input type="hidden" name="id" value={survey.id} />
            <input
              type="hidden"
              name="publish"
              value={survey.is_published ? "false" : "true"}
            />
            <Button
              type="submit"
              size="sm"
              variant={survey.is_published ? "outline" : "default"}
              disabled={publishing}
            >
              {publishing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}
              {survey.is_published ? "Unpublish" : "Publish"}
            </Button>
          </form>
        </div>
      </div>

      {pubState.error ? (
        <p className="font-mono text-xs text-destructive">{pubState.error}</p>
      ) : null}

      {/* Editor form */}
      <form action={saveAction} className="space-y-6">
        <input type="hidden" name="id" value={survey.id} />
        <input type="hidden" name="questions" value={questionsPayload} />
        <input
          type="hidden"
          name="require_email"
          value={requireEmail ? "true" : "false"}
        />

        {/* Meta */}
        <div className="space-y-4 rounded-xl border-2 border-border-2 bg-card p-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title" className="text-muted-foreground">
              Form title
            </Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product feedback survey"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description" className="text-muted-foreground">
              Description{" "}
              <span className="font-mono text-xs text-muted-foreground/60">
                (optional)
              </span>
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell respondents what this form is about…"
              rows={2}
              className="w-full resize-y rounded-xl border-2 border-border-2 bg-background px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
            />
          </div>

          {/* Require email toggle */}
          <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-border-2 bg-background px-3.5 py-3">
            <span className="text-sm">
              Require email address
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                respondents must provide a contact email
              </span>
            </span>
            <input
              type="checkbox"
              checked={requireEmail}
              onChange={(e) => setRequireEmail(e.target.checked)}
              className="size-4 accent-current"
            />
          </label>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border-2 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No questions yet. Add one below.
              </p>
            </div>
          ) : (
            items.map((it, idx) => {
              const Icon = TYPE_ICON[it.type];
              return (
                <div
                  key={it.key}
                  className="rounded-xl border-2 border-border-2 bg-card p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <Icon className="size-3.5" />
                      {QUESTION_TYPE_LABELS[it.type]}
                      <span className="text-muted-foreground/50">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(it.key, -1)}
                        disabled={idx === 0}
                        className="rounded px-1.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(it.key, 1)}
                        disabled={idx === items.length - 1}
                        className="rounded px-1.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(it.key)}
                        className="rounded px-1.5 py-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <Input
                    value={it.label}
                    onChange={(e) =>
                      updateItem(it.key, { label: e.target.value })
                    }
                    placeholder="Question label"
                    className="mb-3"
                  />

                  {/* Options editor for choice questions */}
                  {isChoiceType(it.type) ? (
                    <div className="mb-3 space-y-2">
                      {it.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {it.type === "checkboxes" ? "☐" : "○"}
                          </span>
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const next = [...it.options];
                              next[oi] = e.target.value;
                              updateItem(it.key, { options: next });
                            }}
                            placeholder={`Option ${oi + 1}`}
                            className="h-9"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(it.key, {
                                options: it.options.filter((_, i) => i !== oi),
                              })
                            }
                            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(it.key, {
                            options: [
                              ...it.options,
                              `Option ${it.options.length + 1}`,
                            ],
                          })
                        }
                        className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Plus className="size-3" />
                        add option
                      </button>
                    </div>
                  ) : null}

                  {/* Required toggle */}
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={it.is_required}
                      onChange={(e) =>
                        updateItem(it.key, { is_required: e.target.checked })
                      }
                      className="size-3.5 accent-current"
                    />
                    Required
                  </label>
                </div>
              );
            })
          )}

          {/* Add-question palette */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-border-2 p-3">
            <span className="mr-1 font-mono text-xs text-muted-foreground">
              add question:
            </span>
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => {
              const Icon = TYPE_ICON[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => addQuestion(t)}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border-2 px-2.5 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Icon className="size-3.5" />
                  {QUESTION_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save bar */}
        <div className="flex items-center justify-end gap-3 border-t-2 border-border-2 pt-4">
          {saveState.error ? (
            <p className="font-mono text-xs text-destructive">
              {saveState.error}
            </p>
          ) : saveState.ok ? (
            <p className="font-mono text-xs text-emerald-400">Saved</p>
          ) : null}
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Save form
          </Button>
        </div>
      </form>
    </div>
  );
}
