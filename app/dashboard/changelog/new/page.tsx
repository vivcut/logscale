import Link from "next/link";
import { ArrowLeft } from "@/components/icons";

import { getActiveWorkspace } from "@/lib/workspace";
import { ChangelogEditor } from "../changelog-editor";

export const metadata = {
  title: "New release — Pittstop",
};

export default async function NewChangelogPage() {
  const workspace = await getActiveWorkspace();

  if (!workspace) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="rounded-md  border border-border border-dashed  p-10 text-center">
          <h1 className="text-sm font-medium">No active workspace</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/dashboard/changelog"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        back to changelog
      </Link>

      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground">
          /changelog/new
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          New release
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Write release notes in Markdown, or generate a draft from recently
          completed feedback with AI.
        </p>
      </div>

      <ChangelogEditor />
    </div>
  );
}
