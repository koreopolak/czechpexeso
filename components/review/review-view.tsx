"use client";

/**
 * Review (Premium): the words of recent games, practised three ways —
 * word radio, flashcards and typing. History stores only word ids, so the
 * words themselves come from /api/review.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WordList } from "@/components/game/word-list";
import { Icon, type IconName } from "@/components/icons";
import { useEntitlement, useI18n, usePrefs } from "@/components/providers";
import { Flashcards } from "@/components/review/flashcards";
import { TypingGame } from "@/components/review/typing-game";
import { WordRadio } from "@/components/review/word-radio";
import { FEATURES } from "@/lib/config";
import type { MessageKey } from "@/lib/i18n/translate";
import { useHydrated, useProgress } from "@/lib/progress-store";
import { recentWordIds, REVIEW_MODES, REVIEW_SCOPES, reviewHref, type ReviewMode } from "@/lib/review";
import type { Word } from "@/lib/types";

const MODES: Record<ReviewMode, { icon: IconName; title: MessageKey; text: MessageKey }> = {
  radio: { icon: "headphones", title: "review.radio", text: "review.radioText" },
  flashcards: { icon: "cards", title: "review.flashcards", text: "review.flashcardsText" },
  typing: { icon: "keyboard", title: "review.typing", text: "review.typingText" },
};

// Words already fetched this visit; null marks ids the server no longer knows.
const wordCache = new Map<string, Word | null>();

/** Loads the words for these ids (null = don't load). */
function useReviewWords(ids: string[] | null): { words: Word[] | null; failed: boolean } {
  const [, setLoaded] = useState(0);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const missingKey = (ids ?? []).filter((id) => !wordCache.has(id)).join(",");

  useEffect(() => {
    if (!missingKey) return;
    const missing = missingKey.split(",");
    let cancelled = false;
    fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: missing }) })
      .then((res) => (res.ok ? (res.json() as Promise<{ words: Word[] }>) : Promise.reject(new Error(`review: ${res.status}`))))
      .then(({ words }) => {
        missing.forEach((id) => wordCache.set(id, null));
        words.forEach((w) => wordCache.set(w.id, w));
        if (!cancelled) setLoaded((n) => n + 1);
      })
      .catch(() => {
        if (!cancelled) setFailedKey(missingKey);
      });
    return () => {
      cancelled = true;
    };
  }, [missingKey]);

  if (!ids || missingKey) return { words: null, failed: !!missingKey && failedKey === missingKey };
  return { words: ids.flatMap((id) => wordCache.get(id) ?? []), failed: false };
}

function ModeCard({ mode, href, i }: { mode: ReviewMode; href?: string; i: number }) {
  const { t } = useI18n();
  const m = MODES[mode];
  // Icon beside the text on phones, above it on wider screens.
  const body = (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface transition-colors group-hover:bg-invert group-hover:text-invert-fg">
        <Icon name={m.icon} size={24} />
      </span>
      <span className="min-w-0 flex-1 sm:mt-5">
        <span className="flex items-center justify-between gap-2 text-lg font-semibold">
          {t(m.title)}
          {href && <Icon name="arrow-right" size={18} className="shrink-0 transition-transform group-hover:translate-x-0.5" />}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted sm:mt-1.5">{t(m.text)}</span>
      </span>
    </>
  );
  const className = "panel reveal group flex items-start gap-4 p-5 text-left sm:flex-col sm:gap-0 sm:p-6";
  const style = { "--i": i } as React.CSSProperties;
  return href ? (
    <Link href={href} className={`${className} transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft`} style={style}>
      {body}
    </Link>
  ) : (
    <div className={className} style={style}>
      {body}
    </div>
  );
}

function Heading() {
  const { t } = useI18n();
  return (
    <>
      <p className="kicker flex items-center gap-1.5">
        <Icon name="sparkle" size={12} filled strokeWidth={0} /> {t("common.premium")}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{t("review.title")}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t("review.lead")}</p>
    </>
  );
}

function Locked() {
  const { t } = useI18n();
  return (
    <div className="container-page pb-16 pt-10 sm:pt-14">
      <Heading />
      <div className="panel mt-8 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface">
          <Icon name="lock" size={22} />
        </span>
        <div className="flex-1">
          <h2 className="font-semibold">{t("review.lockedTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t(FEATURES.premiumForSale ? "review.lockedText" : "review.lockedUnavailable")}</p>
        </div>
        {FEATURES.premiumForSale ? (
          <Link href="/pricing" className="btn">
            {t("game.limitCta")}
          </Link>
        ) : (
          <Link href="/play" className="btn btn-outline">
            {t("home.cta")}
          </Link>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {REVIEW_MODES.map((m, i) => (
          <ModeCard key={m} mode={m} i={i} />
        ))}
      </div>
    </div>
  );
}

export function ReviewView({ mode, games }: { mode: ReviewMode | null; games: number }) {
  const { t } = useI18n();
  const { sourceLang: lang } = usePrefs();
  const { premium } = useEntitlement();
  const progress = useProgress();
  const hydrated = useHydrated();
  const recent = useMemo(() => recentWordIds(progress.history, games), [progress.history, games]);
  const { words, failed } = useReviewWords(premium && hydrated && recent.ids.length > 0 ? recent.ids : null);

  if (!premium) return <Locked />;

  const loading = !hydrated || (recent.ids.length > 0 && !words && !failed);
  const empty = hydrated && recent.ids.length === 0;

  if (mode && words && words.length > 0) {
    const props = { words, lang, backHref: reviewHref(games) };
    if (mode === "radio") return <WordRadio {...props} />;
    if (mode === "flashcards") return <Flashcards {...props} />;
    return <TypingGame {...props} />;
  }
  if (mode && loading) {
    return (
      <div className="container-page pt-4" aria-busy="true">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface" />
        <div className="mx-auto mt-6 h-[22rem] max-w-xl animate-pulse rounded-3xl bg-surface" />
      </div>
    );
  }

  return (
    <div className="container-page pb-16 pt-10 sm:pt-14">
      <Heading />

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm font-semibold" id="review-scope">
          {t("review.scope")}
        </span>
        <div className="segmented" role="group" aria-labelledby="review-scope">
          {REVIEW_SCOPES.map((n) => (
            <Link
              key={n}
              href={reviewHref(n, mode ?? undefined)}
              aria-current={n === games ? "true" : undefined}
              aria-label={t("common.games", { n })}
              className="min-w-11 text-center tabular-nums"
              scroll={false}
              replace
            >
              {n}
            </Link>
          ))}
        </div>
        {words && words.length > 0 && (
          <p className="text-sm text-muted">
            {t("review.summary", { words: t("common.words", { n: words.length }), games: t("common.games", { n: recent.games }) })}
          </p>
        )}
      </div>

      {empty ? (
        <div className="panel mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface">
            <Icon name="cards" size={22} />
          </span>
          <p className="flex-1 text-muted">{t("review.empty")}</p>
          <Link href="/play" className="btn">
            {t("home.cta")} <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      ) : failed ? (
        <p className="mt-6 text-danger" role="alert">
          {t("common.error")}
        </p>
      ) : loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-busy="true">
          {REVIEW_MODES.map((m) => (
            <div key={m} className="h-48 animate-pulse rounded-[1.25rem] bg-surface" />
          ))}
        </div>
      ) : (
        words && (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {REVIEW_MODES.map((m, i) => (
                <ModeCard key={m} mode={m} href={reviewHref(games, m)} i={i} />
              ))}
            </div>
            <details className="group mt-8 rounded-2xl border border-line px-4 py-1 sm:px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-semibold">
                <span>
                  {t("review.wordsInReview")} <span className="text-muted">({words.length})</span>
                </span>
                <Icon name="arrow-right" size={16} className="transition-transform group-open:rotate-90" />
              </summary>
              <div className="pb-2">
                <WordList words={words} lang={lang} />
              </div>
            </details>
          </>
        )
      )}
    </div>
  );
}
