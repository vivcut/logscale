"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Plus } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addMonitoredSite, type StatusActionState } from "./actions";

const initialState: StatusActionState = { ok: false };

export function AddSiteForm() {
  const [state, formAction, pending] = useActionState(
    addMonitoredSite,
    initialState
  );
  const formRef = React.useRef<HTMLFormElement>(null);

  // Clear the inputs once a site is successfully added.
  React.useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl  border-2 border-border  bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Add a service</h3>
        <span className="font-mono text-xs text-muted-foreground">
          /monitored_sites
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          name="title"
          type="text"
          placeholder="Display name (e.g. API, Marketing site)"
          className="sm:w-56"
        />
        <Input
          name="url"
          type="text"
          inputMode="url"
          placeholder="https://example.com"
          className="flex-1 font-mono"
          required
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Add
        </Button>
      </div>

      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        New services show “Checked soon” until the first probe runs.
      </p>

      {state.error ? (
        <p className="mt-2 font-mono text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
