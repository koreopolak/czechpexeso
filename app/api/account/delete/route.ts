import { requireUser } from "@/lib/auth";
import { billingEnabled } from "@/lib/env.server";
import { sameOrigin, seeOther } from "@/lib/http";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

/**
 * Deletes the account (GDPR "right to erasure"): cancels any active
 * subscription, then deletes the auth user — profile and cloud progress are
 * removed by ON DELETE CASCADE. The Stripe customer and invoices are kept,
 * since accounting law requires keeping billing records.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const user = await requireUser();
  const db = supabaseAdmin();
  if (!user || !db) return seeOther(req, "/login");

  try {
    const { data } = await db.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    const customer = data?.stripe_customer_id as string | undefined;
    if (billingEnabled && customer) {
      const subs = await stripe().subscriptions.list({ customer, status: "all", limit: 20 });
      for (const s of subs.data) {
        if (!["canceled", "incomplete_expired"].includes(s.status)) await stripe().subscriptions.cancel(s.id);
      }
    }
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (e) {
    console.error("[account] delete failed", e);
    return seeOther(req, "/account?error=delete");
  }

  // Clear the session cookies.
  await (await supabaseServer())?.auth.signOut();
  return seeOther(req, "/");
}
