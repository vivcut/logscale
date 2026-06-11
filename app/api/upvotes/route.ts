import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/upvotes
 * Body: { postId, fingerprint }
 * Toggles an upvote for the current visitor.
 *  - Logged-in users are tracked by user_id.
 *  - Anonymous visitors are tracked by their device fingerprint hash.
 *
 * The actual upvotes_count on public.posts is maintained atomically by the
 * `on_upvote_change` Postgres trigger (see supabase/upvote_counters.sql),
 * which uses `upvotes_count = upvotes_count +/- 1` to avoid race conditions.
 */
export async function POST(request: NextRequest) {
  let body: { postId?: string; fingerprint?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const postId = body.postId;
  const fingerprint = body.fingerprint?.trim() || null;

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user && !fingerprint) {
    return NextResponse.json(
      { error: "Missing visitor identity." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Ensure the post exists.
  const { data: post, error: postError } = await admin
    .from("posts")
    .select("id")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Find an existing vote for this identity.
  let existingQuery = admin.from("upvotes").select("id").eq("post_id", postId);
  existingQuery = user
    ? existingQuery.eq("user_id", user.id)
    : existingQuery.is("user_id", null).eq("fingerprint_hash", fingerprint!);

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    // Toggle OFF — remove the vote. Trigger decrements the count.
    const { error } = await admin
      .from("upvotes")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Toggle ON — insert a vote. Trigger increments the count.
    const { error } = await admin.from("upvotes").insert({
      post_id: postId,
      user_id: user?.id ?? null,
      fingerprint_hash: user ? null : fingerprint,
    });

    if (error) {
      // Unique violation = a concurrent insert already created the vote.
      if (error.code !== "23505") {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  // Return the fresh, authoritative count maintained by the trigger.
  const { data: fresh } = await admin
    .from("posts")
    .select("upvotes_count")
    .eq("id", postId)
    .single();

  return NextResponse.json({
    voted: !existing,
    upvotes_count: fresh?.upvotes_count ?? 0,
  });
}
