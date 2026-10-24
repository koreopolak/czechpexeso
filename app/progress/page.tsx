import type { Metadata } from "next";
import { ProgressView } from "@/components/progress-view";
import { listDecks, todayKey } from "@/lib/decks";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("progress.metaTitle"), robots: { index: false } };
}

export default async function ProgressPage() {
  const { t } = await getT();
  return (
    <div className="container-page pt-10 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("progress.title")}</h1>
      <ProgressView decks={listDecks()} today={todayKey()} />
    </div>
  );
}
