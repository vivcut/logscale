import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Auth callback handler.
 * Exchanges the Supabase authorization `code` (from OAuth or a magic link)
 * for a session, then redirects the user onward to the dashboard.
 *
 * After exchanging the code, if the user's profile has no name yet, we
 * attempt to populate it from OAuth metadata (e.g. Google full_name).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Attempt to backfill the profile name from OAuth user_metadata.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const admin = createAdminClient();
          const { data: profile } = await admin
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", user.id)
            .single();

          const updates: Record<string, string> = {};
          const metaName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            null;
          const metaAvatar = user.user_metadata?.avatar_url ?? null;

          if (!profile?.name && metaName) {
            updates.name = metaName;
          }
          if (!profile?.avatar_url && metaAvatar) {
            updates.avatar_url = metaAvatar;
          }

          if (Object.keys(updates).length > 0) {
            await admin
              .from("profiles")
              .update(updates)
              .eq("id", user.id);
          }
        }
      } catch {
        // Non-fatal — continue with redirect.
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${next}`);
      }
    }
  }

  // On failure, return the user to an error state on the login page.
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login?error=auth_callback_failed`);
}
