import type { Metadata } from "next";
import { ReviewView } from "@/components/review/review-view";
import { getT } from "@/lib/i18n/server";
import { isReviewMode, parseScope } from "@/lib/review";

type Props = { searchParams: Promise<{ mode?: string | string[]; games?: string | string[] }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("review.metaTitle"), robots: { index: false }, alternates: { canonical: "/review" } };
}

/** Premium: review the words of recent games or all of them (?games=1|5|10|30|all, ?mode=pexeso|flashcards|typing|speed|radio). */
export default async function ReviewPage({ searchParams }: Props) {
  const { mode, games } = await searchParams;
  return <ReviewView mode={isReviewMode(mode) ? mode : null} games={parseScope(games)} />;
}
