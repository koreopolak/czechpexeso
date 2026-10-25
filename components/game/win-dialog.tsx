"use client";

import Link from "next/link";
import { useMemo } from "react";
import { WordList } from "@/components/game/word-list";
import { Icon } from "@/components/icons";
import { Modal } from "@/components/modal";
import { useEntitlement, useI18n } from "@/components/providers";
import { Stars } from "@/components/stars";
import { formatTime, starLimits, type GameResult } from "@/lib/game/engine";
import type { NewBests } from "@/lib/progress";
import { reviewHref } from "@/lib/review";
import type { SourceLang, Word } from "@/lib/types";

function Confetti() {
  // Deterministic pseudo-random pieces (no hydration issues, no dependencies).
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
        return {
          left: `${r(1) * 100}%`,
          delay: `${r(2) * 0.6}s`,
          dur: `${2 + r(3) * 1.6}s`,
          dx: `${(r(4) - 0.5) * 160}px`,
          rot: `${360 + r(5) * 540}deg`,
          shade: i % 3 === 0 ? "var(--fg)" : i % 3 === 1 ? "var(--muted)" : "var(--brand-red)",
          w: 6 + r(6) * 6,
        };
      }),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: p.left,
              width: p.w,
              background: p.shade,
              "--delay": p.delay,
              "--dur": p.dur,
              "--dx": p.dx,
              "--rot": p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function WinDialog({
  open,
  result,
  bests,
  words,
  lang,
  onPlayAgain,
  onClose,
  nextHref,
  backHref,
  extra,
}: {
  open: boolean;
  result: GameResult | null;
  bests: NewBests | null;
  words: Word[];
  lang: SourceLang;
  onPlayAgain: () => void;
  onClose: () => void;
  nextHref?: string;
  backHref: string;
  extra?: React.ReactNode;
}) {
  const { t } = useI18n();
  const { premium } = useEntitlement();
  if (!result) return null;
  const anyBest = bests && (bests.score || bests.moves || bests.time || bests.stars);
  // Stars rate speed: tell the player what time earns the next one.
  const [threeMs, twoMs] = starLimits(result.pairs);
  const nextStarMs = result.stars === 1 ? twoMs : result.stars === 2 ? threeMs : null;

  const stats: { label: string; value: string; best?: boolean }[] = [
    { label: t("game.score"), value: String(result.score), best: bests?.score },
    { label: t("game.moves"), value: String(result.moves), best: bests?.moves },
    { label: t("game.time"), value: formatTime(result.timeMs), best: bests?.time },
    { label: t("game.accuracy"), value: `${result.accuracy}%` },
  ];

  return (
    <>
      {open && <Confetti />}
      <Modal open={open} onClose={onClose} title={t("game.winTitle")} wide>
        <div className="text-center">
          <Stars value={result.stars} size={44} animate label={t("game.stars", { n: result.stars })} />
          <h2 className="reveal mt-4 text-4xl font-bold tracking-tight" lang="cs" style={{ "--i": 4 } as React.CSSProperties}>
            {t("game.winTitle")}
          </h2>
          <p className="mt-1 text-muted">{t("game.winSubtitle")}</p>
          {nextStarMs !== null && (
            <p className="mt-3 text-sm font-medium">{t("game.nextStar", { time: formatTime(nextStarMs) })}</p>
          )}
          {anyBest && (
            <p className="pop-in chip chip-solid mx-auto mt-4" style={{ animationDelay: "0.6s" }}>
              {t("game.newBest")}
            </p>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-4 gap-2 text-center">
          {stats.map((s, i) => (
            <div
              key={s.label}
              style={{ "--i": 6 + i } as React.CSSProperties}
              className={`reveal rounded-2xl px-1 py-3 ${s.best ? "bg-invert text-invert-fg" : "bg-surface"}`}
            >
              <dt className={`text-[11px] font-semibold uppercase tracking-wide ${s.best ? "opacity-70" : "text-muted"}`}>{s.label}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>

        {extra}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn flex-1" onClick={onPlayAgain} autoFocus>
            {t("game.playAgain")}
          </button>
          {nextHref ? (
            <Link href={nextHref} className="btn btn-outline flex-1">
              {t("game.nextDeck")}
            </Link>
          ) : null}
          <Link href={backHref} className="btn btn-ghost flex-1">
            {t("game.allDecks")}
          </Link>
        </div>

        <details className="group mt-6 rounded-2xl border border-line px-4 py-1">
          <summary className="cursor-pointer list-none py-2.5 text-sm font-semibold">
            {t("game.review")} <span className="text-muted">({words.length})</span>
          </summary>
          <WordList words={words} lang={lang} />
        </details>
        {premium && (
          // The game is already saved, so "last game" is this one.
          <Link href={reviewHref(1)} className="mt-3 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold hover:underline">
            <Icon name="cards" size={16} /> {t("review.fromGame")}
          </Link>
        )}
      </Modal>
    </>
  );
}
