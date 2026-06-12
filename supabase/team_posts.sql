-- Team-authored posts.
-- Posts created by a signed-in workspace member (owner / admin / invited editor)
-- are flagged so the public board + post page can show a verified "team" badge,
-- mirroring the existing `comments.is_official` behaviour.

alter table public.posts
  add column if not exists is_official boolean default false not null;
