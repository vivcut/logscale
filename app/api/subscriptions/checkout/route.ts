import { NextResponse, type NextRequest } from "next/server";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/checkout
 * Body: { interval: "monthly" | "yearly" }
 *
 * Creates a Stripe Checkout Session (mode=subscription) for the Startup plan
 * and returns its URL. The subscription is scoped to the user's ACTIVE
 * workspace — the workspace id is stashed in the session/subscription metadata
 * so the webhook can attribute the payment to the right workspace.
 */
export async function POST(request: NextRequest) {
  let body: { interval?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const interval = body.interval === "yearly" ? "yearly" : "monthly";

  // Amounts are configured as whole US dollars in the env. We build the price
  // inline with `price_data` so there's no need to pre-create Stripe price
  // objects. Stripe expects the amount in cents.
  const dollars = Number(
    interval === "yearly"
      ? process.env.STRIPE_PRICE_YEARLY
      : process.env.STRIPE_PRICE_MONTHLY
  );

  if (!Number.isFinite(dollars) || dollars <= 0) {
    return NextResponse.json(
      { error: "Stripe price is not configured." },
      { status: 500 }
    );
  }

  const unitAmount = Math.round(dollars * 100);
  const recurringInterval = interval === "yearly" ? "year" : "month";


  // Must be signed in and own/admin the workspace to start a checkout.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return NextResponse.json(
      { error: "No active workspace." },
      { status: 400 }
    );
  }
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return NextResponse.json(
      { error: "Only owners or admins can manage billing." },
      { status: 403 }
    );
  }

  // Reuse an existing Stripe customer for this workspace if we have one.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            recurring: { interval: recurringInterval },
            product_data: { name: "Startup plan" },
          },
        },
      ],

      // Reuse the workspace's customer when known, otherwise let Stripe create
      // one and prefill the signed-in user's email.
      ...(existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/subscriptions/plan?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/subscriptions/plan?canceled=1`,
      // Attribute this checkout (and the resulting subscription) to the
      // workspace so the webhook can find it.
      client_reference_id: workspace.id,
      metadata: { workspace_id: workspace.id },
      subscription_data: {
        metadata: { workspace_id: workspace.id },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
