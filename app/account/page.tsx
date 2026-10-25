import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivationWatcher, DeleteAccountButton } from "@/components/account-client";
import { Icon } from "@/components/icons";
import { PremiumBadge } from "@/components/site-header";
import { getEntitlement } from "@/lib/auth";
import { FEATURES } from "@/lib/config";
import { formatDate } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("account.metaTitle"), robots: { index: false } };
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const [{ t, locale }, ent, params] = await Promise.all([getT(), getEntitlement(), searchParams]);
  if (!ent.authEnabled) redirect("/login");
  if (!ent.user) redirect("/login?next=/account");

  const sub = ent.subscription;
  const welcome = params.welcome === "1";
  const statusKey = sub ? (`status.${sub.status}` as MessageKey) : null;

  return (
    <div className="container-page max-w-2xl pt-10 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("account.title")}</h1>

      {welcome && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-invert p-4 font-medium text-invert-fg" role="status">
          <Icon name="sparkle" size={18} filled strokeWidth={0} />
          {ent.premium ? t("account.welcome") : t("account.activating")}
        </p>
      )}
      {welcome && <ActivationWatcher active={ent.premium} />}

      <dl className="mt-8 divide-y divide-line border-y border-line">
        <div className="flex flex-wrap items-center justify-between gap-2 py-4">
          <dt className="text-muted">{t("account.email")}</dt>
          <dd className="font-medium">{ent.user.email}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 py-4">
          <dt className="text-muted">{t("account.plan")}</dt>
          <dd className="flex items-center gap-2">
            {ent.premium ? <PremiumBadge /> : <span className="font-medium">{t("pricing.freeName")}</span>}
            {ent.lifetime && <span className="font-medium">· {t("pricing.lifetime")}</span>}
          </dd>
        </div>
        {sub && statusKey && !(ent.lifetime && sub.status === "canceled") && (
          <div className="flex flex-wrap items-center justify-between gap-2 py-4">
            <dt className="text-muted">{t("account.status")}</dt>
            <dd className="text-right">
              <span className="font-medium">
                {t(statusKey)}
                {sub.interval && ` · ${t(sub.interval === "year" ? "pricing.yearly" : "pricing.monthly")}`}
              </span>
              {sub.currentPeriodEnd && (
                <span className="block text-sm text-muted">
                  {t(sub.cancelAtPeriodEnd ? "account.ends" : "account.renews", { date: formatDate(sub.currentPeriodEnd, locale) })}
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-8 flex flex-col gap-3">
        {ent.billingEnabled && (sub || ent.lifetime) ? (
          <form action="/api/paddle/portal" method="post" className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">{t(sub && sub.status !== "canceled" ? "account.manageHint" : "account.billingHint")}</p>
            <button type="submit" className="btn shrink-0">
              {t(sub && sub.status !== "canceled" ? "account.manage" : "pricing.manageBilling")}
            </button>
          </form>
        ) : null}
        {!ent.premium && FEATURES.premiumForSale && (
          <Link href="/pricing" className="btn btn-lg">
            <Icon name="sparkle" size={16} filled strokeWidth={0} /> {t("account.upgrade")}
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-outline w-full">
            {t("account.signOut")}
          </button>
        </form>
      </div>

      <section className="mt-16 rounded-2xl border border-line p-5">
        <h2 className="font-semibold">{t("account.dangerTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("account.dangerText")}</p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
