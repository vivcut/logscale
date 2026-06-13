import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft } from "@/components/icons";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { normalizeQuestion } from "@/lib/surveys";
import { SurveyEditor } from "./survey-editor";
import { DeleteSurveyButton } from "./delete-button";

export const metadata = {
  title: "Edit survey — LogScale",
};

export default async function SurveyEditorPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;

  const workspace = await getActiveWorkspace();
  if (!workspace) notFound();

  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select(
      "id, workspace_id, title, description, slug, is_published, require_email"
    )
    .eq("id", surveyId)
    .eq("workspace_id", workspace.id)
    .single();

  if (!survey) notFound();

  const { data: questionsRaw } = await supabase
    .from("survey_questions")
    .select("id, survey_id, type, label, options, is_required, position")
    .eq("survey_id", survey.id)
    .order("position", { ascending: true });

  const questions = (questionsRaw ?? []).map(normalizeQuestion);

  // Derive the public origin (works behind proxies in production).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/forms/${workspace.slug}/${survey.slug}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/surveys"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          back to surveys
        </Link>
        <DeleteSurveyButton id={survey.id} />
      </div>

      <SurveyEditor
        survey={{
          id: survey.id,
          title: survey.title,
          description: survey.description,
          is_published: survey.is_published,
          require_email: survey.require_email,
        }}
        questions={questions}
        publicUrl={publicUrl}
      />
    </div>
  );
}
