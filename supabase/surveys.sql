-- =============================================================================
-- Surveys / Forms
-- =============================================================================
-- Lets a workspace build forms (surveys) with custom questions — short text,
-- long text, single-choice (MCQ) and multi-choice (checkboxes). When published,
-- each form gets a public link anyone can answer. Responses flow back into the
-- dashboard for analysis.
--
-- Tables:
--  surveys      — the form itself (title, description, slug, settings)
--  survey_questions  — ordered questions, each with a type + options + required
--  survey_responses  — one submission (optional email)
--  survey_answers   — a single answer to a single question
--
-- Run in the Supabase SQL Editor. Safe to re-run.
-- =============================================================================

-- 1. surveys -------------------------------------------------------------------
create table if not exists public.surveys (
 id uuid default gen_random_uuid() primary key,
 workspace_id uuid references public.workspaces (id) on delete cascade not null,
 title text not null,
 description text,
 slug text not null,
 -- When true the public link accepts responses.
 is_published boolean default false not null,
 -- Whether respondents must provide an email address.
 require_email boolean default false not null,
 created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 unique (workspace_id, slug)
);

create index if not exists surveys_workspace_idx
 on public.surveys (workspace_id, created_at desc);

-- 2. survey_questions ----------------------------------------------------------
create table if not exists public.survey_questions (
 id uuid default gen_random_uuid() primary key,
 survey_id uuid references public.surveys (id) on delete cascade not null,
 -- 'short_text' | 'long_text' | 'multiple_choice' | 'checkboxes'
 type text check (
  type in ('short_text', 'long_text', 'multiple_choice', 'checkboxes')
 ) default 'short_text' not null,
 label text not null,
 -- Choice options for multiple_choice / checkboxes questions.
 options jsonb default '[]'::jsonb not null,
 is_required boolean default false not null,
 position integer default 0 not null,
 created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists survey_questions_survey_idx
 on public.survey_questions (survey_id, position);

-- 3. survey_responses ----------------------------------------------------------
create table if not exists public.survey_responses (
 id uuid default gen_random_uuid() primary key,
 survey_id uuid references public.surveys (id) on delete cascade not null,
 email text,
 created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists survey_responses_survey_idx
 on public.survey_responses (survey_id, created_at desc);

-- 4. survey_answers ------------------------------------------------------------
create table if not exists public.survey_answers (
 id uuid default gen_random_uuid() primary key,
 response_id uuid references public.survey_responses (id) on delete cascade not null,
 question_id uuid references public.survey_questions (id) on delete cascade not null,
 -- Free-text answer, OR a JSON-encoded array of selected options for
 -- checkbox-style questions. The app decodes based on the question type.
 value text,
 created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists survey_answers_response_idx
 on public.survey_answers (response_id);
create index if not exists survey_answers_question_idx
 on public.survey_answers (question_id);

-- 5. Row Level Security --------------------------------------------------------
alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_answers enable row level security;

-- surveys: members can view, owners/admins can write.
drop policy if exists "surveys_select_member" on public.surveys;
create policy "surveys_select_member"
 on public.surveys for select
 using (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = surveys.workspace_id
    and m.profile_id = auth.uid()
  )
 );

drop policy if exists "surveys_write_admin" on public.surveys;
create policy "surveys_write_admin"
 on public.surveys for all
 using (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = surveys.workspace_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 )
 with check (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = surveys.workspace_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 );

-- survey_questions: gated through the parent survey's workspace membership.
drop policy if exists "survey_questions_select_member" on public.survey_questions;
create policy "survey_questions_select_member"
 on public.survey_questions for select
 using (
  exists (
   select 1
   from public.surveys s
   join public.workspace_members m on m.workspace_id = s.workspace_id
   where s.id = survey_questions.survey_id
    and m.profile_id = auth.uid()
  )
 );

drop policy if exists "survey_questions_write_admin" on public.survey_questions;
create policy "survey_questions_write_admin"
 on public.survey_questions for all
 using (
  exists (
   select 1
   from public.surveys s
   join public.workspace_members m on m.workspace_id = s.workspace_id
   where s.id = survey_questions.survey_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 )
 with check (
  exists (
   select 1
   from public.surveys s
   join public.workspace_members m on m.workspace_id = s.workspace_id
   where s.id = survey_questions.survey_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 );

-- survey_responses: members of the owning workspace can view (for analysis).
drop policy if exists "survey_responses_select_member" on public.survey_responses;
create policy "survey_responses_select_member"
 on public.survey_responses for select
 using (
  exists (
   select 1
   from public.surveys s
   join public.workspace_members m on m.workspace_id = s.workspace_id
   where s.id = survey_responses.survey_id
    and m.profile_id = auth.uid()
  )
 );

-- survey_answers: same workspace gating via the response → survey chain.
drop policy if exists "survey_answers_select_member" on public.survey_answers;
create policy "survey_answers_select_member"
 on public.survey_answers for select
 using (
  exists (
   select 1
   from public.survey_responses r
   join public.surveys s on s.id = r.survey_id
   join public.workspace_members m on m.workspace_id = s.workspace_id
   where r.id = survey_answers.response_id
    and m.profile_id = auth.uid()
  )
 );

-- NOTE: public form submission (inserting responses + answers) and public form
-- rendering (reading published surveys + questions) go through the service-role
-- admin client, so anonymous visitors can submit without broad INSERT policies.
