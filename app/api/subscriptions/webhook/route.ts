import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe signature verification requires the raw, unparsed request body, so
// this handler must run on the Node runtime and never be cached/prerendered.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/webhook
 *
 * Receives Stripe events and keeps the workspace's subscription row in sync.
 *  - checkout.session.completed   → grant the Startup plan (active).
 *  - customer.subscription.updated → mirror Stripe's status.
 *  - customer.subscription.deleted → revoke (fall back to free).
 *
 * Uses the service-role Supabase client (bypasses RLS) because there's no user
 * session on a webhook request.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // IMPORTANT: read the raw text body for signature verification.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      secret
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Signature verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId =
          session.metadata?.workspace_id ??
          session.client_reference_id ??
          null;

        if (!workspaceId) break;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        // Pull the period end from the subscription when available.
        let currentPeriodEnd: string | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const end = (sub as unknown as { current_period_end?: number })
            .current_period_end;
          if (typeof end === "number") {
            currentPeriodEnd = new Date(end * 1000).toISOString();
          }
        }

        await admin.from("subscriptions").upsert(
          {
            workspace_id: workspaceId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: "active",
            plan_tier: "startup",
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "workspace_id" }
        );
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = sub.metadata?.workspace_id ?? null;
        const end = (sub as unknown as { current_period_end?: number })
          .current_period_end;
        const currentPeriodEnd =
          typeof end === "number"
            ? new Date(end * 1000).toISOString()
            : null;

        // An active/trialing subscription keeps the Startup plan; anything else
        // (past_due, unpaid, canceled, incomplete...) loses it.
        const active = sub.status === "active" || sub.status === "trialing";

        const query = admin
          .from("subscriptions")
          .update({
            status: sub.status,
            plan_tier: active ? "startup" : "free",
            current_period_end: currentPeriodEnd,
          });

        if (workspaceId) {
          await query.eq("workspace_id", workspaceId);
        } else {
          await query.eq("stripe_subscription_id", sub.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Subscription revoked / cancelled — remove the Startup plan.
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = sub.metadata?.workspace_id ?? null;

        const query = admin
          .from("subscriptions")
          .update({ status: "canceled", plan_tier: "free" });

        if (workspaceId) {
          await query.eq("workspace_id", workspaceId);
        } else {
          await query.eq("stripe_subscription_id", sub.id);
        }
        break;
      }

      default:
        // Ignore unrelated events.
        break;
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
