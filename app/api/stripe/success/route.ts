import { requireUser } from "@/lib/auth";
import { billingEnabled } from "@/lib/env.server";
import { seeOther } from "@/lib/http";
import { stripe, syncSubscription } from "@/lib/stripe";

/**
 * Stripe redirects here after a successful checkout. We sync the subscription
 * right away so Premium is active on the next page, without waiting for the
 * webhook (which still arrives and is handled idempotently).
 */
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  const user = await requireUser();
  if (billingEnabled && sessionId && user) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (customer && session.client_reference_id === user.id) await syncSubscription(customer);
    } catch (e) {
      console.error("[stripe] success sync failed", e);
    }
  }
  return seeOther(req, "/account?welcome=1");
}
