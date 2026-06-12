import Stripe from "stripe";

/**
 * Server-side Stripe client. Initialized from STRIPE_SECRET_KEY.
 * Never import this into client code — it carries your secret key.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  // Pin a recent API version so behaviour is stable across SDK upgrades.
  apiVersion: "2026-05-27.dahlia",

  typescript: true,
});
