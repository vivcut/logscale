import { createAdminClient } from "@/lib/supabase/admin";

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "checkboxes";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  multiple_choice: "Multiple choice",
  checkboxes: "Checkboxes",
};

/** Does this question type carry a list of selectable options? */
export function isChoiceType(type: QuestionType): boolean {
  return type === "multiple_choice" || type === "checkboxes";
}

export type SurveyQuestion = {
  id: string;
  survey_id: string;
  type: QuestionType;
  label: string;
  options: string[];
  is_required: boolean;
  position: number;
};

export type Survey = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  slug: string;
  is_published: boolean;
  require_email: boolean;
  created_at: string;
};

export type SurveyResponse = {
  id: string;
  survey_id: string;
  email: string | null;
  created_at: string;
};

export type SurveyAnswer = {
  id: string;
  response_id: string;
  question_id: string;
  value: string | null;
};

/**
 * Normalize a raw question row from Supabase into our typed shape. `options`
 * comes back as jsonb, so we coerce it to a string[] defensively.
 */
export function normalizeQuestion(row: {
  id: string;
  survey_id: string;
  type: string;
  label: string;
  options: unknown;
  is_required: boolean;
  position: number;
}): SurveyQuestion {
  let options: string[] = [];
  if (Array.isArray(row.options)) {
    options = row.options.map((o) => String(o));
  }
  return {
    id: row.id,
    survey_id: row.survey_id,
    type: row.type as QuestionType,
    label: row.label,
    options,
    is_required: row.is_required,
    position: row.position,
  };
}

/**
 * Decode an answer's stored value. Checkbox answers are stored as JSON arrays;
 * everything else is plain text. Always returns a string[] for uniform display.
 */
export function decodeAnswer(
  question: SurveyQuestion | undefined,
  value: string | null
): string[] {
  if (value == null || value === "") return [];
  if (question?.type === "checkboxes") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
    } catch {
      /* fall through to plain text */
    }
  }
  return [value];
}

/**
 * Fetch a published survey + its questions by workspace slug + survey slug,
 * using the service-role admin client (public, anonymous-friendly).
 * Returns null when the survey doesn't exist or isn't published.
 */
export async function getPublicSurvey(
  workspaceSlug: string,
  surveySlug: string
): Promise<{
  workspace: { id: string; name: string; slug: string; logo_url: string | null };
  survey: Survey;
  questions: SurveyQuestion[];
} | null> {
  const supabase = createAdminClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug, logo_url, surveys_enabled")
    .eq("slug", workspaceSlug)
    .single();

  // Surveys hidden from public view (toggle off) → treat as not found. The
  // underlying survey + responses are preserved and reappear when re-enabled.
  if (!workspace || workspace.surveys_enabled === false) return null;


  const { data: survey } = await supabase
    .from("surveys")
    .select(
      "id, workspace_id, title, description, slug, is_published, require_email, created_at"
    )
    .eq("workspace_id", workspace.id)
    .eq("slug", surveySlug)
    .single();

  if (!survey || !survey.is_published) return null;

  const { data: questionsRaw } = await supabase
    .from("survey_questions")
    .select("id, survey_id, type, label, options, is_required, position")
    .eq("survey_id", survey.id)
    .order("position", { ascending: true });

  const questions = (questionsRaw ?? []).map(normalizeQuestion);

  return {
    workspace: workspace as {
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
    },
    survey: survey as Survey,
    questions,
  };
}
