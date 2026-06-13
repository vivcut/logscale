import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Signs the current user out and returns them to the login page.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`, { status: 302 });
}
