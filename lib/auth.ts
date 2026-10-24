import "server-only";

import { cache } from "react";
import { authEnabled } from "@/lib/env";
import { billingEnabled, serverEnv } from "@/lib/env.server";
import { supabaseServer } from "@/lib/supabase/server";
import type { Entitlement, SubscriptionInfo } from "@/lib/types";

/**
 * Subscription statuses that grant Premium. `past_due` keeps access while
 * Stripe retries a failed payment (Smart Retries); Stripe then moves the
 * subscription to `canceled` or `unpaid`, which removes access.
 */
export const PREMIUM_STATUSES = ["active", "trialing", "past_due"];

type ProfileRow = {
  subscription_status: string | null;
  subscription_interval: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export function isPremiumProfile(p: ProfileRow | null | undefined): boolean {
  if (!p?.subscription_status || !PREMIUM_STATUSES.includes(p.subscription_status)) return false;
  // Safety net in case a webhook was missed: allow a 3-day grace after the period ends.
  if (p.current_period_end && Date.parse(p.current_period_end) + 3 * 86400_000 < Date.now()) return false;
  return true;
}

/** Who is signed in, and are they Premium? Cached per request. */
export const getEntitlement = cache(async (): Promise<Entitlement> => {
  const base: Entitlement = { authEnabled, billingEnabled, user: null, premium: serverEnv.devPremium, subscription: null };
  const supabase = await supabaseServer();
  if (!supabase) return base;

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return base;

  const user = { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_interval, current_period_end, cancel_at_period_end")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const subscription: SubscriptionInfo | null = profile?.subscription_status
    ? {
        status: profile.subscription_status,
        interval: profile.subscription_interval === "year" ? "year" : profile.subscription_interval === "month" ? "month" : null,
        currentPeriodEnd: profile.current_period_end,
        cancelAtPeriodEnd: Boolean(profile.cancel_at_period_end),
      }
    : null;

  return { ...base, user, subscription, premium: base.premium || isPremiumProfile(profile) };
});

/** Verified user for route handlers (asks the auth server, not just the cookie). */
export async function requireUser() {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
}
