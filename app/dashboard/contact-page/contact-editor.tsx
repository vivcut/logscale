"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Save } from "@/components/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveContactConfig,
  type ContactActionState,
} from "./actions";

const initialState: ContactActionState = { ok: false };

export function ContactEditor({
  initial,
  publicUrl,
}: {
  initial: {
    title: string;
    placeholder: string;
    emailRequired: boolean;
    smsRequired: boolean;
    enabled: boolean;
  };
  publicUrl: string;
}) {
  const [title, setTitle] = React.useState(initial.title);
  const [placeholder, setPlaceholder] = React.useState(initial.placeholder);
  const [emailRequired, setEmailRequired] = React.useState(
    initial.emailRequired
  );
  const [smsRequired, setSmsRequired] = React.useState(initial.smsRequired);

  // Visibility is controlled from Settings → Public visibility. We still send
  // the current value back so saving the config never flips the surface off.
  const enabled = initial.enabled;

  const [state, formAction, saving] = useActionState(
    saveContactConfig,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden serialized toggle values */}
      <input type="hidden" name="email_required" value={String(emailRequired)} />
      <input type="hidden" name="sms_required" value={String(smsRequired)} />
      <input type="hidden" name="enabled" value={String(enabled)} />

      {/* Live state bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-2 rounded-full",
              enabled ? "bg-emerald-400" : "bg-zinc-600"
            )}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {enabled ? "live — public page enabled" : "hidden — public page off"}
          </span>
        </div>
        <Link
          href={publicUrl}
          target="_blank"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
          view public page
        </Link>
      </div>

      {/* Text settings */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title" className="text-muted-foreground">
            Title text
          </Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contact us"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="placeholder" className="text-muted-foreground">
            Message placeholder
          </Label>
          <Input
            id="placeholder"
            name="placeholder"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="How can we help?"
          />
        </div>
      </div>

      {/* Field requirements */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          contact fields
        </p>

        <ToggleRow
          label="Require email"
          description="Visitors must provide an email address."
          checked={emailRequired}
          onChange={setEmailRequired}
        />
        <ToggleRow
          label="Require phone / SMS"
          description="Visitors must provide a phone number."
          checked={smsRequired}
          onChange={setSmsRequired}
        />
      </div>

      {/* Visibility is managed from Settings → Public visibility. */}
      <p className="font-mono text-xs text-muted-foreground">
        Show or hide this page from{" "}
        <Link
          href="/dashboard/settings"
          className="text-foreground underline-offset-2 hover:underline"
        >
          Settings → Public visibility
        </Link>
        .
      </p>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        {state.error ? (
          <p className="font-mono text-xs text-destructive">{state.error}</p>
        ) : state.ok ? (
          <p className="font-mono text-xs text-emerald-400">Saved</p>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border bg-background px-3.5 py-3">
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        <span className="block font-mono text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 shrink-0 accent-current"
      />
    </label>
  );
}
