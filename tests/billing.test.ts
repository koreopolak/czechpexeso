import { describe, expect, it } from "vitest";
import { hasLifetime, isPlan, pickSubscription, subscriptionRow, type SubscriptionLike, type TransactionLike } from "@/lib/billing";

function sub(over: Partial<SubscriptionLike> = {}): SubscriptionLike {
  return {
    id: "sub_1",
    status: "active",
    createdAt: "2026-10-01T00:00:00Z",
    currentBillingPeriod: { endsAt: "2026-11-01T00:00:00Z" },
    scheduledChange: null,
    items: [{ price: { id: "pri_month", billingCycle: { interval: "month" } } }],
    ...over,
  };
}

function txn(over: Partial<TransactionLike> = {}): TransactionLike {
  return {
    id: "txn_1",
    status: "completed",
    items: [{ price: { id: "pri_life" } }],
    details: { totals: { total: "4499" } },
    adjustments: null,
    ...over,
  };
}

describe("isPlan", () => {
  it("accepts the three plans only", () => {
    expect(["month", "year", "lifetime"].every(isPlan)).toBe(true);
    expect(isPlan("week")).toBe(false);
    expect(isPlan(undefined)).toBe(false);
  });
});

describe("pickSubscription", () => {
  it("prefers a live subscription over a newer cancelled one", () => {
    const old = sub({ id: "sub_active", createdAt: "2026-01-01T00:00:00Z" });
    const cancelled = sub({ id: "sub_cancelled", status: "canceled", createdAt: "2026-09-01T00:00:00Z" });
    expect(pickSubscription([cancelled, old])?.id).toBe("sub_active");
  });

  it("picks the newest among equals and handles an empty list", () => {
    const a = sub({ id: "a", status: "canceled", createdAt: "2026-01-01T00:00:00Z" });
    const b = sub({ id: "b", status: "canceled", createdAt: "2026-05-01T00:00:00Z" });
    expect(pickSubscription([a, b])?.id).toBe("b");
    expect(pickSubscription([])).toBeNull();
  });
});

describe("subscriptionRow", () => {
  it("maps a renewing subscription", () => {
    expect(subscriptionRow(sub())).toEqual({
      paddle_subscription_id: "sub_1",
      subscription_status: "active",
      subscription_price_id: "pri_month",
      subscription_interval: "month",
      current_period_end: "2026-11-01T00:00:00Z",
      cancel_at_period_end: false,
    });
  });

  it("uses the cancellation date when a cancel is scheduled", () => {
    const row = subscriptionRow(sub({ scheduledChange: { action: "cancel", effectiveAt: "2026-10-20T00:00:00Z" } }));
    expect(row.cancel_at_period_end).toBe(true);
    expect(row.current_period_end).toBe("2026-10-20T00:00:00Z");
  });

  it("clears everything when there is no subscription", () => {
    expect(Object.values(subscriptionRow(null)).every((v) => v === null || v === false)).toBe(true);
  });
});

describe("hasLifetime", () => {
  it("is true for a completed lifetime purchase", () => {
    expect(hasLifetime([txn()], "pri_life")).toBe(true);
  });

  it("ignores other prices, unfinished payments and a missing price id", () => {
    expect(hasLifetime([txn({ items: [{ price: { id: "pri_month" } }] })], "pri_life")).toBe(false);
    expect(hasLifetime([txn({ status: "ready" })], "pri_life")).toBe(false);
    expect(hasLifetime([txn()], "")).toBe(false);
  });

  it("is revoked by a full refund or chargeback, not by a partial one", () => {
    const refund = (total: string, status = "approved", action = "refund") => ({ action, status, totals: { total } });
    expect(hasLifetime([txn({ adjustments: [refund("4499")] })], "pri_life")).toBe(false);
    expect(hasLifetime([txn({ adjustments: [refund("4499", "approved", "chargeback")] })], "pri_life")).toBe(false);
    expect(hasLifetime([txn({ adjustments: [refund("1000")] })], "pri_life")).toBe(true);
    expect(hasLifetime([txn({ adjustments: [refund("4499", "pending_approval")] })], "pri_life")).toBe(true);
  });
});
