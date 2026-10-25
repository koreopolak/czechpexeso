import type { Metadata } from "next";
import { headers } from "next/headers";
import { PricingPlans } from "@/components/pricing-plans";
import { getEntitlement } from "@/lib/auth";
import { FEATURES } from "@/lib/config";
import { TOTAL_DECK_COUNT } from "@/lib/decks";
import { getT } from "@/lib/i18n/server";
import { getPlanPrices } from "@/lib/paddle";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("pricing.metaTitle"), description: t("pricing.metaDescription"), alternates: { canonical: "/pricing" } };
}

export default async function PricingPage() {
  // Vercel tells us the visitor's country, so prices show in their local currency.
  const country = (await headers()).get("x-vercel-ip-country");
  const [{ t }, prices, { premium }] = await Promise.all([getT(), getPlanPrices(country), getEntitlement()]);

  return (
    <div className="container-page pt-12 sm:pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">{t("pricing.title")}</h1>
        <p className="mt-4 text-lg text-muted">
          {premium ? t("pricing.thanks") : FEATURES.premiumForSale ? t("pricing.lead") : t("pricing.leadUnavailable")}
        </p>
      </div>
      <PricingPlans prices={prices} totalDecks={TOTAL_DECK_COUNT} />
    </div>
  );
}
