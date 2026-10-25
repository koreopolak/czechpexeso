import { requireUser } from "@/lib/auth";
import { billingEnabled } from "@/lib/env.server";
import { sameOrigin, seeOther } from "@/lib/http";
import { customerIdForUser, portalUrl } from "@/lib/paddle";

/** Opens the Paddle customer portal (invoices, payment method, cancel). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  if (!billingEnabled) return seeOther(req, "/account");
  const user = await requireUser();
  if (!user) return seeOther(req, "/login?next=/account");

  const customer = await customerIdForUser(user.id);
  if (!customer) return seeOther(req, "/pricing");

  try {
    return seeOther(req, await portalUrl(customer));
  } catch (e) {
    console.error("[paddle] portal failed", e);
    return seeOther(req, "/account");
  }
}
