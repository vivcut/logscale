"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Plus } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBoard, type BoardActionState } from "./actions";

const initialState: BoardActionState = { ok: false };

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+/, "");
}

export function CreateBoardForm() {
  const [state, formAction, pending] = useActionState(
    createBoard,
    initialState
  );
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugEdited, setSlugEdited] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setName("");
      setSlug("");
      setSlugEdited(false);
      formRef.current?.reset();
    }
  }, [state.ok]);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus />
        New board
      </Button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Create a board</h3>
        <span className="font-mono text-xs text-muted-foreground">
          /boards/new
        </span>
      </div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-muted-foreground">
            Board name
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Feature Requests"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="slug" className="text-muted-foreground">
            Public slug
          </Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              /board/
            </span>
            <Input
              id="slug"
              name="slug"
              placeholder="feature-requests"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              className="font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description" className="text-muted-foreground">
            Description{" "}
            <span className="text-muted-foreground/60">(optional)</span>
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What kind of feedback belongs on this board?"
            rows={3}
          />
        </div>

        <label className="flex items-start gap-3 rounded-md border border-border p-3">
          <input
            type="checkbox"
            name="is_private"
            className="mt-0.5 size-4 accent-foreground"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Private board</span>
            <span className="text-xs text-muted-foreground">
              Only workspace members can view and post. Public visitors are
              blocked.
            </span>
          </span>
        </label>

        {state.error ? (
          <p className="font-mono text-xs text-destructive">{state.error}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus />}
            Create board
          </Button>
        </div>
      </form>
    </div>
  );
}
