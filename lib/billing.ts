/**
 * Pure billing helpers (no Paddle SDK, no database), so they can be unit-tested.
 * lib/paddle.ts feeds them data read from the Paddle API.
 */

export const PLANS = ["month", "year", "lifetime"] as const;
export type Plan = (typeof PLANS)[number];
export type PlanPrice = { amount: number; currency: string };
export type PlanPrices = Record<Plan, PlanPrice>;

export function isPlan(v: unknown): v is Plan {
  return typeof v === "string" && (PLANS as readonly string[]).includes(v);
}

/** The subset of a Paddle subscription we look at. */
export type SubscriptionLike = {
  id: string;
  status: string;
  createdAt: string;
  currentBillingPeriod: { endsAt: string } | null;
  scheduledChange: { action: string; effectiveAt: string } | null;
  items: { price: { id: string; billingCycle: { interval: string } | null } }[];
};

/** The subset of a Paddle transaction we look at. */
export type TransactionLike = {
  id: string;
  status: string;
  items: { price: { id: string } | null }[];
  details: { totals: { total: string } | null } | null;
  adjustments: { action: string; status: string; totals: { total: string } | null }[] | null;
};

// Best first: a live subscription wins over an old cancelled one.
const STATUS_RANK: Record<string, number> = { active: 0, trialing: 1, past_due: 2, paused: 3, canceled: 4 };

export function pickSubscription<T extends SubscriptionLike>(subs: T[]): T | null {
  return (
    subs
      .slice()
      .sort(
        (a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) || Date.parse(b.createdAt) - Date.parse(a.createdAt),
      )[0] ?? null
  );
}

/** Profile columns that describe the subscription. */
export function subscriptionRow(sub: SubscriptionLike | null) {
  const item = sub?.items[0];
  const cancelling = sub?.scheduledChange?.action === "cancel";
  const periodEnd = cancelling ? sub?.scheduledChange?.effectiveAt : sub?.currentBillingPeriod?.endsAt;
  const interval = item?.price.billingCycle?.interval;
  return {
    paddle_subscription_id: sub?.id ?? null,
    subscription_status: sub?.status ?? null,
    subscription_price_id: item?.price.id ?? null,
    subscription_interval: interval === "month" || interval === "year" ? interval : null,
    current_period_end: periodEnd ?? null,
    cancel_at_period_end: Boolean(cancelling),
  };
}

/**
 * True when one of the transactions paid for the lifetime price and was not
 * refunded or charged back in full.
 */
export function hasLifetime(transactions: TransactionLike[], lifetimePriceId: string): boolean {
  if (!lifetimePriceId) return false;
  return transactions.some((t) => {
    if (t.status !== "completed" && t.status !== "paid") return false;
    if (!t.items.some((i) => i.price?.id === lifetimePriceId)) return false;
    const paid = Number(t.details?.totals?.total ?? 0);
    const returned = (t.adjustments ?? [])
      .filter((a) => a.status === "approved" && (a.action === "refund" || a.action === "chargeback"))
      .reduce((sum, a) => sum + Number(a.totals?.total ?? 0), 0);
    return paid === 0 || returned < paid;
  });
}
