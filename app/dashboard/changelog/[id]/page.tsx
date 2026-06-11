import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/icons";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { ChangelogEditor } from "../changelog-editor";
import { DeleteChangelogButton } from "./delete-button";

export const metadata = {
  title: "Edit release — ToTheMoon",
};

export default async function EditChangelogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getActiveWorkspace();

  if (!workspace) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <h1 className="text-sm font-medium">No active workspace</h1>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("changelogs")
    .select("id, title, content, published_at")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (!entry) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/dashboard/changelog"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        back to changelog
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            /changelog/{entry.id.slice(0, 8)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Edit release
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entry.published_at
              ? "This release is live on your public timeline."
              : "This release is a draft."}
          </p>
        </div>
        <DeleteChangelogButton id={entry.id} />
      </div>

      <ChangelogEditor
        entry={{ id: entry.id, title: entry.title, content: entry.content }}
      />
    </div>
  );
}
