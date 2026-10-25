"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { WordList } from "@/components/game/word-list";
import { Icon } from "@/components/icons";
import { useI18n } from "@/components/providers";
import type { SourceLang, Word } from "@/lib/types";

export type ModeProps = { words: Word[]; lang: SourceLang; backHref: string };

/** Top bar of a review mode: back to the Review page, title, and room for controls. */
export function ModeBar({ title, backHref, children }: { title: string; backHref: string; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <Link href={backHref} className="btn btn-ghost btn-icon -ml-2" aria-label={t("review.back")} title={t("review.back")}>
        <Icon name="arrow-left" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight sm:text-xl">{title}</h1>
      {children}
    </div>
  );
}

/** Thin progress bar (done / total). */
export function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-fg transition-[width] duration-500 ease-[var(--ease-out)]"
        style={{ width: `${total ? (value / total) * 100 : 0}%` }}
      />
    </div>
  );
}

/** End of a flashcard or typing session: result, words worth another look, what next. */
export function SessionDone({
  result,
  missed,
  lang,
  backHref,
  onRestart,
  onPractiseMissed,
  extra,
}: {
  result: string;
  missed: Word[];
  lang: SourceLang;
  backHref: string;
  onRestart: () => void;
  onPractiseMissed: () => void;
  /** Shown under the result line (e.g. speed typing stats). */
  extra?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto mt-6 max-w-xl text-center">
      <div className="pop-in mx-auto grid size-16 place-items-center rounded-3xl bg-invert text-invert-fg">
        <Icon name="check" size={30} strokeWidth={2.2} />
      </div>
      <h2 className="reveal mt-5 text-4xl font-bold tracking-tight" lang="cs" style={{ "--i": 2 } as React.CSSProperties}>
        {t("review.doneTitle")}
      </h2>
      <p className="mt-1 text-muted">{t("review.doneSubtitle")}</p>
      <p className="reveal mt-5 text-lg font-semibold" style={{ "--i": 4 } as React.CSSProperties}>
        {result}
      </p>
      {extra}

      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        {missed.length > 0 ? (
          <>
            <button type="button" className="btn flex-1" onClick={onPractiseMissed} autoFocus>
              {t("review.practiseMissed")}
            </button>
            <button type="button" className="btn btn-outline flex-1" onClick={onRestart}>
              <Icon name="restart" size={16} /> {t("review.restart")}
            </button>
          </>
        ) : (
          <button type="button" className="btn flex-1" onClick={onRestart} autoFocus>
            <Icon name="restart" size={16} /> {t("review.restart")}
          </button>
        )}
        <Link href={backHref} className="btn btn-ghost flex-1">
          {t("review.back")}
        </Link>
      </div>

      {missed.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-line px-4 py-2 text-left sm:px-5">
          <h3 className="py-2 text-sm font-semibold">
            {t("review.toPractise")} <span className="text-muted">({missed.length})</span>
          </h3>
          <WordList words={missed} lang={lang} />
        </section>
      ) : (
        <p className="mt-6 text-sm text-muted">{t("review.perfect")}</p>
      )}
    </div>
  );
}
