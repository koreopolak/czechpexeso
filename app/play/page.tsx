import type { Metadata } from "next";
import { DeckPicker } from "@/components/deck-picker";
import { listDecks, todayKey } from "@/lib/decks";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("decks.metaTitle"), alternates: { canonical: "/play" } };
}

export default async function PlayPage() {
  const { t } = await getT();
  return (
    <div className="container-page pt-10 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("decks.title")}</h1>
      <p className="mt-3 text-lg text-muted">{t("decks.lead")}</p>
      <DeckPicker decks={listDecks()} today={todayKey()} />
    </div>
  );
}
