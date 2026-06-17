"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  Save,
  Send,
  Sparkles,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveChangelog,
  generateAiDraft,
  type ChangelogState,
} from "./actions";

const initialState: ChangelogState = { ok: false };

type Mode = "write" | "preview";

export function ChangelogEditor({
  entry,
}: {
  entry?: {
    id: string;
    title: string;
    content: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    saveChangelog,
    initialState
  );

  const [title, setTitle] = React.useState(entry?.title ?? "");
  const [content, setContent] = React.useState(entry?.content ?? "");
  const [mode, setMode] = React.useState<Mode>("write");

  const contentRef = React.useRef<HTMLTextAreaElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // AI draft state
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  // Image upload state
  const [imageUploading, setImageUploading] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (!file) return;

    setImageError(null);
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/changelog/images", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setImageError(json.error ?? "Upload failed.");
        return;
      }

      // Splice the markdown image at the cursor (or append to the end).
      const snippet = `![${file.name}](${json.url})`;
      const el = contentRef.current;
      setContent((prev) => {
        if (el && typeof el.selectionStart === "number") {
          const start = el.selectionStart;
          const end = el.selectionEnd;
          const before = prev.slice(0, start);
          const after = prev.slice(end);
          const sep = before && !before.endsWith("\n") ? "\n" : "";
          return `${before}${sep}${snippet}\n${after}`;
        }
        return prev.trim() ? `${prev.trim()}\n\n${snippet}\n` : `${snippet}\n`;
      });
      setMode("write");
    } catch {
      setImageError("Unexpected error uploading image.");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleAiDraft() {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateAiDraft();
      if (result.ok && result.markdown) {
        // Inject the generated markdown directly into the editor field.
        setContent((prev) =>
          prev.trim()
            ? `${prev.trim()}\n\n${result.markdown}`
            : result.markdown!
        );
        setMode("write");
      } else {
        setAiError(result.error ?? "Failed to generate draft.");
      }
    } catch {
      setAiError("Unexpected error generating draft.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {entry?.id ? <input type="hidden" name="id" value={entry.id} /> : null}
      {/* publish flag is toggled by which button is clicked */}
      <input type="hidden" name="publish" id="publish-flag" value="false" />

      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title" className="text-muted-foreground">
          Title
        </Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="v1.4 — Dark mode, faster search & more"
          className="text-base"
          required
        />
      </div>

      {/* Editor toolbar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content" className="text-muted-foreground">
            Content{" "}
            <span className="font-mono text-xs text-muted-foreground/60">
              (markdown)
            </span>
          </Label>

          <div className="flex items-center gap-2">
            {/* Write / Preview toggle */}
            <div className="flex items-center gap-1 rounded-xl border-2 border-border-2 p-0.5">
              <button
                type="button"
                onClick={() => setMode("write")}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-xs transition-colors",
                  mode === "write"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="size-3" />
                write
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-xs transition-colors",
                  mode === "preview"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="size-3" />
                preview
              </button>
            </div>

            {/* Image upload */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ImageIcon />
              )}
              {imageUploading ? "Uploading…" : "Image"}
            </Button>

            {/* AI Draft */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiDraft}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles className="text-indigo-400" />
              )}
              {aiLoading ? "Generating…" : "AI Draft"}
            </Button>
          </div>
        </div>

        {aiError ? (
          <p className="font-mono text-xs text-destructive">{aiError}</p>
        ) : null}
        {imageError ? (
          <p className="font-mono text-xs text-destructive">{imageError}</p>
        ) : null}

        {/* Hidden field always carries the markdown for submission */}
        <textarea name="content" value={content} readOnly hidden />

        {mode === "write" ? (
          <textarea
            id="content"
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              "## ✨ New\n\n- Describe what shipped…\n\n## 🐛 Fixes\n\n- …"
            }
            rows={18}
            className="w-full resize-y rounded-xl border-2 border-border-2 bg-card px-3.5 py-3 font-mono text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
            required
          />
        ) : (
          <div className="min-h-[28rem] rounded-xl border-2 border-border-2 bg-card px-5 py-4">
            {content.trim() ? (
              <article
                className="prose-changelog"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                nothing to preview yet
              </p>
            )}
          </div>
        )}
      </div>

      {state.error ? (
        <p className="font-mono text-xs text-destructive">{state.error}</p>
      ) : null}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t-2 border-border-2 pt-4">
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          onClick={() => {
            const f = document.getElementById(
              "publish-flag"
            ) as HTMLInputElement | null;
            if (f) f.value = "false";
          }}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save draft
        </Button>
        <Button
          type="submit"
          disabled={pending}
          onClick={() => {
            const f = document.getElementById(
              "publish-flag"
            ) as HTMLInputElement | null;
            if (f) f.value = "true";
          }}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          Publish
        </Button>
      </div>
    </form>
  );
}
