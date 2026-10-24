import type { Metadata } from "next";
import { DailyGate } from "@/components/daily-gate";
import { Paywall } from "@/components/paywall";
import { getEntitlement } from "@/lib/auth";
import { DAILY_TIME_ZONE } from "@/lib/config";
import { dailyChallenge, todayKey } from "@/lib/decks";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("daily.metaTitle"), description: t("daily.lead"), alternates: { canonical: "/daily" } };
}

/** Epoch ms of the next midnight in the daily challenge time zone. */
function nextReset(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DAILY_TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const secondsIntoDay = get("hour") * 3600 + get("minute") * 60 + get("second");
  return now.getTime() + (86400 - secondsIntoDay) * 1000;
}

export default async function DailyPage() {
  const [{ t }, { premium }] = await Promise.all([getT(), getEntitlement()]);

  if (!premium) {
    return (
      <Paywall icon="calendar" title={t("daily.lockedTitle")} text={t("daily.lockedText")} cta={t("paywall.cta")} back={t("paywall.back")} />
    );
  }

  const date = todayKey();
  const { seed, words } = dailyChallenge(date);
  const title = { cs: "Denní výzva", en: t("daily.title"), uk: t("daily.title"), ru: t("daily.title"), pl: t("daily.title") };
  return <DailyGate deck={{ id: "daily", title, words }} date={date} seed={seed} resetsAt={nextReset()} />;
}
