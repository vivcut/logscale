"use client";

import * as React from "react";
import { Loader2 } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { refreshNow } from "./actions";

export function RefreshButton() {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await refreshNow();
        })
      }

    >
      <Loader2 className={pending ? "animate-spin" : "hidden"} />
      {/* A static refresh glyph when idle (Phosphor ArrowsClockwise isn't
          re-exported, so we use a simple SVG to avoid touching the icon map). */}
      {!pending ? (
        <svg
          viewBox="0 0 256 256"
          className="size-4"
          fill="currentColor"
          aria-hidden
        >
          <path d="M197.66 186.34a8 8 0 0 1 0 11.32A95.36 95.36 0 0 1 130 224h-2a96 96 0 0 1-65.78-26.16L43.31 216H80a8 8 0 0 1 0 16H24a8 8 0 0 1-8-8v-56a8 8 0 0 1 16 0v36.69l18.91-18.9A80 80 0 0 0 186.34 186.34a8 8 0 0 1 11.32 0ZM232 24a8 8 0 0 0-8 8v36.69l-18.91-18.9A96 96 0 0 0 50.34 58.34a8 8 0 1 0 11.32 11.32A80 80 0 0 1 197.09 81.41L212.69 96H176a8 8 0 0 0 0 16h56a8 8 0 0 0 8-8V32a8 8 0 0 0-8-8Z" />
        </svg>
      ) : null}
      {pending ? "Checking…" : "Refresh now"}
    </Button>
  );
}
