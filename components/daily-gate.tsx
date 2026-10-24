"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GameLoader } from "@/components/game/game-loader";
import type { GameDeck } from "@/components/game/game-screen";
import { Icon } from "@/components/icons";
import { useI18n } from "@/components/providers";
import { Stars } from "@/components/stars";
import { formatTime } from "@/lib/game/engine";
import { formatDate } from "@/lib/format";
import { dailyStreak } from "@/lib/progress";
import { useHydrated, useProgress } from "@/lib/progress-store";

function untilMidnight(nextMidnightUtc: number, now: number, intl: string) {
  const s = Math.max(0, Math.floor((nextMidnightUtc - now) / 1000));
  const unit = (unit: "hour" | "minute", n: number) => new Intl.NumberFormat(intl, { style: "unit", unit, unitDisplay: "short" }).format(n);
  return `${unit("hour", Math.floor(s / 3600))} ${unit("minute", Math.floor((s % 3600) / 60))}`;
}

/** Shows today's result if the challenge is done, otherwise the board. */
export function DailyGate({ deck, date, seed, resetsAt }: { deck: GameDeck; date: string; seed: number; resetsAt: number }) {
  const { t, locale, intl } = useI18n();
  const progress = useProgress();
  const hydrated = useHydrated();
  // Decided once after hydration, so finishing the game doesn't swap the screen
  // out from under the win dialog.
  const [view, setView] = useState<"pending" | "game" | "replay" | "summary">("pending");
  const [now, setNow] = useState(() => Date.now());
  const result = progress.daily[date];
  if (hydrated && view === "pending") setView(result ? "summary" : "game");

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (view === "pending") return null;
  if (view !== "summary" || !result) {
    return <GameLoader key={view} mode="daily" deck={deck} daily={{ date, seed }} />;
  }

  const streak = dailyStreak(progress, date);
  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-md text-center">
        <p className="kicker">{formatDate(`${date}T12:00:00Z`, locale)}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{t("daily.title")}</h1>
        <p className="mt-3 inline-flex items-center gap-2 font-semibold">
          <Icon name="check" size={18} /> {t("daily.done")}
        </p>

        <div className="panel mt-8 p-6">
          <p className="kicker">{t("daily.today")}</p>
          <div className="mt-3">
            <Stars value={result.stars} size={32} label={t("game.stars", { n: result.stars })} />
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-surface py-3">
              <dt className="text-xs text-muted">{t("game.score")}</dt>
              <dd className="text-xl font-bold tabular-nums">{result.score}</dd>
            </div>
            <div className="rounded-2xl bg-surface py-3">
              <dt className="text-xs text-muted">{t("game.moves")}</dt>
              <dd className="text-xl font-bold tabular-nums">{result.moves}</dd>
            </div>
            <div className="rounded-2xl bg-surface py-3">
              <dt className="text-xs text-muted">{t("game.time")}</dt>
              <dd className="text-xl font-bold tabular-nums">{formatTime(result.timeMs)}</dd>
            </div>
          </dl>
          <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold">
            <Icon name="flame" size={18} /> {t("daily.streak")}: {t("common.days", { n: streak })}
          </p>
        </div>

        <p className="mt-6 text-sm text-muted">{t("daily.next", { time: untilMidnight(resetsAt, now, intl) })}</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" className="btn btn-outline" onClick={() => setView("replay")}>
            <Icon name="restart" size={16} /> {t("game.playAgain")}
          </button>
          <Link href="/play" className="btn">
            {t("game.allDecks")}
          </Link>
        </div>
      </div>
    </div>
  );
}
