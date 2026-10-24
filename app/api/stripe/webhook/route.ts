import type Stripe from "stripe";
import { serverEnv } from "@/lib/env.server";
import { stripe, syncSubscription } from "@/lib/stripe";

/**
 * Stripe webhook endpoint: https://czechpexeso.net/api/stripe/webhook
 * Every relevant event just re-syncs that customer's subscription from Stripe,
 * so retries, duplicates and out-of-order delivery are all harmless.
 */
const EVENTS = new Set<string>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
]);

function customerOf(event: Stripe.Event): string | null {
  const obj = event.data.object as { customer?: string | { id: string } | null };
  if (!obj.customer) return null;
  return typeof obj.customer === "string" ? obj.customer : obj.customer.id;
}

export async function POST(req: Request) {
  if (!serverEnv.stripeSecretKey || !serverEnv.stripeWebhookSecret) {
    return new Response("Stripe is not configured", { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    // The raw body is required for signature verification.
    event = await stripe().webhooks.constructEventAsync(await req.text(), signature, serverEnv.stripeWebhookSecret);
  } catch (e) {
    console.warn("[stripe] bad webhook signature", e instanceof Error ? e.message : e);
    return new Response("Invalid signature", { status: 400 });
  }

  if (EVENTS.has(event.type)) {
    const customer = customerOf(event);
    if (customer) {
      try {
        await syncSubscription(customer);
      } catch (e) {
        console.error(`[stripe] sync failed for ${event.type}`, e);
        // 500 makes Stripe retry later.
        return new Response("Sync failed", { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
