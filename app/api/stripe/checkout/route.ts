import type Stripe from "stripe";
import { getEntitlement, requireUser } from "@/lib/auth";
import { billingEnabled, serverEnv } from "@/lib/env.server";
import { originOf, sameOrigin, seeOther } from "@/lib/http";
import { getOrCreateCustomer, priceIdFor, stripe, type Interval } from "@/lib/stripe";

/**
 * Starts Stripe Checkout for the monthly or yearly plan.
 * Called by a plain <form method="post">, so it answers with redirects.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  if (!billingEnabled) return seeOther(req, "/pricing");

  const user = await requireUser();
  if (!user) return seeOther(req, "/login?next=/pricing");

  // Already subscribed: send them to manage the existing subscription instead.
  if ((await getEntitlement()).premium) return seeOther(req, "/account");

  const form = await req.formData().catch(() => null);
  const interval: Interval = form?.get("interval") === "month" ? "month" : "year";
  const origin = originOf(req);

  try {
    const customer = await getOrCreateCustomer(user);
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: priceIdFor(interval), quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "auto",
      subscription_data: {
        metadata: { user_id: user.id },
        ...(serverEnv.trialDays > 0 ? { trial_period_days: serverEnv.trialDays } : {}),
      },
      success_url: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    };
    if (serverEnv.automaticTax) {
      params.automatic_tax = { enabled: true };
      params.customer_update = { address: "auto", name: "auto" };
    }
    const session = await stripe().checkout.sessions.create(params);
    if (!session.url) throw new Error("Checkout session has no URL");
    return seeOther(req, session.url);
  } catch (e) {
    console.error("[stripe] checkout failed", e);
    return seeOther(req, "/pricing?checkout=error");
  }
}
