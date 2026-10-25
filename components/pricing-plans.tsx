"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useEntitlement, useI18n } from "@/components/providers";
import type { Plan, PlanPrices } from "@/lib/billing";
import { FEATURES, LIMITS } from "@/lib/config";
import { publicEnv } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import type { UiLocale } from "@/lib/types";

// Paddle Checkout has no Ukrainian; English is the closest neutral choice.
const CHECKOUT_LOCALE: Record<UiLocale, string> = { en: "en", uk: "en", ru: "ru", pl: "pl" };

function Feature({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className="flex gap-3">
      <Icon name="check" size={18} className="mt-0.5 shrink-0" />
      <span className={strong ? "font-semibold" : ""}>{children}</span>
    </li>
  );
}

function currentTheme(): "light" | "dark" {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Paddle.js may only be initialized once per page, but this component can
// mount several times (client-side navigation), so share one instance.
let paddlePromise: Promise<Paddle | undefined> | null = null;
const closeListeners = new Set<() => void>();

function loadPaddle(): Promise<Paddle | undefined> {
  paddlePromise ??= initializePaddle({
    token: publicEnv.paddleClientToken,
    environment: publicEnv.paddleEnv,
    checkout: { settings: { displayMode: "overlay" } },
    eventCallback: (e) => {
      if (e.name === "checkout.closed") closeListeners.forEach((f) => f());
    },
  }).catch((e: unknown) => {
    paddlePromise = null;
    throw e;
  });
  return paddlePromise;
}

export function PricingPlans({ prices, totalDecks }: { prices: PlanPrices; totalDecks: number }) {
  const { t, locale } = useI18n();
  const { user, premium, lifetime, authEnabled, billingEnabled } = useEntitlement();
  const [plan, setPlan] = useState<Plan>("year");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Load Paddle.js up front: it also opens checkout links from Paddle emails
  // (for example "update payment method"), which point at this page.
  useEffect(() => {
    if (!billingEnabled || !publicEnv.paddleClientToken) return;
    const onClose = () => setBusy(false);
    closeListeners.add(onClose);
    loadPaddle().catch((e) => console.error("[paddle] could not load Paddle.js", e));
    return () => {
      closeListeners.delete(onClose);
    };
  }, [billingEnabled]);

  async function checkout() {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/paddle/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { transactionId?: string; hasCustomer?: boolean; redirect?: string };
      if (data.redirect) {
        window.location.assign(data.redirect);
        return;
      }
      if (!res.ok || !data.transactionId) throw new Error(`Checkout unavailable (${res.status})`);
      const paddle = await loadPaddle();
      if (!paddle) throw new Error("Paddle.js did not load");
      const successUrl = `${window.location.origin}/api/paddle/success?transaction_id=${encodeURIComponent(data.transactionId)}`;
      paddle.Checkout.open({
        transactionId: data.transactionId,
        // Returning customers keep their Paddle customer (and email) so the purchase lands on this account.
        ...(data.hasCustomer || !user?.email ? {} : { customer: { email: user.email } }),
        settings: { successUrl, allowLogout: !data.hasCustomer, theme: currentTheme(), locale: CHECKOUT_LOCALE[locale] },
      });
    } catch (e) {
      console.error("[paddle] checkout failed", e);
      setFailed(true);
      setBusy(false);
    }
  }

  const saving = Math.round((1 - prices.year.amount / (prices.month.amount * 12)) * 100);
  const price = prices[plan];
  const monthlyEquivalent = formatPrice(Math.round(prices.year.amount / 12), prices.year.currency, locale, { trimZeros: false });
  const per = plan === "year" ? t("pricing.perYear") : plan === "month" ? t("pricing.perMonth") : t("pricing.oneTime");
  const subline =
    plan === "year" ? t("pricing.yearlyEquivalent", { price: monthlyEquivalent }) : plan === "lifetime" ? t("pricing.lifetimeLead") : "";
  // A subscriber can still switch to lifetime.
  const canBuy = !premium || (plan === "lifetime" && !lifetime);

  let action: React.ReactNode;
  if (premium && !canBuy) {
    action = (
      <form action="/api/paddle/portal" method="post">
        <p className="mb-3 flex items-center gap-2 font-semibold">
          <Icon name="check" size={18} /> {lifetime ? t("pricing.currentLifetime") : t("pricing.current")}
        </p>
        {user && billingEnabled && (
          <button type="submit" className="btn w-full border-invert-fg bg-invert-fg text-invert">
            {lifetime ? t("pricing.manageBilling") : t("pricing.manage")}
          </button>
        )}
      </form>
    );
  } else if (!billingEnabled || !authEnabled) {
    action = (
      <>
        <button type="button" className="btn w-full border-invert-fg bg-invert-fg text-invert" disabled>
          {t("pricing.subscribe")}
        </button>
        <p className="mt-3 text-sm opacity-70">{t("pricing.notConfigured")}</p>
      </>
    );
  } else if (!user) {
    action = (
      <Link href="/login?next=/pricing" className="btn w-full border-invert-fg bg-invert-fg text-invert">
        {t("pricing.signInFirst")}
      </Link>
    );
  } else {
    action = (
      <>
        <button type="button" onClick={checkout} className="btn w-full border-invert-fg bg-invert-fg text-invert" disabled={busy}>
          {busy ? t("pricing.redirecting") : plan === "lifetime" ? t("pricing.buyLifetime") : t("pricing.subscribe")}
        </button>
        {premium && <p className="mt-3 text-sm opacity-70">{t("pricing.switchNote")}</p>}
        {failed && (
          <p className="mt-3 text-sm" role="alert">
            {t("common.error")}
          </p>
        )}
      </>
    );
  }

  const tabs: { id: Plan; label: string; badge?: string }[] = [
    { id: "month", label: t("pricing.monthly") },
    { id: "year", label: t("pricing.yearly"), badge: saving > 0 ? `−${saving}%` : undefined },
    { id: "lifetime", label: t("pricing.lifetime") },
  ];

  return (
    <>
      <div className="mt-10 flex justify-center">
        <div className="segmented" role="group" aria-label={t("pricing.title")}>
          {tabs.map((tab) => (
            <button key={tab.id} type="button" aria-pressed={plan === tab.id} onClick={() => setPlan(tab.id)}>
              {tab.label}
              {tab.badge && <span className="ml-1.5 rounded-full bg-fg px-1.5 py-0.5 text-[11px] text-bg">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
        {/* Free */}
        <section className="panel flex flex-col p-7 sm:p-8" aria-labelledby="plan-free">
          <h2 id="plan-free" className="text-xl font-semibold">
            {t("pricing.freeName")}
          </h2>
          <p className="mt-1 text-muted">{t("pricing.freeLead")}</p>
          <p className="mt-6 text-4xl font-bold tracking-tight">{formatPrice(0, price.currency, locale)}</p>
          <ul className="mt-6 flex-1 space-y-3 text-[0.95rem]">
            <Feature strong>{t("pricing.free1", { n: totalDecks })}</Feature>
            <Feature>{t("pricing.free2")}</Feature>
            {LIMITS.freeGamesPerDay > 0 && <Feature>{t("pricing.free3", { n: LIMITS.freeGamesPerDay })}</Feature>}
            <Feature>{t("pricing.free4", { n: LIMITS.freeHistoryVisible })}</Feature>
            {authEnabled && FEATURES.syncForEveryone && <Feature>{t("pricing.free5")}</Feature>}
          </ul>
          <Link href="/play" className="btn btn-outline mt-8 w-full">
            {t("pricing.freeCta")}
          </Link>
        </section>

        {/* Premium */}
        <section className="flex flex-col rounded-[1.25rem] bg-invert p-7 text-invert-fg sm:p-8" aria-labelledby="plan-premium">
          <div className="flex items-center justify-between">
            <h2 id="plan-premium" className="flex items-center gap-2 text-xl font-semibold">
              <Icon name="sparkle" size={18} filled strokeWidth={0} /> {t("pricing.premiumName")}
            </h2>
            {plan === "year" && saving > 0 && <span className="chip border-invert-fg/30">{t("pricing.save", { n: saving })}</span>}
            {plan === "lifetime" && <span className="chip border-invert-fg/30">{t("pricing.payOnce")}</span>}
          </div>
          <p className="mt-1 opacity-70">{t("pricing.premiumLead")}</p>
          <p className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight">{formatPrice(price.amount, price.currency, locale, { trimZeros: false })}</span>
            <span className="opacity-70">{per}</span>
          </p>
          <p className="mt-1 h-5 text-sm opacity-70">{subline}</p>
          <ul className="mt-6 flex-1 space-y-3 text-[0.95rem]">
            <Feature strong>{t("pricing.p1")}</Feature>
            <Feature>{t("pricing.p2")}</Feature>
            <Feature>{t("pricing.p3")}</Feature>
            <Feature>{t("pricing.p4")}</Feature>
            {!FEATURES.syncForEveryone && <Feature>{t("pricing.p6")}</Feature>}
            <Feature>{t("pricing.p5")}</Feature>
          </ul>
          <div className="mt-8">{action}</div>
        </section>
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        {t("pricing.note")}{" "}
        <Link href="/refunds" className="underline">
          {t("footer.refunds")}
        </Link>
      </p>
    </>
  );
}
