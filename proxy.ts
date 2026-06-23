import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed `middleware` to `proxy`. This runs on every matched
// request to keep the Supabase auth session fresh and guard dashboard routes.
export async function proxy(request: NextRequest) {
 return await updateSession(request);
}

export const config = {
 matcher: [
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico, sitemap.xml, robots.txt (metadata files)
   * - public assets (svg, png, jpg, jpeg, gif, webp, ico, webmanifest)
   */
  "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
 ],
};
