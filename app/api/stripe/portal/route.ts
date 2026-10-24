import { requireUser } from "@/lib/auth";
import { billingEnabled } from "@/lib/env.server";
import { originOf, sameOrigin, seeOther } from "@/lib/http";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Opens the Stripe Customer Portal (change plan, card, invoices, cancel). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  if (!billingEnabled) return seeOther(req, "/account");
  const user = await requireUser();
  if (!user) return seeOther(req, "/login?next=/account");

  const { data } = (await supabaseAdmin()?.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle()) ?? {};
  const customer = data?.stripe_customer_id as string | undefined;
  if (!customer) return seeOther(req, "/pricing");

  try {
    const session = await stripe().billingPortal.sessions.create({ customer, return_url: `${originOf(req)}/account` });
    return seeOther(req, session.url);
  } catch (e) {
    console.error("[stripe] portal failed", e);
    return seeOther(req, "/account");
  }
}
