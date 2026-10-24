"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useEntitlement, useI18n } from "@/components/providers";
import { FEATURES, LIMITS } from "@/lib/config";
import { formatPrice } from "@/lib/format";

type Price = { amount: number; currency: string };

function Feature({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className="flex gap-3">
      <Icon name="check" size={18} className="mt-0.5 shrink-0" />
      <span className={strong ? "font-semibold" : ""}>{children}</span>
    </li>
  );
}

export function PricingPlans({
  prices,
  trialDays,
  totalDecks,
}: {
  prices: { month: Price; year: Price };
  trialDays: number;
  totalDecks: number;
}) {
  const { t, locale } = useI18n();
  const { user, premium, authEnabled, billingEnabled } = useEntitlement();
  const [interval, setPlanInterval] = useState<"month" | "year">("year");
  const [busy, setBusy] = useState(false);

  // Coming back from Stripe with the back button restores this page from cache.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && setBusy(false);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const saving = Math.round((1 - prices.year.amount / (prices.month.amount * 12)) * 100);
  const price = prices[interval];
  const monthlyEquivalent = formatPrice(Math.round(prices.year.amount / 12), prices.year.currency, locale, { trimZeros: false });

  let action: React.ReactNode;
  if (premium) {
    action = (
      <form action="/api/stripe/portal" method="post">
        <p className="mb-3 flex items-center gap-2 font-semibold">
          <Icon name="check" size={18} /> {t("pricing.current")}
        </p>
        {user && billingEnabled && (
          <button type="submit" className="btn w-full border-invert-fg bg-invert-fg text-invert">
            {t("pricing.manage")}
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
      <form action="/api/stripe/checkout" method="post" onSubmit={() => setBusy(true)}>
        <input type="hidden" name="interval" value={interval} />
        <button type="submit" className="btn w-full border-invert-fg bg-invert-fg text-invert" disabled={busy}>
          {busy ? t("pricing.redirecting") : t("pricing.subscribe")}
        </button>
      </form>
    );
  }

  return (
    <>
      <div className="mt-10 flex justify-center">
        <div className="segmented" role="group" aria-label={t("pricing.title")}>
          <button type="button" aria-pressed={interval === "month"} onClick={() => setPlanInterval("month")}>
            {t("pricing.monthly")}
          </button>
          <button type="button" aria-pressed={interval === "year"} onClick={() => setPlanInterval("year")}>
            {t("pricing.yearly")}
            {saving > 0 && <span className="ml-1.5 rounded-full bg-fg px-1.5 py-0.5 text-[11px] text-bg">−{saving}%</span>}
          </button>
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
            {interval === "year" && saving > 0 && (
              <span className="chip border-invert-fg/30">{t("pricing.save", { n: saving })}</span>
            )}
          </div>
          <p className="mt-1 opacity-70">{t("pricing.premiumLead")}</p>
          <p className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight">{formatPrice(price.amount, price.currency, locale, { trimZeros: false })}</span>
            <span className="opacity-70">{interval === "year" ? t("pricing.perYear") : t("pricing.perMonth")}</span>
          </p>
          <p className="mt-1 h-5 text-sm opacity-70">
            {interval === "year" ? t("pricing.yearlyEquivalent", { price: monthlyEquivalent }) : ""}
          </p>
          {trialDays > 0 && !premium && <p className="chip mt-3 w-fit border-invert-fg/30">{t("pricing.trial", { n: trialDays })}</p>}
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
      <p className="mt-8 text-center text-sm text-muted">{t("pricing.note")}</p>
    </>
  );
}
