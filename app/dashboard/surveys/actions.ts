"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";
import {
 getWorkspaceSubscription,
 hasStartupPlan,
 PLAN_LIMITS,
} from "@/lib/subscription";
import { isChoiceType, type QuestionType } from "@/lib/surveys";


export type SurveyActionState = {
 ok: boolean;
 error?: string;
};

function slugify(input: string): string {
 return input
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/[\s_-]+/g, "-")
  .replace(/^-+|-+$/g, "");
}

/**
 * Create a new (empty, unpublished) survey and redirect to its editor.
 */
export async function createSurvey(
 _prev: SurveyActionState,
 formData: FormData
): Promise<SurveyActionState> {
 const supabase = await createClient();

 const workspace = await getActiveWorkspace();
 if (!workspace) return { ok: false, error: "No active workspace." };
 if (workspace.role !== "owner" && workspace.role !== "admin") {
  return { ok: false, error: "You don't have permission to create surveys." };
 }

 const title = String(formData.get("title") ?? "").trim();
 if (!title) return { ok: false, error: "Please enter a title." };

 // Hobby plan limit: at most PLAN_LIMITS.maxSurveys survey per workspace.
 const subscription = await getWorkspaceSubscription(workspace.id);
 if (!hasStartupPlan(subscription)) {
  const { count } = await supabase
   .from("surveys")
   .select("id", { count: "exact", head: true })
   .eq("workspace_id", workspace.id);
  if ((count ?? 0) >= PLAN_LIMITS.maxSurveys) {
   return {
    ok: false,
    error: `The Hobby plan is limited to ${PLAN_LIMITS.maxSurveys} survey. Upgrade to the Startup plan for unlimited surveys.`,
   };
  }
 }

 // Build a unique slug within the workspace (append a short suffix on clash).

 const base = slugify(title) || "survey";
 let slug = base;
 for (let i = 0; i < 5; i++) {
  const { data: existing } = await supabase
   .from("surveys")
   .select("id")
   .eq("workspace_id", workspace.id)
   .eq("slug", slug)
   .maybeSingle();
  if (!existing) break;
  slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
 }

 const { data: survey, error } = await supabase
  .from("surveys")
  .insert({ workspace_id: workspace.id, title, slug })
  .select("id")
  .single();

 if (error) return { ok: false, error: error.message };

 revalidatePath("/dashboard/surveys");
 redirect(`/dashboard/surveys/${survey.id}`);
}

type IncomingQuestion = {
 type: QuestionType;
 label: string;
 options: string[];
 is_required: boolean;
};

/**
 * Save the full survey: meta (title/description/settings) plus the complete
 * ordered list of questions. We replace the question set wholesale (delete +
 * re-insert) which keeps the client simple — the editor always submits the
 * authoritative state as a single JSON blob.
 */
export async function saveSurvey(
 _prev: SurveyActionState,
 formData: FormData
): Promise<SurveyActionState> {
 const supabase = await createClient();

 const workspace = await getActiveWorkspace();
 if (!workspace) return { ok: false, error: "No active workspace." };
 if (workspace.role !== "owner" && workspace.role !== "admin") {
  return { ok: false, error: "You don't have permission to edit surveys." };
 }

 const id = String(formData.get("id") ?? "");
 if (!id) return { ok: false, error: "Missing survey id." };

 const title = String(formData.get("title") ?? "").trim();
 if (!title) return { ok: false, error: "Please enter a title." };

 const description = String(formData.get("description") ?? "").trim() || null;
 const requireEmail = formData.get("require_email") === "true";

 // Confirm ownership.
 const { data: survey } = await supabase
  .from("surveys")
  .select("id, workspace_id")
  .eq("id", id)
  .eq("workspace_id", workspace.id)
  .single();
 if (!survey) return { ok: false, error: "Survey not found." };

 // Parse the questions payload.
 let questions: IncomingQuestion[] = [];
 try {
  const raw = JSON.parse(String(formData.get("questions") ?? "[]"));
  if (Array.isArray(raw)) {
   questions = raw
    .map((q): IncomingQuestion | null => {
     const type = String(q?.type) as QuestionType;
     const label = String(q?.label ?? "").trim();
     if (!label) return null;
     const opts = Array.isArray(q?.options)
      ? q.options.map((o: unknown) => String(o).trim()).filter(Boolean)
      : [];
     return {
      type,
      label,
      options: isChoiceType(type) ? opts : [],
      is_required: Boolean(q?.is_required),
     };
    })
    .filter((q): q is IncomingQuestion => q !== null);
  }
 } catch {
  return { ok: false, error: "Could not parse questions." };
 }

 // Hobby plan limit: at most PLAN_LIMITS.maxQuestionsPerSurvey questions.
 const subscription = await getWorkspaceSubscription(workspace.id);
 if (
  !hasStartupPlan(subscription) &&
  questions.length > PLAN_LIMITS.maxQuestionsPerSurvey
 ) {
  return {
   ok: false,
   error: `The Hobby plan is limited to ${PLAN_LIMITS.maxQuestionsPerSurvey} questions per survey. Upgrade to the Startup plan for unlimited questions.`,
  };
 }

 // Update survey meta.

 const { error: updErr } = await supabase
  .from("surveys")
  .update({ title, description, require_email: requireEmail })
  .eq("id", id)
  .eq("workspace_id", workspace.id);
 if (updErr) return { ok: false, error: updErr.message };

 // Replace the question set wholesale.
 await supabase.from("survey_questions").delete().eq("survey_id", id);

 if (questions.length > 0) {
  const rows = questions.map((q, i) => ({
   survey_id: id,
   type: q.type,
   label: q.label,
   options: q.options,
   is_required: q.is_required,
   position: i,
  }));
  const { error: insErr } = await supabase
   .from("survey_questions")
   .insert(rows);
  if (insErr) return { ok: false, error: insErr.message };
 }

 revalidatePath(`/dashboard/surveys/${id}`);
 revalidatePath("/dashboard/surveys");
 return { ok: true };
}

/**
 * Flip a survey's published state. Publishing makes the public link live.
 */
export async function setSurveyPublished(
 _prev: SurveyActionState,
 formData: FormData
): Promise<SurveyActionState> {
 const supabase = await createClient();

 const workspace = await getActiveWorkspace();
 if (!workspace) return { ok: false, error: "No active workspace." };
 if (workspace.role !== "owner" && workspace.role !== "admin") {
  return { ok: false, error: "You don't have permission." };
 }

 const id = String(formData.get("id") ?? "");
 const publish = formData.get("publish") === "true";
 if (!id) return { ok: false, error: "Missing survey id." };

 const { error } = await supabase
  .from("surveys")
  .update({ is_published: publish })
  .eq("id", id)
  .eq("workspace_id", workspace.id);

 if (error) return { ok: false, error: error.message };

 revalidatePath(`/dashboard/surveys/${id}`);
 revalidatePath("/dashboard/surveys");
 return { ok: true };
}

export async function deleteSurvey(
 _prev: SurveyActionState,
 formData: FormData
): Promise<SurveyActionState> {
 const supabase = await createClient();

 const workspace = await getActiveWorkspace();
 if (!workspace) return { ok: false, error: "No active workspace." };
 if (workspace.role !== "owner" && workspace.role !== "admin") {
  return { ok: false, error: "You don't have permission." };
 }

 const id = String(formData.get("id") ?? "");
 if (!id) return { ok: false, error: "Missing survey id." };

 const { error } = await supabase
  .from("surveys")
  .delete()
  .eq("id", id)
  .eq("workspace_id", workspace.id);

 if (error) return { ok: false, error: error.message };

 revalidatePath("/dashboard/surveys");
 redirect("/dashboard/surveys");
}

export type SubmitState = {
 ok: boolean;
 error?: string;
};

/**
 * Public form submission. Validates required questions + email setting, then
 * writes a response row plus one answer row per question. Uses the admin client
 * so anonymous visitors can submit without broad INSERT policies.
 */
export async function submitSurveyResponse(
 _prev: SubmitState,
 formData: FormData
): Promise<SubmitState> {
 const surveyId = String(formData.get("survey_id") ?? "");
 if (!surveyId) return { ok: false, error: "Missing survey." };

 const admin = createAdminClient();

 // Load the survey + questions (must be published).
 const { data: survey } = await admin
  .from("surveys")
  .select("id, require_email, is_published")
  .eq("id", surveyId)
  .single();

 if (!survey || !survey.is_published) {
  return { ok: false, error: "This form is not accepting responses." };
 }

 const { data: questionsRaw } = await admin
  .from("survey_questions")
  .select("id, type, is_required")
  .eq("survey_id", surveyId)
  .order("position", { ascending: true });

 const questions = questionsRaw ?? [];

 const email = String(formData.get("email") ?? "").trim();
 if (survey.require_email && !email) {
  return { ok: false, error: "Email is required." };
 }

 // Collect + validate answers.
 const answers: { question_id: string; value: string | null }[] = [];
 for (const q of questions) {
  if (q.type === "checkboxes") {
   const selected = formData.getAll(`q_${q.id}`).map((v) => String(v));
   if (q.is_required && selected.length === 0) {
    return { ok: false, error: "Please answer all required questions." };
   }
   answers.push({
    question_id: q.id,
    value: selected.length ? JSON.stringify(selected) : null,
   });
  } else {
   const value = String(formData.get(`q_${q.id}`) ?? "").trim();
   if (q.is_required && !value) {
    return { ok: false, error: "Please answer all required questions." };
   }
   answers.push({ question_id: q.id, value: value || null });
  }
 }

 // Insert the response, then its answers.
 const { data: response, error: respErr } = await admin
  .from("survey_responses")
  .insert({ survey_id: surveyId, email: email || null })
  .select("id")
  .single();

 if (respErr || !response) {
  return { ok: false, error: respErr?.message ?? "Could not save response." };
 }

 if (answers.length > 0) {
  const rows = answers.map((a) => ({ ...a, response_id: response.id }));
  const { error: ansErr } = await admin.from("survey_answers").insert(rows);
  if (ansErr) return { ok: false, error: ansErr.message };
 }

 return { ok: true };
}
