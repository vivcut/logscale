import { NextResponse, type NextRequest } from "next/server";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { getWorkspaceSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/portal
 *
 * Creates a Stripe Billing Portal session for the active workspace's customer
 * so the owner/admin can manage (update card, cancel, view invoices) their
 * Startup subscription, then returns its URL for the client to redirect to.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return NextResponse.json({ error: "No active workspace." }, { status: 400 });
  }
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return NextResponse.json(
      { error: "Only owners or admins can manage billing." },
      { status: 403 }
    );
  }

  const subscription = await getWorkspaceSubscription(workspace.id);
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No subscription to manage yet." },
      { status: 400 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/subscriptions/plan`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
