import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/upvotes
 * Body: { postId }
 * Toggles an upvote for the current logged-in user.
 * Anonymous upvoting is no longer allowed — users must sign in.
 *
 * The actual upvotes_count on public.posts is maintained atomically by the
 * `on_upvote_change` Postgres trigger (see supabase/upvote_counters.sql),
 * which uses `upvotes_count = upvotes_count +/- 1` to avoid race conditions.
 */
export async function POST(request: NextRequest) {
  let body: { postId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const postId = body.postId;

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to upvote. Please sign in or create an account." },
      { status: 401 }
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

  // Find an existing vote for this user.
  const { data: existing } = await admin
    .from("upvotes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

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
      user_id: user.id,
      fingerprint_hash: null,
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
