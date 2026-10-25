import "server-only";

import { Environment, Paddle, type CountryCode } from "@paddle/paddle-node-sdk";
import { hasLifetime, pickSubscription, PLANS, subscriptionRow, type Plan, type PlanPrices } from "@/lib/billing";
import { FALLBACK_PRICES } from "@/lib/config";
import { publicEnv } from "@/lib/env";
import { billingEnabled, serverEnv } from "@/lib/env.server";
import { supabaseAdmin } from "@/lib/supabase/server";

let client: Paddle | null = null;

/** Lazily created so builds work without Paddle keys. */
export function paddle(): Paddle {
  if (!serverEnv.paddleApiKey) throw new Error("PADDLE_API_KEY is not set");
  client ??= new Paddle(serverEnv.paddleApiKey, {
    environment: publicEnv.paddleEnv === "sandbox" ? Environment.sandbox : Environment.production,
  });
  return client;
}

export function priceIdFor(plan: Plan): string {
  return plan === "lifetime" ? serverEnv.priceLifetime : plan === "year" ? serverEnv.priceYearly : serverEnv.priceMonthly;
}

/** Statuses of a subscription that still bills the customer. */
const LIVE_STATUSES = ["active", "trialing", "past_due", "paused"] as const;

const priceCache = new Map<string, { at: number; value: PlanPrices }>();

/**
 * Prices for a visitor's country, as Paddle will charge them (local currency
 * from the price overrides, tax included). Cached per country for an hour;
 * falls back to the amounts in lib/config.ts.
 */
export async function getPlanPrices(country?: string | null): Promise<PlanPrices> {
  if (!billingEnabled) return FALLBACK_PRICES;
  // Without a country (local dev), price as for the Czech Republic.
  const code = country && /^[A-Z]{2}$/.test(country) ? country : "CZ";
  const cached = priceCache.get(code);
  if (cached && Date.now() - cached.at < 3600_000) return cached.value;
  try {
    const previews = await Promise.all(
      PLANS.map((plan) =>
        paddle().pricingPreview.preview({
          items: [{ priceId: priceIdFor(plan), quantity: 1 }],
          address: { countryCode: code as CountryCode },
        }),
      ),
    );
    const value = Object.fromEntries(
      PLANS.map((plan, i) => {
        const line = previews[i].details.lineItems[0];
        if (!line) throw new Error(`No preview for ${plan}`);
        return [plan, { amount: Number(line.unitTotals.total), currency: previews[i].currencyCode.toLowerCase() }];
      }),
    ) as PlanPrices;
    priceCache.set(code, { at: Date.now(), value });
    return value;
  } catch (e) {
    // Countries Paddle can't sell to end up here too.
    console.error(`[paddle] could not load prices for ${code}`, e);
    return FALLBACK_PRICES;
  }
}

export async function customerIdForUser(userId: string): Promise<string | null> {
  const { data } = (await supabaseAdmin()?.from("profiles").select("paddle_customer_id").eq("id", userId).maybeSingle()) ?? {};
  return (data?.paddle_customer_id as string | null | undefined) ?? null;
}

/**
 * Creates the transaction that Paddle Checkout opens. The user id goes in
 * custom data so webhooks can link the Paddle customer to this account;
 * returning customers keep their existing Paddle customer.
 */
export async function createCheckoutTransaction(userId: string, plan: Plan) {
  const customerId = await customerIdForUser(userId);
  const txn = await paddle().transactions.create({
    items: [{ priceId: priceIdFor(plan), quantity: 1 }],
    customData: { user_id: userId },
    ...(customerId ? { customerId } : {}),
  });
  return { transactionId: txn.id, hasCustomer: Boolean(customerId) };
}

/**
 * Copies the customer's current subscription and lifetime purchase from Paddle
 * to their profile. Called from webhooks and right after checkout. Reading the
 * latest state from Paddle (instead of trusting event payloads) makes
 * out-of-order or repeated webhooks harmless.
 *
 * `userIdHint` (from the checkout's custom data) links a new customer to an
 * account; it never moves a profile that already belongs to another customer.
 */
export async function syncCustomer(customerId: string, userIdHint?: string | null): Promise<void> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase service key is not set");

  const [subs, txns] = await Promise.all([
    paddle().subscriptions.list({ customerId: [customerId], perPage: 50 }).next(),
    paddle()
      .transactions.list({ customerId: [customerId], status: ["completed", "paid"], include: ["adjustment"], perPage: 50 })
      .next(),
  ]);
  const sub = pickSubscription(subs);
  const lifetime = hasLifetime(txns, serverEnv.priceLifetime);

  // Bought lifetime while subscribed: stop the subscription from renewing.
  if (lifetime && sub && LIVE_STATUSES.some((s) => s === sub.status) && sub.scheduledChange?.action !== "cancel") {
    try {
      await paddle().subscriptions.cancel(sub.id, { effectiveFrom: "next_billing_period" });
    } catch (e) {
      console.error(`[paddle] could not cancel ${sub.id} after a lifetime purchase`, e);
    }
  }

  const row = {
    paddle_customer_id: customerId,
    ...subscriptionRow(sub),
    lifetime,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await db.from("profiles").update(row).eq("paddle_customer_id", customerId).select("id");
  if (error) throw error;
  if (updated && updated.length > 0) return;

  if (!userIdHint) {
    console.warn(`[paddle] no profile for customer ${customerId}`);
    return;
  }
  const { data: linked, error: linkError } = await db
    .from("profiles")
    .update(row)
    .eq("id", userIdHint)
    .is("paddle_customer_id", null)
    .select("id");
  if (linkError) throw linkError;
  if (!linked?.length) console.warn(`[paddle] could not link customer ${customerId} to user ${userIdHint}`);
}

/** A one-time sign-in link to the Paddle customer portal (invoices, card, cancel). */
export async function portalUrl(customerId: string): Promise<string> {
  const subs = await paddle()
    .subscriptions.list({ customerId: [customerId], status: [...LIVE_STATUSES], perPage: 25 })
    .next();
  const session = await paddle().customerPortalSessions.create(
    customerId,
    subs.map((s) => s.id),
  );
  return session.urls.general.overview;
}

/** A full refund or chargeback of a subscription payment ends that subscription (see /refunds). */
export async function cancelAfterRefund(subscriptionId: string): Promise<void> {
  const sub = await paddle().subscriptions.get(subscriptionId);
  if (LIVE_STATUSES.some((s) => s === sub.status)) await paddle().subscriptions.cancel(sub.id, { effectiveFrom: "immediately" });
}

/** Cancels every subscription that still bills the customer, right away. */
export async function cancelSubscriptionsNow(customerId: string): Promise<void> {
  const subs = await paddle()
    .subscriptions.list({ customerId: [customerId], status: [...LIVE_STATUSES], perPage: 50 })
    .next();
  for (const s of subs) await paddle().subscriptions.cancel(s.id, { effectiveFrom: "immediately" });
}
