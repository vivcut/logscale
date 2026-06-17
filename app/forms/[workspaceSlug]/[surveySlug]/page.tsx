import { notFound } from "next/navigation";

import { getPublicSurvey } from "@/lib/surveys";
import { Watermark } from "@/components/watermark";
import { FormRunner } from "./form-runner";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceSlug: string; surveySlug: string }>;
}) {
  const { workspaceSlug, surveySlug } = await params;
  const data = await getPublicSurvey(workspaceSlug, surveySlug);
  return {
    title: data ? `${data.survey.title} — ${data.workspace.name}` : "Form",
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; surveySlug: string }>;
}) {
  const { workspaceSlug, surveySlug } = await params;

  const data = await getPublicSurvey(workspaceSlug, surveySlug);
  if (!data) notFound();

  const { workspace, survey, questions } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        {/* Workspace identity header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl  border-2 border-border  bg-secondary text-sm font-medium">
            {workspace.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={workspace.logo_url}
                alt={workspace.name}
                className="size-full object-cover"
              />
            ) : (
              workspace.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {workspace.name}
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              {survey.title}
            </h1>
          </div>
        </div>

        {survey.description ? (
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            {survey.description}
          </p>
        ) : null}

        <FormRunner
          surveyId={survey.id}
          questions={questions}
          requireEmail={survey.require_email}
        />

        {/* Hobby-plan watermark (removed on Startup). */}
        <Watermark workspaceId={workspace.id} />
      </div>

    </div>
  );
}
