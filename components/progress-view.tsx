"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useSyncStatus } from "@/components/progress-sync";
import { useEntitlement, useI18n, usePrefs } from "@/components/providers";
import { Stars } from "@/components/stars";
import { WordsBar } from "@/components/deck-picker";
import { FEATURES, LIMITS } from "@/lib/config";
import { formatTime } from "@/lib/game/engine";
import { formatDuration, formatShortDate } from "@/lib/format";
import { dailyStreak, dayKey, mergeProgress, parseProgress, summarize, wordsPlayed } from "@/lib/progress";
import { progressStore, useHydrated, useProgress } from "@/lib/progress-store";
import type { DeckMeta } from "@/lib/types";

export function ProgressView({ decks, today }: { decks: DeckMeta[]; today: string }) {
  const { t, locale } = useI18n();
  const { sourceLang } = usePrefs();
  const { premium, user } = useEntitlement();
  const progress = useProgress();
  const hydrated = useHydrated();
  const sync = useSyncStatus();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const deckById = new Map(decks.map((d) => [d.id, d]));
  const summary = summarize(progress, decks.map((d) => d.id));
  const streak = dailyStreak(progress, today);
  const syncs = !!user && (premium || FEATURES.syncForEveryone);
  const totalWords = decks.reduce((n, d) => n + d.wordCount, 0);
  const playedWords = decks.reduce((n, d) => n + wordsPlayed(progress, d.id, d.wordIds), 0);
  const visible = premium ? progress.history : progress.history.slice(0, LIMITS.freeHistoryVisible);
  const hidden = progress.history.length - visible.length;

  const syncLine =
    sync === "syncing" ? t("progress.syncing")
    : sync === "error" ? t("progress.syncError")
    : syncs ? t("progress.synced")
    : t("progress.local");

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(progressStore.get(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `czechpexeso-progress-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    try {
      const parsed = parseProgress(JSON.parse(await file.text()));
      if (!parsed) throw new Error("invalid");
      progressStore.set({ ...mergeProgress(progressStore.get(), parsed), updatedAt: Date.now() });
      setNotice(t("progress.imported"));
    } catch {
      setNotice(t("progress.importError"));
    }
  };

  const tiles: { label: string; value: string }[] = [
    { label: t("progress.words"), value: `${playedWords}/${totalWords}` },
    { label: t("progress.games"), value: String(summary.games) },
    { label: t("progress.decks"), value: `${summary.decksPlayed}/${decks.length}` },
    { label: t("progress.mastered"), value: String(summary.threeStarDecks) },
    { label: t("progress.accuracy"), value: summary.games ? `${summary.accuracy}%` : "—" },
    { label: t("progress.pairs"), value: String(summary.pairs) },
    { label: t("progress.time"), value: formatDuration(summary.timeMs) },
  ];
  if (premium) tiles.push({ label: t("progress.streak"), value: t("common.days", { n: streak }) });

  if (!hydrated) return <div className="mt-10 h-64 animate-pulse rounded-3xl bg-surface" />;

  return (
    <>
      <p className="mt-3 flex items-center gap-2 text-muted">
        {sync === "synced" && <Icon name="check" size={16} />}
        {syncLine}
        {!syncs && (
          <Link
            href={user ? "/pricing" : "/login?next=/progress"}
            className="font-medium text-fg underline underline-offset-4"
          >
            {t("progress.syncHint")}
          </Link>
        )}
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((s) => (
          <div key={s.label} className="panel p-5">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12" aria-labelledby="by-deck">
        <h2 id="by-deck" className="text-2xl font-bold tracking-tight">
          {t("progress.byDeck")}
        </h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {decks.map((d) => {
            const s = progress.decks[d.id];
            const played = wordsPlayed(progress, d.id, d.wordIds);
            return (
              <li key={d.id} className="flex items-center gap-4 py-3.5">
                <Icon name={d.icon} size={20} className="shrink-0 text-muted" />
                <Link href={`/play/${d.id}`} className="min-w-0 flex-1 hover:underline">
                  <span className="font-semibold" lang="cs">
                    {d.title.cs}
                  </span>{" "}
                  <span className="text-sm text-muted">{d.title[sourceLang]}</span>
                </Link>
                <WordsBar
                  played={played}
                  total={d.wordCount}
                  label={t("decks.wordsPlayed", { n: played, total: d.wordCount })}
                  className="w-16 shrink-0 sm:w-24"
                />
                {s?.plays ? (
                  <>
                    <span className="hidden text-sm text-muted sm:inline">{t("common.games", { n: s.plays })}</span>
                    <span className="hidden w-24 text-right text-sm tabular-nums sm:inline">
                      {t("progress.bestScore")}: <b>{s.bestScore}</b>
                    </span>
                    <Stars value={s.bestStars} label={t("decks.best", { n: s.bestStars })} />
                  </>
                ) : (
                  <span className="text-sm text-muted">—</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="history">
        <h2 id="history" className="text-2xl font-bold tracking-tight">
          {t("progress.history")}
        </h2>
        {progress.history.length === 0 ? (
          <p className="mt-4 text-muted">{t("progress.empty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
            {visible.map((g) => {
              const d = deckById.get(g.deckId);
              const name =
                g.deckId === "daily"
                  ? t("progress.daily")
                  : g.deckId === "review"
                    ? `${t("review.title")} · ${t("review.pexeso")}`
                    : d
                      ? `${d.title.cs} · ${d.title[sourceLang]}`
                      : g.deckId;
              return (
                <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <span className="w-28 shrink-0 text-muted tabular-nums">{formatShortDate(g.at, locale)}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                  <span className="text-muted">{g.grid.replace("x", "×")}</span>
                  <span className="tabular-nums">
                    {t("common.moves", { n: g.moves })}
                  </span>
                  <span className="w-12 text-right tabular-nums">{g.timed ? formatTime(g.timeMs) : "—"}</span>
                  <Stars value={g.stars} size={13} label={t("game.stars", { n: g.stars })} />
                  <span className="w-14 text-right font-semibold tabular-nums">{g.score}</span>
                </li>
              );
            })}
            {hidden > 0 && (
              <li className="py-4">
                <Link href="/pricing" className="flex items-center gap-2 font-medium hover:underline">
                  <Icon name="lock" size={16} /> {t("progress.moreLocked", { n: hidden })}
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="panel mt-12 p-6" aria-labelledby="data">
        <h2 id="data" className="text-lg font-semibold">
          {t("progress.dataTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("progress.dataText")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={exportFile}>
            <Icon name="download" size={16} /> {t("progress.export")}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} /> {t("progress.import")}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-danger"
            onClick={() => {
              if (window.confirm(t("progress.resetConfirm"))) progressStore.reset();
            }}
          >
            {t("progress.reset")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {notice && (
          <p className="mt-3 text-sm font-medium" role="status">
            {notice}
          </p>
        )}
      </section>
    </>
  );
}
