import "server-only";

import Stripe from "stripe";
import { FALLBACK_PRICES } from "@/lib/config";
import { billingEnabled, serverEnv } from "@/lib/env.server";
import { supabaseAdmin } from "@/lib/supabase/server";

let client: Stripe | null = null;

/** Lazily created so builds work without Stripe keys. */
export function stripe(): Stripe {
  if (!serverEnv.stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(serverEnv.stripeSecretKey, {
    appInfo: { name: "czechpexeso.net" },
  });
  return client;
}

export type Interval = "month" | "year";
export type PlanPrice = { amount: number; currency: string };

let priceCache: { at: number; value: Record<Interval, PlanPrice> } | null = null;

/** Real prices from Stripe (cached for an hour), or the fallbacks from lib/config.ts. */
export async function getPlanPrices(): Promise<Record<Interval, PlanPrice>> {
  if (!billingEnabled) return FALLBACK_PRICES;
  if (priceCache && Date.now() - priceCache.at < 3600_000) return priceCache.value;
  try {
    const [m, y] = await Promise.all([
      stripe().prices.retrieve(serverEnv.priceMonthly),
      stripe().prices.retrieve(serverEnv.priceYearly),
    ]);
    const value = {
      month: { amount: m.unit_amount ?? FALLBACK_PRICES.month.amount, currency: m.currency },
      year: { amount: y.unit_amount ?? FALLBACK_PRICES.year.amount, currency: y.currency },
    };
    priceCache = { at: Date.now(), value };
    return value;
  } catch (e) {
    console.error("[stripe] could not load prices", e);
    return FALLBACK_PRICES;
  }
}

export function priceIdFor(interval: Interval) {
  return interval === "year" ? serverEnv.priceYearly : serverEnv.priceMonthly;
}

/** Returns the user's Stripe customer id, creating the customer the first time. */
export async function getOrCreateCustomer(user: { id: string; email: string }): Promise<string> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase service key is not set");
  const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id as string;

  const customer = await stripe().customers.create(
    { email: user.email, metadata: { user_id: user.id } },
    // Two quick clicks must not create two customers.
    { idempotencyKey: `customer-${user.id}` },
  );
  const { error } = await db
    .from("profiles")
    .upsert({ id: user.id, email: user.email, stripe_customer_id: customer.id, updated_at: new Date().toISOString() });
  if (error) throw error;
  return customer.id;
}

const STATUS_RANK: Record<string, number> = { active: 0, trialing: 1, past_due: 2, unpaid: 3, paused: 4, incomplete: 5 };

/**
 * Copies the customer's current subscription from Stripe to their profile.
 * Called from webhooks and right after checkout. Reading the latest state from
 * Stripe (instead of trusting event payloads) makes out-of-order or repeated
 * webhooks harmless.
 */
export async function syncSubscription(customerId: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase service key is not set");

  const list = await stripe().subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  const sub = list.data
    .slice()
    .sort((a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) || b.created - a.created)[0];
  const item = sub?.items.data[0];
  const periodEnd = sub?.cancel_at ?? item?.current_period_end ?? null;

  const row = {
    stripe_subscription_id: sub?.id ?? null,
    subscription_status: sub?.status ?? null,
    subscription_price_id: item?.price.id ?? null,
    subscription_interval: item?.price.recurring?.interval ?? null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub && (sub.cancel_at_period_end || sub.cancel_at)),
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await db.from("profiles").update(row).eq("stripe_customer_id", customerId).select("id");
  if (error) throw error;
  if (updated && updated.length > 0) return;

  // Customer not linked yet (e.g. created in the Dashboard): use its metadata.
  const customer = await stripe().customers.retrieve(customerId);
  const userId = !customer.deleted ? customer.metadata?.user_id : undefined;
  if (!userId) {
    console.warn(`[stripe] no profile for customer ${customerId}`);
    return;
  }
  const { error: linkError } = await db.from("profiles").update({ ...row, stripe_customer_id: customerId }).eq("id", userId);
  if (linkError) throw linkError;
}
