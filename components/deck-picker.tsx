"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { PlayOptions } from "@/components/play-options";
import { useEntitlement, usePrefs, useT } from "@/components/providers";
import { Stars } from "@/components/stars";
import { LIMITS } from "@/lib/config";
import { dailyStreak, gamesToday, wordsPlayed } from "@/lib/progress";
import { useHydrated, useProgress } from "@/lib/progress-store";
import type { DeckMeta } from "@/lib/types";

/** How many of the deck's words the player has ever matched. */
export function WordsBar({ played, total, label, className = "" }: { played: number; total: number; label: string; className?: string }) {
  const pct = total ? Math.round((played / total) * 100) : 0;
  return (
    <span className={`flex flex-col gap-1.5 ${className}`} title={label}>
      <span className="text-right text-xs font-semibold tabular-nums text-muted">
        {played}/{total}
      </span>
      <span
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={played}
        className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <span className="block h-full rounded-full bg-fg transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

export function DeckPicker({ decks, today }: { decks: DeckMeta[]; today: string }) {
  const t = useT();
  const { sourceLang } = usePrefs();
  const { premium } = useEntitlement();
  const progress = useProgress();
  const hydrated = useHydrated();

  const limited = !premium && LIMITS.freeGamesPerDay > 0;
  const left = Math.max(0, LIMITS.freeGamesPerDay - gamesToday(progress));
  const dailyDone = !!progress.daily[today];
  const streak = dailyStreak(progress, today);

  return (
    <>
      <div className="mt-6">
        <PlayOptions />
      </div>

      {hydrated && limited && <p className="mt-4 text-sm text-muted">{t("decks.gamesLeft", { n: left })}</p>}

      {/* Daily challenge */}
      <Link
        href="/daily"
        className="group mt-8 flex items-center gap-4 rounded-3xl border border-fg p-5 transition-colors hover:bg-surface sm:p-6"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-invert text-invert-fg">
          <Icon name="calendar" size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold">{t("daily.title")}</span>
            {!premium && (
              <span className="chip">
                <Icon name="lock" size={12} /> {t("common.premium")}
              </span>
            )}
            {premium && hydrated && dailyDone && (
              <span className="chip chip-solid">
                <Icon name="check" size={12} /> {t("daily.done")}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            {t("daily.cardText")}
            {premium && hydrated && streak > 0 && ` · ${t("daily.streak")}: ${t("common.days", { n: streak })}`}
          </span>
        </span>
        <Icon name="arrow-right" className="shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>

      {/* Decks */}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {decks.map((d) => {
          const stats = progress.decks[d.id];
          const played = hydrated ? wordsPlayed(progress, d.id, d.wordIds) : 0;
          return (
            <li key={d.id}>
              <Link
                href={`/play/${d.id}`}
                className="group relative flex h-full flex-col rounded-3xl border border-line p-4 transition-all hover:-translate-y-0.5 hover:border-fg hover:shadow-soft sm:p-5"
              >
                <span className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-invert text-invert-fg">
                    <Icon name={d.icon} size={20} />
                  </span>
                  {hydrated && stats?.plays ? (
                    <Stars value={stats.bestStars} size={14} label={t("decks.best", { n: stats.bestStars })} />
                  ) : hydrated ? (
                    <span className="chip">{t("decks.new")}</span>
                  ) : null}
                </span>
                <span className="mt-4 flex flex-1 flex-col justify-between gap-3 lg:flex-row lg:items-end">
                  <span className="min-w-0">
                    <span className="block text-lg font-semibold leading-tight" lang="cs">
                      {d.title.cs}
                    </span>
                    <span className="block text-sm text-muted">{d.title[sourceLang]}</span>
                    <span className="mt-3 block whitespace-nowrap text-xs text-muted">
                      {t("common.words", { n: d.wordCount })} · {d.level}
                    </span>
                  </span>
                  <WordsBar
                    played={played}
                    total={d.wordCount}
                    label={t("decks.wordsPlayed", { n: played, total: d.wordCount })}
                    className="w-full shrink-0 lg:mb-0.5 lg:w-24"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {limited && (
        <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl bg-invert p-6 text-invert-fg sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-xl font-semibold">{t("decks.unlockTitle")}</p>
            <p className="mt-1 opacity-70">{t("decks.unlockText")}</p>
          </div>
          <Link href="/pricing" className="btn shrink-0 border-invert-fg bg-invert-fg text-invert">
            {t("pricing.subscribe")}
          </Link>
        </div>
      )}
    </>
  );
}
