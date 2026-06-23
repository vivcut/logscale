"use client";

import * as React from "react";
import { Loader2, Warning } from "@/components/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkspace } from "./actions";

/**
 * Inline editor for the workspace name + slug. Both fields are guarded by a
 * confirmation dialog because they're visible to (and linked by) the public:
 *   - name → shown on every public page + the widget header
 *   - slug → changes the public URL and breaks embeds pointing at the old slug
 */
export function WorkspaceEditor({
  initialName,
  initialSlug,
  canManage,
}: {
  initialName: string;
  initialSlug: string;
  canManage: boolean;
}) {
  const [name, setName] = React.useState(initialName);
  const [slug, setSlug] = React.useState(initialSlug);
  const [savedName, setSavedName] = React.useState(initialName);
  const [savedSlug, setSavedSlug] = React.useState(initialSlug);

  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<null | "name" | "slug">(null);

  const nameDirty = name.trim() !== savedName;
  const slugDirty = slug.trim() !== savedSlug;

  async function save(field: "name" | "slug") {
    setPending(true);
    setError(null);
    const res =
      field === "name"
        ? await updateWorkspace({ name })
        : await updateWorkspace({ slug });
    setPending(false);
    setConfirm(null);

    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    if (field === "name") setSavedName(name.trim());
    else setSavedSlug(slug.trim());
  }

  return (
    <>
      <div className="grid gap-px overflow-hidden rounded-xl border-2 border-border bg-border sm:grid-cols-2">
        <div className="bg-card p-4">
          <Label htmlFor="ws-name" className="font-mono text-xs text-muted-foreground">
            name
          </Label>
          {canManage ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!nameDirty || pending}
                onClick={() => setConfirm("name")}
              >
                Save
              </Button>
            </div>
          ) : (
            <p className="mt-1 text-sm">{savedName}</p>
          )}
        </div>

        <div className="bg-card p-4">
          <Label htmlFor="ws-slug" className="font-mono text-xs text-muted-foreground">
            slug
          </Label>
          {canManage ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="ws-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-9 font-mono"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!slugDirty || pending}
                onClick={() => setConfirm("slug")}
              >
                Save
              </Button>
            </div>
          ) : (
            <p className="mt-1 font-mono text-sm">{savedSlug}</p>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-2 font-mono text-xs text-destructive">{error}</p>
      ) : null}

      {confirm ? (
        <ConfirmDialog
          pending={pending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => save(confirm)}
          title={
            confirm === "name" ? "Change workspace name?" : "Change your slug?"
          }
          body={
            confirm === "name" ? (
              <>
                Your workspace name is shown to everyone on your public pages and
                in the in-app widget. Visitors will see{" "}
                <span className="font-medium text-foreground">
                  {name.trim()}
                </span>{" "}
                immediately.
              </>
            ) : (
              <>
                Changing your slug updates your public URL to{" "}
                <span className="font-mono text-foreground">
                  /public/{slug.trim()}
                </span>{" "}
                and will <span className="font-medium text-foreground">break</span>{" "}
                your old links and any embedded widgets still pointing at{" "}
                <span className="font-mono text-foreground">{savedSlug}</span>.
                Update your embed snippet afterwards.
              </>
            )
          }
        />
      ) : null}
    </>
  );
}

function ConfirmDialog({
  title,
  body,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: React.ReactNode;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl  border-2 border-border  bg-popover shadow-2xl">
        <div className="flex items-start gap-3 p-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl  border-2 border-border  bg-secondary">
            <Warning className="size-4 text-chart-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2  border-t-2 border-border  bg-card/50 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={pending}
            className={cn(pending && "opacity-70")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
