import { requireUser } from "@/lib/auth";
import { billingEnabled } from "@/lib/env.server";
import { sameOrigin, seeOther } from "@/lib/http";
import { cancelSubscriptionsNow } from "@/lib/paddle";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

/**
 * Deletes the account (GDPR "right to erasure"): cancels any active
 * subscription, then deletes the auth user — profile and cloud progress are
 * removed by ON DELETE CASCADE. The Paddle customer and invoices are kept,
 * since accounting law requires keeping billing records.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const user = await requireUser();
  const db = supabaseAdmin();
  if (!user || !db) return seeOther(req, "/login");

  try {
    const { data } = await db.from("profiles").select("paddle_customer_id").eq("id", user.id).maybeSingle();
    const customer = data?.paddle_customer_id as string | undefined;
    if (billingEnabled && customer) await cancelSubscriptionsNow(customer);
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
