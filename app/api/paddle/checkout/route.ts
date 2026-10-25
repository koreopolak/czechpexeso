import { getEntitlement, requireUser } from "@/lib/auth";
import { isPlan } from "@/lib/billing";
import { FEATURES } from "@/lib/config";
import { billingEnabled } from "@/lib/env.server";
import { sameOrigin } from "@/lib/http";
import { createCheckoutTransaction } from "@/lib/paddle";

/**
 * Creates the Paddle transaction for a plan; the pricing page then opens it in
 * Paddle Checkout (an overlay on our own page).
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  if (!billingEnabled || !FEATURES.premiumForSale) return Response.json({ error: "disabled" }, { status: 503 });

  const user = await requireUser();
  if (!user) return Response.json({ redirect: "/login?next=/pricing" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { plan?: unknown } | null;
  const plan = isPlan(body?.plan) ? body.plan : "year";

  // Already Premium: manage the existing plan instead. A subscriber may still
  // switch to lifetime (the subscription then stops renewing).
  const ent = await getEntitlement();
  if (ent.lifetime || (ent.premium && plan !== "lifetime")) return Response.json({ redirect: "/account" }, { status: 409 });

  try {
    return Response.json(await createCheckoutTransaction(user.id, plan));
  } catch (e) {
    console.error("[paddle] checkout failed", e);
    return Response.json({ error: "checkout" }, { status: 500 });
  }
}
