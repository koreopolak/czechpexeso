import type { Metadata } from "next";
import { PricingPlans } from "@/components/pricing-plans";
import { getEntitlement } from "@/lib/auth";
import { TOTAL_DECK_COUNT } from "@/lib/decks";
import { serverEnv } from "@/lib/env.server";
import { getT } from "@/lib/i18n/server";
import { getPlanPrices } from "@/lib/stripe";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("pricing.metaTitle"), description: t("pricing.metaDescription"), alternates: { canonical: "/pricing" } };
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const [{ t }, prices, { premium }, { checkout }] = await Promise.all([getT(), getPlanPrices(), getEntitlement(), searchParams]);

  return (
    <div className="container-page pt-12 sm:pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">{t("pricing.title")}</h1>
        <p className="mt-4 text-lg text-muted">{premium ? t("pricing.thanks") : t("pricing.lead")}</p>
        {(checkout === "cancelled" || checkout === "error") && (
          <p className="mx-auto mt-6 w-fit rounded-full bg-surface px-4 py-2 text-sm" role="status">
            {checkout === "cancelled" ? t("pricing.cancelled") : t("common.error")}
          </p>
        )}
      </div>
      <PricingPlans prices={prices} trialDays={serverEnv.trialDays} totalDecks={TOTAL_DECK_COUNT} />
    </div>
  );
}
