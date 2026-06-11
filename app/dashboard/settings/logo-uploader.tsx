"use client";

import * as React from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { uploadWorkspaceLogo, removeWorkspaceLogo } from "./actions";

export function LogoUploader({
  workspaceName,
  initialUrl,
}: {
  workspaceName: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = React.useState<string | null>(initialUrl);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("logo", file);
    const res = await uploadWorkspaceLogo(fd);
    if (!res.ok) {
      setError(res.error ?? "Upload failed.");
    } else if (res.url) {
      setUrl(res.url);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onRemove() {
    setBusy(true);
    setError(null);
    const res = await removeWorkspaceLogo();
    if (!res.ok) setError(res.error ?? "Could not remove logo.");
    else setUrl(null);
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary text-lg font-bold">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={workspaceName} className="size-full object-cover" />
        ) : (
          workspaceName.charAt(0).toUpperCase()
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={onPick}
            className="hidden"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : url ? (
              <Upload className="size-4" />
            ) : (
              <ImageIcon className="size-4" />
            )}
            {url ? "Replace logo" : "Upload logo"}
          </Button>
          {url ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          PNG, JPG, WEBP or SVG · max 2MB · shown on your public pages
        </p>
        {error ? (
          <p className="font-mono text-[10px] text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
