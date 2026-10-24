import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameLoader } from "@/components/game/game-loader";
import { getDeck, nextDeckId } from "@/lib/decks";
import { getPrefs } from "@/lib/i18n/server";

type Props = { params: Promise<{ deckId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  const deck = getDeck(deckId);
  if (!deck) return {};
  const { sourceLang } = await getPrefs();
  return {
    title: `${deck.title.cs} · ${deck.title[sourceLang]}`,
    description: deck.description[sourceLang],
    alternates: { canonical: `/play/${deck.id}` },
  };
}

/** Every deck is free to play; free players have a daily game limit (see LIMITS). */
export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const deck = getDeck(deckId);
  if (!deck) notFound();

  const next = nextDeckId(deck.id);
  return (
    <GameLoader
      key={deck.id}
      mode="deck"
      deck={{ id: deck.id, title: deck.title, words: deck.words }}
      nextHref={next ? `/play/${next}` : undefined}
    />
  );
}
