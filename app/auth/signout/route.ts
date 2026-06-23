import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Signs the current user out and returns them to the login page.
 * Accepts an optional `next` query param so that after logging back in,
 * the user is redirected to where they were.
 */
async function handleSignOut(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "";
  const brand = url.searchParams.get("brand") || "";
  const watermark = url.searchParams.get("watermark") || "";
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const loginParams = new URLSearchParams();
  if (next) loginParams.set("next", next);
  if (brand) loginParams.set("brand", brand);
  if (watermark) loginParams.set("watermark", watermark);

  const qs = loginParams.toString();
  const loginUrl = qs ? `${base}/login?${qs}` : `${base}/login`;

  return NextResponse.redirect(loginUrl, { status: 302 });
}

export async function GET(request: NextRequest) {
  return handleSignOut(request);
}

export async function POST(request: NextRequest) {
  return handleSignOut(request);
}
