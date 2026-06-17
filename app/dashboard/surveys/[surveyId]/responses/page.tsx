import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Inbox } from "@/components/icons";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import {
 decodeAnswer,
 isChoiceType,
 normalizeQuestion,
 type SurveyQuestion,
} from "@/lib/surveys";

export const metadata = {
 title: "Responses — Pittstop",
};

export default async function ResponsesPage({
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
  .select("id, title")
  .eq("id", surveyId)
  .eq("workspace_id", workspace.id)
  .single();

 if (!survey) notFound();

 const { data: questionsRaw } = await supabase
  .from("survey_questions")
  .select("id, survey_id, type, label, options, is_required, position")
  .eq("survey_id", survey.id)
  .order("position", { ascending: true });

 const questions: SurveyQuestion[] = (questionsRaw ?? []).map(normalizeQuestion);
 const questionById = new Map(questions.map((q) => [q.id, q]));

 // Responses (most recent first).
 const { data: responses } = await supabase
  .from("survey_responses")
  .select("id, email, created_at")
  .eq("survey_id", survey.id)
  .order("created_at", { ascending: false });

 const responseList = responses ?? [];
 const responseIds = responseList.map((r) => r.id);

 // All answers for those responses.
 const answersByResponse = new Map<
  string,
  { question_id: string; value: string | null }[]
 >();
 // Aggregated option tallies for choice questions: questionId -> option -> count.
 const tallies = new Map<string, Map<string, number>>();

 if (responseIds.length > 0) {
  const { data: answers } = await supabase
   .from("survey_answers")
   .select("response_id, question_id, value")
   .in("response_id", responseIds);

  for (const a of answers ?? []) {
   // Per-response grouping.
   const list = answersByResponse.get(a.response_id) ?? [];
   list.push({ question_id: a.question_id, value: a.value });
   answersByResponse.set(a.response_id, list);

   // Choice tallies.
   const q = questionById.get(a.question_id);
   if (q && isChoiceType(q.type)) {
    const decoded = decodeAnswer(q, a.value);
    const bucket = tallies.get(q.id) ?? new Map<string, number>();
    for (const sel of decoded) {
     bucket.set(sel, (bucket.get(sel) ?? 0) + 1);
    }
    tallies.set(q.id, bucket);
   }
  }
 }

 const total = responseList.length;

 return (
  <div className="mx-auto w-full max-w-4xl px-6 py-10">
   <div className="mb-6 flex items-center justify-between gap-4">
    <Link
     href={`/dashboard/surveys/${survey.id}`}
     className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
     <ArrowLeft className="size-3.5" />
     back to editor
    </Link>
   </div>

   <div className="mb-8">
    <p className="font-mono text-xs text-muted-foreground">
     {workspace.name} / surveys / responses
    </p>
    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
     {survey.title}
    </h1>
    <p className="mt-1 text-sm text-muted-foreground">
     {total} {total === 1 ? "response" : "responses"} collected
    </p>
   </div>

   {total === 0 ? (
    <div className="flex flex-col items-center justify-center rounded-xl  border-2 border-border border-dashed py-16 text-center">
     <Inbox className="mb-3 size-5 text-muted-foreground" />
     <h3 className="text-sm font-medium">No responses yet</h3>
     <p className="mt-1 max-w-sm text-sm text-muted-foreground">
      Publish the form and share its link to start collecting answers.
     </p>
    </div>
   ) : (
    <div className="space-y-10">
     {/* Aggregated summary per question */}
     <section className="space-y-4">
      <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
       <BarChart3 className="size-3.5" />
       summary
      </h2>

      {questions.map((q) => {
       const bucket = tallies.get(q.id);
       return (
        <div
         key={q.id}
         className="rounded-xl  border-2 border-border bg-card p-5"
        >
         <h3 className="mb-3 text-sm font-medium">{q.label}</h3>

         {isChoiceType(q.type) ? (
          <div className="space-y-2">
           {q.options.map((opt) => {
            const count = bucket?.get(opt) ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
             <div key={opt}>
              <div className="mb-1 flex items-center justify-between text-xs">
               <span>{opt}</span>
               <span className="font-mono text-muted-foreground">
                {count} · {pct.toFixed(0)}%
               </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
               <div
                className="h-full rounded-full bg-foreground/80"
                style={{ width: `${pct}%` }}
               />
              </div>
             </div>
            );
           })}
          </div>
         ) : (
          <p className="font-mono text-xs text-muted-foreground">
           Free-text question — see individual responses below.
          </p>
         )}
        </div>
       );
      })}
     </section>

     {/* Individual responses */}
     <section className="space-y-4">
      <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
       individual responses
      </h2>

      {responseList.map((r, i) => {
       const answers = answersByResponse.get(r.id) ?? [];
       const answerByQ = new Map(
        answers.map((a) => [a.question_id, a.value])
       );
       return (
        <div
         key={r.id}
         className="rounded-xl  border-2 border-border bg-card p-5"
        >
         <div className="mb-4 flex items-center justify-between gap-2 border-b-2 pb-3">
          <span className="font-mono text-xs text-muted-foreground">
           #{total - i}
           {r.email ? (
            <span className="ml-2 text-foreground">{r.email}</span>
           ) : (
            <span className="ml-2">anonymous</span>
           )}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>

                  <dl className="space-y-3">
                    {questions.map((q) => {
                      const decoded = decodeAnswer(q, answerByQ.get(q.id) ?? null);
                      return (
                        <div key={q.id}>
                          <dt className="text-xs text-muted-foreground">
                            {q.label}
                          </dt>
                          <dd className="mt-0.5 text-sm">
                            {decoded.length ? (
                              decoded.join(", ")
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground/50">
                                — no answer
                              </span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
