import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback handler.
 * Exchanges the Supabase authorization `code` (from OAuth or a magic link)
 * for a session, then redirects the user onward to the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
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
