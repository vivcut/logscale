"use client";

import * as React from "react";
import { useActionState } from "react";
import { ArrowRight, Loader2 } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspace, type OnboardingState } from "./actions";

const initialState: OnboardingState = {};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+/, "");
}

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(
    createWorkspace,
    initialState
  );
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugEdited, setSlugEdited] = React.useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-muted-foreground">
          Workspace name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Acme Inc."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          autoFocus
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="slug" className="text-muted-foreground">
          Workspace URL
        </Label>
        <div className="flex items-center gap-2 rounded-xl border-2 border-border-2 px-3 focus-within:border-ring">
          <span className="font-mono text-xs text-muted-foreground">
            /public/
          </span>
          <input
            id="slug"
            name="slug"
            placeholder="acme"
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(slugify(e.target.value));
            }}
            className="h-9 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
            required
          />
        </div>
      </div>

      {state.error ? (
        <p className="font-mono text-xs text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" className="mt-1 w-full" disabled={pending || !name}>
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            Create workspace
            <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
