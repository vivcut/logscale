-- =============================================================================
-- Avatars on posts/comments + comment pinning + comment attachments bucket
-- =============================================================================
-- Run in the Supabase SQL Editor AFTER comments_and_authors.sql.
-- Safe to re-run (all statements are idempotent).
-- =============================================================================

-- 1. Add avatar URL to posts (stores poster's profile picture)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_avatar_url text;

-- 2. Add avatar URL and pinning support to comments
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS author_avatar_url text,
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false NOT NULL;

-- 3. Create the comment-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('comment-attachments', 'comment-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Public read policy for comment-attachments bucket
CREATE POLICY "comment_attachments_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comment-attachments');

-- 5. Service-role insert policy for comment-attachments bucket
CREATE POLICY "comment_attachments_service_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comment-attachments');
